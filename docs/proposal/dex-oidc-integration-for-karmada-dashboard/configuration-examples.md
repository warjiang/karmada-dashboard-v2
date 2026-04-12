# Configuration Examples

This document provides complete configuration examples for deploying Dex OIDC integration with the Karmada Dashboard.

## Table of Contents

- [Dex Configuration](#dex-configuration)
- [Karmada API Server Configuration](#karmada-api-server-configuration)
- [Dashboard Backend Configuration](#dashboard-backend-configuration)
- [RBAC Configuration](#rbac-configuration)

---

## Dex Configuration

### Example 1: LDAP Connector

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dex-config
  namespace: karmada-system
data:
  config.yaml: |
    issuer: https://dex.example.com

    storage:
      type: kubernetes
      config:
        inCluster: true

    web:
      http: 0.0.0.0:5556

    oauth2:
      skipApprovalScreen: true

    staticClients:
    - id: karmada-dashboard
      redirectURIs:
      - 'https://dashboard.example.com/login/callback'
      name: 'Karmada Dashboard'
      secret: your-client-secret-here

    connectors:
    - type: ldap
      id: ldap
      name: Corporate LDAP
      config:
        host: ldap.example.com:636
        insecureNoSSL: false
        insecureSkipVerify: false

        # Bind credentials for searching
        bindDN: cn=admin,dc=example,dc=com
        bindPW: admin-password

        # User search configuration
        userSearch:
          baseDN: ou=users,dc=example,dc=com
          filter: "(objectClass=person)"
          username: uid
          idAttr: uid
          emailAttr: mail
          nameAttr: cn

        # Group search configuration
        groupSearch:
          baseDN: ou=groups,dc=example,dc=com
          filter: "(objectClass=groupOfNames)"
          userMatchers:
          - userAttr: DN
            groupAttr: member
          nameAttr: cn
```

### Example 2: GitHub Connector

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dex-config
  namespace: karmada-system
data:
  config.yaml: |
    issuer: https://dex.example.com

    storage:
      type: kubernetes
      config:
        inCluster: true

    web:
      http: 0.0.0.0:5556

    oauth2:
      skipApprovalScreen: true

    staticClients:
    - id: karmada-dashboard
      redirectURIs:
      - 'https://dashboard.example.com/login/callback'
      name: 'Karmada Dashboard'
      secret: your-client-secret-here

    connectors:
    - type: github
      id: github
      name: GitHub
      config:
        clientID: $GITHUB_CLIENT_ID
        clientSecret: $GITHUB_CLIENT_SECRET
        redirectURI: https://dex.example.com/callback
        orgs:
        - name: your-github-org
          teams:
          - platform-team
          - sre-team
```

### Example 3: SAML Connector

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dex-config
  namespace: karmada-system
data:
  config.yaml: |
    issuer: https://dex.example.com

    storage:
      type: kubernetes
      config:
        inCluster: true

    web:
      http: 0.0.0.0:5556

    oauth2:
      skipApprovalScreen: true

    staticClients:
    - id: karmada-dashboard
      redirectURIs:
      - 'https://dashboard.example.com/login/callback'
      name: 'Karmada Dashboard'
      secret: your-client-secret-here

    connectors:
    - type: saml
      id: saml
      name: Corporate SSO
      config:
        ssoURL: https://sso.example.com/saml/sso
        ca: /etc/dex/saml-ca.pem
        redirectURI: https://dex.example.com/callback
        usernameAttr: email
        emailAttr: email
        groupsAttr: groups
```

---

## Karmada API Server Configuration

### Karmada API Server Deployment

Add the following flags to the Karmada API Server deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: karmada-apiserver
  namespace: karmada-system
spec:
  template:
    spec:
      containers:
      - name: karmada-apiserver
        command:
        - kube-apiserver
        - --oidc-issuer-url=https://dex.example.com
        - --oidc-client-id=karmada-dashboard
        - --oidc-username-claim=email
        - --oidc-username-prefix=oidc:
        - --oidc-groups-claim=groups
        - --oidc-groups-prefix=oidc:
        # Optional: CA certificate for Dex
        # - --oidc-ca-file=/etc/kubernetes/pki/dex-ca.crt
        # Existing flags...
        - --etcd-servers=https://etcd:2379
        - --service-cluster-ip-range=10.96.0.0/12
        # ... other flags
```

### Configuration Explanation

| Flag | Description | Example Value |
|------|-------------|---------------|
| `--oidc-issuer-url` | Dex issuer URL (must match Dex config) | `https://dex.example.com` |
| `--oidc-client-id` | OAuth2 client ID (must match Dex config) | `karmada-dashboard` |
| `--oidc-username-claim` | JWT claim to use as username | `email` or `sub` |
| `--oidc-username-prefix` | Prefix for OIDC usernames (for RBAC) | `oidc:` |
| `--oidc-groups-claim` | JWT claim containing user groups | `groups` |
| `--oidc-groups-prefix` | Prefix for OIDC groups (for RBAC) | `oidc:` |
| `--oidc-ca-file` | CA cert to verify Dex TLS (if self-signed) | `/etc/kubernetes/pki/dex-ca.crt` |

---

## Dashboard Backend Configuration

### Deployment with OIDC Flags

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: karmada-dashboard-api
  namespace: karmada-system
spec:
  template:
    spec:
      containers:
      - name: api
        image: karmada/dashboard-api:latest
        command:
        - /dashboard-api
        - --kubeconfig=/etc/karmada/kubeconfig
        - --karmada-kubeconfig=/etc/karmada/karmada-apiserver.config
        - --oidc-issuer-url=https://dex.example.com
        - --oidc-client-id=karmada-dashboard
        - --oidc-client-secret=your-client-secret-here
        - --oidc-redirect-url=https://dashboard.example.com/login/callback
        - --oidc-scopes=openid,email,groups,profile
        env:
        - name: OIDC_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: dashboard-oidc-secret
              key: client-secret
        ports:
        - containerPort: 8000
          name: http
        volumeMounts:
        - name: kubeconfig
          mountPath: /etc/karmada
          readOnly: true
      volumes:
      - name: kubeconfig
        secret:
          secretName: karmada-kubeconfig
```

### Secret for OIDC Client Credentials

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dashboard-oidc-secret
  namespace: karmada-system
type: Opaque
stringData:
  client-secret: your-client-secret-here
```

### CLI Flags Reference

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--oidc-issuer-url` | Yes | - | Dex issuer URL |
| `--oidc-client-id` | Yes | - | OAuth2 client ID |
| `--oidc-client-secret` | Yes | - | OAuth2 client secret |
| `--oidc-redirect-url` | Yes | - | OAuth2 redirect URI |
| `--oidc-scopes` | No | `openid,email,groups` | OIDC scopes to request |

---

## RBAC Configuration

### Example 1: Bind LDAP Group to Cluster Admin

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: oidc-platform-admins
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: Group
  name: oidc:platform-team
  apiGroup: rbac.authorization.k8s.io
```

### Example 2: Bind Individual User to View Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: oidc-user-viewer
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: view
subjects:
- kind: User
  name: oidc:alice@example.com
  apiGroup: rbac.authorization.k8s.io
```

### Example 3: Namespace-Scoped Role for SRE Team

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: oidc-sre-edit
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: edit
subjects:
- kind: Group
  name: oidc:sre-team
  apiGroup: rbac.authorization.k8s.io
```

---

## Complete Deployment Example

### Dex Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dex
  namespace: karmada-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: dex
  template:
    metadata:
      labels:
        app: dex
    spec:
      containers:
      - name: dex
        image: ghcr.io/dexidp/dex:v2.37.0
        command:
        - /usr/local/bin/dex
        - serve
        - /etc/dex/config.yaml
        ports:
        - name: http
          containerPort: 5556
        volumeMounts:
        - name: config
          mountPath: /etc/dex
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: dex-config
---
apiVersion: v1
kind: Service
metadata:
  name: dex
  namespace: karmada-system
spec:
  selector:
    app: dex
  ports:
  - name: http
    port: 5556
    targetPort: 5556
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dex
  namespace: karmada-system
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - dex.example.com
    secretName: dex-tls
  rules:
  - host: dex.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dex
            port:
              number: 5556
```

---

## Testing the Configuration

### 1. Verify Dex is Running

```bash
kubectl get pods -n karmada-system -l app=dex
kubectl logs -n karmada-system -l app=dex
```

### 2. Test OIDC Discovery Endpoint

```bash
curl https://dex.example.com/.well-known/openid-configuration
```

Expected response:
```json
{
  "issuer": "https://dex.example.com",
  "authorization_endpoint": "https://dex.example.com/auth",
  "token_endpoint": "https://dex.example.com/token",
  "jwks_uri": "https://dex.example.com/keys",
  ...
}
```

### 3. Test Dashboard OIDC Login Endpoint

```bash
curl -v https://dashboard.example.com/api/v1/auth/oidc/login
```

Expected: HTTP 302 redirect to Dex authorization endpoint.

### 4. Complete Login Flow

1. Open browser: `https://dashboard.example.com`
2. Click "Enterprise Login"
3. Authenticate with your IdP credentials
4. Verify redirect back to dashboard with successful login

---

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| "Invalid redirect URI" | Mismatch between Dex config and dashboard | Ensure `redirectURIs` in Dex matches `--oidc-redirect-url` |
| "Invalid client" | Client ID mismatch | Verify `--oidc-client-id` matches Dex `staticClients[].id` |
| "Token verification failed" | Karmada API Server OIDC config wrong | Check `--oidc-issuer-url` matches Dex issuer exactly |
| "Forbidden" after login | RBAC not configured | Create ClusterRoleBinding for OIDC user/group |
| "Connection refused" to Dex | Dex not accessible | Check Dex service, ingress, and DNS |

### Debug Logs

Enable debug logging in Dashboard:

```bash
--v=4
```

Check Karmada API Server logs for OIDC token verification:

```bash
kubectl logs -n karmada-system karmada-apiserver-xxx | grep oidc
```
