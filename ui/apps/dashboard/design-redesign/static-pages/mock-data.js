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
    { name: "demo-policy", namespace: "default", type: "PropagationPolicy", resources: "Deployment/nginx", placement: "3 member clusters", conflicts: "None", updated: "4m ago", status: "Applied" },
    { name: "regional-platform", namespace: "platform", type: "ClusterPropagationPolicy", resources: "12 matched", placement: "member1 · member2", conflicts: "None", updated: "2h ago", status: "Applied" },
    { name: "member3-overrides", namespace: "platform", type: "OverridePolicy", resources: "3 matched", placement: "member3", conflicts: "1 warning", updated: "1d ago", status: "Review" },
    { name: "data-residency", namespace: "data", type: "PropagationPolicy", resources: "StatefulSet/*", placement: "member2", conflicts: "None", updated: "6d ago", status: "Applied" }
  ],
  events: [
    { time: "10:29:46", type: "Policy", title: "demo-policy propagated", detail: "1 workload · 3 member clusters" },
    { time: "10:24:02", type: "Workload", title: "nginx deployment healthy", detail: "default · 3/3 replicas" },
    { time: "10:18:31", type: "Capacity", title: "member3 metrics delayed", detail: "Latest sample is 2m 14s old", level: "warn" },
    { time: "09:57:03", type: "Config", title: "Registry credentials rotated", detail: "system · completed by platform-admin" }
  ],
  memberWorkloads: [
    { kind: "Deployment", name: "nginx", namespace: "default", pods: "1 / 1", image: "nginx:1.27", cpu: "28m", memory: "46 MiB", status: "Running" },
    { kind: "DaemonSet", name: "node-exporter", namespace: "monitoring", pods: "1 / 1", image: "prom/node-exporter:v1.8", cpu: "12m", memory: "19 MiB", status: "Running" },
    { kind: "CronJob", name: "log-compactor", namespace: "platform", pods: "0 / 1", image: "registry.local/compactor:2.1", cpu: "—", memory: "—", status: "Suspended" }
  ],
  member: {
    name: "member1",
    syncMode: "Push",
    version: "v1.35.0",
    region: "Not assigned",
    status: "Ready",
    lastSync: "8s ago",
    pods: { used: 12, total: 110 },
    nodes: { ready: 1, total: 1 },
    cpu: { used: "1.05", total: "16 cores", percent: 6.56 },
    memory: { used: "0.47", total: "61 GiB", percent: 0.76 }
  },
  memberResources: {
    pods: [
      { kind: "Pod", name: "nginx-7b4f8d9f6b-q2m8d", namespace: "default", ready: "1 / 1", status: "Running", restarts: "0", node: "member1-control-plane", cpu: "28m", cpuPercent: 6, cpuRequest: "100m", cpuRequestPercent: 20, cpuLimit: "500m", memory: "46 MiB", memoryPercent: 36, memoryRequest: "64 MiB", memoryRequestPercent: 50, memoryLimit: "128 MiB", age: "3h" },
      { kind: "Pod", name: "coredns-674b8bbfcf-hz8k7", namespace: "kube-system", ready: "1 / 1", status: "Running", restarts: "0", node: "member1-control-plane", cpu: "11m", cpuPercent: 11, cpuRequest: "50m", cpuRequestPercent: 50, cpuLimit: "100m", memory: "32 MiB", memoryPercent: 46, memoryRequest: "35 MiB", memoryRequestPercent: 50, memoryLimit: "70 MiB", age: "18d" },
      { kind: "Pod", name: "metrics-server-5f8cb78db7-v9p4t", namespace: "kube-system", ready: "1 / 1", status: "Running", restarts: "1", node: "member1-control-plane", cpu: "19m", cpuPercent: 19, cpuRequest: "50m", cpuRequestPercent: 50, cpuLimit: "100m", memory: "58 MiB", memoryPercent: 58, memoryRequest: "50 MiB", memoryRequestPercent: 50, memoryLimit: "100 MiB", age: "18d" }
    ],
    cronjobs: [
      { kind: "CronJob", name: "certificate-rotation", namespace: "kube-system", ready: "1 / 1", image: "registry.k8s.io/kube-apiserver:v1.35.0", schedule: "0 2 * * 0", age: "18d", status: "Ready" },
      { kind: "CronJob", name: "log-compactor", namespace: "platform", ready: "0 / 1", image: "registry.local/compactor:2.1", schedule: "*/30 * * * *", age: "9d", status: "Suspended" }
    ],
    daemonsets: [
      { kind: "DaemonSet", name: "kube-proxy", namespace: "kube-system", ready: "1 / 1", image: "registry.k8s.io/kube-proxy:v1.35.0", available: "1", age: "18d", status: "Ready" },
      { kind: "DaemonSet", name: "node-exporter", namespace: "monitoring", ready: "1 / 1", image: "prom/node-exporter:v1.8.2", available: "1", age: "16d", status: "Ready" }
    ],
    deployments: [
      { kind: "Deployment", name: "coredns", namespace: "kube-system", ready: "2 / 2", image: "registry.k8s.io/coredns/coredns:v1.12.1", updated: "2", age: "18d", status: "Ready" },
      { kind: "Deployment", name: "metrics-server", namespace: "kube-system", ready: "1 / 1", image: "registry.k8s.io/metrics-server:v0.8.0", updated: "1", age: "18d", status: "Ready" },
      { kind: "Deployment", name: "nginx", namespace: "default", ready: "1 / 1", image: "nginx:1.27", updated: "1", age: "3h", status: "Ready" }
    ],
    statefulsets: [
      { kind: "StatefulSet", name: "prometheus", namespace: "monitoring", ready: "1 / 1", service: "prometheus", strategy: "RollingUpdate", image: "prom/prometheus:v3.4.1", age: "16d", status: "Ready" },
      { kind: "StatefulSet", name: "registry", namespace: "platform", ready: "1 / 1", service: "registry", strategy: "RollingUpdate", image: "registry:2.8.3", age: "12d", status: "Ready" }
    ],
    jobs: [
      { kind: "Job", name: "bootstrap-check", namespace: "kube-system", ready: "1 / 1", image: "registry.k8s.io/kubectl:v1.35.0", completions: "1 / 1", age: "18d", status: "Complete" },
      { kind: "Job", name: "schema-migrate-126", namespace: "data", ready: "1 / 1", image: "registry.local/migrate:126", completions: "1 / 1", age: "18m", status: "Complete" }
    ],
    ingress: [
      { kind: "Ingress", name: "console", namespace: "platform", class: "nginx", hosts: "console.member1.local", address: "10.10.0.21", tls: "Enabled", age: "12d", status: "Ready" },
      { kind: "Ingress", name: "registry", namespace: "platform", class: "nginx", hosts: "registry.member1.local", address: "10.10.0.22", tls: "Enabled", age: "12d", status: "Ready" }
    ],
    services: [
      { kind: "Service", name: "kubernetes", namespace: "default", type: "ClusterIP", clusterIp: "10.96.0.1", ports: "443/TCP", endpoints: "1", age: "18d", status: "Ready" },
      { kind: "Service", name: "kube-dns", namespace: "kube-system", type: "ClusterIP", clusterIp: "10.96.0.10", ports: "53/UDP · 53/TCP", endpoints: "2", age: "18d", status: "Ready" },
      { kind: "Service", name: "metrics-server", namespace: "kube-system", type: "ClusterIP", clusterIp: "10.98.44.12", ports: "443/TCP", endpoints: "1", age: "18d", status: "Ready" }
    ],
    networkPolicies: [
      { kind: "NetworkPolicy", name: "default-deny", namespace: "platform", podSelector: "{}", types: ["Ingress", "Egress"], rules: "2", age: "12d", status: "Ready" },
      { kind: "NetworkPolicy", name: "allow-monitoring", namespace: "monitoring", podSelector: "app=prometheus", types: ["Ingress"], rules: "1", age: "16d", status: "Ready" }
    ],
    gateways: [
      { kind: "Gateway", name: "platform-gateway", namespace: "platform", class: "nginx", addresses: "10.10.0.21", listeners: "2", routes: "2", age: "12d", status: "Programmed" }
    ],
    httpRoutes: [
      { kind: "HTTPRoute", name: "console", namespace: "platform", hostnames: "console.member1.local", parents: ["platform-gateway"], rules: "2", backends: "1", age: "12d", status: "Accepted" },
      { kind: "HTTPRoute", name: "registry", namespace: "platform", hostnames: "registry.member1.local", parents: ["platform-gateway"], rules: "1", backends: "1", age: "12d", status: "Accepted" }
    ],
    helmReleases: [
      { kind: "HelmRelease", name: "prometheus", namespace: "monitoring", chart: "kube-prometheus-stack", version: "75.15.1", revision: "4", updated: "3h ago", status: "Deployed" },
      { kind: "HelmRelease", name: "registry", namespace: "platform", chart: "docker-registry", version: "2.2.3", revision: "2", updated: "12d ago", status: "Deployed" }
    ],
    helmCharts: [
      { kind: "HelmChart", name: "kube-prometheus-stack", repository: "prometheus-community", version: "75.15.1", appVersion: "v0.84.0", description: "Kubernetes monitoring stack", updated: "2h ago", status: "Available" },
      { kind: "HelmChart", name: "ingress-nginx", repository: "ingress-nginx", version: "4.13.0", appVersion: "1.13.0", description: "Ingress controller for Kubernetes", updated: "6h ago", status: "Available" },
      { kind: "HelmChart", name: "docker-registry", repository: "twuni", version: "2.2.3", appVersion: "2.8.3", description: "Private container registry", updated: "1d ago", status: "Available" }
    ],
    configmaps: [
      { kind: "ConfigMap", name: "coredns", namespace: "kube-system", keys: ["Corefile"], immutable: "No", age: "18d", status: "Ready" },
      { kind: "ConfigMap", name: "kube-proxy", namespace: "kube-system", keys: ["config.conf", "kubeconfig.conf"], immutable: "No", age: "18d", status: "Ready" },
      { kind: "ConfigMap", name: "kube-root-ca.crt", namespace: "default", keys: ["ca.crt"], immutable: "No", age: "18d", status: "Ready" }
    ],
    pvcs: [
      { kind: "PersistentVolumeClaim", name: "registry-cache", namespace: "platform", phase: "Bound", volume: "pvc-4b7e91", capacity: "20 GiB", access: ["RWO"], storageClass: "local-path", age: "12d", status: "Bound" },
      { kind: "PersistentVolumeClaim", name: "prometheus-data", namespace: "monitoring", phase: "Bound", volume: "pvc-908af1", capacity: "50 GiB", access: ["RWO"], storageClass: "local-path", age: "16d", status: "Bound" }
    ],
    secrets: [
      { kind: "Secret", name: "default-token", namespace: "default", type: "kubernetes.io/service-account-token", dataKeys: ["ca.crt", "namespace", "token"], age: "18d", status: "Ready", sensitive: true },
      { kind: "Secret", name: "registry-pull", namespace: "platform", type: "kubernetes.io/dockerconfigjson", dataKeys: [".dockerconfigjson"], age: "12d", status: "Ready", sensitive: true }
    ],
    hpas: [
      { kind: "HorizontalPodAutoscaler", name: "nginx", namespace: "default", target: "Deployment/nginx", metric: "CPU 12% / 70%", replicas: "1 / 1–5", age: "3h", status: "Ready" },
      { kind: "HorizontalPodAutoscaler", name: "metrics-server", namespace: "kube-system", target: "Deployment/metrics-server", metric: "CPU 21% / 75%", replicas: "1 / 1–3", age: "18d", status: "Ready" }
    ],
    pdbs: [
      { kind: "PodDisruptionBudget", name: "coredns", namespace: "kube-system", selector: "k8s-app=kube-dns", minAvailable: "1", allowed: "1", age: "18d", status: "Ready" },
      { kind: "PodDisruptionBudget", name: "prometheus", namespace: "monitoring", selector: "app=prometheus", minAvailable: "1", allowed: "0", age: "16d", status: "Protected" }
    ],
    clusterRoleBindings: [
      { kind: "ClusterRoleBinding", name: "cluster-admin", role: "cluster-admin", subjects: ["Group/system:masters"], age: "18d", status: "Ready" },
      { kind: "ClusterRoleBinding", name: "system:node", role: "system:node", subjects: ["Group/system:nodes"], age: "18d", status: "Ready" }
    ],
    clusterRoles: [
      { kind: "ClusterRole", name: "cluster-admin", rules: "1 rule", resources: ["*"], verbs: ["*"], labels: ["kubernetes.io/bootstrapping=rbac-defaults"], age: "18d", status: "Ready" },
      { kind: "ClusterRole", name: "system:discovery", rules: "4 rules", resources: ["apis", "healthz", "version"], verbs: ["get"], labels: ["kubernetes.io/bootstrapping=rbac-defaults"], age: "18d", status: "Ready" }
    ],
    events: [
      { kind: "Event", name: "nginx-7b4f8d9f6b", namespace: "default", eventType: "Normal", reason: "Pulled", object: "Pod/nginx-7b4f8d9f6b", message: "Container image nginx:1.27 already present on machine", source: "kubelet", lastSeen: "3m ago", count: "4", status: "Normal" },
      { kind: "Event", name: "metrics-server-5f8cb", namespace: "kube-system", eventType: "Warning", reason: "Unhealthy", object: "Pod/metrics-server-5f8cb", message: "Readiness probe failed once and recovered", source: "kubelet", lastSeen: "26m ago", count: "1", status: "Review" }
    ],
    namespaces: [
      { kind: "Namespace", name: "default", labels: ["kubernetes.io/metadata.name=default"], phase: "Active", age: "18d", status: "Active" },
      { kind: "Namespace", name: "kube-system", labels: ["kubernetes.io/metadata.name=kube-system"], phase: "Active", age: "18d", status: "Active" },
      { kind: "Namespace", name: "monitoring", labels: ["owner=platform"], phase: "Active", age: "16d", status: "Active" },
      { kind: "Namespace", name: "platform", labels: ["owner=platform"], phase: "Active", age: "12d", status: "Active" }
    ],
    nodes: [
      { kind: "Node", name: "member1-control-plane", status: "Ready", roles: ["control-plane"], version: "v1.35.0", internalIp: "192.168.10.11", os: "Ubuntu 24.04.2 LTS", runtime: "containerd://2.0.4", cpu: "1.05 cores", cpuPercent: 6.56, cpuLimit: "16 cores", memory: "0.47 GiB", memoryPercent: 0.76, memoryLimit: "61 GiB", pods: "12 / 110", unschedulable: false, taints: [], age: "18d" }
    ],
    pvs: [
      { kind: "PersistentVolume", name: "pvc-4b7e91", capacity: "20 GiB", access: ["RWO"], reclaim: "Delete", phase: "Bound", claim: "platform/registry-cache", storageClass: "local-path", age: "12d", status: "Bound" },
      { kind: "PersistentVolume", name: "pvc-908af1", capacity: "50 GiB", access: ["RWO"], reclaim: "Delete", phase: "Bound", claim: "monitoring/prometheus-data", storageClass: "local-path", age: "16d", status: "Bound" }
    ],
    storageClasses: [
      { kind: "StorageClass", name: "local-path", provisioner: "rancher.io/local-path", reclaim: "Delete", binding: "WaitForFirstConsumer", expansion: "No", parameters: ["pathPattern"], age: "18d", status: "Ready" },
      { kind: "StorageClass", name: "fast", provisioner: "csi.example.io", reclaim: "Retain", binding: "Immediate", expansion: "Yes", parameters: ["type=ssd", "replicas=2"], age: "12d", status: "Ready" }
    ],
    roleBindings: [
      { kind: "RoleBinding", name: "read-platform", namespace: "platform", role: "Role/platform-reader", subjects: ["Group/platform-viewers"], age: "12d", status: "Ready" },
      { kind: "RoleBinding", name: "prometheus-config", namespace: "monitoring", role: "Role/prometheus-config", subjects: ["ServiceAccount/prometheus"], age: "16d", status: "Ready" }
    ],
    roles: [
      { kind: "Role", name: "platform-reader", namespace: "platform", rules: "3 rules", resources: ["deployments", "services", "pods"], verbs: ["get", "list", "watch"], labels: ["owner=platform"], age: "12d", status: "Ready" },
      { kind: "Role", name: "prometheus-config", namespace: "monitoring", rules: "2 rules", resources: ["configmaps", "secrets"], verbs: ["get", "update"], labels: ["app=prometheus"], age: "16d", status: "Ready" }
    ],
    serviceAccounts: [
      { kind: "ServiceAccount", name: "default", namespace: "default", secrets: "1", automount: "Inherited", age: "18d", status: "Ready" },
      { kind: "ServiceAccount", name: "prometheus", namespace: "monitoring", secrets: "1", automount: "Enabled", age: "16d", status: "Ready" },
      { kind: "ServiceAccount", name: "registry", namespace: "platform", secrets: "2", automount: "Disabled", age: "12d", status: "Ready" }
    ],
    crds: [
      { kind: "CustomResourceDefinition", name: "servicemonitors.monitoring.coreos.com", group: "monitoring.coreos.com", scope: "Namespaced", versions: ["v1"], kindName: "ServiceMonitor", stored: "v1", age: "16d", status: "Established" },
      { kind: "CustomResourceDefinition", name: "prometheusrules.monitoring.coreos.com", group: "monitoring.coreos.com", scope: "Namespaced", versions: ["v1"], kindName: "PrometheusRule", stored: "v1", age: "16d", status: "Established" }
    ]
  }
};

