# OIDC Integration Testing

This directory contains test setups for the Karmada Dashboard Dex OIDC integration.

## Quick Start (Static Password Connector)

The simplest way to test OIDC integration - no custom service needed.

### 1. Start Dex

```bash
cd test/oidc-integration/dex
docker-compose up
```

Dex will run on http://localhost:5556

### 2. Start Karmada Dashboard

```bash
# From project root
go run cmd/api/main.go \
  --kubeconfig ~/.kube/config \
  --karmada-kubeconfig ~/.kube/karmada.config \
  --oidc-issuer-url http://localhost:5556/dex \
  --oidc-client-id karmada-dashboard \
  --oidc-client-secret dashboard-secret-key \
  --oidc-redirect-url http://localhost:8000/login/callback \
  --insecure-port 8000
```

### 3. Test Login

1. Open http://localhost:8000
2. Click "企业登录" (Enterprise Login)
3. You'll be redirected to Dex login page
4. Login with test credentials (see below)
5. You'll be redirected back to the dashboard

### Test Users

| Email | Password | Groups |
|-------|----------|--------|
| admin@example.com | password | admins, developers |
| user@example.com | password | developers |
| viewer@example.com | password | viewers |

---

## Advanced Setup (Mock Account Service)

To test with a custom identity provider that Dex connects to.

### 1. Start Mock Account Service

```bash
cd test/oidc-integration/mock-account-service
go run main.go
```

Service runs on http://localhost:5555

Endpoints:
- `/.well-known/openid-configuration` - OIDC discovery
- `/auth` - Authorization endpoint
- `/token` - Token endpoint
- `/userinfo` - UserInfo endpoint
- `/keys` - JWKS endpoint

### 2. Start Dex with OIDC Connector

```bash
cd test/oidc-integration/dex

# Edit docker-compose.yaml to use config-oidc.yaml
# Change: ./config-static.yaml → ./config-oidc.yaml

docker-compose up
```

### 3. Start Karmada Dashboard

Same as above.

### 4. Test Flow

The authentication flow is:
```
Dashboard → Dex → Mock Account Service → Dex → Dashboard
```

---

## RBAC Configuration

To test RBAC with OIDC groups, create ClusterRoleBindings in your Karmada API server:

```yaml
# rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: oidc-admins
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: Group
  name: admins
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: oidc-developers
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: edit
subjects:
- kind: Group
  name: developers
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: oidc-viewers
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: view
subjects:
- kind: Group
  name: viewers
  apiGroup: rbac.authorization.k8s.io
```

Apply to Karmada API server:
```bash
kubectl --kubeconfig ~/.kube/karmada.config apply -f rbac.yaml
```

---

## Troubleshooting

### Dex shows "Invalid redirect URI"

**Cause:** Mismatch between Dex config and Dashboard flag

**Solution:** Ensure `--oidc-redirect-url` matches the `redirectURIs` in Dex config:
```yaml
# Dex config
redirectURIs:
- 'http://localhost:8000/login/callback'

# Dashboard flag
--oidc-redirect-url http://localhost:8000/login/callback
```

### "Failed to verify ID token"

**Cause:** Issuer URL mismatch

**Solution:** Ensure `--oidc-issuer-url` matches Dex issuer exactly:
```yaml
# Dex config
issuer: http://localhost:5556/dex

# Dashboard flag
--oidc-issuer-url http://localhost:5556/dex
```

### "Invalid state parameter"

**Cause:** State expired or already used (CSRF protection)

**Solution:**
- Clear browser sessionStorage
- Restart login flow
- State expires after 10 minutes

### Mock service not reachable from Dex (Docker)

**Cause:** Docker networking issue

**Solution:** Use `host.docker.internal` instead of `localhost` in Dex config:
```yaml
connectors:
- type: oidc
  config:
    issuer: http://host.docker.internal:5555  # Not localhost
```

Or run Dex outside Docker:
```bash
# Install Dex
go install github.com/dexidp/dex/cmd/dex@latest

# Run Dex
dex serve test/oidc-integration/dex/config-oidc.yaml
```

---

## Generating Password Hashes

For static password connector, generate bcrypt hashes:

```bash
# Install htpasswd
apt-get install apache2-utils  # Debian/Ubuntu
brew install httpd              # macOS

# Generate hash
echo "your-password" | htpasswd -BinC 10 username | cut -d: -f2
```

---

## Architecture

### Simple Setup (Static Password)
```
Browser → Dashboard → Dex (static passwords) → Dashboard
```

### Advanced Setup (Mock Service)
```
Browser → Dashboard → Dex → Mock Account Service → Dex → Dashboard
```

---

## Verification Checklist

- [ ] OIDC login button appears on login page
- [ ] Clicking button redirects to Dex
- [ ] Can login with test credentials
- [ ] Redirected back to dashboard with token
- [ ] Token stored in localStorage
- [ ] API requests include Bearer token
- [ ] Token contains correct claims (sub, email, groups)
- [ ] RBAC enforced based on groups
- [ ] Backward compatibility: token login still works
- [ ] Error handling: invalid state shows error

---

## Security Notes

⚠️ **This setup is for testing only. Do NOT use in production:**
- HTTP instead of HTTPS
- Weak passwords ("password")
- No rate limiting
- No audit logging
- In-memory storage (data lost on restart)
- Auto-approval (no user consent)

For production, use:
- HTTPS with valid certificates
- Strong passwords or external IdP (LDAP/SAML)
- Rate limiting and brute-force protection
- Audit logging
- Persistent storage (Kubernetes CRDs or database)
- User consent screen
