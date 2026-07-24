window.KD_MOCK = {
  clusters: [
    { name: "member1", mode: "Push", version: "v1.35.0", status: "Ready", nodes: 1, cpu: "1.1 / 16", memory: "0.5 / 61 GiB", freshness: "8s ago" },
    { name: "member2", mode: "Push", version: "v1.35.0", status: "Ready", nodes: 1, cpu: "0.9 / 16", memory: "0.4 / 61 GiB", freshness: "11s ago" },
    { name: "member3", mode: "Pull", version: "v1.35.0", status: "Stale", nodes: 1, cpu: "1.2 / 16", memory: "0.5 / 61 GiB", freshness: "2m 14s ago" }
  ],
  resources: [
    { kind: "Deployment", name: "nginx", namespace: "default", cluster: "member1 · member2 · member3", desired: "3", ready: "3", age: "3h 18m", status: "Healthy" },
    { kind: "Deployment", name: "api-gateway", namespace: "platform", cluster: "member1 · member2", desired: "4", ready: "4", age: "12d", status: "Healthy" },
    { kind: "StatefulSet", name: "redis-primary", namespace: "data", cluster: "member2", desired: "1", ready: "1", age: "31d", status: "Healthy" },
    { kind: "DaemonSet", name: "node-exporter", namespace: "monitoring", cluster: "member1 · member2 · member3", desired: "3", ready: "3", age: "44d", status: "Healthy" },
    { kind: "CronJob", name: "log-compactor", namespace: "platform", cluster: "member3", desired: "1", ready: "0", age: "9d", status: "Degraded" },
    { kind: "Job", name: "schema-migrate-126", namespace: "data", cluster: "member1", desired: "1", ready: "1", age: "18m", status: "Complete" }
  ],
  policies: [
    { name: "demo-policy", namespace: "default", type: "PropagationPolicy", resources: "Deployment/nginx", placement: "3 clusters", conflicts: "None", updated: "4m ago", status: "Applied" },
    { name: "regional-platform", namespace: "platform", type: "ClusterPropagationPolicy", resources: "12 matched", placement: "member1 · member2", conflicts: "None", updated: "2h ago", status: "Applied" },
    { name: "member3-overrides", namespace: "platform", type: "OverridePolicy", resources: "3 matched", placement: "member3", conflicts: "1 warning", updated: "1d ago", status: "Review" },
    { name: "data-residency", namespace: "data", type: "PropagationPolicy", resources: "StatefulSet/*", placement: "member2", conflicts: "None", updated: "6d ago", status: "Applied" }
  ],
  events: [
    { time: "10:29:46", type: "Policy", title: "demo-policy propagated", detail: "1 workload · 3 clusters" },
    { time: "10:24:02", type: "Workload", title: "nginx deployment healthy", detail: "default · 3/3 replicas" },
    { time: "10:18:31", type: "Capacity", title: "member3 metrics delayed", detail: "Latest sample is 2m 14s old", level: "warn" },
    { time: "09:57:03", type: "Config", title: "Registry credentials rotated", detail: "system · completed by platform-admin" }
  ],
  memberWorkloads: [
    { kind: "Deployment", name: "nginx", namespace: "default", pods: "1 / 1", image: "nginx:1.27", cpu: "28m", memory: "46 MiB", status: "Running" },
    { kind: "DaemonSet", name: "node-exporter", namespace: "monitoring", pods: "1 / 1", image: "prom/node-exporter:v1.8", cpu: "12m", memory: "19 MiB", status: "Running" },
    { kind: "CronJob", name: "log-compactor", namespace: "platform", pods: "0 / 1", image: "registry.local/compactor:2.1", cpu: "—", memory: "—", status: "Suspended" }
  ]
};
