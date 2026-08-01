(function () {
  "use strict";

  const series = {
    "30m": {
      cpu: "8,62 42,59 76,65 110,51 144,56 178,43 212,48 246,35 280,41 314,29 348,34 382,24 416,28 450,19 484,25",
      memory: "8,67 42,65 76,62 110,60 144,57 178,55 212,51 246,48 280,46 314,41 348,39 382,34 416,31 450,27 484,24",
      networkIn: "8,70 42,51 76,63 110,42 144,61 178,37 212,55 246,33 280,48 314,29 348,45 382,25 416,38 450,21 484,31",
      networkOut: "8,75 42,69 76,72 110,57 144,65 178,49 212,58 246,42 280,54 314,38 348,47 382,34 416,43 450,29 484,37",
      diskRead: "8,73 42,66 76,70 110,58 144,63 178,51 212,60 246,44 280,55 314,41 348,49 382,35 416,44 450,31 484,38",
      diskWrite: "8,80 42,75 76,77 110,68 144,72 178,61 212,66 246,56 280,63 314,51 348,58 382,47 416,54 450,43 484,49"
    },
    "1h": {
      cpu: "8,66 42,58 76,61 110,53 144,46 178,56 212,40 246,44 280,31 314,38 348,26 382,35 416,22 450,29 484,20",
      memory: "8,70 42,68 76,65 110,62 144,60 178,56 212,55 246,51 280,48 314,46 348,41 382,38 416,34 450,30 484,27",
      networkIn: "8,72 42,59 76,67 110,48 144,63 178,43 212,58 246,39 280,52 314,35 348,47 382,29 416,43 450,25 484,34",
      networkOut: "8,76 42,71 76,74 110,64 144,68 178,55 212,61 246,48 280,57 314,44 348,52 382,39 416,48 450,33 484,41",
      diskRead: "8,74 42,69 76,72 110,63 144,66 178,55 212,62 246,49 280,58 314,45 348,53 382,40 416,49 450,36 484,43",
      diskWrite: "8,81 42,77 76,78 110,72 144,74 178,65 212,69 246,60 280,66 314,56 348,62 382,52 416,59 450,48 484,54"
    },
    "24h": {
      cpu: "8,57 42,46 76,64 110,51 144,68 178,39 212,54 246,34 280,61 314,42 348,50 382,30 416,45 450,25 484,36",
      memory: "8,64 42,61 76,58 110,63 144,55 178,52 212,49 246,46 280,50 314,42 348,38 382,40 416,34 450,30 484,27",
      networkIn: "8,71 42,44 76,62 110,38 144,69 178,41 212,57 246,30 280,64 314,35 348,54 382,26 416,49 450,22 484,39",
      networkOut: "8,78 42,61 76,72 110,55 144,75 178,51 212,66 246,45 280,69 314,48 348,60 382,40 416,55 450,35 484,46",
      diskRead: "8,70 42,61 76,73 110,58 144,76 178,52 212,68 246,46 280,71 314,49 348,64 382,43 416,58 450,38 484,51",
      diskWrite: "8,82 42,72 76,80 110,68 144,84 178,63 212,75 246,58 280,78 314,60 348,70 382,54 416,66 450,49 484,59"
    }
  };

  const esc = (value) => String(value ?? "—").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

  function refreshIconButton(label, attribute) {
    return `<button class="shadcn-button shadcn-button-outline refresh-icon-button metrics-refresh-button member-metrics-refresh-button" type="button" ${attribute} data-tooltip="${label}" aria-label="${label}"><svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.22 6.49L3 16"></path><path d="M3 21v-5h5"></path><path d="M3 12A9 9 0 0 1 18.22 5.51L21 8"></path><path d="M21 3v5h-5"></path></svg></button>`;
  }

  function chart(id, title, value, unit, points, secondaryPoints = "", legend = ["Usage"]) {
    const legendCopy = secondaryPoints ? `<span><i></i>${legend[0]}</span><span><i class="secondary"></i>${legend[1]}</span>` : `<span><i></i>${legend[0]}</span>`;
    return `<article class="member-metrics-chart" data-metric-chart="${id}"><header><div><span>${title}</span><b data-metric-value>${value}</b>${unit ? `<small>${unit}</small>` : ""}</div><span class="member-metric-legend">${legendCopy}</span></header><svg viewBox="0 0 492 100" preserveAspectRatio="none" aria-label="${title} trend"><g class="metric-grid"><path d="M0 20H492M0 40H492M0 60H492M0 80H492"></path><path d="M82 0V100M164 0V100M246 0V100M328 0V100M410 0V100"></path></g><polygon data-metric-area points="${points} 484,100 8,100"></polygon><polyline data-metric-line points="${points}"></polyline>${secondaryPoints ? `<polyline class="secondary" data-metric-secondary points="${secondaryPoints}"></polyline>` : ""}</svg><footer><span data-range-copy>30 minutes ago</span><span>Now</span></footer></article>`;
  }

  function metricCell(value, percent, request, limit) {
    const width = Math.max(0, Math.min(100, Number(percent || 0)));
    const level = width > 90 ? "critical" : width > 60 ? "warning" : "normal";
    return `<div class="member-metric-cell ${level}" data-tooltip="Usage ${esc(value)} · Request ${esc(request)} · Limit ${esc(limit)}"><span class="member-metric-track"><i style="--metric:${width}%"></i></span><b>${esc(value)}</b></div>`;
  }

  function allocationRow(label, used, requested, limited, total, usedPercent, requestPercent, limitPercent) {
    return `<div class="member-allocation-row">
      <div class="member-allocation-head"><span>${label}</span><b>${esc(used)} used</b><small>${esc(total)} allocatable</small></div>
      <div class="member-allocation-bars"><div><span>Requests <b>${esc(requested)}</b></span><div class="member-allocation-track"><i style="--value:${requestPercent}%"></i></div><small>${requestPercent}% of capacity</small></div><div><span>Limits <b>${esc(limited)}</b></span><div class="member-allocation-track is-limit"><i style="--value:${limitPercent}%"></i></div><small>${limitPercent}% of capacity</small></div></div>
      <p>${usedPercent}% currently in use</p>
    </div>`;
  }

  function render(member, resources, statusPill) {
    const pods = resources.pods || [];
    const nodes = resources.nodes || [];
    const namespaces = resources.namespaces || [];
    const services = resources.services || [];
    const events = resources.events || [];
    const runningPods = member.pods.used;
    const readyNodes = nodes.filter((node) => node.status === "Ready").length;
    const topRows = pods.map((pod) => `<tr><td><button class="table-name" type="button" data-tooltip="Open ${esc(pod.name)}" data-metrics-open-pod="${esc(pod.name)}">${esc(pod.name)}</button><span class="sub">${esc(pod.namespace)}</span></td><td>${metricCell(pod.cpu, pod.cpuPercent, pod.cpuRequest, pod.cpuLimit)}</td><td>${metricCell(pod.memory, pod.memoryPercent, pod.memoryRequest, pod.memoryLimit)}</td><td class="mono member-metrics-node-name">${esc(pod.node)}</td><td>${statusPill(pod.status)}</td></tr>`).join("");
    const nodeRows = nodes.map((node) => `<tr><td><button class="table-name" type="button" data-tooltip="Open ${esc(node.name)}" data-metrics-open-node>${esc(node.name)}</button><span class="sub">${esc(node.roles?.join(" · ") || "worker")}</span></td><td>${metricCell(node.cpu, node.cpuPercent, "—", node.cpuLimit)}</td><td>${metricCell(node.memory, node.memoryPercent, "—", node.memoryLimit)}</td><td class="mono">${esc(node.pods)}</td><td><span class="metric-condition good">No pressure</span></td><td>${statusPill(node.status)}</td></tr>`).join("");
    const signalRows = events.slice(0, 3).map((event) => {
      const warning = /warning|review/i.test(`${event.eventType} ${event.status}`);
      return `<li><span class="member-signal-dot ${warning ? "warning" : "good"}"></span><div><strong>${esc(event.reason)}</strong><small>${esc(event.object)} · ${esc(event.message)}</small></div><time>${esc(event.lastSeen)}</time></li>`;
    }).join("");
    const current = series["30m"];
    return `<section class="member-view member-metrics-view"><header class="member-view-header"><div><span class="eyebrow">Member cluster / Observability</span><h2>Metrics</h2><p>Capacity, utilization, and recent operational signals for ${esc(member.name)}.</p><div class="member-view-meta">${statusPill(member.status)}<span>Prometheus connected</span><i></i><span>Last sample ${esc(member.lastSync)}</span></div></div><div class="header-actions">${refreshIconButton("Refresh metrics", "data-member-metrics-refresh")}</div></header>
      <div class="member-metrics-controls"><label>Time range<select class="select" data-member-metrics-range><option value="30m">Last 30 minutes</option><option value="1h">Last 1 hour</option><option value="24h">Last 24 hours</option></select></label><label>Refresh<select class="select" data-member-metrics-interval><option value="30">Every 30 seconds</option><option value="10">Every 10 seconds</option><option value="0">Off</option></select></label><label>Namespace<select class="select" data-member-metrics-scope><option value="all">All namespaces</option><option value="kube-system">kube-system</option><option value="default">default</option></select></label><span><i></i> Live · <b data-metrics-resolution>30 seconds</b></span></div>
      <div class="member-metrics-summary"><article><button type="button" class="member-metric-summary-link" data-member-metrics-nav="nodes"><span>Nodes</span><b>${readyNodes}<small> / ${nodes.length}</small></b><small>${readyNodes === nodes.length ? "All nodes ready" : `${nodes.length - readyNodes} need attention`}</small></button></article><article><button type="button" class="member-metric-summary-link" data-member-metrics-nav="pods"><span>Pods</span><b>${runningPods}<small> running</small></b><small>${pods.length} workloads currently sampled</small></button></article><article><button type="button" class="member-metric-summary-link" data-member-metrics-nav="namespaces"><span>Namespaces</span><b>${namespaces.length}</b><small>Across this member cluster</small></button></article><article><button type="button" class="member-metric-summary-link" data-member-metrics-nav="services"><span>Services</span><b>${services.length}</b><small>${services.reduce((total, service) => total + Number(service.endpoints || 0), 0)} ready endpoints</small></button></article></div>
      <div class="member-metrics-overview"><article class="panel member-resource-allocation"><div class="panel-head"><div><strong>Resource allocation</strong><small>Requests and limits compared with allocatable capacity.</small></div><span class="meta">CURRENT</span></div><div class="member-allocation-list">${allocationRow("CPU", `${member.cpu.used} cores`, "1.72 cores", "3.50 cores", member.cpu.total, member.cpu.percent, 10.75, 21.88)}${allocationRow("Memory", `${member.memory.used} GiB`, "1.25 GiB", "3.00 GiB", member.memory.total, member.memory.percent, 2.05, 4.92)}</div></article><article class="panel member-recent-signals"><div class="panel-head"><div><strong>Recent signals</strong><small>Latest events affecting health and capacity.</small></div><button class="panel-link" type="button" data-member-metrics-nav="events">View events</button></div><ul>${signalRows || `<li class="member-signal-empty">No recent signals</li>`}</ul><footer><span class="member-signal-dot good"></span><span>Metrics pipeline healthy</span><small>Prometheus · metrics-server fallback</small></footer></article></div>
      <div class="member-metrics-grid">${chart("resource", "Resource utilization", `${member.cpu.percent}%`, "CPU now", current.cpu, current.memory, ["CPU", "Memory"])}${chart("network", "Network usage", "4.2", "MiB/s", current.networkIn, current.networkOut, ["Incoming", "Outgoing"])}</div>
      <section class="member-metrics-lower"><article class="panel member-metrics-consumers"><div class="panel-head"><div><strong>Top pod consumers</strong><small>Current usage from metrics-server, ordered by CPU.</small></div><span class="meta" data-metrics-scope-copy>ALL NAMESPACES</span></div><div class="data-panel"><table class="data-table member-metrics-table"><thead><tr><th>Pod</th><th>CPU</th><th>Memory</th><th>Node</th><th>Status</th></tr></thead><tbody data-metrics-pods>${topRows}</tbody></table></div></article><article class="panel member-metrics-nodes"><div class="panel-head"><div><strong>Node saturation</strong><small>Pressure, pod allocation, and current resource usage.</small></div><button class="panel-link" type="button" data-metrics-open-node>View nodes</button></div><div class="data-panel"><table class="data-table member-node-metrics-table"><thead><tr><th>Node</th><th>CPU</th><th>Memory</th><th>Pods</th><th>Pressure</th><th>Status</th></tr></thead><tbody>${nodeRows}</tbody></table></div></article></section>
    </section>`;
  }

  function bind(root, toast) {
    const range = root.querySelector("[data-member-metrics-range]");
    const interval = root.querySelector("[data-member-metrics-interval]");
    const scope = root.querySelector("[data-member-metrics-scope]");
    const updateRange = () => {
      const selected = series[range.value];
      root.querySelector('[data-metric-chart="resource"] [data-metric-line]').setAttribute("points", selected.cpu);
      root.querySelector('[data-metric-chart="resource"] [data-metric-area]').setAttribute("points", `${selected.cpu} 484,100 8,100`);
      root.querySelector('[data-metric-chart="resource"] [data-metric-secondary]').setAttribute("points", selected.memory);
      root.querySelector('[data-metric-chart="network"] [data-metric-line]').setAttribute("points", selected.networkIn);
      root.querySelector('[data-metric-chart="network"] [data-metric-area]').setAttribute("points", `${selected.networkIn} 484,100 8,100`);
      root.querySelector('[data-metric-chart="network"] [data-metric-secondary]').setAttribute("points", selected.networkOut);
      const copy = { "30m": "30 minutes ago", "1h": "1 hour ago", "24h": "24 hours ago" }[range.value];
      root.querySelectorAll("[data-range-copy]").forEach((item) => { item.textContent = copy; });
    };
    range.addEventListener("change", updateRange);
    interval.addEventListener("change", () => {
      const copy = interval.value === "0" ? "Off" : `${interval.value} seconds`;
      root.querySelector("[data-metrics-resolution]").textContent = copy;
      toast(interval.value === "0" ? "Metric refresh paused" : "Metric refresh updated", interval.value === "0" ? "Existing samples remain visible." : `New samples will be requested every ${interval.value} seconds.`);
    });
    scope.addEventListener("change", () => {
      const selected = scope.value;
      root.querySelectorAll("[data-metrics-pods] tr").forEach((row) => {
        const namespace = row.querySelector(".sub")?.textContent || "";
        row.hidden = selected !== "all" && namespace !== selected;
      });
      root.querySelector("[data-metrics-scope-copy]").textContent = selected === "all" ? "ALL NAMESPACES" : selected.toUpperCase();
    });
    const refresh = root.querySelector("[data-member-metrics-refresh]");
    refresh.addEventListener("click", () => {
      window.KD_REFRESH.run(refresh, () => {
        toast("Metrics refreshed", "CPU, memory, network, and pod samples are current.");
      });
    });
    root.querySelectorAll("[data-member-metrics-nav]").forEach((button) => button.addEventListener("click", () => {
      location.hash = button.dataset.memberMetricsNav;
    }));
    root.querySelectorAll("[data-metrics-open-pod]").forEach((button) => button.addEventListener("click", () => {
      location.hash = "pods";
    }));
    root.querySelectorAll("[data-metrics-open-node]").forEach((button) => button.addEventListener("click", () => {
      location.hash = "nodes";
    }));
  }

  window.KD_MEMBER_METRICS = { render, bind };
})();

export {};
