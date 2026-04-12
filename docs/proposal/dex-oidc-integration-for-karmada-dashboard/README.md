
| title | authors | reviewers | approvers | creation-date |
| --- | --- | --- | --- | --- |
| Dex OIDC Integration for Karmada Dashboard | @warjiang | @ | @ | 2026-04-12 |

# Dex OIDC Integration for Karmada Dashboard

## Summary

The Karmada Dashboard currently supports only a simple bearer token authentication model, where users must manually obtain and paste a JWT token (typically a Kubernetes ServiceAccount token) to log in. This approach is not suitable for enterprise environments that require integration with existing identity systems such as LDAP, Active Directory, SAML providers, or social login (GitHub, GitLab, etc.).

[Dex](https://dexidp.io/) is a federated OpenID Connect (OIDC) Identity Provider that acts as a portal to other identity providers. It issues OIDC ID tokens on behalf of upstream identity providers, enabling applications to authenticate users against a wide variety of enterprise identity systems through a single, standardized interface.

This proposal describes the design and implementation of integrating Dex as an OIDC provider into the Karmada Dashboard, enabling enterprise users to log in using their existing organizational credentials via the standard **OAuth 2.0 Authorization Code Flow**.

## Motivation

The current token-based authentication has several limitations in enterprise environments:

- **Manual token management**: Users must manually generate, copy, and paste ServiceAccount tokens, which is error-prone and has poor user experience.
- **No enterprise IdP integration**: There is no way to authenticate users against LDAP, Active Directory, or other enterprise identity systems.
- **No SSO support**: Users cannot leverage existing Single Sign-On (SSO) infrastructure.
- **Short-lived tokens**: Kubernetes ServiceAccount tokens expire, requiring users to repeat the manual process.
- **No user identity mapping**: The dashboard cannot associate dashboard sessions with real organizational user identities for audit and RBAC purposes.

### Goals

- Implement the standard OAuth 2.0 Authorization Code Flow with Dex as the OIDC provider.
- Allow users to log in to the Karmada Dashboard using enterprise credentials (LDAP, AD, GitHub, GitLab, SAML, etc.) via Dex.
- Preserve backward compatibility: the existing token-based login must continue to work.
- Leverage Kubernetes native OIDC authentication so that the ID token issued by Dex can be used directly with the Karmada API Server.
- Provide new CLI flags to configure OIDC parameters without breaking existing deployments.

### Non-Goals

- Implementing a custom identity provider — Dex handles all upstream IdP integrations.
- Implementing refresh token rotation or silent token renewal in this phase.
- Supporting the OAuth 2.0 Device Authorization Grant (for CLI tools) — this is a separate concern.
- Replacing the existing ServiceAccount token login for non-OIDC deployments.

## Proposal

### User Stories

#### Story 1

**As an enterprise platform engineer**, I want to configure the Karmada Dashboard to authenticate users against our company's LDAP directory, so that employees can log in with their existing corporate credentials without needing to manually manage Kubernetes ServiceAccount tokens.

Currently, onboarding a new team member to the Karmada Dashboard requires:
1. Creating a Kubernetes ServiceAccount
2. Binding appropriate RBAC roles
3. Extracting the token and sharing it securely with the user
4. The user manually pasting the token into the dashboard

With Dex OIDC integration, the workflow becomes:
1. Configure Dex to connect to the corporate LDAP
2. Configure RBAC bindings for LDAP groups
3. Users log in with their existing LDAP credentials via the familiar browser-based login flow

#### Story 2

**As a security-conscious organization**, we require that all access to infrastructure management tools be authenticated through our centralized Identity Provider (IdP) to ensure consistent audit trails, enforce MFA policies, and enable immediate access revocation when employees leave.

The current token-based approach bypasses our IdP entirely. With Dex OIDC integration, all Karmada Dashboard logins flow through our IdP, enabling:
- Centralized audit logging of who accessed the dashboard and when
- Enforcement of MFA policies defined in the IdP
- Immediate access revocation by disabling the user in the IdP

#### Story 3

**As a Karmada Dashboard administrator**, I want to maintain backward compatibility so that existing automated systems and users who rely on ServiceAccount token login are not disrupted when OIDC is enabled.

The OIDC login should be an additive feature — when `--oidc-issuer-url` is not configured, the dashboard behaves exactly as before.

### Notes/Constraints/Caveats

- **Karmada API Server configuration required**: To use the OIDC ID token directly with the Karmada API Server, the API Server must be configured with OIDC flags (`--oidc-issuer-url`, `--oidc-client-id`, etc.). This is a one-time operational change.
- **Dex deployment**: Dex must be deployed and accessible from both the dashboard backend (for token exchange) and the user's browser (for the authorization redirect).
- **HTTPS required**: OIDC flows require HTTPS for the redirect URI in production environments.
- **State parameter**: A cryptographically random `state` parameter must be used to prevent CSRF attacks during the authorization code flow.

### Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Dex unavailability breaks login | Token-based login is preserved as fallback; OIDC is opt-in |
| CSRF attack on callback endpoint | Use cryptographically random `state` parameter, validate on callback |
| ID token leakage in URL | Token is returned via JSON response body, not URL fragment |
| Karmada API Server misconfiguration | Dashboard validates OIDC config at startup and logs clear error messages |
| Token expiry during session | Frontend detects 401 responses and redirects to login; refresh token support planned for future phase |

## Design Details

### Overall Architecture

The integration follows the standard OAuth 2.0 Authorization Code Flow:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Browser                                │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          1. Click "Enterprise Login"
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Karmada Dashboard Backend                         │
│                                                                     │
│  GET /api/v1/auth/oidc/login                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. Generate random state (stored in cookie)                  │   │
│  │ 2. Build Dex authorization URL                               │   │
│  │ 3. Return redirect URL to frontend                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          2. Redirect to Dex /auth
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Dex (OIDC Provider)                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. Dex redirects to upstream IdP (LDAP/GitHub/SAML/...)     │   │
│  │ 4. User authenticates with enterprise credentials            │   │
│  │ 5. Dex issues authorization code                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          6. Callback to Dashboard with code + state
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Karmada Dashboard Backend                         │
│                                                                     │
│  GET /api/v1/auth/oidc/callback?code=...&state=...                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 7. Validate state parameter (CSRF protection)                │   │
│  │ 8. Exchange code for id_token + access_token                 │   │
│  │ 9. Verify id_token signature against Dex JWKS                │   │
│  │ 10. Return id_token to frontend                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          11. Frontend stores id_token, uses as Bearer token
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Karmada API Server                             │
│                                                                     │
│  12. Validates id_token using configured OIDC issuer                │
│  13. Applies RBAC based on username/groups from token claims        │
└─────────────────────────────────────────────────────────────────────┘
```

### Backend Changes

#### 1. New CLI Flags (`cmd/api/app/options/options.go`)

Add an `OIDCOptions` struct to the existing `Options`:

```go
// OIDCOptions contains configuration for OIDC authentication via Dex
type OIDCOptions struct {
    IssuerURL    string   // --oidc-issuer-url: Dex issuer URL, e.g. https://dex.example.com
    ClientID     string   // --oidc-client-id: OAuth2 client ID registered in Dex
    ClientSecret string   // --oidc-client-secret: OAuth2 client secret
    RedirectURL  string   // --oidc-redirect-url: Callback URL, e.g. https://dashboard.example.com/api/v1/auth/oidc/callback
    Scopes       []string // --oidc-scopes: default ["openid", "email", "groups", "profile"]
}
```

OIDC is disabled when `IssuerURL` is empty, preserving full backward compatibility.

#### 2. New OIDC Handler (`cmd/api/app/routes/auth/oidc.go`)

Two new endpoints are added, both registered **without** `AuthMiddleware` (they are pre-authentication endpoints):

**`GET /api/v1/auth/oidc/login`**

Returns the Dex authorization URL for the frontend to redirect to. Generates and stores a random `state` value in a short-lived cookie for CSRF protection.

```
Request:  GET /api/v1/auth/oidc/login
Response: { "loginURL": "https://dex.example.com/auth?client_id=...&state=...&..." }
```

**`GET /api/v1/auth/oidc/callback`**

Handles the redirect from Dex after user authentication. Validates the `state` parameter, exchanges the authorization code for tokens, verifies the ID token, and returns the ID token to the frontend.

```
Request:  GET /api/v1/auth/oidc/callback?code=<code>&state=<state>
Response: { "token": "<id_token>" }
```

The handler uses `github.com/coreos/go-oidc/v3` for ID token verification against Dex's JWKS endpoint, ensuring the token signature is valid before returning it to the frontend.

#### 3. OIDC Provider Initialization (`cmd/api/app/api.go`)

When `OIDCOptions.IssuerURL` is non-empty, initialize the OIDC provider at startup:

```go
if opts.OIDC.IssuerURL != "" {
    if err := auth.InitOIDCProvider(ctx, opts.OIDC); err != nil {
        klog.Fatalf("Failed to initialize OIDC provider: %v", err)
    }
    klog.Infof("OIDC provider initialized: %s", opts.OIDC.IssuerURL)
}
```

#### 4. Router Registration (`cmd/api/app/router/setup.go`)

Add a new public router group for OIDC endpoints that bypasses `AuthMiddleware`:

```go
// Public auth routes (no AuthMiddleware)
authPublic := router.Group("/api/v1/auth")
authPublic.GET("/oidc/login", handleOIDCLogin)
authPublic.GET("/oidc/callback", handleOIDCCallback)
```

#### 5. New Dependencies (`go.mod`)

```
golang.org/x/oauth2 v0.x.x
github.com/coreos/go-oidc/v3 v3.x.x
```

#### 6. Karmada API Server Configuration

To enable the Karmada API Server to validate OIDC ID tokens issued by Dex, the following flags must be added to the `karmada-apiserver` startup configuration:

```yaml
# karmada-apiserver deployment args
- --oidc-issuer-url=https://dex.example.com
- --oidc-client-id=karmada-dashboard
- --oidc-username-claim=email
- --oidc-groups-claim=groups
- --oidc-username-prefix=oidc:
- --oidc-groups-prefix=oidc:
```

After this configuration, RBAC bindings can reference OIDC users and groups:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: karmada-dashboard-admins
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: Group
  name: "oidc:platform-admins"   # maps to Dex group claim
  apiGroup: rbac.authorization.k8s.io
```

### Frontend Changes

#### 1. New API Service (`ui/apps/dashboard/src/services/auth.ts`)

Add `GetOIDCLoginURL()` to fetch the Dex authorization URL from the backend:

```typescript
export async function GetOIDCLoginURL() {
  const resp = await karmadaClient.get<IResponse<{ loginURL: string }>>(
    `/auth/oidc/login`
  );
  return resp.data;
}
```

#### 2. Login Page Enhancement (`ui/apps/dashboard/src/pages/login/index.tsx`)

The login page is extended to show an "Enterprise Login" button alongside the existing token input. The OIDC button is only rendered when the backend reports that OIDC is configured (via a new `/api/v1/auth/oidc/enabled` endpoint or a feature flag).

```
┌─────────────────────────────────────────────────────┐
│              Karmada Dashboard                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ℹ️  参考文档生成 JWT token                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Token input (textarea)                     │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [ 登录 ]          [ 🏢 Enterprise Login (OIDC) ]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Clicking "Enterprise Login" calls `GetOIDCLoginURL()` and redirects the browser to the returned Dex authorization URL.

#### 3. OIDC Callback Page (`ui/apps/dashboard/src/pages/login/callback.tsx`)

A new route `/login/callback` handles the OIDC redirect from Dex. The backend processes the code exchange and returns the ID token; the callback page receives the token, stores it via `setToken()`, and redirects to `/overview`.

The flow:
1. Dex redirects browser to `https://dashboard.example.com/login/callback?code=...&state=...`
2. The frontend callback page calls `GET /api/v1/auth/oidc/callback?code=...&state=...`
3. Backend validates, exchanges code, returns `{ token: "<id_token>" }`
4. Frontend calls `setToken(token)` → stored in localStorage
5. Navigate to `/overview`

#### 4. Router Registration (`ui/apps/dashboard/src/router/index.tsx`)

Add the callback route as a public (unauthenticated) route:

```typescript
{
  path: '/login/callback',
  element: <OIDCCallbackPage />,
}
```

### Dex Configuration Example

A minimal Dex configuration for LDAP integration:

```yaml
issuer: https://dex.example.com

storage:
  type: kubernetes
  config:
    inCluster: true

web:
  http: 0.0.0.0:5556

connectors:
- type: ldap
  id: ldap
  name: Corporate LDAP
  config:
    host: ldap.example.com:636
    rootCAData: <base64-encoded-ca>
    bindDN: cn=service-account,dc=example,dc=com
    bindPW: <password>
    userSearch:
      baseDN: ou=users,dc=example,dc=com
      username: uid
      idAttr: uid
      emailAttr: mail
      nameAttr: cn
    groupSearch:
      baseDN: ou=groups,dc=example,dc=com
      userAttr: DN
      groupAttr: member
      nameAttr: cn

staticClients:
- id: karmada-dashboard
  redirectURIs:
  - https://dashboard.example.com/login/callback
  name: Karmada Dashboard
  secret: <client-secret>
```

### Sequence Diagram

```
Browser          Dashboard Backend          Dex              Karmada API Server
   │                     │                   │                      │
   │─── GET /login ──────►│                   │                      │
   │◄── Login Page ───────│                   │                      │
   │                     │                   │                      │
   │─ Click Enterprise ──►│                   │                      │
   │  Login button        │                   │                      │
   │                     │                   │                      │
   │◄── { loginURL } ────│                   │                      │
   │                     │                   │                      │
   │─── Redirect ─────────────────────────►  │                      │
   │                     │                   │                      │
   │                     │         User authenticates with IdP      │
   │                     │                   │                      │
   │◄── Redirect to /login/callback ─────────│                      │
   │    ?code=xxx&state=yyy                  │                      │
   │                     │                   │                      │
   │─── GET /api/v1/auth/oidc/callback ─────►│                      │
   │    ?code=xxx&state=yyy                  │                      │
   │                     │                   │                      │
   │                     │─── Exchange code ►│                      │
   │                     │◄── id_token ──────│                      │
   │                     │                   │                      │
   │                     │  Verify id_token  │                      │
   │                     │  against JWKS     │                      │
   │                     │                   │                      │
   │◄── { token: id_token } ────────────────│                      │
   │                     │                   │                      │
   │  Store token in localStorage            │                      │
   │                     │                   │                      │
   │─── GET /api/v1/... Bearer id_token ────►│──── Validate OIDC ──►│
   │                     │                   │     token            │
   │◄─────────────────── Response ───────────────────────────────── │
```

### Test Plan

#### Unit Tests

- `TestOIDCLoginHandler`: Verify that the login handler generates a valid authorization URL with correct parameters (`client_id`, `redirect_uri`, `scope`, `state`, `response_type=code`).
- `TestOIDCCallbackHandler_ValidCode`: Verify successful token exchange and ID token verification.
- `TestOIDCCallbackHandler_InvalidState`: Verify that mismatched `state` returns HTTP 400.
- `TestOIDCCallbackHandler_InvalidCode`: Verify that an invalid authorization code returns HTTP 401.
- `TestOIDCDisabled`: Verify that OIDC endpoints return HTTP 404 or appropriate error when `--oidc-issuer-url` is not configured.
- `TestBackwardCompatibility`: Verify that existing token-based login (`POST /api/v1/login`) continues to work when OIDC is enabled.

#### Integration Tests

- End-to-end OIDC flow with a test Dex instance configured with a static password connector.
- Verify that the ID token returned by the callback can be used as a Bearer token for subsequent API calls.
- Verify RBAC enforcement using groups from the OIDC token claims.

#### Frontend Tests

- `OIDCCallbackPage`: Verify that the callback page correctly extracts the token from the backend response and stores it.
- `LoginPage`: Verify that the "Enterprise Login" button is rendered only when OIDC is enabled, and that clicking it redirects to the correct URL.

## Alternatives

### Alternative 1: Dashboard as OIDC Proxy with Kubernetes Impersonation

Instead of configuring the Karmada API Server with OIDC flags, the Dashboard backend could use a privileged ServiceAccount with `system:impersonator` permissions. After OIDC authentication, the dashboard would inject `Impersonate-User` and `Impersonate-Group` headers into all API requests.

**Pros:**
- No changes required to Karmada API Server configuration
- Simpler operational setup

**Cons:**
- Dashboard ServiceAccount requires broad impersonation privileges, increasing blast radius
- Audit logs in Karmada API Server show the dashboard's ServiceAccount, not the real user
- Does not leverage Kubernetes native OIDC support

This approach is suitable as a transitional solution but is not recommended for production due to the audit and security concerns.

### Alternative 2: kubelogin + Existing Token Input

Users can use [kubelogin](https://github.com/int128/kubelogin) (a kubectl plugin) to perform the OIDC flow locally and obtain an ID token, which they then paste into the existing token input field.

**Pros:**
- Zero changes to the dashboard
- Works immediately with any OIDC-configured Karmada API Server

**Cons:**
- Poor user experience — requires CLI tool installation and manual token copying
- Not suitable for non-technical users
- Does not provide a browser-native SSO experience

This is a viable short-term workaround but does not meet the goal of providing a seamless enterprise login experience.
