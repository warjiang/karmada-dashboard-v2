# Implementation Guide

This document provides a step-by-step guide for implementing Dex OIDC integration in the Karmada Dashboard.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Phase 1: Backend Implementation](#phase-1-backend-implementation)
- [Phase 2: Frontend Implementation](#phase-2-frontend-implementation)
- [Phase 3: Testing](#phase-3-testing)
- [Phase 4: Deployment](#phase-4-deployment)

---

## Prerequisites

### Required Knowledge

- Go programming (backend)
- React + TypeScript (frontend)
- OAuth 2.0 / OIDC protocol basics
- Kubernetes RBAC

### Required Tools

- Go 1.25.7+
- Node.js 18+
- kubectl
- Access to Karmada cluster

### Required Dependencies

**Backend:**
```bash
go get golang.org/x/oauth2@latest
go get github.com/coreos/go-oidc/v3/oidc@latest
```

**Frontend:**
```bash
cd ui/apps/dashboard
npm install --save-dev @types/node
```

---

## Phase 1: Backend Implementation

### Step 1.1: Add OIDC Configuration Options

**File:** `cmd/api/app/options/options.go`

Add new fields to the `Options` struct:

```go
type Options struct {
    // ... existing fields ...

    // OIDC related options
    OIDCIssuerURL    string
    OIDCClientID     string
    OIDCClientSecret string
    OIDCRedirectURL  string
    OIDCScopes       []string
}
```

Add CLI flags in the `AddFlags` method:

```go
func (o *Options) AddFlags(fs *pflag.FlagSet) {
    // ... existing flags ...

    // OIDC related flags
    fs.StringVar(&o.OIDCIssuerURL, "oidc-issuer-url", "", "OIDC issuer URL (e.g., https://dex.example.com)")
    fs.StringVar(&o.OIDCClientID, "oidc-client-id", "", "OIDC client ID")
    fs.StringVar(&o.OIDCClientSecret, "oidc-client-secret", "", "OIDC client secret")
    fs.StringVar(&o.OIDCRedirectURL, "oidc-redirect-url", "", "OIDC redirect URL (e.g., https://dashboard.example.com/login/callback)")
    fs.StringSliceVar(&o.OIDCScopes, "oidc-scopes", []string{"openid", "email", "groups", "profile"}, "OIDC scopes to request")
}
```

### Step 1.2: Create OIDC Provider Package

**File:** `pkg/oidc/provider.go`

```go
package oidc

import (
    "context"
    "crypto/rand"
    "encoding/base64"
    "fmt"
    "sync"

    "github.com/coreos/go-oidc/v3/oidc"
    "golang.org/x/oauth2"
    "k8s.io/klog/v2"
)

type Provider struct {
    oauth2Config *oauth2.Config
    oidcProvider *oidc.Provider
    verifier     *oidc.IDTokenVerifier
    states       sync.Map // state -> timestamp for CSRF protection
}

type Config struct {
    IssuerURL    string
    ClientID     string
    ClientSecret string
    RedirectURL  string
    Scopes       []string
}

func NewProvider(ctx context.Context, cfg *Config) (*Provider, error) {
    if cfg.IssuerURL == "" {
        return nil, fmt.Errorf("OIDC issuer URL is required")
    }

    provider, err := oidc.NewProvider(ctx, cfg.IssuerURL)
    if err != nil {
        return nil, fmt.Errorf("failed to create OIDC provider: %w", err)
    }

    oauth2Config := &oauth2.Config{
        ClientID:     cfg.ClientID,
        ClientSecret: cfg.ClientSecret,
        RedirectURL:  cfg.RedirectURL,
        Endpoint:     provider.Endpoint(),
        Scopes:       cfg.Scopes,
    }

    verifier := provider.Verifier(&oidc.Config{
        ClientID: cfg.ClientID,
    })

    return &Provider{
        oauth2Config: oauth2Config,
        oidcProvider: provider,
        verifier:     verifier,
    }, nil
}

func (p *Provider) GenerateAuthURL() (authURL string, state string, err error) {
    state, err = generateRandomState()
    if err != nil {
        return "", "", err
    }

    p.states.Store(state, true)
    authURL = p.oauth2Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
    return authURL, state, nil
}

func (p *Provider) ValidateState(state string) bool {
    _, ok := p.states.LoadAndDelete(state)
    return ok
}

func (p *Provider) ExchangeToken(ctx context.Context, code string) (*oauth2.Token, error) {
    return p.oauth2Config.Exchange(ctx, code)
}

func (p *Provider) VerifyIDToken(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
    return p.verifier.Verify(ctx, rawIDToken)
}

func generateRandomState() (string, error) {
    b := make([]byte, 32)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(b), nil
}
```

### Step 1.3: Create OIDC Route Handlers

**File:** `cmd/api/app/routes/auth/oidc.go`

```go
package auth

import (
    "context"
    "net/http"

    "github.com/gin-gonic/gin"
    "k8s.io/klog/v2"

    v1 "github.com/karmada-io/dashboard/cmd/api/app/types/api/v1"
    "github.com/karmada-io/dashboard/cmd/api/app/types/common"
    "github.com/karmada-io/dashboard/pkg/oidc"
)

var oidcProvider *oidc.Provider

// InitOIDCProvider initializes the OIDC provider
func InitOIDCProvider(ctx context.Context, cfg *oidc.Config) error {
    if cfg.IssuerURL == "" {
        klog.Info("OIDC not configured, skipping OIDC provider initialization")
        return nil
    }

    provider, err := oidc.NewProvider(ctx, cfg)
    if err != nil {
        return err
    }

    oidcProvider = provider
    klog.Info("OIDC provider initialized successfully")
    return nil
}

// handleOIDCLogin generates the OIDC authorization URL
func handleOIDCLogin(c *gin.Context) {
    if oidcProvider == nil {
        common.Fail(c, &common.Error{
            Code:    http.StatusNotImplemented,
            Message: "OIDC is not configured",
        })
        return
    }

    authURL, state, err := oidcProvider.GenerateAuthURL()
    if err != nil {
        klog.ErrorS(err, "Failed to generate OIDC auth URL")
        common.Fail(c, err)
        return
    }

    common.Success(c, &v1.OIDCLoginResponse{
        AuthURL: authURL,
        State:   state,
    })
}

// handleOIDCCallback handles the OIDC callback
func handleOIDCCallback(c *gin.Context) {
    if oidcProvider == nil {
        common.Fail(c, &common.Error{
            Code:    http.StatusNotImplemented,
            Message: "OIDC is not configured",
        })
        return
    }

    req := new(v1.OIDCCallbackRequest)
    if err := c.Bind(req); err != nil {
        klog.ErrorS(err, "Failed to bind OIDC callback request")
        common.Fail(c, err)
        return
    }

    // Validate state to prevent CSRF
    if !oidcProvider.ValidateState(req.State) {
        common.Fail(c, &common.Error{
            Code:    http.StatusBadRequest,
            Message: "Invalid state parameter",
        })
        return
    }

    // Exchange authorization code for tokens
    ctx := c.Request.Context()
    oauth2Token, err := oidcProvider.ExchangeToken(ctx, req.Code)
    if err != nil {
        klog.ErrorS(err, "Failed to exchange authorization code")
        common.Fail(c, err)
        return
    }

    // Extract and verify ID token
    rawIDToken, ok := oauth2Token.Extra("id_token").(string)
    if !ok {
        common.Fail(c, &common.Error{
            Code:    http.StatusInternalServerError,
            Message: "No id_token in token response",
        })
        return
    }

    idToken, err := oidcProvider.VerifyIDToken(ctx, rawIDToken)
    if err != nil {
        klog.ErrorS(err, "Failed to verify ID token")
        common.Fail(c, err)
        return
    }

    // Extract user info from ID token
    var claims struct {
        Email  string   `json:"email"`
        Name   string   `json:"name"`
        Groups []string `json:"groups"`
    }
    if err := idToken.Claims(&claims); err != nil {
        klog.ErrorS(err, "Failed to parse ID token claims")
        common.Fail(c, err)
        return
    }

    klog.InfoS("User authenticated via OIDC", "email", claims.Email, "groups", claims.Groups)

    common.Success(c, &v1.OIDCCallbackResponse{
        Token: rawIDToken,
        User: &v1.User{
            Name:          claims.Email,
            Authenticated: true,
        },
    })
}
```

### Step 1.4: Register OIDC Routes

**File:** `cmd/api/app/routes/auth/handler.go`

Add route registration in the `init()` function:

```go
func init() {
    router.V1().POST("/login", handleLogin)
    router.V1().GET("/me", handleMe)

    // OIDC routes (no auth middleware required)
    r := router.Router()
    r.GET("/api/v1/auth/oidc/login", handleOIDCLogin)
    r.POST("/api/v1/auth/oidc/callback", handleOIDCCallback)
}
```

### Step 1.5: Initialize OIDC in API Server

**File:** `cmd/api/app/api.go`

Add OIDC initialization in the `run()` function:

```go
func run(ctx context.Context, opts *options.Options) error {
    // ... existing initialization ...

    // Initialize OIDC provider if configured
    if opts.OIDCIssuerURL != "" {
        oidcCfg := &oidc.Config{
            IssuerURL:    opts.OIDCIssuerURL,
            ClientID:     opts.OIDCClientID,
            ClientSecret: opts.OIDCClientSecret,
            RedirectURL:  opts.OIDCRedirectURL,
            Scopes:       opts.OIDCScopes,
        }
        if err := auth.InitOIDCProvider(ctx, oidcCfg); err != nil {
            return fmt.Errorf("failed to initialize OIDC provider: %w", err)
        }
    }

    // ... rest of initialization ...
}
```

### Step 1.6: Add API Types

**File:** `cmd/api/app/types/api/v1/auth.go`

```go
package v1

type OIDCLoginResponse struct {
    AuthURL string `json:"authUrl"`
    State   string `json:"state"`
}

type OIDCCallbackRequest struct {
    Code  string `json:"code"`
    State string `json:"state"`
}

type OIDCCallbackResponse struct {
    Token string `json:"token"`
    User  *User  `json:"user"`
}
```

---

## Phase 2: Frontend Implementation

### Step 2.1: Add OIDC Service Functions

**File:** `ui/apps/dashboard/src/services/auth.ts`

```typescript
export async function GetOIDCLoginURL() {
  const resp = await karmadaClient.get<IResponse<{
    authUrl: string;
    state: string;
  }>>(`/auth/oidc/login`);
  return resp.data;
}

export async function OIDCCallback(code: string, state: string) {
  const resp = await karmadaClient.post<IResponse<{
    token: string;
    user: {
      name: string;
      authenticated: boolean;
    };
  }>>(`/auth/oidc/callback`, { code, state });
  return resp.data;
}
```

### Step 2.2: Update Login Page

**File:** `ui/apps/dashboard/src/pages/login/index.tsx`

Add enterprise login button:

```typescript
import { useNavigate } from 'react-router-dom';
import { GetOIDCLoginURL } from '@/services/auth.ts';

const LoginPage = () => {
  const [authToken, setAuthToken] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const handleOIDCLogin = async () => {
    try {
      const ret = await GetOIDCLoginURL();
      if (ret.code === 200 && ret.data) {
        // Store state in sessionStorage for validation
        sessionStorage.setItem('oidc_state', ret.data.state);
        // Redirect to Dex
        window.location.href = ret.data.authUrl;
      } else {
        await messageApi.error('Failed to initiate OIDC login');
      }
    } catch (e) {
      await messageApi.error('OIDC login error');
    }
  };

  return (
    <div className={'h-screen w-screen bg-[#FAFBFC]'}>
      <div className="h-full w-full flex justify-center items-center">
        <Card className={cn('w-1/2', styles['login-card'])} title={...}>
          {/* Existing token input */}
          <Input.TextArea ... />

          <div className={'mt-4 flex gap-2'}>
            <Button type="primary" onClick={...}>
              {i18nInstance.t('402d19e50fff44c827a4f3b608bd5812', '登录')}
            </Button>

            <Button onClick={handleOIDCLogin}>
              {i18nInstance.t('enterprise_login', '企业登录')}
            </Button>
          </div>
        </Card>
      </div>
      {contextHolder}
    </div>
  );
};
```

### Step 2.3: Create OIDC Callback Page

**File:** `ui/apps/dashboard/src/pages/login/callback.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import { OIDCCallback } from '@/services/auth.ts';
import { useAuth } from '@/components/auth';

const OIDCCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const storedState = sessionStorage.getItem('oidc_state');

      if (!code || !state) {
        await messageApi.error('Invalid callback parameters');
        navigate('/login');
        return;
      }

      if (state !== storedState) {
        await messageApi.error('State mismatch - possible CSRF attack');
        navigate('/login');
        return;
      }

      try {
        const ret = await OIDCCallback(code, state);
        if (ret.code === 200 && ret.data) {
          sessionStorage.removeItem('oidc_state');
          setToken(ret.data.token);
          await messageApi.success('Login successful');
          navigate('/overview');
        } else {
          await messageApi.error('OIDC callback failed');
          navigate('/login');
        }
      } catch (e) {
        await messageApi.error('OIDC callback error');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, messageApi]);

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <Spin size="large" tip="Completing login..." />
      {contextHolder}
    </div>
  );
};

export default OIDCCallbackPage;
```

### Step 2.4: Register Callback Route

**File:** `ui/apps/dashboard/src/App.tsx` (or your router configuration)

```typescript
import OIDCCallbackPage from '@/pages/login/callback';

// Add route
<Route path="/login/callback" element={<OIDCCallbackPage />} />
```

---

## Phase 3: Testing

### Step 3.1: Unit Tests

**Backend Test:** `pkg/oidc/provider_test.go`

```go
package oidc

import (
    "testing"
)

func TestGenerateRandomState(t *testing.T) {
    state1, err := generateRandomState()
    if err != nil {
        t.Fatalf("Failed to generate state: %v", err)
    }

    state2, err := generateRandomState()
    if err != nil {
        t.Fatalf("Failed to generate state: %v", err)
    }

    if state1 == state2 {
        t.Error("Generated states should be unique")
    }

    if len(state1) == 0 {
        t.Error("State should not be empty")
    }
}
```

### Step 3.2: Integration Testing

1. Deploy Dex in test environment
2. Configure test OIDC client
3. Test full login flow:
   - Click "Enterprise Login"
   - Authenticate with test credentials
   - Verify callback handling
   - Verify token storage
   - Verify API requests with token

### Step 3.3: Manual Testing Checklist

- [ ] OIDC login button appears when configured
- [ ] OIDC login button hidden when not configured
- [ ] Token login still works
- [ ] State validation prevents CSRF
- [ ] Invalid callback parameters handled gracefully
- [ ] Token stored correctly in localStorage
- [ ] Authenticated API requests work
- [ ] Token expiry redirects to login
- [ ] Logout clears token

---

## Phase 4: Deployment

### Step 4.1: Deploy Dex

```bash
kubectl apply -f dex-deployment.yaml
kubectl apply -f dex-service.yaml
kubectl apply -f dex-ingress.yaml
```

### Step 4.2: Configure Karmada API Server

Update Karmada API Server deployment with OIDC flags (see configuration-examples.md).

### Step 4.3: Deploy Dashboard with OIDC

```bash
kubectl apply -f dashboard-deployment.yaml
```

### Step 4.4: Configure RBAC

```bash
kubectl apply -f rbac-bindings.yaml
```

### Step 4.5: Verify Deployment

```bash
# Check Dex is running
kubectl get pods -n karmada-system -l app=dex

# Check Dashboard is running
kubectl get pods -n karmada-system -l app=karmada-dashboard

# Test OIDC login
curl https://dashboard.example.com/api/v1/auth/oidc/login
```

---

## Troubleshooting

### Common Issues

**Issue:** "OIDC is not configured" error

**Solution:** Verify `--oidc-issuer-url` flag is set on dashboard backend

---

**Issue:** "Invalid state parameter" error

**Solution:** Check browser allows sessionStorage, verify state is not expired

---

**Issue:** "Failed to verify ID token" error

**Solution:**
- Verify Karmada API Server OIDC config matches Dex issuer
- Check clock skew between Dex and API server
- Verify Dex CA certificate if using self-signed certs

---

**Issue:** 401 Unauthorized on API requests

**Solution:**
- Verify RBAC bindings exist for OIDC users/groups
- Check `--oidc-username-claim` and `--oidc-groups-claim` match token claims
- Verify token is not expired

---

## Next Steps

After successful deployment:

1. Monitor OIDC login metrics
2. Implement refresh token support
3. Add token expiry handling in frontend
4. Configure additional identity connectors in Dex
5. Set up audit logging for OIDC logins
