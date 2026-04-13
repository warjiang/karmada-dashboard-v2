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

package main

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
	issuer     = "http://localhost:5555"

	// In-memory storage for authorization codes
	authCodes = sync.Map{}
)

// User represents a test user
type User struct {
	ID       string   `json:"id"`
	Email    string   `json:"email"`
	Username string   `json:"username"`
	Password string   `json:"password"`
	Groups   []string `json:"groups"`
}

// AuthCode stores authorization code data
type AuthCode struct {
	Code        string
	User        User
	RedirectURI string
	CreatedAt   time.Time
}

var users = []User{
	{
		ID:       "user-001",
		Email:    "admin@example.com",
		Username: "admin",
		Password: "password",
		Groups:   []string{"admins", "developers"},
	},
	{
		ID:       "user-002",
		Email:    "user@example.com",
		Username: "user",
		Password: "password",
		Groups:   []string{"developers"},
	},
	{
		ID:       "user-003",
		Email:    "viewer@example.com",
		Username: "viewer",
		Password: "password",
		Groups:   []string{"viewers"},
	},
}

func init() {
	var err error
	privateKey, err = rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Fatal(err)
	}
	publicKey = &privateKey.PublicKey
}

func main() {
	http.HandleFunc("/.well-known/openid-configuration", handleDiscovery)
	http.HandleFunc("/auth", handleAuth)
	http.HandleFunc("/token", handleToken)
	http.HandleFunc("/userinfo", handleUserInfo)
	http.HandleFunc("/keys", handleJWKS)

	log.Println("Mock Account Service running on http://localhost:5555")
	log.Println("Test users:")
	for _, u := range users {
		log.Printf("  - %s / %s (groups: %v)", u.Email, u.Password, u.Groups)
	}
	log.Fatal(http.ListenAndServe(":5555", nil))
}

func handleDiscovery(w http.ResponseWriter, r *http.Request) {
	discovery := map[string]interface{}{
		"issuer":                 issuer,
		"authorization_endpoint": issuer + "/auth",
		"token_endpoint":         issuer + "/token",
		"userinfo_endpoint":      issuer + "/userinfo",
		"jwks_uri":               issuer + "/keys",
		"response_types_supported": []string{"code"},
		"subject_types_supported":  []string{"public"},
		"id_token_signing_alg_values_supported": []string{"RS256"},
		"scopes_supported": []string{"openid", "email", "profile", "groups"},
		"claims_supported": []string{"sub", "email", "name", "groups"},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(discovery)
}

func handleAuth(w http.ResponseWriter, r *http.Request) {
	redirectURI := r.URL.Query().Get("redirect_uri")
	state := r.URL.Query().Get("state")

	if redirectURI == "" {
		http.Error(w, "Missing redirect_uri", http.StatusBadRequest)
		return
	}

	// For testing, auto-approve with first user
	user := users[0]

	// Generate authorization code
	code := uuid.New().String()
	authCodes.Store(code, AuthCode{
		Code:        code,
		User:        user,
		RedirectURI: redirectURI,
		CreatedAt:   time.Now(),
	})

	// Redirect back with code
	redirectURL := fmt.Sprintf("%s?code=%s&state=%s", redirectURI, code, state)
	log.Printf("Authorization: redirecting to %s", redirectURL)
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func handleToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.ParseForm()
	grantType := r.FormValue("grant_type")
	code := r.FormValue("code")

	if grantType != "authorization_code" {
		http.Error(w, "Unsupported grant type", http.StatusBadRequest)
		return
	}

	// Retrieve and validate authorization code
	value, ok := authCodes.LoadAndDelete(code)
	if !ok {
		http.Error(w, "Invalid authorization code", http.StatusBadRequest)
		return
	}

	authCode := value.(AuthCode)

	// Check if code is expired (5 minutes)
	if time.Since(authCode.CreatedAt) > 5*time.Minute {
		http.Error(w, "Authorization code expired", http.StatusBadRequest)
		return
	}

	// Generate ID token
	idToken := generateIDToken(authCode.User)

	response := map[string]interface{}{
		"access_token": uuid.New().String(),
		"token_type":   "Bearer",
		"expires_in":   3600,
		"id_token":     idToken,
	}

	log.Printf("Token exchange: issued token for user %s", authCode.User.Email)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleUserInfo(w http.ResponseWriter, r *http.Request) {
	// For testing, return first user
	user := users[0]
	userInfo := map[string]interface{}{
		"sub":    user.ID,
		"email":  user.Email,
		"name":   user.Username,
		"groups": user.Groups,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfo)
}

func handleJWKS(w http.ResponseWriter, r *http.Request) {
	// Convert public key to JWK format
	n := base64.RawURLEncoding.EncodeToString(publicKey.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(big.NewInt(int64(publicKey.E)).Bytes())

	jwks := map[string]interface{}{
		"keys": []map[string]interface{}{
			{
				"kty": "RSA",
				"use": "sig",
				"kid": "mock-key-1",
				"alg": "RS256",
				"n":   n,
				"e":   e,
			},
		},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jwks)
}

func generateIDToken(user User) string {
	now := time.Now()
	claims := jwt.MapClaims{
		"iss":    issuer,
		"sub":    user.ID,
		"aud":    "dex-client",
		"exp":    now.Add(time.Hour).Unix(),
		"iat":    now.Unix(),
		"email":  user.Email,
		"name":   user.Username,
		"groups": user.Groups,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = "mock-key-1"

	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		log.Printf("Error signing token: %v", err)
		return ""
	}

	return tokenString
}
