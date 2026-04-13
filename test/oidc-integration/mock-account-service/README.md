# Mock Account Service

A minimal OAuth2/OIDC provider for testing Dex integration.

## Overview

This service implements the OAuth2 Authorization Code Flow and OIDC protocol, allowing Dex to connect to it as an upstream identity provider.

## Features

- **OIDC Discovery** - `/.well-known/openid-configuration`
- **Authorization Endpoint** - `/auth` (auto-approves for testing)
- **Token Endpoint** - `/token` (exchanges code for tokens)
- **UserInfo Endpoint** - `/userinfo`
- **JWKS Endpoint** - `/keys` (public keys for token verification)
- **JWT Signing** - RSA-256 with auto-generated key pair
- **In-memory Storage** - No database needed

## Test Users

| ID | Email | Password | Groups |
|----|-------|----------|--------|
| user-001 | admin@example.com | password | admins, developers |
| user-002 | user@example.com | password | developers |
| user-003 | viewer@example.com | password | viewers |

## Running

```bash
# Install dependencies
go mod download

# Run service
go run main.go
```

Service runs on http://localhost:5555

## Endpoints

### OIDC Discovery
```bash
curl http://localhost:5555/.well-known/openid-configuration
```

### Authorization (auto-approves)
```
GET /auth?client_id=dex-client&redirect_uri=http://localhost:5556/dex/callback&response_type=code&state=xyz
```

### Token Exchange
```bash
curl -X POST http://localhost:5555/token \
  -d "grant_type=authorization_code" \
  -d "code=<auth_code>" \
  -d "client_id=dex-client" \
  -d "client_secret=dex-secret"
```

### UserInfo
```bash
curl http://localhost:5555/userinfo \
  -H "Authorization: Bearer <access_token>"
```

### JWKS (Public Keys)
```bash
curl http://localhost:5555/keys
```

## JWT Claims

ID tokens include:
- `iss` - Issuer (http://localhost:5555)
- `sub` - Subject (user ID)
- `aud` - Audience (dex-client)
- `exp` - Expiration (1 hour)
- `iat` - Issued at
- `email` - User email
- `name` - Username
- `groups` - User groups (for RBAC)

## Integration with Dex

Configure Dex to use this service as an OIDC connector:

```yaml
connectors:
- type: oidc
  id: mock-account-service
  name: Mock Account Service
  config:
    issuer: http://localhost:5555
    clientID: dex-client
    clientSecret: dex-secret
    redirectURI: http://localhost:5556/dex/callback
    scopes:
    - openid
    - email
    - profile
    - groups
    getUserInfo: true
    insecureEnableGroups: true
    claimMapping:
      email: email
      groups: groups
```

## Architecture

```
User → Dex → Mock Service
         ↓
    Authorization Request
         ↓
    Auto-approve (no login form)
         ↓
    Return auth code
         ↓
    Dex exchanges code for token
         ↓
    Mock Service returns JWT ID token
         ↓
    Dex validates token signature (JWKS)
         ↓
    Dex returns token to Dashboard
```

## Limitations (Testing Only)

- Auto-approves all authorization requests (no login form)
- No password validation
- In-memory storage (codes lost on restart)
- Single RSA key (no rotation)
- No rate limiting
- No audit logging
- HTTP only (no HTTPS)

## Dependencies

- `github.com/golang-jwt/jwt/v5` - JWT signing and verification
- `github.com/google/uuid` - Authorization code generation
