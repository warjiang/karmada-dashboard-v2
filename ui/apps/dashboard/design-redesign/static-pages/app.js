(function () {
  "use strict";

  const D = window.KD_MOCK;
  const page = document.body.dataset.page || "overview";
  const pageRoot = document.getElementById("app");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  const pageMeta = {
    overview: ["Fleet / Overview", "All systems are steady.", "Three member clusters are connected. One capacity signal needs attention."],
    topology: ["Fleet / Topology", "Federation routes", "See how control-plane intent resolves across member clusters."],
    resources: ["Operate / Resources", "Resource workspace", "Search and compare federated resources without losing cluster scope."],
    "resource-detail": ["Resources / Deployment", "nginx", "A federated deployment propagated from default to three member clusters."],
    policies: ["Operate / Policies", "Placement and overrides", "Review where resources are placed, transformed, and currently blocked."],
    clusters: ["Operate / Member clusters", "Connected fleet", "Readiness, sync mode, version, and resource freshness in one scan."],
    member: ["Member cluster / member3", "member3", "A pull-mode member with current Kubernetes state and delayed metrics."],
    metrics: ["Observe / Metrics", "Control-plane signals", "Correlate request volume, latency, errors, and workqueue depth."],
    settings: ["System / Configuration", "Control-plane settings", "Manage connection, registry, upgrade, and failover behavior."],
    states: ["Design system / States", "Operational state library", "Errors remain visible as errors—never disguised as empty data."],
  };

  const navItems = [
    ["Observe", [
      ["overview", "index.html", "Fleet overview"],
      ["topology", "topology.html", "Topology"],
      ["metrics", "metrics.html", "Metrics"]
    ]],
    ["Operate", [
      ["resources", "resources.html", "Resources"],
      ["policies", "policies.html", "Policies"],
      ["clusters", "clusters.html", "Member clusters", "1"]
    ]],
    ["System", [
      ["settings", "settings.html", "Configuration"],
      ["states", "states.html", "State library"]
    ]]
  ];

  function getTheme() {
    return localStorage.getItem("karmada-theme") || (prefersDark.matches ? "dark" : "light");
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.classList.toggle("active", button.dataset.themeChoice === theme);
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
    });
  }

  function themeSwitch() {
    return `<div class="theme-switch" role="group" aria-label="Color theme">
      <button type="button" data-theme-choice="light">Light</button>
      <button type="button" data-theme-choice="dark">Dark</button>
    </div>`;
  }

  function navActive(key) {
    if (key === page) return true;
    if (page === "resource-detail" && key === "resources") return true;
    if (page === "member" && key === "clusters") return true;
    return false;
  }

  function sideRail() {
    const nav = navItems.map(([group, items]) => `<div class="nav-group">${group}</div><nav class="primary-nav">${items.map(([key, href, label, count]) => `<a href="${href}" class="${navActive(key) ? "active" : ""}"><span class="nav-signal"></span>${label}${count ? `<span class="nav-count">${count}</span>` : ""}</a>`).join("")}</nav>`).join("");
    return `<aside class="side-rail">
      <a class="brand" href="index.html" aria-label="Karmada overview"><img src="../../public/logo.svg" alt=""><span><strong>Karmada</strong><small>Federation control</small></span></a>
      <button class="scope-switcher" type="button" data-action="scope"><span><span class="micro">Active scope</span><b>${page === "member" ? "member3" : "Global fleet"}</b></span><span class="arrow">⌄</span></button>
      ${nav}
      <div class="rail-footer"><b>CONTROL PLANE · RUNNING</b>v1.17.0 · commit 4a27148c</div>
    </aside>`;
  }

  function topbar() {
    const meta = pageMeta[page];
    return `<div class="topbar"><div class="breadcrumb">${meta[0]}</div><div class="top-actions">${themeSwitch()}<button class="btn small" type="button" data-action="command">⌘K Search</button></div></div>`;
  }

  function pageHeader(primaryAction, secondaryAction) {
    const meta = pageMeta[page];
    return `<header class="page-header"><div><h1>${meta[1]}</h1><p>${meta[2]}</p></div><div class="header-actions">${secondaryAction || ""}${primaryAction || ""}</div></header>`;
  }

  function panel(title, meta, body, extraClass = "") {
    return `<section class="panel ${extraClass}"><div class="panel-head"><strong>${title}</strong><span class="meta">${meta}</span></div>${body}</section>`;
  }

  function statusPill(status) {
    const normalized = status.toLowerCase();
    const cls = /healthy|ready|running|applied|complete|operational/.test(normalized) ? "good" : /stale|degraded|review|suspended|syncing/.test(normalized) ? "warn" : /failed|error|disconnected/.test(normalized) ? "bad" : "neutral";
    return `<span class="status-pill ${cls}">${status}</span>`;
  }

  function eventTimeline(limit = 4) {
    return `<div class="timeline">${D.events.slice(0, limit).map((event) => `<div class="timeline-item"><time>${event.time} · ${event.type.toUpperCase()}</time><b class="${event.level === "warn" ? "text-warn" : ""}">${event.title}</b><p>${event.detail}</p></div>`).join("")}</div>`;
  }

  function overviewPage() {
    const fleet = D.clusters.map((cluster) => `<div class="fleet-row"><div class="fleet-name">${cluster.name}<small>${cluster.mode.toUpperCase()} · ${cluster.version}</small></div><div class="route-line ${cluster.status === "Stale" ? "stale" : ""}"></div><div class="fleet-stat"><b class="${cluster.status === "Stale" ? "stale" : ""}">${cluster.status.toUpperCase()}</b><br>${cluster.nodes} node</div></div>`).join("");
    return `${pageHeader('<button class="btn primary" data-action="create">Create resource</button>', '<button class="btn" data-action="terminal">Open terminal</button>')}
      <section class="overview-status">
        <article class="panel health-hero"><div class="status-row"><span>Federation health</span><span>3 / 3 clusters</span></div><div class="health-title"><span class="dot"></span>Operational</div><p>Control plane is running on <strong>v1.17.0</strong>. Policies are propagating without errors across all active members.</p><span class="freshness">LAST SYNC 10:33:18 · 12s AGO</span></article>
        <article class="panel capacity-grid"><div class="capacity-cell"><label>Nodes</label><b>3 / 3</b><div class="meter"><i style="--value:100%"></i></div></div><div class="capacity-cell"><label>Pods</label><b>38 / 330</b><div class="meter"><i style="--value:12%"></i></div></div><div class="capacity-cell"><label>CPU</label><b>3.15 / 48</b><div class="meter"><i style="--value:7%"></i></div></div><div class="capacity-cell"><label>Memory</label><b>1.40 / 183 GiB</b><div class="meter"><i style="--value:1%"></i></div></div></article>
      </section>
      <section class="split-grid">${panel("Federation routes", "Live topology", `<div class="fleet-list">${fleet}</div>`)}${panel("Recent changes", "Last 30 min", eventTimeline(3))}</section>`;
  }

  function overviewContext() {
    return `<aside class="context-rail"><div class="context-head"><h2>Attention queue</h2><span class="count-badge">1 OPEN</span></div><article class="attention"><div class="meta-line"><span class="text-warn">Stale signal</span><span>2m ago</span></div><h3>member3 metrics are delayed</h3><p>Resource state is current, but CPU and memory samples exceeded the 90s freshness target.</p><a href="member-cluster.html">Inspect member3 →</a></article><article class="attention"><div class="meta-line"><span>Capacity</span><span>Today</span></div><h3>Pod allocation is below 12%</h3><p>No action required. Current headroom supports the expected workload window.</p><a href="metrics.html">Open capacity view →</a></article><article class="attention"><div class="meta-line"><span class="text-good">Policy</span><span>Current</span></div><h3>No policy conflicts</h3><p>All propagation and override policies resolved successfully.</p></article><div class="command-hint">⌘K&nbsp;&nbsp;Search resources, clusters, policies…</div></aside>`;
  }

  function topologyPage() {
    const members = D.clusters.map((cluster) => `<article class="member-node ${cluster.status === "Stale" ? "warn" : ""}"><div class="node-head"><h3>${cluster.name}</h3>${statusPill(cluster.status)}</div><dl><div><dt>Mode</dt><dd>${cluster.mode}</dd></div><div><dt>Version</dt><dd>${cluster.version}</dd></div><div><dt>Nodes</dt><dd>${cluster.nodes} / ${cluster.nodes}</dd></div><div><dt>Freshness</dt><dd>${cluster.freshness}</dd></div></dl></article>`).join("");
    return `${pageHeader('<button class="btn primary" data-action="fit">Fit topology</button>', '<button class="btn" data-action="filter">Filter routes</button>')}
      <div class="tabs"><button class="active">Live topology</button><button data-action="tab-message">Policy paths</button><button data-action="tab-message">Resource paths</button></div>
      <section class="panel topology-canvas"><article class="control-node"><img src="../../public/logo.svg" alt=""><strong>Karmada control plane</strong>${statusPill("Operational")}<p>24 active policies · 38 workloads</p></article><div class="topology-routes"></div><div class="member-nodes">${members}</div><div class="legend"><span class="text-good">● Current</span><span class="text-warn">● Stale metrics</span><span>— Propagation route</span></div></section>`;
  }

  function resourceRows(rows = D.resources) {
    return rows.map((r) => `<tr data-search="${[r.kind, r.name, r.namespace, r.cluster, r.status].join(" ").toLowerCase()}"><td><input class="checkbox" type="checkbox" aria-label="Select ${r.name}"></td><td><a class="row-link" href="resource-detail.html">${r.name}</a><span class="sub">${r.kind}</span></td><td>${r.namespace}</td><td>${r.cluster}</td><td class="mono">${r.ready} / ${r.desired}</td><td>${statusPill(r.status)}</td><td class="mono">${r.age}</td><td><div class="row-actions"><button class="row-action" data-action="inspect">Inspect</button><button class="row-action" data-action="more">More</button></div></td></tr>`).join("");
  }

  function resourcesPage() {
    return `${pageHeader('<button class="btn primary" data-action="create">Create resource</button>', '<button class="btn" data-action="import">Import YAML</button>')}
      <div class="stat-band"><div><label>Workloads</label><b>38</b><small>37 healthy</small></div><div><label>Namespaces</label><b>9</b><small>Across fleet</small></div><div><label>Services</label><b>17</b><small>16 available</small></div><div><label>Needs review</label><b class="text-warn">1</b><small class="text-warn">member3</small></div></div>
      <div class="tabs"><button class="active">Workloads</button><button data-action="tab-message">Services</button><button data-action="tab-message">Config & storage</button><button data-action="tab-message">Namespaces</button></div>
      <div class="toolbar"><div class="search-field"><input type="search" placeholder="Search by name, kind, namespace, or cluster" data-table-search></div><select class="select" aria-label="Namespace"><option>All namespaces</option><option>default</option><option>platform</option><option>monitoring</option></select><select class="select" aria-label="Cluster"><option>All clusters</option><option>member1</option><option>member2</option><option>member3</option></select><span class="result-count" data-result-count>${D.resources.length} resources</span></div>
      <div class="data-panel"><table class="data-table"><thead><tr><th><input class="checkbox" type="checkbox" aria-label="Select all"></th><th>Name / Kind</th><th>Namespace</th><th>Placement</th><th>Ready</th><th>Status</th><th>Age</th><th></th></tr></thead><tbody data-filter-body>${resourceRows()}</tbody></table></div>`;
  }

  function resourceDetailPage() {
    return `${pageHeader('<button class="btn primary" data-action="edit">Edit YAML</button>', '<button class="btn danger" data-action="delete">Delete</button>')}
      <div class="tabs"><button class="active">Overview</button><button data-action="tab-message">Manifest</button><button data-action="tab-message">Events</button><button data-action="tab-message">Related resources</button></div>
      <section class="detail-layout"><div>${panel("Federation status", "Live", `<div class="panel-body"><div class="stat-band" style="margin:0"><div><label>Desired</label><b>3</b><small>Across 3 clusters</small></div><div><label>Ready</label><b>3</b><small>All available</small></div><div><label>Updated</label><b>3</b><small>Revision 4</small></div><div><label>Unavailable</label><b>0</b><small>No disruption</small></div></div></div>`)}<div style="height:12px"></div>${panel("Member realization", "3 clusters", `<div class="fleet-list">${D.clusters.map(c => `<div class="fleet-row"><div class="fleet-name">${c.name}<small>${c.mode.toUpperCase()}</small></div><div class="route-line ${c.status === "Stale" ? "stale" : ""}"></div><div class="fleet-stat"><b>1 / 1 READY</b><br>revision 4</div></div>`).join("")}</div>`)}</div>
      <aside>${panel("Resource details", "Metadata", `<div class="panel-body"><dl class="definition-list"><div><dt>Kind</dt><dd>Deployment</dd></div><div><dt>Namespace</dt><dd>default</dd></div><div><dt>Created</dt><dd>3h 18m ago</dd></div><div><dt>Policy</dt><dd><a class="row-link" href="policies.html">demo-policy</a></dd></div><div><dt>Image</dt><dd>nginx:1.27</dd></div><div><dt>Labels</dt><dd>app=nginx<br>tier=web</dd></div></dl></div>`)}</aside></section>`;
  }

  function policiesPage() {
    const rows = D.policies.map((p) => `<tr data-search="${[p.name,p.namespace,p.type,p.status].join(" ").toLowerCase()}"><td><input class="checkbox" type="checkbox" aria-label="Select ${p.name}"></td><td><a class="row-link" href="#" data-action="inspect">${p.name}</a><span class="sub">${p.type}</span></td><td>${p.namespace}</td><td>${p.resources}</td><td>${p.placement}</td><td class="${p.conflicts !== "None" ? "text-warn" : ""}">${p.conflicts}</td><td>${statusPill(p.status)}</td><td class="mono">${p.updated}</td><td><button class="row-action" data-action="more">More</button></td></tr>`).join("");
    return `${pageHeader('<button class="btn primary" data-action="create-policy">Create policy</button>', '<button class="btn" data-action="validate">Validate manifest</button>')}
      <div class="stat-band"><div><label>Active policies</label><b>24</b><small>23 applied</small></div><div><label>Matched resources</label><b>38</b><small>Current</small></div><div><label>Override rules</label><b>7</b><small>3 namespaces</small></div><div><label>Conflicts</label><b class="text-warn">1</b><small class="text-warn">Review requested</small></div></div>
      <div class="tabs"><button class="active">All policies</button><button data-action="tab-message">Propagation</button><button data-action="tab-message">Override</button></div>
      <div class="toolbar"><div class="search-field"><input type="search" placeholder="Search policy, type, or namespace" data-table-search></div><select class="select"><option>All policy types</option><option>PropagationPolicy</option><option>OverridePolicy</option></select><span class="result-count" data-result-count>${D.policies.length} policies</span></div>
      <div class="data-panel"><table class="data-table"><thead><tr><th><input class="checkbox" type="checkbox" aria-label="Select all"></th><th>Name / Type</th><th>Namespace</th><th>Resources</th><th>Placement</th><th>Conflicts</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody data-filter-body>${rows}</tbody></table></div>`;
  }

  function clustersPage() {
    const rows = D.clusters.map((c) => `<tr><td><a class="row-link" href="member-cluster.html">${c.name}</a><span class="sub">${c.mode} mode</span></td><td>${statusPill(c.status)}</td><td class="mono">${c.version}</td><td class="mono">${c.nodes} / ${c.nodes}</td><td class="mono">${c.cpu}</td><td class="mono">${c.memory}</td><td class="mono ${c.status === "Stale" ? "text-warn" : ""}">${c.freshness}</td><td><div class="row-actions"><a class="row-action" href="member-cluster.html">Open</a><button class="row-action" data-action="more">More</button></div></td></tr>`).join("");
    return `${pageHeader('<button class="btn primary" data-action="join">Join cluster</button>', '<button class="btn" data-action="health-check">Run health check</button>')}
      <div class="stat-band"><div><label>Connected</label><b>3</b><small>All reachable</small></div><div><label>Push mode</label><b>2</b><small>Direct connection</small></div><div><label>Pull mode</label><b>1</b><small>Agent connection</small></div><div><label>Stale signals</label><b class="text-warn">1</b><small class="text-warn">Metrics only</small></div></div>
      <div class="toolbar"><div class="search-field"><input type="search" placeholder="Search member cluster" data-table-search></div><select class="select"><option>All connection modes</option><option>Push</option><option>Pull</option></select><span class="result-count">3 member clusters</span></div>
      <div class="data-panel"><table class="data-table"><thead><tr><th>Cluster</th><th>Status</th><th>Kubernetes</th><th>Nodes</th><th>CPU</th><th>Memory</th><th>Freshness</th><th></th></tr></thead><tbody data-filter-body>${rows}</tbody></table></div>`;
  }

  function memberPage() {
    const workloads = D.memberWorkloads.map((r) => `<tr data-search="${[r.kind,r.name,r.namespace,r.status].join(" ").toLowerCase()}"><td><a class="row-link" href="resource-detail.html">${r.name}</a><span class="sub">${r.kind}</span></td><td>${r.namespace}</td><td class="mono">${r.pods}</td><td class="mono">${r.image}</td><td class="mono">${r.cpu}</td><td class="mono">${r.memory}</td><td>${statusPill(r.status)}</td><td><button class="row-action" data-action="inspect">Inspect</button></td></tr>`).join("");
    return `${pageHeader('<button class="btn primary" data-action="terminal">Open terminal</button>', '<button class="btn danger" data-action="disconnect">Disconnect</button>')}
      <div class="state-detail" style="border-color:var(--amber)"><strong class="text-warn">Metrics delayed · 2m 14s</strong>&nbsp;&nbsp; Kubernetes object state is current; CPU and memory values below are marked stale. <button class="btn quiet small" data-action="retry">Retry metrics</button></div>
      <div class="stat-band"><div><label>Connection</label><b>Pull</b><small>Agent online</small></div><div><label>Nodes</label><b>1 / 1</b><small>Ready</small></div><div><label>Pods</label><b>13 / 110</b><small>12% allocated</small></div><div><label>Kubernetes</label><b>v1.35</b><small>Supported</small></div></div>
      <div class="tabs"><button class="active">Overview</button><button data-action="tab-message">Workloads</button><button data-action="tab-message">Services</button><button data-action="tab-message">Config & storage</button><button data-action="tab-message">Cluster & RBAC</button></div>
      <div class="toolbar"><div class="search-field"><input type="search" placeholder="Search member3 workloads" data-table-search></div><select class="select"><option>All namespaces</option><option>default</option><option>monitoring</option><option>platform</option></select><span class="result-count" data-result-count>${D.memberWorkloads.length} workloads</span></div>
      <div class="data-panel"><table class="data-table"><thead><tr><th>Name / Kind</th><th>Namespace</th><th>Pods</th><th>Image</th><th>CPU</th><th>Memory</th><th>Status</th><th></th></tr></thead><tbody data-filter-body>${workloads}</tbody></table></div>`;
  }

  function chartPanel(title, value, unit, path) {
    return panel(title, "Last 60 min", `<div class="metric-chart"><div class="metric-value">${value} <small>${unit}</small></div><div class="sparkline"><svg viewBox="0 0 500 120" preserveAspectRatio="none" aria-label="${title} chart"><path class="area" d="${path} L500 120 L0 120 Z"></path><path d="${path}"></path></svg></div></div>`);
  }

  function metricsPage() {
    return `${pageHeader('<button class="btn primary" data-action="refresh">Refresh</button>', '<select class="select" aria-label="Time range"><option>Last 60 minutes</option><option>Last 6 hours</option><option>Last 24 hours</option></select>')}
      <div class="toolbar"><select class="select"><option>All control-plane components</option><option>karmada-apiserver</option><option>karmada-scheduler</option><option>karmada-controller-manager</option></select><select class="select"><option>30s resolution</option><option>1m resolution</option></select><span class="result-count">Last sample 12s ago</span></div>
      <section class="triple-grid">${chartPanel("API request rate", "126", "req/s", "M0 88 C45 72 62 76 92 61 S150 42 186 58 S245 94 285 63 S352 48 394 54 S460 26 500 39")}${chartPanel("P95 latency", "84", "ms", "M0 71 C48 76 64 64 104 68 S165 50 205 63 S266 58 304 65 S370 35 416 52 S468 65 500 48")}${chartPanel("Workqueue depth", "7", "items", "M0 96 L55 93 L100 96 L145 84 L190 88 L235 82 L280 76 L325 89 L370 70 L415 75 L460 58 L500 66")}</section>
      <div style="height:12px"></div><section class="split-grid">${chartPanel("Scheduling throughput", "18.4", "bindings/s", "M0 83 C40 58 75 72 110 59 S180 86 220 66 S292 48 335 60 S415 36 500 51")}${panel("Signal health", "Current", `<div class="panel-body"><dl class="definition-list"><div><dt>Prometheus</dt><dd>${statusPill("Ready")}</dd></div><div><dt>Scrape targets</dt><dd>8 / 8 healthy</dd></div><div><dt>Recording rules</dt><dd>23 evaluated</dd></div><div><dt>Missing series</dt><dd class="text-warn">member3 node metrics</dd></div><div><dt>Retention</dt><dd>15 days</dd></div></dl></div>`)}</section>`;
  }

  function settingsPage() {
    return `${pageHeader('<button class="btn primary" data-action="save">Save changes</button>', '<button class="btn" data-action="discard">Discard</button>')}
      <section class="settings-grid"><nav class="settings-menu"><button class="active">Karmada config</button><button data-action="settings-tab">Registry</button><button data-action="settings-tab">Upgrade</button><button data-action="settings-tab">Failover</button><button data-action="settings-tab">Reschedule</button><button data-action="settings-tab">Permissions</button><button data-action="settings-tab">Add-ons</button></nav><div class="form-section"><h2>Connection and scheduling</h2><p>Values shown here are mock configuration for design review.</p><div class="field"><label for="api-endpoint">Control-plane endpoint</label><input id="api-endpoint" value="https://karmada-apiserver.karmada-system.svc:5443"><small>Used by the Dashboard backend to reach Karmada.</small></div><div class="field"><label for="scheduler-name">Scheduler profile</label><select id="scheduler-name" class="select" style="width:100%"><option>Default scheduler</option><option>High availability</option><option>Edge optimized</option></select></div><div class="switch-row"><div><strong>Failover reconciliation</strong><span>Reschedule workloads when a member becomes unavailable.</span></div><button class="toggle on" type="button" data-action="toggle" aria-label="Toggle failover"></button></div><div class="switch-row"><div><strong>Automatic resource interpretation</strong><span>Enable ResourceInterpreter for custom workload types.</span></div><button class="toggle on" type="button" data-action="toggle" aria-label="Toggle resource interpretation"></button></div><div class="switch-row"><div><strong>Anonymous metrics</strong><span>Share non-identifying usage statistics.</span></div><button class="toggle" type="button" data-action="toggle" aria-label="Toggle anonymous metrics"></button></div><div class="state-detail">Changes affect the control plane. The prototype requires an explicit save but does not submit configuration.</div></div></section>`;
  }

  function statesPage() {
    return `${pageHeader('<button class="btn primary" data-action="simulate">Simulate state</button>', '')}
      <section class="state-grid">
        <article class="state-card"><span class="state-code">01 · Loading</span><h2>Loading workloads</h2><p>The surrounding context remains available while the table resolves.</p><div class="skeleton line"></div><div class="skeleton line short"></div><div class="skeleton line"></div></article>
        <article class="state-card"><span class="state-code">02 · Empty</span><h2>No workloads in this namespace</h2><p>Namespace <strong>preview</strong> is reachable and returned no workload objects.</p><button class="btn">Choose another namespace</button> <button class="btn primary">Create workload</button></article>
        <article class="state-card warning"><span class="state-code">03 · Partial failure</span><h2>Metrics are incomplete</h2><p>Resource state is current. CPU and memory series from member3 could not be fetched.</p><div class="state-detail">GET /apis/metrics.k8s.io · timeout after 10s</div><button class="btn" data-action="retry">Retry failed source</button></article>
        <article class="state-card error"><span class="state-code">04 · Fatal error</span><h2>Control plane is unavailable</h2><p>Navigation is preserved so operators can copy diagnostics or return after recovery.</p><div class="state-detail">karmada-apiserver · connection refused · trace 7f9a1c</div><button class="btn" data-action="copy">Copy diagnostics</button> <button class="btn primary" data-action="retry">Retry connection</button></article>
        <article class="state-card error"><span class="state-code">05 · Forbidden / RBAC</span><h2>You cannot list Secrets</h2><p>This is a permission failure, not an empty namespace. Request the required role from a cluster administrator.</p><div class="state-detail">Required: secrets.list · scope: member2 / platform</div><button class="btn">View required role</button></article>
        <article class="state-card warning"><span class="state-code">06 · Stale / disconnected</span><h2>Showing last known state</h2><p>member3 disconnected 8 minutes ago. Values below are frozen and no longer represent live state.</p><div class="state-detail">LAST SUCCESSFUL SYNC · 10:25:04 CST</div><button class="btn" data-action="retry">Test connection</button></article>
        <article class="state-card error"><span class="state-code">07 · Destructive confirmation</span><h2>Delete member3?</h2><p>This removes the member registration. Existing workloads on the cluster will keep running but leave Karmada management.</p><div class="state-detail">Affected: 13 workloads · 4 policies · pull-mode agent</div><button class="btn">Cancel</button> <button class="btn danger" data-action="delete-confirm">Type name to delete</button></article>
        <article class="state-card success"><span class="state-code">08 · Normal / success</span><h2>Policy propagated</h2><p>demo-policy resolved successfully across all three members. No placement conflicts were found.</p><div class="state-detail">3 / 3 CLUSTERS · REVISION 12 · 6s AGO</div><button class="btn">View policy</button></article>
      </section>`;
  }

  function loginPage() {
    return `<main class="login-page"><section class="login-story"><div class="login-brand"><img src="../../public/logo.svg" alt=""><strong>Karmada</strong></div><div class="login-copy"><span class="eyebrow">Federation control</span><h1>One fleet.<br>Clear control.</h1><p>Operate resources, policies, and member clusters from a single, verifiable control plane.</p></div></section><section class="login-form-wrap"><form class="login-form" data-login-form><div style="display:flex;justify-content:flex-end;margin-bottom:42px">${themeSwitch()}</div><h2>Sign in to Dashboard</h2><p>Use a service account token authorized for this Karmada control plane.</p><div class="field"><label for="token">Bearer token</label><textarea id="token" placeholder="Paste token here" required></textarea><small>The token stays in this browser session for the static prototype.</small></div><button class="btn primary" type="submit">Continue to fleet overview</button><div class="login-note">OIDC is configured by the administrator. <button class="btn quiet small" type="button" data-action="oidc">Sign in with OIDC</button></div></form></section></main>`;
  }

  const renderers = { overview: overviewPage, topology: topologyPage, resources: resourcesPage, "resource-detail": resourceDetailPage, policies: policiesPage, clusters: clustersPage, member: memberPage, metrics: metricsPage, settings: settingsPage, states: statesPage };

  function shell(content) {
    const withContext = page === "overview";
    return `<div class="app-shell ${withContext ? "has-context" : ""}">${sideRail()}<main class="workbench">${topbar()}${content}</main>${withContext ? overviewContext() : ""}</div>`;
  }

  function modal(title, body, confirmLabel = "Continue", destructive = false) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><p>${body}</p><div class="modal-actions"><button class="btn" data-modal-close>Cancel</button><button class="btn ${destructive ? "danger" : "primary"}" data-modal-confirm>${confirmLabel}</button></div></section>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("[data-modal-close]").addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
    backdrop.querySelector("[data-modal-confirm]").addEventListener("click", () => { backdrop.remove(); toast("Prototype action completed", "No backend state was changed."); });
  }

  function toast(title, detail = "") {
    document.querySelector(".toast")?.remove();
    const element = document.createElement("div");
    element.className = "toast";
    element.innerHTML = `<b>${title}</b>${detail ? `<br><span>${detail}</span>` : ""}`;
    document.body.appendChild(element);
    window.setTimeout(() => element.remove(), 3200);
  }

  function commandPalette() {
    const element = document.createElement("div");
    element.className = "command-backdrop";
    element.innerHTML = `<section class="command-palette"><input autofocus placeholder="Search resources, clusters, policies…" aria-label="Command search"><div class="command-results"><button class="command-item" data-go="resources.html"><span>Open resource workspace</span><small>RESOURCES</small></button><button class="command-item" data-go="member-cluster.html"><span>Inspect member3</span><small>STALE SIGNAL</small></button><button class="command-item" data-go="policies.html"><span>Review policy conflicts</span><small>POLICIES</small></button><button class="command-item" data-go="states.html"><span>Open operational state library</span><small>DESIGN</small></button></div></section>`;
    document.body.appendChild(element);
    element.querySelector("input").focus();
    element.addEventListener("click", (e) => { if (e.target === element) element.remove(); const target = e.target.closest("[data-go]"); if (target) location.href = target.dataset.go; });
  }

  function bindInteractions() {
    document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", () => {
      localStorage.setItem("karmada-theme", button.dataset.themeChoice);
      applyTheme(button.dataset.themeChoice);
    }));

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); commandPalette(); }
      if (event.key === "Escape") document.querySelector(".modal-backdrop, .command-backdrop")?.remove();
    });

    document.querySelectorAll("[data-table-search]").forEach((input) => input.addEventListener("input", () => {
      const rows = [...document.querySelectorAll("[data-filter-body] tr")];
      const query = input.value.toLowerCase().trim();
      let shown = 0;
      rows.forEach((row) => { const match = !query || (row.dataset.search || row.textContent.toLowerCase()).includes(query); row.classList.toggle("hidden", !match); if (match) shown += 1; });
      const result = document.querySelector("[data-result-count]");
      if (result) result.textContent = `${shown} result${shown === 1 ? "" : "s"}`;
    }));

    document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.action;
      if (action === "command") return commandPalette();
      if (action === "toggle") return event.currentTarget.classList.toggle("on");
      if (["delete", "disconnect", "delete-confirm"].includes(action)) return modal("Confirm destructive action", "The affected object and its dependencies are shown before execution. This static prototype does not change real data.", "Confirm", true);
      if (action === "scope") return modal("Switch active scope", "Choose Global fleet for the federated view or open an individual member cluster.", "Keep current scope");
      if (action === "terminal") return modal("Browser terminal", "A production implementation would open an audited terminal session in the active cluster scope.", "Open mock terminal");
      if (action === "oidc") return modal("OIDC sign-in unavailable", "The identity provider callback is not configured for this static prototype.", "Return to token sign-in");
      if (action === "copy") { navigator.clipboard?.writeText("karmada-apiserver · connection refused · trace 7f9a1c"); return toast("Diagnostics copied"); }
      if (action === "settings-tab") { document.querySelectorAll(".settings-menu button").forEach(b => b.classList.remove("active")); event.currentTarget.classList.add("active"); return toast(`${event.currentTarget.textContent} selected`, "The shared configuration layout is ready for secondary design."); }
      if (action === "tab-message") return toast(`${event.currentTarget.textContent} view`, "This route is represented by the shared content model in the prototype.");
      if (action === "save") return toast("Configuration saved", "Static prototype confirmation only.");
      if (action === "refresh" || action === "retry") return toast("Signals refreshed", "Latest mock sample received 1s ago.");
      toast("Interaction available", "This control is wired for prototype review.");
    }));

    document.querySelector("[data-login-form]")?.addEventListener("submit", (event) => { event.preventDefault(); location.href = "index.html"; });
  }

  applyTheme(getTheme());
  if (page === "login") pageRoot.innerHTML = loginPage();
  else pageRoot.innerHTML = shell(renderers[page]());
  applyTheme(getTheme());
  bindInteractions();
})();
