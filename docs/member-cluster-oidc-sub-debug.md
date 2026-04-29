# Member Cluster OIDC (sub) Debug Notes

This project keeps `sub` as the OIDC username source on the control plane:

- `--oidc-username-claim=sub`
- `--oidc-username-prefix=oidc:`

For member cluster access through Dashboard (`/clusterapi/{member}/...`), bind RBAC by:

- `User: oidc:<sub>`

## Verify identity with token-only flow

Avoid kubeconfig client certs when validating OIDC tokens. Use a token-only command:

```bash
kubectl \
  --kubeconfig=/Users/dingwenjiang/.kube/karmada-v2.config \
  --context=karmada-apiserver \
  --token="<id_token>" \
  auth whoami
```

Then verify proxy access to a member cluster:

```bash
kubectl \
  --kubeconfig=/Users/dingwenjiang/.kube/karmada-v2.config \
  --context=karmada-apiserver \
  --token="<id_token>" \
  get --raw '/apis/cluster.karmada.io/v1alpha1/clusters/member1/proxy/api/v1/namespaces'
```

If this returns `forbidden`, apply RBAC in member cluster using:

- `artifacts/dashboard/member-cluster-oidc-sub-readonly-rbac.yaml`
