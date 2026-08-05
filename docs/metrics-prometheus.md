# Prometheus-backed control-plane metrics

Karmada Dashboard metrics v2 uses Prometheus for collection, retention, and
querying. The `metrics-scraper` deployment is now a stateless API gateway; it
does not create SQLite databases or scrape member clusters.

## Managed Prometheus installation

The managed mode installs one Prometheus StatefulSet. It retains seven days of
data on a 10 Gi PVC by default and directly discovers Karmada control-plane
pods in `karmada-system`.

Before installing, verify that the cluster has a default StorageClass. If it
does not, set `metrics_scraper.prometheus.managed.storage.storageClassName`.

Create the kubeconfig Secret expected by the chart:

```bash
kubectl create namespace karmada-system --dry-run=client -o yaml | kubectl apply -f -

kubectl -n karmada-system create secret generic karmada-kubeconfig \
  --from-file=kubeconfig=/path/to/karmada.config \
  --dry-run=client -o yaml | kubectl apply -f -
```

The selected kubeconfig context must contain either a client certificate/key
or a bearer token and CA data that can authenticate to secure Karmada metrics
endpoints.

Each entry under `metrics_scraper.components` can override `namespace`,
`selectorLabel`, `selectorRegex`, `port`, `scheme`, `path`, `serverName`, and
`insecureSkipVerify`. An empty component `namespace` inherits
`prometheus.managed.targetNamespace`. The chart creates Pod-discovery Roles
only in the namespaces used by enabled components. `karmada-agent` remains
disabled by default.

Create `values-prometheus.yaml`:

```yaml
metrics_scraper:
  replicaCount: 2
  kubeconfigName: karmada-kubeconfig
  kubeconfigContext: karmada-apiserver

  prometheus:
    mode: managed
    queryTimeout: 15s
    maxQueryRange: 168h
    managed:
      image:
        repository: prom/prometheus
        tag: v3.5.0
        pullPolicy: IfNotPresent
      targetNamespace: karmada-system
      scrapeInterval: 15s
      retention: 7d
      storage:
        type: pvc
        size: 10Gi
        storageClassName: ""
      resources:
        requests:
          cpu: 100m
          memory: 256Mi
        limits:
          cpu: 500m
          memory: 1Gi

  components:
    karmada-agent:
      enabled: false
```

Validate and install the chart:

```bash
helm dependency build charts/karmada-dashboard
helm lint charts/karmada-dashboard -f values-prometheus.yaml
helm template karmada-dashboard charts/karmada-dashboard \
  -n karmada-system -f values-prometheus.yaml

helm upgrade --install karmada-dashboard charts/karmada-dashboard \
  -n karmada-system --create-namespace -f values-prometheus.yaml
```

Wait for the storage and workloads:

```bash
kubectl -n karmada-system rollout status statefulset/karmada-dashboard-prometheus
kubectl -n karmada-system rollout status deployment/karmada-dashboard-metrics-scraper
kubectl -n karmada-system get pods,pvc
```

Allow two scrape intervals before checking data. Verify Prometheus:

```bash
kubectl -n karmada-system port-forward service/karmada-dashboard-prometheus 9090:9090

curl -G http://localhost:9090/api/v1/query \
  --data-urlencode 'query=count by (karmada_component) (up)'
```

The target page is available at <http://localhost:9090/targets>.

Verify the Dashboard domain API:

```bash
kubectl -n karmada-system port-forward service/karmada-dashboard-metrics-scraper 8000:8000
curl http://localhost:8000/api/v2/metrics/components
```

## External Prometheus

External mode does not install a Prometheus StatefulSet. The external server
must scrape the configured control-plane targets and attach the labels
`karmada_component`, `karmada_namespace`, and `karmada_pod`.

```yaml
metrics_scraper:
  prometheus:
    mode: external
    external:
      url: https://prometheus.monitoring.svc:9090
      bearerTokenSecret:
        name: prometheus-reader
        key: token
      tlsSecret:
        name: prometheus-client-tls
        caKey: ca.crt
        certKey: tls.crt
        keyKey: tls.key
      serverName: prometheus.monitoring.svc
      insecureSkipVerify: false
```

Bearer-token and client-certificate settings are optional. Only configure the
authentication method required by the external endpoint. For CA-only TLS,
set `tlsSecret.name` and `caKey` while leaving `certKey` and `keyKey` empty;
for mTLS, configure both `certKey` and `keyKey`.

## Troubleshooting

- **PVC remains Pending:** configure a valid StorageClass or use
  `storage.type: emptyDir` for non-persistent development environments.
- **The prepare-config init container fails:** verify the Secret contains a
  `kubeconfig` key, the configured context exists, and its credential files or
  embedded data are readable.
- **A target reports `up == 0`:** check the component port, pod-IP network
  reachability, NetworkPolicy, TLS server name, and Prometheus discovery Role.
- **The API returns 503:** inspect Prometheus readiness and the configured
  endpoint from the metrics-scraper pod.
- Managed mode intentionally uses one Prometheus replica. Use external mode
  with an existing HA Prometheus service when storage-layer HA is required.
