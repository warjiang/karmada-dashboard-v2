(function () {
  "use strict";

  const esc = (value) => String(value ?? "—").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

  function refreshIconButton(label, attribute) {
    return `<button class="refresh-icon-button member-detail-refresh" type="button" ${attribute} data-tooltip="${label}" aria-label="${label}"><svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.22 6.49L3 16"></path><path d="M3 21v-5h5"></path><path d="M3 12A9 9 0 0 1 18.22 5.51L21 8"></path><path d="M21 3v5h-5"></path></svg></button>`;
  }

  function detailActionIcon(action) {
    const shapes = {
      access: '<circle cx="8" cy="15" r="3"></circle><path d="m10.5 13.5 7-7"></path><path d="m15 6 3 3"></path>',
      cordon: '<path d="M12 3 4.5 6v5.5c0 4.3 2.8 7.8 7.5 9.5 4.7-1.7 7.5-5.2 7.5-9.5V6Z"></path><path d="M8.5 12h7"></path>',
      drain: '<path d="M12 3v13"></path><path d="m7 11 5 5 5-5"></path><path d="M5 21h14"></path>',
      events: '<path d="M6 3v3M18 3v3M4 9h16"></path><rect x="4" y="5" width="16" height="16" rx="2"></rect><path d="M8 13h3M8 17h6"></path>',
      exec: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m7 9 3 3-3 3"></path><path d="M13 15h4"></path>',
      logs: '<path d="M5 5h14M5 10h14M5 15h9M5 20h6"></path>',
      monitor: '<path d="M3 12h4l2.2-5 4.1 10 2.2-5H21"></path>',
      proxy: '<path d="M5 12h14"></path><path d="m14 7 5 5-5 5"></path>',
      restart: '<path d="M20 7v5h-5"></path><path d="M19 12a7 7 0 1 1-2-4.9L20 10"></path>',
      scale: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"></path>',
      taint: '<path d="M20 13 13 20l-9-9V4h7Z"></path><circle cx="8.5" cy="8.5" r="1"></circle>',
      uncordon: '<path d="M12 3 4.5 6v5.5c0 4.3 2.8 7.8 7.5 9.5 4.7-1.7 7.5-5.2 7.5-9.5V6Z"></path><path d="m8.5 12 2.2 2.2 4.8-5"></path>'
    };
    const shape = shapes[action];
    return shape ? `<svg class="member-detail-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>` : "";
  }
  const label = (value) => String(value).replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  const tabLabel = (value) => ({ yaml: "YAML", crds: "CRDs" })[value] || label(value);
  const asList = (value) => Array.isArray(value) ? value : [value];
  let activeDetailSession = null;
  let pendingActionValues = {};

  const profiles = {
    pods: ["containers", "logs", "terminal", "files", "volumes", "monitor"],
    deployments: ["pods", "containers", "logs", "terminal", "history", "volumes", "monitor"],
    statefulsets: ["pods", "containers", "logs", "terminal", "history", "volumes", "monitor"],
    daemonsets: ["pods", "containers", "logs", "terminal", "history", "monitor"],
    jobs: ["pods", "containers", "logs", "monitor", "events"],
    cronjobs: ["jobs", "history", "monitor", "events"],
    nodes: ["pods", "monitor", "terminal", "events"],
    services: ["endpoints", "related", "proxy"],
    ingress: ["routes", "related", "events"],
    gateways: ["listeners", "routes", "conditions", "related"],
    "http-routes": ["rules", "backends", "conditions", "related"],
    configmaps: ["data", "consumers", "history"],
    secrets: ["data", "consumers", "history"],
    pvcs: ["consumers", "capacity", "events"],
    pvs: ["consumers", "capacity", "events"],
    roles: ["rules", "subjects", "access"],
    "cluster-roles": ["rules", "subjects", "access"],
    "role-bindings": ["subjects", "rules", "access"],
    "cluster-role-bindings": ["subjects", "rules", "access"],
    "service-accounts": ["subjects", "access", "secrets"],
    crds: ["versions", "instances", "conditions"],
    "helm-releases": ["resources", "values", "history", "notes"],
    "helm-charts": ["versions", "values", "readme"]
  };

  function factsPanel(row, statusPill, member) {
    const facts = Object.entries(row).filter(([key]) => !["name", "kind", "message", "sensitive"].includes(key) && !/(Percent|Request|Limit)$/.test(key)).slice(0, 12);
    const state = row.status || row.phase || "Ready";
    const warning = /review|degraded|stale|failed|warning/i.test(state);
    return `<div class="resource-detail-overview">
      <div class="resource-detail-status">
        <div class="resource-detail-state-copy"><span class="${warning ? "warning" : ""}"></span><div><strong>${esc(state)}</strong><small>Observed from ${esc(member.name)} · ${esc(member.lastSync)}</small></div></div>
        ${statusPill(state)}
      </div>
      <section class="resource-detail-facts-card" aria-label="Resource information">
        <dl class="resource-detail-facts">${facts.map(([key, value]) => `<div><dt>${esc(label(key))}</dt><dd data-resource-fact="${esc(key)}" title="${esc(Array.isArray(value) ? value.join(" · ") : value)}">${esc(Array.isArray(value) ? value.join(" · ") : value)}</dd></div>`).join("")}</dl>
      </section>
    </div>`;
  }

  function nodeTaintMarkup(taints) {
    if (!taints.length) return '<p>No taints configured. This node accepts workloads allowed by its labels and available capacity.</p>';
    return taints.map((taint, index) => `<span><code>${esc(taint.key)}=${esc(taint.value)}</code><small>${esc(taint.effect)}</small><button type="button" data-remove-taint="${index}" aria-label="Remove taint ${esc(taint.key)}">×</button></span>`).join("");
  }

  function nodeOverviewPanel(row, statusPill, member) {
    const taints = Array.isArray(row.taints) ? row.taints : [];
    const unschedulable = Boolean(row.unschedulable);
    return `<div class="resource-detail-overview node-detail-overview">
      <div class="resource-detail-status">
        <div class="resource-detail-state-copy"><span></span><div><strong>${esc(row.status || "Ready")}</strong><small>Observed from ${esc(member.name)} · ${esc(member.lastSync)}</small></div></div>
        ${statusPill(row.status || "Ready")}
      </div>
      <section class="resource-detail-facts-card node-operation-summary">
        <header><div><span>Node operations</span><strong>Scheduling and runtime</strong></div><small>Member cluster</small></header>
        <dl class="resource-detail-facts">
          <div><dt>Scheduling</dt><dd data-node-scheduling-state>${unschedulable ? "Cordoned" : "Schedulable"}</dd></div>
          <div><dt>Workloads</dt><dd data-node-pod-count>${esc(row.pods || "0")}</dd></div>
          <div><dt>Kubernetes</dt><dd>${esc(row.version || member.version)}</dd></div>
          <div><dt>Runtime</dt><dd>${esc(row.runtime || "containerd")}</dd></div>
          <div><dt>Internal IP</dt><dd>${esc(row.internalIp || "—")}</dd></div>
          <div><dt>Operating system</dt><dd>${esc(row.os || "—")}</dd></div>
        </dl>
      </section>
      <section class="resource-detail-facts-card node-taint-summary">
        <header><div><span>Scheduling constraints</span><strong>Taints</strong></div><small data-node-taint-count>${taints.length}</small></header>
        <div class="node-taint-list" data-node-taint-list>${nodeTaintMarkup(taints)}</div>
      </section>
    </div>`;
  }

  function compactTable(columns, rows) {
    return `<div class="detail-table-wrap"><table class="detail-table"><thead><tr>${columns.map((item) => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function workloadPods(row) {
    const base = row.name || "workload";
    return compactTable(["Pod", "Ready", "Status", "Restarts", "Node", "Age"], [
      [`<b>${esc(base)}-7b4f8d9f6b-kt2ns</b>`, "1 / 1", '<span class="detail-state good">Running</span>', "0", "member1-control-plane", "3h"],
      [`<b>${esc(base)}-7b4f8d9f6b-vw7q4</b>`, "1 / 1", '<span class="detail-state good">Running</span>', "0", "member1-control-plane", "3h"]
    ]);
  }

  function logsPanel(row) {
    const lines = [
      "2026-07-25T10:41:12.038Z  INFO  configuration loaded successfully",
      "2026-07-25T10:41:12.214Z  INFO  listening on 0.0.0.0:8080",
      "2026-07-25T10:42:03.710Z  INFO  GET /healthz 200 1.2ms",
      "2026-07-25T10:42:33.744Z  INFO  GET /readyz 200 0.9ms",
      "2026-07-25T10:43:01.108Z  INFO  reconciliation completed revision=126",
      "2026-07-25T10:43:18.506Z  WARN  upstream latency above target duration=248ms",
      "2026-07-25T10:43:33.784Z  INFO  GET /metrics 200 4.1ms"
    ];
    return `<section class="log-workspace"><div class="detail-toolbar"><select data-log-container aria-label="Container"><option>${esc(row.name)} · main</option><option>sidecar</option></select><label class="detail-search"><span>⌕</span><input data-log-search placeholder="Filter log output" aria-label="Filter logs"></label><button type="button" data-log-pause>Pause</button><button type="button" data-log-download>Download</button></div><pre class="detail-log" data-log-output>${lines.map((line) => `<span>${esc(line)}</span>`).join("\n")}</pre><footer><span>Streaming · 7 lines · timestamps on</span><span>Container: main</span></footer></section>`;
  }

  function terminalPanel(row) {
    return `<section class="detail-terminal"><header><span class="terminal-live"></span><b>${esc(row.name)} / main</b><small>Connected · audited session</small></header><div data-detail-terminal-output><span>Connected to</span> ${esc(row.name)}\n<span>Namespace</span>: <span>${esc(row.namespace || "cluster scope")}</span>\n<span>Shell</span>: /bin/sh\n\n$ whoami\nroot\n$ pwd\n/app</div><form data-detail-terminal-form><span>$</span><input aria-label="Terminal command" placeholder="Type a command" autocomplete="off"><button type="submit">Run</button></form></section>`;
  }

  function monitorPanel(row) {
    const scheduled = ["CronJob", "Job"].includes(row.kind);
    const noLiveSample = row.kind === "CronJob" && row.status === "Suspended";
    if (noLiveSample) return `<section class="monitor-workspace"><div class="monitor-controls"><div><button class="active" data-monitor-range="1h">1h</button><button data-monitor-range="6h">6h</button><button data-monitor-range="24h">24h</button></div><span>metrics-server · no active pod</span></div><div class="metrics-empty"><span>NO LIVE SAMPLE</span><h3>This CronJob is suspended</h3><p>CPU, memory, network, and disk metrics become available when a Job creates a running Pod. Historical execution metrics remain available from completed Jobs.</p></div></section>`;
    const context = scheduled ? `<div class="monitor-context-note">Metrics are aggregated from Pods created by ${row.kind === "CronJob" ? "recent Jobs" : "this Job"}. Completed executions show the latest retained samples.</div>` : "";
    return `<section class="monitor-workspace"><div class="monitor-controls"><div><button class="active" data-monitor-range="1h">1h</button><button data-monitor-range="6h">6h</button><button data-monitor-range="24h">24h</button></div><span>Metrics current · 15s resolution</span></div>${context}<div class="monitor-grid">${metricCard("CPU usage", row.cpu || (scheduled ? "23m peak" : "126m"), "cores", "18,52 55,47 92,62 128,39 165,45 202,31 239,49 276,28 313,34 350,20 387,27 424,16 462,24" )}${metricCard("Memory working set", row.memory || (scheduled ? "62 MiB peak" : "184 MiB"), "bytes", "18,63 55,61 92,58 128,55 165,51 202,49 239,46 276,43 313,38 350,35 387,31 424,28 462,25")}${metricCard("Network receive", "2.8 MiB/s", "bytes / second", "18,69 55,46 92,59 128,42 165,64 202,38 239,52 276,31 313,57 350,29 387,45 424,22 462,35")}${metricCard("Network transmit", "1.4 MiB/s", "bytes / second", "18,61 55,58 92,51 128,55 165,42 202,48 239,37 276,44 313,32 350,39 387,28 424,33 462,24")}</div></section>`;
  }

  function metricCard(title, value, unit, points) {
    return `<article class="monitor-card"><header><span>${title}</span><b>${esc(value)}</b><small>${unit}</small></header><svg viewBox="0 0 480 84" preserveAspectRatio="none" aria-label="${title}"><defs><linearGradient id="metric-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue)" stop-opacity=".2"/><stop offset="1" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs><polygon points="${points} 462,84 18,84" fill="url(#metric-fill)"></polygon><polyline points="${points}" fill="none" stroke="var(--blue)" stroke-width="2" vector-effect="non-scaling-stroke"></polyline></svg></article>`;
  }

  function relatedPanel(row) {
    const name = esc(row.name);
    return compactTable(["Relationship", "Kind", "Name", "Namespace", "Status"], [
      ["Owned by", "ReplicaSet", `${name}-7b4f8d9f6b`, esc(row.namespace || "—"), '<span class="detail-state good">Ready</span>'],
      ["Selects", "Pod", `${name}-7b4f8d9f6b-kt2ns`, esc(row.namespace || "—"), '<span class="detail-state good">Running</span>'],
      ["Exposed by", "Service", name, esc(row.namespace || "—"), '<span class="detail-state good">Ready</span>']
    ]);
  }

  function eventsPanel(row, member) {
    const warning = row.message ? ["Warning", row.reason || "Review", row.message, row.lastSeen || "current"] : ["Normal", "Synced", "Object state observed successfully", "18s ago"];
    return compactTable(["Type", "Reason", "Message", "Source", "Last seen"], [
      [`<span class="detail-state ${warning[0] === "Warning" ? "warn" : "good"}">${warning[0]}</span>`, esc(warning[1]), esc(warning[2]), "kubelet", esc(warning[3])],
      ['<span class="detail-state good">Normal</span>', "Pulled", "Container image already present on machine", "kubelet", "4m ago"],
      ['<span class="detail-state good">Normal</span>', "Scheduled", `Assigned to ${esc(member.name)}`, "default-scheduler", "3h ago"]
    ]);
  }

  function genericPanel(tab, row, member) {
    const name = esc(row.name);
    const panels = {
      containers: () => compactTable(["Container", "Image", "Ready", "Restarts", "Ports"], [[`<b>${name}</b>`, esc(row.image || "registry.local/app:stable"), '<span class="detail-state good">Ready</span>', "0", "8080/TCP"], ["metrics", "prom/stats-exporter:v1.3", '<span class="detail-state good">Ready</span>', "0", "9090/TCP"]]),
      volumes: () => compactTable(["Volume", "Type", "Mount path", "Read only", "Status"], [["config", "ConfigMap", "/etc/config", "Yes", '<span class="detail-state good">Mounted</span>'], ["cache", "EmptyDir", "/var/cache/app", "No", '<span class="detail-state good">Mounted</span>']]),
      files: () => `<section class="file-browser"><div class="file-path">/app <span>/</span></div>${["bin", "config", "logs", "public"].map((item) => `<button type="button"><span>▱</span><b>${item}</b><small>directory</small></button>`).join("")}<button type="button"><span>≡</span><b>README.md</b><small>2.4 KiB</small></button></section>`,
      history: () => compactTable(["Revision", "Change", "Status", "Created"], [["126", "Image updated to stable", '<span class="detail-state good">Current</span>', "3h ago"], ["125", "Configuration checksum changed", "Superseded", "2d ago"], ["124", "Replicas changed 1 → 2", "Superseded", "6d ago"]]),
      jobs: () => compactTable(["Job", "Status", "Completions", "Started", "Duration"], [[`${name}-29184320`, '<span class="detail-state good">Complete</span>', "1 / 1", "2h ago", "18s"], [`${name}-29182880`, '<span class="detail-state good">Complete</span>', "1 / 1", "1d ago", "21s"]]),
      endpoints: () => compactTable(["Address", "Port", "Protocol", "Node", "Ready"], [["10.244.0.18", "443", "TCP", `${esc(member.name)}-control-plane`, '<span class="detail-state good">Yes</span>'], ["10.244.0.24", "443", "TCP", `${esc(member.name)}-worker`, '<span class="detail-state good">Yes</span>']]),
      proxy: () => `<section class="proxy-panel"><div><span>Service proxy URL</span><code>/api/v1/namespaces/${esc(row.namespace || "default")}/services/${name}:http/proxy/</code></div><label>Path<input value="/healthz" aria-label="Proxy path"></label><button type="button" data-proxy-send>Send request</button><div class="proxy-result" data-proxy-result>Ready to send a request through the Kubernetes API proxy.</div></section>`,
      data: () => `<section class="key-value-list">${asList(row.keys || row.dataKeys || ["config.yaml", "ca.crt"]).map((item, index) => `<article><header><b>${esc(item)}</b><button type="button" data-copy-key>Copy</button></header><pre>${row.sensitive ? "••••••••••••••••••••" : index ? "enabled: true\ninterval: 30s" : "server:\n  port: 8080\n  mode: production"}</pre></article>`).join("")}</section>`,
      consumers: () => compactTable(["Kind", "Name", "Namespace", "Reference", "Status"], [["Deployment", "api-gateway", esc(row.namespace || "platform"), "volume mount", '<span class="detail-state good">Ready</span>'], ["Pod", "api-gateway-7b4f8d9f6b", esc(row.namespace || "platform"), "environment", '<span class="detail-state good">Running</span>']]),
      capacity: () => `<section class="capacity-detail"><div><span>Requested</span><b>${esc(row.capacity || "20 GiB")}</b></div><div><span>Used</span><b>12.4 GiB</b><i style="--capacity:62%"></i></div><div><span>Available</span><b>7.6 GiB</b></div><p><span>Storage class</span> <strong>${esc(row.storageClass || "local-path")}</strong> <span>supports expansion.</span></p></section>`,
      rules: () => compactTable(["API groups", "Resources", "Verbs", "Scope"], [["apps", "deployments · statefulsets", "get · list · watch", esc(row.namespace || "All namespaces")], ["core", "pods · services · configmaps", "get · list · watch", esc(row.namespace || "All namespaces")]]),
      subjects: () => compactTable(["Kind", "Name", "Namespace", "Role"], [["Group", "platform-viewers", "—", esc(row.role || row.name)], ["ServiceAccount", "prometheus", "monitoring", esc(row.role || row.name)]]),
      access: () => `<section class="access-review"><header><div><span>Effective access</span><b>12 allowed capabilities</b></div><button type="button" data-access-check>Run access review</button></header>${["get pods", "list deployments", "watch services", "update configmaps", "create jobs"].map((item) => `<div><span>✓</span><b>${item}</b><small>${esc(row.namespace || "cluster scope")}</small></div>`).join("")}</section>`,
      versions: () => compactTable(["Version", "Served", "Stored", "Schema", "Status"], [[esc(row.stored || "v1"), "Yes", "Yes", "OpenAPI v3", '<span class="detail-state good">Established</span>'], ["v1beta1", "No", "No", "Preserved", "Deprecated"]]),
      instances: () => compactTable(["Name", "Namespace", "Version", "Status", "Age"], [[`example-${name.split(".")[0]}`, "monitoring", esc(row.stored || "v1"), '<span class="detail-state good">Ready</span>', "16d"]]),
      conditions: () => compactTable(["Type", "Status", "Reason", "Message", "Updated"], [["Established", '<span class="detail-state good">True</span>', "InitialNamesAccepted", "API endpoint is active", "16d ago"], ["NamesAccepted", '<span class="detail-state good">True</span>', "NoConflicts", "No naming conflicts found", "16d ago"]]),
      routes: () => compactTable(["Hostname", "Path", "Backend", "Port", "Status"], [[esc(row.hosts || "console.member1.local"), "/", "Service/console", "443", '<span class="detail-state good">Accepted</span>']]),
      listeners: () => compactTable(["Name", "Protocol", "Port", "Hostname", "Routes", "Status"], [["https", "HTTPS", "443", "*.member1.local", "2", '<span class="detail-state good">Programmed</span>']]),
      backends: () => compactTable(["Backend", "Port", "Weight", "Resolved refs", "Status"], [["Service/api-gateway", "8080", "100", "True", '<span class="detail-state good">Ready</span>']]),
      resources: () => compactTable(["Kind", "Name", "Namespace", "Status"], [["Deployment", name, esc(row.namespace || "platform"), '<span class="detail-state good">Ready</span>'], ["Service", name, esc(row.namespace || "platform"), '<span class="detail-state good">Ready</span>'], ["ConfigMap", `${name}-config`, esc(row.namespace || "platform"), '<span class="detail-state good">Ready</span>']]),
      values: () => `<textarea class="detail-values" spellcheck="false" aria-label="Helm values" aria-readonly="true" readonly>replicaCount: 2\nimage:\n  repository: registry.local/${name}\n  tag: stable\nservice:\n  type: ClusterIP\n  port: 8080</textarea><div class="yaml-actions yaml-readonly-note"><span>Values snapshot · read only</span><small>Use Upgrade from the row Actions menu to change values.</small></div>`,
      notes: () => `<section class="detail-document"><h3>${name} installed successfully</h3><p>Use the service endpoint inside the cluster or configure an Ingress to expose the application.</p><pre>kubectl -n ${esc(row.namespace || "platform")} get all -l app.kubernetes.io/instance=${name}</pre></section>`,
      readme: () => `<section class="detail-document"><h3>${name}</h3><p>A packaged Kubernetes application from the configured chart repository.</p><h4>Prerequisites</h4><ul><li>Kubernetes 1.28+</li><li>Default storage class</li><li>Ingress controller (optional)</li></ul></section>`
    };
    return (panels[tab] || (() => relatedPanel(row)))();
  }

  function actionDialog(action, row, toast, onApplied) {
    pendingActionValues = {
      action,
      desired: parseInt(row.ready, 10) || 2,
      taintKey: "workload",
      taintValue: "batch",
      taintEffect: "NoSchedule",
      capacity: row.capacity || "30 GiB",
      revision: row.revision || "4"
    };
    const dialogs = {
      scale: ["Scale workload", `<label>Desired replicas<input data-action-value type="number" min="0" value="${parseInt(row.ready, 10) || 2}"></label><p>Availability and disruption budgets are checked before applying.</p>`, "Review scale"],
      resize: ["Resize resources", '<label>CPU request<input value="250m"></label><label>Memory request<input value="256Mi"></label>', "Review resize"],
      cordon: ["Cordon node", `<p>Stop scheduling new workloads on <strong>${esc(row.name)}</strong>. Existing Pods continue running.</p>`, "Cordon node"],
      uncordon: ["Uncordon node", `<p>Allow the scheduler to place new workloads on <strong>${esc(row.name)}</strong> again.</p>`, "Uncordon node"],
      drain: ["Drain node", '<label class="check-row"><input type="checkbox" checked> Ignore DaemonSet pods</label><label class="check-row"><input type="checkbox" checked> Respect disruption budgets</label><label>Grace period<input value="30s"></label>', "Review drain"],
      taint: ["Add node taint", '<label>Key<input data-taint-field="key" value="workload"></label><label>Value<input data-taint-field="value" value="batch"></label><label>Effect<select data-taint-field="effect"><option>NoSchedule</option><option>PreferNoSchedule</option><option>NoExecute</option></select></label>', "Add taint"],
      restart: ["Restart rollout", `<p>Restart <strong>${esc(row.name)}</strong> with a rolling update while preserving the configured availability budget.</p>`, "Restart rollout"],
      run: ["Run CronJob now", `<p>Create a one-off Job from the current <strong>${esc(row.name)}</strong> template.</p>`, "Create Job"],
      forward: ["Port forward", `<label>Service port<input value="${String(row.ports || "443").match(/\d+/)?.[0] || "443"}"></label><label>Local port<input value="8443"></label>`, "Start forwarding"],
      expand: ["Expand volume", `<label>New capacity<input data-expand-capacity value="${esc(row.capacity || "30 GiB")}"></label><p>Volume shrink is not supported.</p>`, "Review expansion"],
      rollback: ["Rollback release", '<label>Revision<select data-rollback-revision><option value="4">Revision 4 · current</option><option value="3">Revision 3</option><option value="2">Revision 2</option></select></label>', "Review rollback"]
    };
    const [title, body, confirm] = dialogs[action] || [`${label(action)} · ${esc(row.name)}`, `<p>This operation is available in the ${esc(row.kind || "resource")} workspace. Review the target before applying.</p>`, label(action)];
    if (window.KD_SHADCN) {
      window.KD_SHADCN.openDialog({
        title,
        bodyHtml: body,
        confirmLabel: confirm,
        destructive: ["delete", "drain", "cordon"].includes(action),
        onConfirm: () => {
          if (action === "scale") {
            const desired = Math.max(0, Number(pendingActionValues.desired || 0));
            row.ready = `${desired} / ${desired}`;
            row.replicas = desired;
          }
          if (action === "cordon") row.unschedulable = true;
          if (action === "uncordon") row.unschedulable = false;
          if (action === "drain") { row.unschedulable = true; row.pods = "0 / 110"; }
          if (action === "taint") {
            const key = String(pendingActionValues.taintKey || "workload").trim();
            const value = String(pendingActionValues.taintValue || "batch").trim();
            const effect = pendingActionValues.taintEffect || "NoSchedule";
            row.taints = [...(Array.isArray(row.taints) ? row.taints : []), { key, value, effect }];
          }
          if (action === "expand") row.capacity = String(pendingActionValues.capacity || row.capacity).trim();
          if (action === "rollback") row.revision = pendingActionValues.revision || row.revision;
          onApplied?.(action);
          toast(`${label(action)} applied`, `${row.name} was updated in the ${row.kind || "resource"} prototype.`);
        }
      });
      return;
    }
    const backdrop = document.createElement("div");
    backdrop.className = "detail-dialog-backdrop";
    backdrop.innerHTML = `<section class="detail-dialog" role="dialog" aria-modal="true"><header><h3>${title}</h3><button type="button" data-dialog-close aria-label="Close">×</button></header><div class="detail-dialog-body">${body}</div><footer><button class="btn" type="button" data-dialog-close>Cancel</button><button class="btn primary" type="button" data-dialog-confirm>${confirm}</button></footer></section>`;
    document.body.appendChild(backdrop);
    backdrop.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => backdrop.remove()));
    backdrop.querySelector("[data-dialog-confirm]").addEventListener("click", () => { backdrop.remove(); toast(`${label(action)} ready`, "Prototype only; no member-cluster state was changed."); });
  }

  function removeNodeTaint(row, index, toast, viewId) {
    const taint = Array.isArray(row.taints) ? row.taints[index] : null;
    if (!taint) return;
    const apply = () => {
      row.taints.splice(index, 1);
      syncNodeOperations(row, viewId);
      toast("Taint removed", `${taint.key}=${taint.value}:${taint.effect} was removed from ${row.name}.`);
    };
    if (window.KD_SHADCN) {
      window.KD_SHADCN.openDialog({
        title: "Remove node taint",
        bodyHtml: `<p>Remove <strong>${esc(taint.key)}=${esc(taint.value)}:${esc(taint.effect)}</strong> from <strong>${esc(row.name)}</strong>? Workloads previously blocked by this taint may become schedulable.</p>`,
        confirmLabel: "Remove taint",
        destructive: true,
        onConfirm: apply
      });
      return;
    }
    apply();
  }

  function syncNodeOperations(row, viewId, attempt = 0) {
    if (viewId !== "nodes") return;
    const root = document.querySelector(".member-detail-workspace");
    if (!root) {
      if (attempt < 6) window.setTimeout(() => syncNodeOperations(row, viewId, attempt + 1), 50);
      return;
    }
    const scheduling = root.querySelector("[data-node-scheduling-state]");
    const podCount = root.querySelector("[data-node-pod-count]");
    const taintCount = root.querySelector("[data-node-taint-count]");
    const taintList = root.querySelector("[data-node-taint-list]");
    if (scheduling) scheduling.textContent = row.unschedulable ? "Cordoned" : "Schedulable";
    if (podCount) podCount.textContent = row.pods || "0";
    if (taintCount) taintCount.textContent = String(Array.isArray(row.taints) ? row.taints.length : 0);
    if (taintList) taintList.innerHTML = nodeTaintMarkup(Array.isArray(row.taints) ? row.taints : []);
    const schedulingButton = root.querySelector('[data-detail-action="cordon"], [data-detail-action="uncordon"]');
    if (schedulingButton) {
      schedulingButton.dataset.detailAction = row.unschedulable ? "uncordon" : "cordon";
      schedulingButton.textContent = row.unschedulable ? "Uncordon" : "Cordon";
    }
    // Radix restores the suspended Sheet after the confirmation dialog closes.
    // Re-apply the prototype state through that short render window so React's
    // restored static markup cannot overwrite the operation result.
    if (attempt < 6) window.setTimeout(() => syncNodeOperations(row, viewId, attempt + 1), 50);
  }

  function syncResourceOperations(row, viewId) {
    document.querySelectorAll("[data-resource-fact]").forEach((field) => {
      const key = field.dataset.resourceFact;
      if (!(key in row)) return;
      const value = Array.isArray(row[key]) ? row[key].join(" · ") : row[key];
      field.textContent = String(value ?? "—");
      field.title = String(value ?? "—");
    });
    syncNodeOperations(row, viewId);
  }

  function selectDetailTab(session, tabId) {
    const expected = tabLabel(tabId).toLowerCase();
    const root = document.querySelector(".member-detail-workspace");
    const trigger = [...(root?.querySelectorAll('[role="tab"]') || [])].find((item) => item.textContent.trim().toLowerCase() === expected);
    if (trigger) {
      window.setTimeout(() => {
        trigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, buttons: 1 }));
        trigger.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
        trigger.click();
      }, 0);
      return;
    }
    session.setTab?.(tabId);
  }

  function handleDetailAction(button) {
    const session = activeDetailSession;
    if (!session) return;
    const { row, member, toast } = session;
    const action = button.dataset.detailAction;
    const tabActions = { logs: "logs", exec: "terminal", monitor: "monitor", proxy: "proxy", access: "access", events: "events" };
    if (tabActions[action]) return selectDetailTab(session, tabActions[action]);
    if (action === "refresh") {
      return window.KD_REFRESH.run(button, () => {
        toast("Resource refreshed", `${row.name} is current in ${member.name}.`);
      });
    }
    if (action === "describe") return actionDialog("describe", row, toast);
    if (action === "clone") return actionDialog("clone", row, toast);
    if (action === "delete") return actionDialog("delete", row, toast);
    actionDialog(action, row, toast, () => {
      syncResourceOperations(row, session.viewId);
      session.onApplied?.(action, row);
    });
  }

  function resourceHeaderActions(viewId) {
    const common = refreshIconButton("Refresh resource", 'data-detail-action="refresh"');
    const actionSets = {
      pods: [["logs", "Logs"], ["exec", "Terminal"], ["monitor", "Monitor"]],
      deployments: [["scale", "Scale"], ["restart", "Restart rollout"], ["monitor", "Monitor"]],
      statefulsets: [["scale", "Scale"], ["restart", "Restart rollout"], ["monitor", "Monitor"]],
      daemonsets: [["restart", "Restart rollout"], ["monitor", "Monitor"]],
      jobs: [["logs", "Logs"], ["monitor", "Monitor"]],
      cronjobs: [["run", "Run now"], ["monitor", "Monitor"]],
      services: [["proxy", "API proxy"], ["forward", "Port forward"]],
      pvcs: [["expand", "Expand volume"]],
      roles: [["access", "Access review"]],
      "cluster-roles": [["access", "Access review"]],
      "role-bindings": [["access", "Access review"]],
      "cluster-role-bindings": [["access", "Access review"]],
      "service-accounts": [["access", "Access review"]],
      "helm-releases": [["rollback", "Rollback"]]
    };
    return common + (actionSets[viewId] || []).map(([action, actionLabel]) => `<button class="member-detail-action" type="button" data-detail-action="${action}">${detailActionIcon(action)}<span>${actionLabel}</span></button>`).join("");
  }

  function open(options) {
    const { row, viewId, config, member, memberYaml, statusPill, toast } = options;
    activeDetailSession = { row, viewId, member, toast, setTab: null, onApplied: options.onApplied };
    const specialistTabs = profiles[viewId] || [];
    const tabs = ["overview", ...specialistTabs.filter((tab) => tab !== "events" && tab !== "related"), "related", "events", "yaml"].filter((tab, index, items) => items.indexOf(tab) === index);
    const tabBodies = {};
    const panels = tabs.map((tab) => {
      let body;
      if (tab === "overview") body = viewId === "nodes" ? nodeOverviewPanel(row, statusPill, member) : factsPanel(row, statusPill, member);
      else if (tab === "yaml") body = `<textarea class="yaml-editor" spellcheck="false" aria-label="YAML manifest" aria-readonly="true" readonly>${esc(memberYaml(row))}</textarea><div class="yaml-actions yaml-readonly-note"><span>Manifest snapshot · read only</span><small>Edit YAML is available from the row Actions menu.</small></div>`;
      else if (tab === "events") body = eventsPanel(row, member);
      else if (tab === "related") body = relatedPanel(row);
      else if (tab === "pods") body = workloadPods(row);
      else if (tab === "logs") body = logsPanel(row);
      else if (tab === "terminal") body = terminalPanel(row);
      else if (tab === "monitor") body = monitorPanel(row);
      else body = genericPanel(tab, row, member);
      tabBodies[tab] = body;
      return `<section data-drawer-panel="${tab}">${body}</section>`;
    }).join("");

    const bindWorkspace = (root, setTab) => {
      root.dataset.memberDetailBound = "true";
      if (activeDetailSession) activeDetailSession.setTab = setTab;
    };

    const initialTab = options.initialTab && tabs.includes(options.initialTab) ? options.initialTab : "overview";
    const schedulingAction = row.unschedulable ? "uncordon" : "cordon";
    const nodeActions = `${refreshIconButton("Refresh node", 'data-detail-action="refresh"')}<button class="member-detail-action" type="button" data-detail-action="${schedulingAction}">${detailActionIcon(schedulingAction)}<span>${row.unschedulable ? "Uncordon" : "Cordon"}</span></button><button class="member-detail-action" type="button" data-detail-action="taint">${detailActionIcon("taint")}<span>Taint</span></button><button class="member-detail-action danger-quiet" type="button" data-detail-action="drain">${detailActionIcon("drain")}<span>Drain</span></button>`;
    const resourceActions = resourceHeaderActions(viewId);
    const resourceKind = viewId === "nodes" ? "Node" : (row.kind || config.title.replace(/s$/, ""));
    const resourceContext = row.namespace ? `<span>${esc(resourceKind)}</span><span class="member-detail-context-separator" aria-hidden="true">·</span><span>Namespace ${esc(row.namespace)}</span>` : `<span>${esc(resourceKind)}</span><span class="member-detail-context-separator" aria-hidden="true">·</span><span>Cluster scoped</span>`;
    const headerHtml = `<header class="drawer-head member-detail-head"><div class="member-detail-identity"><div class="resource-title-mark" aria-hidden="true">${esc(resourceKind.slice(0, 2).toUpperCase())}</div><div class="member-detail-title"><span class="eyebrow">${viewId === "nodes" ? "Member node" : "Resource details"}</span><h2>${esc(row.name || row.object || config.title)}</h2><p class="member-detail-context">${resourceContext}</p></div></div><div class="member-detail-primary" aria-label="Resource actions">${viewId === "nodes" ? nodeActions : resourceActions}</div></header>`;
    const toolbarHtml = `<div class="member-detail-statusbar"><div class="member-detail-scope"><span class="member-detail-scope-mark" aria-hidden="true">MC</span><span><small>Member cluster</small><strong>${esc(member.name)}</strong></span></div><div class="member-detail-sync">${statusPill(row.status || row.phase || "Ready")}<span>Updated ${esc(member.lastSync)}</span></div></div>`;

    if (window.KD_SHADCN) {
      window.KD_SHADCN.openSheet({
        title: esc(row.name || row.object || config.title),
        description: `${row.namespace ? `${esc(row.namespace)} · ` : ""}${esc(member.name)}`,
        contentClassName: "detail-drawer member-detail-workspace w-[min(620px,48vw)] min-w-[520px] max-w-none gap-0 overflow-auto p-0 sm:max-w-none",
        headerHtml,
        toolbarHtml,
        tabs: tabs.map((tab) => ({ value: tab, label: tabLabel(tab), contentHtml: tabBodies[tab] })),
        tabsClassName: "drawer-tabs member-detail-tabs",
        initialTab,
        onMount: (root, api) => bindWorkspace(root, api.setTab)
      });
      return;
    }

    document.querySelector(".drawer-backdrop")?.remove();
    const backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop member-detail-backdrop";
    backdrop.innerHTML = `<aside class="detail-drawer member-detail-workspace" role="dialog" aria-modal="true" aria-labelledby="drawer-title">${headerHtml.replace("</header>", '<button class="drawer-close" type="button" aria-label="Close details">×</button></header>')}${toolbarHtml}<div class="drawer-tabs member-detail-tabs" role="tablist">${tabs.map((tab) => `<button type="button" role="tab" data-drawer-tab="${tab}">${tabLabel(tab)}</button>`).join("")}</div><div class="drawer-content member-detail-content">${panels}</div></aside>`;
    document.body.appendChild(backdrop);
    const setTab = (tabId) => {
      backdrop.querySelectorAll("[data-drawer-tab]").forEach((button) => { const active = button.dataset.drawerTab === tabId; button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active)); });
      backdrop.querySelectorAll("[data-drawer-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.drawerPanel === tabId));
    };
    setTab(initialTab);
    backdrop.querySelector(".drawer-close").addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) backdrop.remove(); });
    backdrop.querySelectorAll("[data-drawer-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.drawerTab)));
    bindWorkspace(backdrop, setTab);
  }

  function runAction(options) {
    const { row, viewId, member, toast, action, onApplied } = options;
    activeDetailSession = { row, viewId, member, toast, setTab: null };
    actionDialog(action, row, toast, () => {
      syncResourceOperations(row, viewId);
      onApplied?.(action, row);
    });
  }

  function captureActionValue(target) {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (target.matches("[data-action-value]")) pendingActionValues.desired = target.value;
    if (target.matches('[data-taint-field="key"]')) pendingActionValues.taintKey = target.value;
    if (target.matches('[data-taint-field="value"]')) pendingActionValues.taintValue = target.value;
    if (target.matches('[data-taint-field="effect"]')) pendingActionValues.taintEffect = target.value;
    if (target.matches("[data-expand-capacity]")) pendingActionValues.capacity = target.value;
    if (target.matches("[data-rollback-revision]")) pendingActionValues.revision = target.value;
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const root = target?.closest(".member-detail-workspace");
    if (!root || !activeDetailSession) return;
    const detailAction = target.closest("[data-detail-action]");
    if (detailAction) return handleDetailAction(detailAction);
    const removeTaint = target.closest("[data-remove-taint]");
    if (removeTaint) return removeNodeTaint(activeDetailSession.row, Number(removeTaint.dataset.removeTaint), activeDetailSession.toast, activeDetailSession.viewId);
    const logPause = target.closest("[data-log-pause]");
    if (logPause) {
      const paused = logPause.classList.toggle("active");
      logPause.textContent = paused ? "Resume" : "Pause";
      return activeDetailSession.toast(paused ? "Log stream paused" : "Log stream resumed");
    }
    if (target.closest("[data-log-download]")) return activeDetailSession.toast("Log export prepared", "The current filtered stream is ready to download.");
    const monitorRange = target.closest("[data-monitor-range]");
    if (monitorRange) {
      root.querySelectorAll("[data-monitor-range]").forEach((item) => item.classList.remove("active"));
      monitorRange.classList.add("active");
      return;
    }
    if (target.closest("[data-proxy-send]")) {
      const result = root.querySelector("[data-proxy-result]");
      if (result) result.textContent = "HTTP/1.1 200 OK\ncontent-type: text/plain\n\nok";
      return;
    }
    if (target.closest("[data-copy-key]")) return activeDetailSession.toast("Value copied", "Sensitive values remain masked in the prototype.");
    if (target.closest("[data-access-check]")) return activeDetailSession.toast("Access review complete", "12 capabilities allowed; no denied rules found.");
  });

  document.addEventListener("input", (event) => {
    captureActionValue(event.target);
    const input = event.target instanceof Element ? event.target.closest("[data-log-search]") : null;
    const root = input?.closest(".member-detail-workspace");
    if (!input || !root) return;
    const query = input.value.toLowerCase();
    root.querySelectorAll("[data-log-output] span").forEach((line) => { line.hidden = !line.textContent.toLowerCase().includes(query); });
  });

  document.addEventListener("change", (event) => captureActionValue(event.target));

  document.addEventListener("submit", (event) => {
    const form = event.target instanceof Element ? event.target.closest("[data-detail-terminal-form]") : null;
    const root = form?.closest(".member-detail-workspace");
    if (!form || !root) return;
    event.preventDefault();
    const input = form.querySelector("input");
    const command = input?.value.trim();
    if (!command) return;
    const output = root.querySelector("[data-detail-terminal-output]");
    const response = /ls/.test(command) ? "bin  config  logs  public" : /env/.test(command) ? "NODE_ENV=production\nCLUSTER=member1" : /curl/.test(command) ? "ok" : "Command completed in mock session.";
    if (output) { output.append(document.createTextNode(`\n\n$ ${command}\n${response}`)); output.scrollTop = output.scrollHeight; }
    input.value = "";
  });

  window.KD_MEMBER_DETAIL = { open, runAction };
})();

export {};
