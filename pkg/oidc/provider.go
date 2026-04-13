/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package oidc

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"sync"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

// Config holds OIDC provider configuration
type Config struct {
	IssuerURL    string
	ClientID     string
	ClientSecret string
	RedirectURL  string
	Scopes       []string
}

// Provider wraps OIDC provider and OAuth2 config
type Provider struct {
	oauth2Config *oauth2.Config
	oidcProvider *oidc.Provider
	verifier     *oidc.IDTokenVerifier
	states       sync.Map // stores state -> expiry time for CSRF protection
}

// stateEntry stores state validation data
type stateEntry struct {
	createdAt time.Time
}

// NewProvider initializes a new OIDC provider
func NewProvider(ctx context.Context, cfg *Config) (*Provider, error) {
	if cfg.IssuerURL == "" {
		return nil, fmt.Errorf("issuer URL is required")
	}
	if cfg.ClientID == "" {
		return nil, fmt.Errorf("client ID is required")
	}
	if cfg.RedirectURL == "" {
		return nil, fmt.Errorf("redirect URL is required")
	}

	// Perform OIDC discovery
	provider, err := oidc.NewProvider(ctx, cfg.IssuerURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create OIDC provider: %w", err)
	}

	// Configure OAuth2
	oauth2Config := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.RedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       cfg.Scopes,
	}

	// Create ID token verifier
	verifier := provider.Verifier(&oidc.Config{
		ClientID: cfg.ClientID,
	})

	p := &Provider{
		oauth2Config: oauth2Config,
		oidcProvider: provider,
		verifier:     verifier,
	}

	// Start background cleanup of expired states
	go p.cleanupExpiredStates(ctx)

	return p, nil
}

// GenerateAuthURL generates authorization URL with a random state parameter
func (p *Provider) GenerateAuthURL() (authURL string, state string, err error) {
	// Generate cryptographically random state
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", fmt.Errorf("failed to generate state: %w", err)
	}
	state = base64.URLEncoding.EncodeToString(b)

	// Store state with timestamp
	p.states.Store(state, stateEntry{
		createdAt: time.Now(),
	})

	// Generate authorization URL
	authURL = p.oauth2Config.AuthCodeURL(state, oauth2.AccessTypeOffline)

	return authURL, state, nil
}

// ValidateState validates and consumes the state parameter (one-time use)
func (p *Provider) ValidateState(state string) error {
	if state == "" {
		return fmt.Errorf("state parameter is empty")
	}

	// LoadAndDelete ensures one-time use
	value, loaded := p.states.LoadAndDelete(state)
	if !loaded {
		return fmt.Errorf("invalid or expired state parameter")
	}

	// Check if state is expired (10 minutes)
	entry := value.(stateEntry)
	if time.Since(entry.createdAt) > 10*time.Minute {
		return fmt.Errorf("state parameter expired")
	}

	return nil
}

// ExchangeToken exchanges authorization code for tokens
func (p *Provider) ExchangeToken(ctx context.Context, code string) (*oauth2.Token, error) {
	if code == "" {
		return nil, fmt.Errorf("authorization code is empty")
	}

	token, err := p.oauth2Config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange token: %w", err)
	}

	return token, nil
}

// VerifyIDToken verifies the ID token signature and claims
func (p *Provider) VerifyIDToken(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
	if rawIDToken == "" {
		return nil, fmt.Errorf("ID token is empty")
	}

	idToken, err := p.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %w", err)
	}

	return idToken, nil
}

// cleanupExpiredStates periodically removes expired state entries
func (p *Provider) cleanupExpiredStates(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.states.Range(func(key, value interface{}) bool {
				entry := value.(stateEntry)
				if time.Since(entry.createdAt) > 10*time.Minute {
					p.states.Delete(key)
				}
				return true
			})
		}
	}
}