window.KD_MOCK.controlResources = {
  clusters: window.KD_MOCK.clusters.map((cluster) => ({
    kind: "Cluster", name: cluster.name, syncMode: cluster.mode, kubernetes: cluster.version,
    nodes: `${cluster.nodes} / ${cluster.nodes}`, freshness: cluster.freshness, status: cluster.status, age: "18d"
  })),
  resourceBindings: [
    { kind: "ResourceBinding", name: "nginx-deployment", namespace: "default", resource: "Deployment/nginx", policy: "demo-policy", clusters: ["member1", "member2", "member3"], replicas: "1 · 1 · 1", scheduler: "default-scheduler", status: "Scheduled", age: "3h" },
    { kind: "ResourceBinding", name: "api-gateway-deployment", namespace: "platform", resource: "Deployment/api-gateway", policy: "platform-services", clusters: ["member1", "member2"], replicas: "2 · 2", scheduler: "default-scheduler", status: "Scheduled", age: "12d" }
  ],
  clusterResourceBindings: [
    { kind: "ClusterResourceBinding", name: "node-exporter-daemonset", resource: "DaemonSet/monitoring/node-exporter", policy: "global-monitoring", clusters: ["member1", "member2", "member3"], scheduler: "default-scheduler", status: "Scheduled", age: "44d" },
    { kind: "ClusterResourceBinding", name: "platform-namespace", resource: "Namespace/platform", policy: "regional-platform", clusters: ["member1", "member2"], scheduler: "default-scheduler", status: "Scheduled", age: "12d" }
  ],
  works: [
    { kind: "Work", name: "member1-nginx-7fd4", namespace: "karmada-es-member1", cluster: "member1", workload: "Deployment/default/nginx", manifests: "1", applied: "1 / 1", status: "Applied", age: "3h" },
    { kind: "Work", name: "member2-nginx-2ab9", namespace: "karmada-es-member2", cluster: "member2", workload: "Deployment/default/nginx", manifests: "1", applied: "1 / 1", status: "Applied", age: "3h" },
    { kind: "Work", name: "member3-log-compactor-91c2", namespace: "karmada-es-member3", cluster: "member3", workload: "CronJob/platform/log-compactor", manifests: "1", applied: "0 / 1", status: "Degraded", age: "9d" }
  ],
  multiClusterServices: [
    { kind: "MultiClusterService", name: "api-gateway", namespace: "platform", service: "Service/api-gateway", clusters: ["member1", "member2"], ports: "443/TCP", endpoints: "4", discovery: "Ready", status: "Ready", age: "12d" },
    { kind: "MultiClusterService", name: "kube-dns", namespace: "kube-system", service: "Service/kube-dns", clusters: ["member1", "member2", "member3"], ports: "53/UDP · 53/TCP", endpoints: "6", discovery: "Ready", status: "Ready", age: "18d" }
  ],
  serviceExports: [
    { kind: "ServiceExport", name: "api-gateway", namespace: "platform", cluster: "member1", service: "api-gateway", ports: "443/TCP", consumers: ["member2"], status: "Ready", age: "12d" },
    { kind: "ServiceExport", name: "registry", namespace: "platform", cluster: "member2", service: "registry", ports: "5000/TCP", consumers: ["member1", "member3"], status: "Ready", age: "12d" }
  ],
  pods: window.KD_MOCK.memberResources.pods.map((row) => ({ ...row, placement: "member1" })),
  deployments: window.KD_MOCK.memberResources.deployments.map((row) => ({ ...row, placement: row.name === "nginx" ? "member1 · member2 · member3" : "member1 · member2" })),
  statefulsets: window.KD_MOCK.memberResources.statefulsets.map((row) => ({ ...row, placement: row.name === "prometheus" ? "member1 · member2 · member3" : "member2" })),
  daemonsets: window.KD_MOCK.memberResources.daemonsets.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  jobs: window.KD_MOCK.memberResources.jobs.map((row) => ({ ...row, placement: "member1" })),
  cronjobs: window.KD_MOCK.memberResources.cronjobs.map((row) => ({ ...row, placement: row.name === "log-compactor" ? "member3" : "member1 · member2" })),
  services: window.KD_MOCK.memberResources.services.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  ingress: window.KD_MOCK.memberResources.ingress.map((row) => ({ ...row, placement: "member1 · member2" })),
  networkPolicies: window.KD_MOCK.memberResources.networkPolicies.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  configmaps: window.KD_MOCK.memberResources.configmaps.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  secrets: window.KD_MOCK.memberResources.secrets.map((row) => ({ ...row, placement: row.namespace === "platform" ? "member1 · member2" : "member1 · member2 · member3" })),
  hpas: window.KD_MOCK.memberResources.hpas.map((row) => ({ ...row, placement: "member1 · member2" })),
  pdbs: window.KD_MOCK.memberResources.pdbs.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  pvcs: window.KD_MOCK.memberResources.pvcs.map((row) => ({ ...row, placement: row.name === "prometheus-data" ? "member1 · member2 · member3" : "member2" })),
  pvs: window.KD_MOCK.memberResources.pvs.map((row) => ({ ...row, placement: "member2" })),
  storageClasses: window.KD_MOCK.memberResources.storageClasses.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  namespaces: window.KD_MOCK.memberResources.namespaces.map((row) => ({ ...row, placement: row.name === "platform" ? "member1 · member2" : "member1 · member2 · member3" })),
  events: [
    { kind: "Event", name: "member3-work-sync", namespace: "karmada-es-member3", eventType: "Warning", reason: "ApplyFailed", object: "Work/member3-log-compactor-91c2", message: "CronJob is suspended in member3", source: "karmada-controller-manager", lastSeen: "2m ago", count: "3", status: "Review" },
    { kind: "Event", name: "nginx-scheduled", namespace: "default", eventType: "Normal", reason: "ScheduleSuccess", object: "ResourceBinding/nginx-deployment", message: "Resource scheduled to 3 member clusters", source: "karmada-scheduler", lastSeen: "4m ago", count: "1", status: "Normal" }
  ],
  crds: [
    { kind: "CustomResourceDefinition", name: "clusters.cluster.karmada.io", group: "cluster.karmada.io", scope: "Cluster", versions: ["v1alpha1"], kindName: "Cluster", stored: "v1alpha1", instances: "3", status: "Established", age: "18d" },
    { kind: "CustomResourceDefinition", name: "propagationpolicies.policy.karmada.io", group: "policy.karmada.io", scope: "Namespaced", versions: ["v1alpha1"], kindName: "PropagationPolicy", stored: "v1alpha1", instances: "2", status: "Established", age: "18d" },
    { kind: "CustomResourceDefinition", name: "resourcebindings.work.karmada.io", group: "work.karmada.io", scope: "Namespaced", versions: ["v1alpha2"], kindName: "ResourceBinding", stored: "v1alpha2", instances: "2", status: "Established", age: "18d" }
  ],
  serviceAccounts: window.KD_MOCK.memberResources.serviceAccounts.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  roles: window.KD_MOCK.memberResources.roles.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  roleBindings: window.KD_MOCK.memberResources.roleBindings.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  clusterRoles: window.KD_MOCK.memberResources.clusterRoles.map((row) => ({ ...row, placement: "member1 · member2 · member3" })),
  clusterRoleBindings: window.KD_MOCK.memberResources.clusterRoleBindings.map((row) => ({ ...row, placement: "member1 · member2 · member3" }))
};

export {};
