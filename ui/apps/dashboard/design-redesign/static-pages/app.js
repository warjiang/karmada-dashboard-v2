(function () {
  "use strict";

  const D = window.KD_MOCK;
  const logoUrl = window.KD_ASSETS?.logo || "./logo.svg";
  const kubernetesLogoUrl = window.KD_ASSETS?.kubernetesLogo || "./kubernetes-logo.svg";
  const page = document.body.dataset.page || "overview";
  const pageRoot = document.getElementById("app");
  const esc = (value) => String(value ?? "—").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const requestedMember = new URLSearchParams(location.search).get("cluster");
  const activeMemberName = D.clusters.some((cluster) => cluster.name === requestedMember) ? requestedMember : "member1";
  const isMemberScope = page === "member" || (page === "create" && Boolean(requestedMember));

  if (isMemberScope) {
    const activeMemberSummary = D.clusters.find((cluster) => cluster.name === activeMemberName) || D.clusters[0];
    document.title = `Karmada · Member Cluster · ${activeMemberName}`;
    D.member = {
      ...D.member,
      name: activeMemberName,
      syncMode: activeMemberSummary.mode,
      version: activeMemberSummary.version,
      status: activeMemberSummary.status,
      lastSync: activeMemberSummary.freshness
    };
    D.memberResources.nodes = D.memberResources.nodes.map((node, index) => index === 0 ? { ...node, name: `${activeMemberName}-control-plane` } : node);
  }

  const pageMeta = {
    overview: ["Federation / Overview", "All systems are steady.", "Three member clusters are connected. One capacity signal needs attention."],
    topology: ["Federation / Global topology", "Global resource topology", "Trace one resource from template and policy resolution to every realized member-cluster workload."],
    resources: ["Resource management / Pods", "Pods", "Inspect pod readiness, placement, restarts, and live resource usage."],
    policies: ["MultiCluster / Policies", "Placement and overrides", "Review where resources are placed, transformed, and currently blocked."],
    clusters: ["Federation / Cluster management", "Member cluster management", "Manage member clusters and inspect their live control-plane connections in one workspace."],
    member: ["Member Clusters / member1", "member1", "A healthy push-mode Kubernetes member cluster connected to this Karmada control plane."],
    metrics: ["Federation / Metrics visualization", "Control Plane metrics", "Correlate scheduler throughput, API latency, queue depth, and controller health."],
    settings: ["System / Configuration", "Control Plane settings", "Manage connection, registry, upgrade, and failover behavior."],
    states: ["System / State library", "Operational state library", "Errors remain visible as errors—never disguised as empty data."],
    create: ["Resource management / Create resource", "Create resource", "Configure a Kubernetes or Karmada object with guided fields or YAML."],
  };

  const zhCopy = {
    "Active scope": "当前范围",
    "Control Plane": "控制面",
    "Control Plane overview": "控制面概览",
    "Member Cluster": "成员集群",
    "Member Clusters": "成员集群",
    "Overview": "概览",
    "MultiCluster": "多集群",
    "Federation / Overview": "联邦 / 概览",
    "Global topology": "全局拓扑",
    "Cluster topology": "集群拓扑",
    "Cluster management": "集群管理",
    "Cluster workspace": "集群工作区",
    "Cluster resources": "集群资源",
    "Metrics visualization": "指标可视化",
    "Create resource": "创建资源",
    "Deployment": "部署",
    "Applications": "应用",
    "Workloads": "工作负载",
    "Network & traffic": "网络与流量",
    "Storage": "存储",
    "Access control": "访问控制",
    "Policies": "策略",
    "Observe": "观察",
    "Operate": "操作",
    "System": "系统",
    "Topology": "拓扑",
    "Member Cluster graph": "成员集群拓扑",
    "Metrics": "指标",
    "Configuration": "配置",
    "State library": "状态库",
    "Terminal": "终端",
    "Control Plane Terminal": "控制面终端",
    "Language": "语言",
    "Light": "亮色",
    "Dark": "暗色",
    "Account": "账户",
    "Profile & access": "个人信息与权限",
    "Sign out": "退出登录",
    "Control Plane / Overview": "控制面 / 概览",
    "Control Plane / Topology": "控制面 / 拓扑",
    "Operate / Resources": "操作 / 资源",
    "Operate / Policies": "操作 / 策略",
    "Operate / Member Clusters": "操作 / 成员集群",
    "Observe / Metrics": "观察 / 指标",
    "System / Configuration": "系统 / 配置",
    "Design system / States": "设计系统 / 状态",
    "All systems are steady.": "所有系统运行稳定",
    "Member Cluster topology": "成员集群拓扑",
    "Resource workspace": "资源工作区",
    "Placement and overrides": "调度与覆盖",
    "Connected Member Clusters": "已连接成员集群",
    "Control Plane signals": "控制面信号",
    "Control Plane settings": "控制面设置",
    "Operational state library": "运行状态库",
    "Add Member Cluster": "添加成员集群",
    "Run health check": "运行健康检查",
    "Connected": "已连接",
    "All reachable": "全部可达",
    "Push mode": "Push 模式",
    "Pull mode": "Pull 模式",
    "Direct connection": "直连",
    "Agent connection": "Agent 连接",
    "Stale signals": "过期信号",
    "Metrics only": "仅指标",
    "All connection modes": "全部连接模式",
    "Status": "状态",
    "Nodes": "节点",
    "Memory": "内存",
    "Freshness": "新鲜度",
    "Open": "打开",
    "More": "更多",
    "Search": "搜索",
    "Search member cluster": "搜索成员集群",
    "Switch workspace": "切换工作区",
    "CONTROL PLANE": "控制面",
    "MEMBER CLUSTERS": "成员集群",
    "Current workspace": "当前工作区",
    "Healthy": "健康",
    "Ready": "就绪",
    "Stale": "过期",
    "Control Plane terminal manager": "控制面终端管理",
    "Terminal sessions": "终端会话",
    "Audited shell access to Karmada control plane components.": "对 Karmada 控制面组件进行受审计的 Shell 访问。",
    "New session": "新建会话",
    "Close session": "关闭会话",
    "Connected securely": "安全连接",
    "Read-only prototype session": "只读原型会话",
    "Run": "运行",
    "Close": "关闭",
    "Type a read-only command": "输入只读命令",
    "Session activity is recorded for audit. This prototype does not execute real commands.": "会话活动将被审计记录；此原型不会执行真实命令。",
    "Sign in to Dashboard": "登录控制台",
    "Bearer token": "Bearer Token",
    "Paste token here": "在此粘贴 Token",
    "Continue to Control Plane overview": "进入控制面概览",
    "Sign in with OIDC": "使用 OIDC 登录"
  };

  Object.assign(zhCopy, {
    "Resource management": "资源管理",
    "Network & discovery": "网络与发现",
    "Current": "当前",
    "Pending": "等待中",
    "Running": "运行中",
    "Completed": "已完成",
    "Failed": "失败",
    "Warning": "警告",
    "Normal": "正常",
    "Review": "需检查",
    "Details": "详情",
    "Edit": "编辑",
    "Delete": "删除",
    "Cancel": "取消",
    "Confirm": "确认",
    "Continue": "继续",
    "Apply": "应用",
    "Save": "保存",
    "Discard": "放弃更改",
    "Retry": "重试",
    "Refresh": "刷新",
    "Configure": "配置",
    "Install": "安装",
    "Uninstall": "卸载",
    "Enable": "启用",
    "Disable": "停用",
    "Enabled": "已启用",
    "Disabled": "已停用",
    "Available": "可用",
    "Unavailable": "不可用",
    "Verified": "已验证",
    "Passed": "已通过",
    "Type": "类型",
    "Kind": "资源类型",
    "Key": "键",
    "Name": "名称",
    "Namespace": "命名空间",
    "Scope": "范围",
    "cluster scope": "集群范围",
    "Source": "来源",
    "Target": "目标",
    "Status": "状态",
    "Reason": "原因",
    "Message": "消息",
    "Description": "说明",
    "Version": "版本",
    "Image": "镜像",
    "Replicas": "副本数",
    "Connection": "连接",
    "Placement": "调度位置",
    "Actions": "操作",
    "Created": "创建时间",
    "Updated": "更新时间",
    "Last seen": "最后出现",
    "Last sync": "最后同步",
    "Count": "次数",
    "Age": "运行时长",
    "Search resources": "搜索资源",
    "Search member clusters": "搜索成员集群",
    "Search name, namespace, or kind": "搜索名称、命名空间或资源类型",
    "Clear search": "清除搜索",
    "Select an option": "请选择",
    "All namespaces": "全部命名空间",
    "All statuses": "全部状态",
    "All resources": "全部资源",
    "Columns": "列设置",
    "Column visibility": "列显示",
    "No results": "没有匹配结果",
    "No matching commands.": "没有匹配的命令",
    "No active warnings": "没有活动警告",
    "Resource details": "资源详情",
    "Resource information": "资源信息",
    "Node operations": "节点操作",
    "Scheduling and runtime": "调度与运行时",
    "Runtime": "运行时",
    "Operating system": "操作系统",
    "Scheduling constraints": "调度约束",
    "Taints": "污点",
    "No taints configured. This node accepts workloads allowed by its labels and available capacity.": "未配置污点。此节点将接收其标签和可用容量所允许的工作负载。",
    "Containers": "容器",
    "Files": "文件",
    "Volumes": "存储卷",
    "History": "历史",
    "Endpoints": "端点",
    "Proxy": "代理",
    "Data": "数据",
    "Consumers": "引用方",
    "Discovery": "发现状态",
    "Source cluster": "来源集群",
    "Object": "对象",
    "Versions": "版本",
    "Instances": "实例",
    "Conditions": "状况",
    "Resources": "资源",
    "Values": "Values",
    "Notes": "说明",
    "Readme": "README",
    "bytes / second": "字节/秒",
    "Drain": "排空",
    "Download": "下载",
    "Streaming · 7 lines · timestamps on": "流式更新 · 7 行 · 已显示时间戳",
    "Container: main": "容器：main",
    "Connected · audited session": "已连接 · 会话受审计",
    "Connected to": "已连接到",
    "Interactive session": "交互式会话",
    "type \"help\" for available commands.": "输入 \"help\" 查看可用命令。",
    "Shell": "Shell",
    "metrics-server · no active pod": "metrics-server · 无活动 Pod",
    "NO LIVE SAMPLE": "无实时样本",
    "This CronJob is suspended": "此 CronJob 已暂停",
    "CPU, memory, network, and disk metrics become available when a Job creates a running Pod. Historical execution metrics remain available from completed Jobs.": "Job 创建运行中的 Pod 后即可查看 CPU、内存、网络和磁盘指标；已完成 Job 的历史执行指标仍会保留。",
    "Metrics are aggregated from Pods created by recent Jobs. Completed executions show the latest retained samples.": "指标聚合自近期 Job 创建的 Pod；已完成的执行会显示最新保留样本。",
    "Metrics are aggregated from Pods created by this Job. Completed executions show the latest retained samples.": "指标聚合自此 Job 创建的 Pod；已完成的执行会显示最新保留样本。",
    "Metrics current · 15s resolution": "指标为最新 · 15 秒分辨率",
    "Service proxy URL": "Service 代理 URL",
    "Send request": "发送请求",
    "Ready to send a request through the Kubernetes API proxy.": "已准备通过 Kubernetes API 代理发送请求。",
    "Requested": "请求容量",
    "Used": "已使用",
    "Expansion is supported by storage class": "此存储类支持扩容：",
    "supports expansion.": "支持扩容。",
    "Run access review": "执行权限检查",
    "A packaged Kubernetes application from the configured chart repository.": "来自已配置 Chart 仓库的 Kubernetes 应用包。",
    "Prerequisites": "前置条件",
    "Default storage class": "默认存储类",
    "Ingress controller (optional)": "Ingress 控制器（可选）",
    "Use the service endpoint inside the cluster or configure an Ingress to expose the application.": "可在集群内使用 Service 端点，也可配置 Ingress 对外暴露应用。",
    "12 capabilities allowed; no denied rules found.": "允许 12 项能力，未发现被拒绝的规则。",
    "Event history": "事件历史",
    "Manifest snapshot · read only": "清单快照 · 只读",
    "Edit YAML is available from the row Actions menu.": "可通过表格行的操作菜单编辑 YAML。",
    "Values snapshot · read only": "Values 快照 · 只读",
    "Use Upgrade from the row Actions menu to change values.": "如需修改 Values，请使用表格行操作菜单中的升级功能。",
    "Desired placement": "期望调度位置",
    "Not targeted": "未选为目标",
    "Realized": "已实现",
    "Signal stale": "信号已过期",
    "Control Plane ready": "控制面就绪",
    "Federation state": "联邦状态",
    "Current workspace": "当前工作区",
    "Switch to Control Plane": "切换至控制面",
    "Switch workspace": "切换工作区",
    "Attention queue": "待处理队列",
    "Operational signals that may need review.": "可能需要检查的运行信号。",
    "No warning events for this object": "该对象没有警告事件",
    "Search resources, member clusters, policies…": "搜索资源、成员集群或策略…",
    "Suggestions": "建议操作",
    "Create resource in current workspace": "在当前工作区创建资源",
    "Trace global resource delivery": "追踪全局资源分发",
    "Inspect cluster connections": "检查集群连接",
    "Manage member clusters": "管理成员集群",
    "Open metrics visualization": "打开指标可视化",
    "Open resource workspace": "打开资源工作区",
    "Review policy conflicts": "检查策略冲突",
    "Profile & access": "个人信息与权限",
    "Done": "完成",
    "Confirm destructive action": "确认高风险操作",
    "Prototype action completed": "原型操作已完成",
    "No backend state was changed.": "未修改任何后端状态。",
    "Interaction available": "交互已就绪",
    "This control is wired for prototype review.": "此控件已实现原型交互。",
    "Signals refreshed": "信号已刷新",
    "Latest mock sample received 1s ago.": "已于 1 秒前收到最新模拟数据。",
    "Configuration saved": "配置已保存",
    "Static prototype confirmation only.": "仅为静态原型确认。",
    "Configuration": "配置",
    "Karmada config": "Karmada 配置",
    "Dashboard config": "Dashboard 配置",
    "Registry": "镜像仓库",
    "Helm configuration": "Helm 配置",
    "Upgrade": "升级",
    "Failover policies": "故障迁移策略",
    "Rescheduling": "重新调度",
    "Component permissions": "组件权限",
    "Add-ons": "附加组件",
    "Karmada control plane": "Karmada 控制面",
    "Dashboard configuration": "Dashboard 配置",
    "Image registries": "镜像仓库",
    "Control plane upgrade": "控制面升级",
    "Binding rescheduling": "Binding 重新调度",
    "Karmada add-ons": "Karmada 附加组件",
    "Runtime source": "运行时来源",
    "Configuration source": "配置来源",
    "Registry rules": "仓库规则",
    "Release manager": "发布管理器",
    "Upgrade method": "升级方式",
    "Configuration scope": "配置范围",
    "Operation target": "操作目标",
    "Authorization source": "授权来源",
    "Supported add-ons": "支持的附加组件",
    "Component arguments": "组件参数",
    "CONTROL PLANE CONFIGURATION": "控制面配置",
    "DASHBOARD CONFIGURATION": "DASHBOARD 配置",
    "IMAGE DISTRIBUTION": "镜像分发",
    "PACKAGE MANAGEMENT": "包管理",
    "RELEASE MANAGEMENT": "版本管理",
    "CLUSTER RECOVERY": "集群恢复",
    "PLACEMENT RECOVERY": "调度恢复",
    "IDENTITY AND ACCESS": "身份与访问",
    "ADD-ON MANAGEMENT": "附加组件管理",
    "Save changes": "保存更改",
    "Discard changes": "放弃更改",
    "Unsaved changes": "存在未保存更改",
    "Saved configuration": "已保存配置",
    "Official documentation": "官方文档",
    "Current configuration": "当前配置",
    "Generated component arguments": "生成的组件参数",
    "CURRENT": "当前",
    "UNSAVED": "未保存",
    "Installation method detected: Helm": "检测到安装方式：Helm",
    "Upgrade plan": "升级计划",
    "Preflight checks": "升级前检查",
    "Run preflight checks": "运行升级前检查",
    "Running checks": "正在检查",
    "Review upgrade": "检查升级内容",
    "Upgrade completed": "升级已完成",
    "Start upgrade": "开始升级",
    "Current version": "当前版本",
    "Target version": "目标版本",
    "Application failover": "应用故障迁移",
    "Cluster failover": "集群故障迁移",
    "Toleration seconds": "容忍时间（秒）",
    "Purge mode": "清理模式",
    "Grace period seconds": "宽限时间（秒）",
    "Cluster purge mode": "集群清理模式",
    "Generated policy fragment": "生成的策略片段",
    "Manual rescheduling": "手动重新调度",
    "Find binding": "查找 Binding",
    "Target clusters": "目标集群",
    "Recalculation": "重新计算",
    "Trigger field": "触发字段",
    "Merge patch preview": "合并补丁预览",
    "Trigger rescheduling": "触发重新调度",
    "Component permission audit": "组件权限审计",
    "Component": "组件",
    "Runs in": "运行位置",
    "Access level": "访问级别",
    "Resource scope": "资源范围",
    "Official description": "官方说明",
    "Authentication": "认证",
    "Authorization": "授权",
    "Manage role bindings": "管理角色绑定",
    "Open Access control": "打开访问控制",
    "Host cluster": "宿主集群",
    "All Kubernetes resources": "全部 Kubernetes 资源",
    "Cluster administrator": "集群管理员",
    "Not installed": "未安装",
    "Installing": "正在安装",
    "Uninstalling": "正在卸载",
    "Attention required": "需要处理",
    "Priority class": "优先级类",
    "Private registry": "私有镜像仓库",
    "Member context": "成员集群上下文",
    "Deployment": "部署",
    "Estimator": "Estimator",
    "Cluster scoped · excluded from “enable all”": "集群范围 · 不包含在“全部启用”中",
    "Scheduler Estimator is required": "需要 Scheduler Estimator",
    "Install dependency and Descheduler": "安装依赖与 Descheduler",
    "Select at least one ready member cluster.": "请至少选择一个就绪的成员集群。",
    "This is an interactive design prototype; no Kubernetes API request or cluster write will occur.": "这是交互设计原型，不会发起 Kubernetes API 请求，也不会写入集群。",
    "Member cluster": "成员集群",
    "Connection mode": "连接模式",
    "API or agent reachable": "API 或 Agent 可达",
    "Direct connections": "直连集群",
    "Agent connections": "Agent 连接",
    "Review freshness": "检查信号新鲜度",
    "All signals current": "全部信号均为最新",
    "Member cluster updated": "成员集群已更新",
    "Member cluster registration started": "已开始注册成员集群",
    "Member cluster deleted": "成员集群已删除",
    "Delete cluster": "删除集群",
    "Resource editor mode": "资源编辑模式",
    "Guided form": "引导表单",
    "YAML editor": "YAML 编辑器",
    "Associated policies": "关联策略",
    "Propagation Policy": "传播策略",
    "Override Policy": "覆盖策略",
    "Cluster scoped": "集群范围",
    "Member resource": "成员集群资源",
    "Topology minimap": "拓扑缩略图",
    "Hide minimap": "隐藏缩略图",
    "Show minimap": "显示缩略图",
    "Top to bottom layout": "从上到下布局",
    "Left to right layout": "从左到右布局",
    "Run automatic layout": "运行自动布局"
  });

  Object.assign(zhCopy, {
    "Three member clusters are connected. One capacity signal needs attention.": "已连接三个成员集群，其中一条容量信号需要处理。",
    "Trace one resource from template and policy resolution to every realized member-cluster workload.": "从资源模板和策略解析开始，追踪资源到每个成员集群中的实际工作负载。",
    "Manage member clusters and inspect their live control-plane connections in one workspace.": "在同一工作区管理成员集群并检查实时控制面连接。",
    "Inspect pod readiness, placement, restarts, and live resource usage.": "检查 Pod 就绪状态、调度位置、重启次数和实时资源使用情况。",
    "A deployment propagated from the control plane to three member clusters.": "一个从控制面分发到三个成员集群的 Deployment。",
    "Review where resources are placed, transformed, and currently blocked.": "检查资源的调度位置、转换结果和当前阻塞项。",
    "Correlate scheduler throughput, API latency, queue depth, and controller health.": "关联分析调度器吞吐量、API 延迟、队列深度和控制器健康状态。",
    "Manage connection, registry, upgrade, and failover behavior.": "管理连接、镜像仓库、升级和故障迁移行为。",
    "Errors remain visible as errors—never disguised as empty data.": "错误始终明确显示，不会伪装成空数据。",
    "Configure a Kubernetes or Karmada object with guided fields or YAML.": "通过引导字段或 YAML 配置 Kubernetes 或 Karmada 对象。",
    "Create Kubernetes resources and Karmada policies from one validated workspace.": "在同一个经过校验的工作区创建 Kubernetes 资源和 Karmada 策略。",
    "Tune official controller-manager and scheduler flags, then apply changes through a controlled rolling restart.": "调整官方 controller-manager 和 scheduler 参数，并通过受控滚动重启应用更改。",
    "Configure Dashboard navigation, metric panels, registries, routes, and runtime defaults from one ConfigMap.": "通过一个 ConfigMap 配置 Dashboard 导航、指标面板、镜像仓库、路由和运行时默认值。",
    "Manage multiple image registries with registry-specific mirrors, credentials, security, and pull behavior.": "管理多个镜像仓库及各自的镜像加速、凭据、安全策略和拉取行为。",
    "Manage chart repositories and the default Helm release behavior used for Karmada lifecycle operations.": "管理 Chart 仓库及 Karmada 生命周期操作使用的默认 Helm 发布行为。",
    "Upgrade the Karmada CRD bundle and control-plane components with the workflow supported by the detected installation method.": "使用当前安装方式支持的流程升级 Karmada CRD 和控制面组件。",
    "Configure official application and cluster failover fields used by PropagationPolicy and ClusterPropagationPolicy resources.": "配置 PropagationPolicy 和 ClusterPropagationPolicy 使用的官方应用与集群故障迁移字段。",
    "Trigger a fresh scheduling calculation for an existing binding using its rescheduleTriggeredAt field.": "通过现有 Binding 的 rescheduleTriggeredAt 字段触发新的调度计算。",
    "Audit Karmada component permissions and manage human access through standard Roles, ClusterRoles, and bindings.": "审计 Karmada 组件权限，并通过标准 Role、ClusterRole 和绑定管理用户访问。",
    "Install, configure, and monitor optional Karmada components across the host and member clusters.": "在宿主集群和成员集群中安装、配置并监控可选 Karmada 组件。",
    "Install and manage the four components supported by karmadactl addons enable. Lifecycle actions below update this interactive prototype only.": "安装并管理 karmadactl addons enable 支持的四个组件。以下生命周期操作只会更新交互原型。",
    "Install per member cluster for more accurate scheduling estimates. Descheduler requires at least one ready estimator.": "按成员集群安装，以获得更准确的调度估算。Descheduler 至少需要一个就绪的 Estimator。",
    "Installation is disabled for stale member clusters. Restore the cluster connection before deploying Scheduler Estimator.": "过期的成员集群无法安装组件，请先恢复集群连接，再部署 Scheduler Estimator。",
    "Karmada Descheduler relies on Scheduler Estimator. Select the ready member clusters that should receive the dependency first.": "Karmada Descheduler 依赖 Scheduler Estimator，请先选择要安装该依赖的就绪成员集群。",
    "The connected member kubeconfig remains managed outside this page. Sensitive content is not displayed.": "已连接成员集群的 kubeconfig 仍在本页面之外管理，这里不会展示敏感内容。",
    "The updated values will be used by the next lifecycle action.": "更新后的配置将在下一次生命周期操作中使用。",
    "Existing configuration is retained in this prototype.": "此原型会保留现有配置。",
    "Review configuration before continuing if you need custom values.": "如需自定义配置，请在继续前检查配置。",
    "Upgrade APIs and components together, using the instructions for the next minor release.": "按照下一个次要版本的说明同步升级 API 和组件。",
    "The official process requires a recoverable backup, compatible CRDs, and a healthy installation-specific upgrade path.": "官方流程要求具备可恢复备份、兼容的 CRD 和健康的安装方式专属升级路径。",
    "Helm will update the CRD bundle and roll the control-plane components. This prototype does not write to a cluster.": "Helm 将更新 CRD 并滚动升级控制面组件；此原型不会写入集群。",
    "Migrate an unhealthy application after its interpreted health remains unhealthy for the configured tolerance.": "当应用的解释器健康状态持续异常并超过容忍时间后，迁移该应用。",
    "Control legacy workload cleanup after a NoExecute taint triggers migration from a member cluster.": "控制 NoExecute 污点触发成员集群迁移后旧工作负载的清理方式。",
    "Select a binding to perform a complete scheduling recalculation without reusing the previous result.": "选择一个 Binding 进行完整的调度重算，不复用之前的结果。",
    "Review the permission boundary documented by Karmada for lifecycle and agent components.": "检查 Karmada 为生命周期组件和 Agent 组件定义的权限边界。",
    "Human and Dashboard access is managed with ServiceAccounts, Roles, ClusterRoles, and their bindings in the Karmada API server.": "用户和 Dashboard 的访问权限由 Karmada API Server 中的 ServiceAccount、Role、ClusterRole 及其绑定管理。",
    "Official installation tools provision component permissions using least-privilege Roles and ClusterRoles.": "官方安装工具通过最小权限 Role 和 ClusterRole 配置组件权限。",
    "The agent acts as an administrator in its member cluster and has limited resource-specific access in the Karmada system.": "Agent 在成员集群中拥有管理员权限，并在 Karmada 系统中拥有受限的特定资源权限。",
    "Agent mode intentionally requires administrator access in the member cluster. Protect its ServiceAccount token and certificate rotation path.": "Agent 模式需要成员集群管理员权限，请妥善保护其 ServiceAccount Token 和证书轮换路径。",
    "Choose the member clusters that receive this resource.": "选择接收该资源的成员集群。",
    "Apply a JSON path replacement on selected member clusters.": "在选定成员集群上应用 JSON Path 替换。",
    "Create placement and override policies together with this resource.": "创建该资源时一并创建调度和覆盖策略。",
    "Edit the resource and its policies with the same YAML workflow.": "在同一个 YAML 工作流中编辑资源及其策略。",
    "This object participates directly in Karmada control-plane reconciliation.": "该对象直接参与 Karmada 控制面协调。",
    "Propagation state is compared with realized objects in every target member cluster.": "系统会将分发状态与每个目标成员集群中的实际对象进行比较。",
    "Object state observed successfully": "已成功获取对象状态",
    "Member cluster copies are current": "成员集群副本均为最新",
    "Projected service account token was refreshed": "已刷新投射的 ServiceAccount Token",
    "Role bindings and effective access were evaluated": "已评估角色绑定和有效访问权限",
    "Target member clusters were resolved": "已解析目标成员集群",
    "Desired manifest was applied to member clusters": "期望清单已应用至成员集群",
    "Latest resource status was collected": "已采集最新资源状态"
  });

  Object.assign(zhCopy, {
    "Add member cluster": "添加成员集群",
    "A member cluster with this name already exists.": "已存在同名成员集群。",
    "Register a Kubernetes cluster and choose how Karmada connects to it.": "注册 Kubernetes 集群并选择 Karmada 的连接方式。",
    "Cluster name is required.": "请输入集群名称。",
    "Cluster names are immutable after registration.": "集群注册后无法修改名称。",
    "Lowercase letters, numbers, hyphens, and dots.": "仅支持小写字母、数字、连字符和点。",
    "Choose a readable kubeconfig file or paste its contents.": "选择可读取的 kubeconfig 文件或粘贴其内容。",
    "Paste the complete kubeconfig or import a YAML file.": "粘贴完整 kubeconfig，或导入 YAML 文件。",
    "Best when the member cluster API is reachable from the control plane.": "适用于控制面可以直接访问成员集群 API 的场景。",
    "Best when the member cluster API is not directly reachable from the control plane.": "适用于控制面无法直接访问成员集群 API 的场景。",
    "Control plane connects directly to the member cluster API.": "控制面直接连接成员集群 API。",
    "Cluster kubeconfig": "集群 kubeconfig",
    "Cluster labels": "集群标签",
    "Cluster taints": "集群污点",
    "Complete every label pair or remove the incomplete row.": "请补全每一组标签，或移除未完成的行。",
    "Complete key, value, and effect for every taint.": "请补全每个污点的键、值和效果。",
    "Close details": "关闭详情",
    "Collapse": "收起",
    "Expand": "展开",
    "Copy YAML": "复制 YAML",
    "Copied": "已复制",
    "Read only": "只读",
    "Editable": "可编辑",
    "Pause": "暂停",
    "Resume": "继续",
    "Logs": "日志",
    "Monitor": "监控",
    "Port forward": "端口转发",
    "Resource actions": "资源操作",
    "Refresh resource": "刷新资源",
    "Refresh node": "刷新节点",
    "Refresh metrics": "刷新指标",
    "Resource refreshed": "资源已刷新",
    "Metrics refreshed": "指标已刷新",
    "Metric refresh paused": "指标刷新已暂停",
    "Metric refresh updated": "指标刷新设置已更新",
    "Log stream paused": "日志流已暂停",
    "Log stream resumed": "日志流已恢复",
    "Log export prepared": "日志导出已准备",
    "Command completed in mock session.": "命令已在模拟会话中完成。",
    "Prototype only; no member-cluster state was changed.": "仅为原型交互，未修改成员集群状态。",
    "Access review": "访问权限检查",
    "Access review complete": "访问权限检查已完成",
    "Add node taint": "添加节点污点",
    "Add taint": "添加污点",
    "Remove node taint": "移除节点污点",
    "Remove taint": "移除污点",
    "Cordon": "封锁调度",
    "Cordon node": "封锁节点调度",
    "Cordoned": "已封锁调度",
    "Drain node": "驱逐节点工作负载",
    "Schedulable": "可调度",
    "Resize resources": "调整资源配置",
    "Scale workload": "伸缩工作负载",
    "Restart rollout": "重启滚动发布",
    "Rollback release": "回滚发布",
    "Expand volume": "扩容存储卷",
    "Run CronJob now": "立即运行 CronJob",
    "Create Job": "创建 Job",
    "Review scale": "检查伸缩配置",
    "Review resize": "检查资源调整",
    "Review drain": "检查驱逐配置",
    "Review rollback": "检查回滚配置",
    "Review expansion": "检查扩容配置",
    "Just now": "刚刚",
    "Queued now": "刚刚进入队列",
    "Detecting": "正在检测",
    "Registering": "正在注册",
    "Applied": "已应用",
    "Scheduled": "已调度",
    "Pulled": "已拉取",
    "Deprecated": "已弃用",
    "Established": "已建立",
    "Preserved": "已保留",
    "All nodes ready": "全部节点就绪",
    "Ready 2 / 2": "就绪 2 / 2",
    "Connected · telemetry stale": "已连接 · 遥测已过期",
    "Configuration source and rollout status": "配置来源与发布状态",
    "Control-plane rollout completed": "控制面滚动发布已完成",
    "Rolling out components": "正在滚动发布组件",
    "Rolling out control-plane components": "正在滚动发布控制面组件",
    "Runtime is current": "运行时配置为最新",
    "Arguments match the saved runtime configuration.": "参数与已保存的运行时配置一致。",
    "Draft differs from the saved runtime configuration.": "草稿与已保存的运行时配置不同。",
    "Controller manager": "Controller Manager",
    "Scheduler": "Scheduler",
    "Cluster health detection": "集群健康检测",
    "Cluster resource modeling": "集群资源建模",
    "API throughput and concurrency": "API 吞吐量与并发",
    "Feature gates and propagation exclusions": "功能门控与分发排除项",
    "Monitor interval": "监控间隔",
    "Monitor grace period": "监控宽限期",
    "Failure threshold": "失败阈值",
    "Recovery threshold": "恢复阈值",
    "Graceful eviction timeout": "优雅驱逐超时",
    "Scheduler name": "调度器名称",
    "Scheduler Estimator": "Scheduler Estimator",
    "Estimator timeout": "Estimator 超时",
    "Disable Estimator for Pull clusters": "对 Pull 集群停用 Estimator",
    "Karmada API QPS": "Karmada API QPS",
    "Karmada API burst": "Karmada API 突发上限",
    "Member API QPS": "成员集群 API QPS",
    "Member API burst": "成员集群 API 突发上限",
    "Concurrent Work syncs": "并发 Work 同步数",
    "Concurrent Binding syncs": "并发 Binding 同步数",
    "Comma-separated namespaces that controller-manager must never propagate.": "以逗号分隔 controller-manager 永不分发的命名空间。",
    "Configure the scheduler identity, built-in plugins, and Scheduler Estimator integration.": "配置调度器标识、内置插件和 Scheduler Estimator 集成。",
    "Control resource modeling, eviction behavior, and optional reconciliation loops.": "控制资源建模、驱逐行为和可选协调循环。",
    "Increase these values only after checking API server saturation and controller queue depth.": "仅在确认 API Server 饱和度和控制器队列深度后提高这些值。",
    "Feature gates are component-scoped and may change between Karmada releases.": "功能门控按组件生效，并可能随 Karmada 版本变化。",
    "Include request context in structured component logs.": "在结构化组件日志中包含请求上下文。",
    "Prioritize controller work queues for more predictable reconciliation.": "为控制器工作队列设置优先级，使协调过程更可预测。",
    "Enable custom resource models used by scheduling decisions.": "启用调度决策使用的自定义资源模型。",
    "Allow workload-aware affinity during scheduling.": "在调度时启用工作负载感知亲和性。",
    "Aggregates resource search and proxy access across the Karmada control plane and member clusters.": "聚合 Karmada 控制面与成员集群的资源搜索和代理访问。",
    "Evicts replicas that remain unschedulable so Karmada can place them on a more suitable member cluster.": "驱逐持续无法调度的副本，使 Karmada 可以将其放置到更合适的成员集群。",
    "Aggregates metrics from member clusters and exposes them through Kubernetes metrics APIs.": "聚合成员集群指标，并通过 Kubernetes Metrics API 对外提供。",
    "Global resource discovery": "全局资源发现",
    "Replica rescheduling": "副本重新调度",
    "Cross-cluster metrics": "跨集群指标",
    "Add-on configuration saved": "附加组件配置已保存",
    "Namespace and image are required.": "命名空间和镜像为必填项。",
    "Replicas must be a whole number from 1 to 20.": "副本数必须是 1 到 20 之间的整数。",
    "Member context is required.": "成员集群上下文为必填项。",
    "Prototype state updated in karmada-system.": "已更新 karmada-system 中的原型状态。",
    "Descheduler stack installed": "Descheduler 组件栈已安装",
    "All v1.16.0 images are reachable": "所有 v1.16.0 镜像均可访问",
    "API compatibility": "API 兼容性",
    "No removed APIs are currently stored": "当前未存储已移除的 API",
    "Control-plane backup": "控制面备份",
    "Component images": "组件镜像",
    "CRD bundle": "CRD 包",
    "CPU usage": "CPU 使用量",
    "CPU now": "当前 CPU",
    "Memory working set": "内存工作集",
    "Network receive": "网络接收",
    "Network transmit": "网络发送",
    "Network usage": "网络使用量",
    "Resource utilization": "资源利用率",
    "Observations": "观测结果",
    "Incoming bindings": "传入 Binding",
    "Outgoing": "传出",
    "Incoming": "传入",
    "Longest running processor": "耗时最长的处理器",
    "Schedule attempts": "调度尝试次数",
    "Scheduling algorithm duration": "调度算法耗时",
    "Framework extension latency": "框架扩展延迟",
    "Plugin execution duration": "插件执行耗时",
    "E2E scheduling duration": "端到端调度耗时",
    "Prometheus metric types": "Prometheus 指标类型",
    "Gauge": "Gauge",
    "Counter": "Counter",
    "Histogram": "Histogram",
    "Filter logs": "筛选日志",
    "Filter log output": "筛选日志输出",
    "Relationship": "关系",
    "Reference": "引用",
    "Backend": "后端",
    "Address": "地址",
    "Hostname": "主机名",
    "Protocol": "协议",
    "Ports": "端口",
    "Mount path": "挂载路径",
    "Completions": "完成数",
    "Duration": "持续时间",
    "Revision": "修订版本",
    "Role": "角色",
    "Group": "用户组",
    "API groups": "API 组",
    "Resolved refs": "已解析引用",
    "Exposed by": "由以下对象暴露",
    "Owned by": "归属对象",
    "Container image already present on machine": "容器镜像已存在于节点",
    "No naming conflicts found": "未发现命名冲突",
    "API endpoint is active": "API 端点处于活动状态"
  });

  Object.assign(zhCopy, {
    "ALL NAMESPACES": "全部命名空间",
    "API proxy": "API 代理",
    "Apply required and preferred cluster affinity.": "应用必需和偏好的集群亲和性。",
    "Bind": "绑定",
    "Change": "变更",
    "Cluster-scoped binding": "集群范围 Binding",
    "Configuration checksum changed": "配置校验和已变更",
    "Container": "容器",
    "Continuous failure duration required to become unhealthy. Default 30s.": "持续失败达到该时长后判定为不健康，默认 30 秒。",
    "Continuous success duration required to become healthy. Default 30s.": "持续成功达到该时长后判定为健康，默认 30 秒。",
    "CPU, memory, network, and pod samples are current.": "CPU、内存、网络和 Pod 样本均为最新。",
    "CRDs and control-plane components now report v1.16.0.": "CRD 和控制面组件当前均报告为 v1.16.0。",
    "Dashboard ConfigMap YAML": "Dashboard ConfigMap YAML",
    "Dashboard menu configuration": "Dashboard 菜单配置",
    "Deploy into": "部署到",
    "Deploy to": "部署到",
    "Directly": "直接清理",
    "Gracefully": "优雅清理",
    "Never": "从不清理",
    "Distribute workloads across topology domains.": "跨拓扑域分布工作负载。",
    "Enable application failover": "启用应用故障迁移",
    "Enable cluster failover behavior": "启用集群故障迁移",
    "Evict propagated resources that do not tolerate NoExecute cluster taints.": "驱逐无法容忍 NoExecute 集群污点的已分发资源。",
    "Exclude clusters currently under eviction.": "排除当前处于驱逐状态的集群。",
    "Existing samples remain visible.": "现有样本仍会保留显示。",
    "Filter": "筛选",
    "Filter and score clusters by taints and tolerations.": "按污点和容忍度筛选并评分集群。",
    "Global resource delivery topology": "全局资源分发拓扑",
    "Grace period while a member cluster starts. Default 1m.": "成员集群启动时的宽限期，默认 1 分钟。",
    "Helm release": "Helm 发布",
    "Helm values": "Helm Values",
    "How often cluster health is evaluated. Default 5s.": "集群健康评估频率，默认 5 秒。",
    "How often cluster status is posted. Default 10s.": "集群状态上报频率，默认 10 秒。",
    "Image updated to stable": "镜像已更新为 stable",
    "Karmada lifecycle resources": "Karmada 生命周期资源",
    "Label": "标签",
    "Maximum duration for an estimator request. Default 3s.": "Estimator 请求的最长等待时间，默认 3 秒。",
    "Maximum wait before final removal. Default 10m.": "最终移除前的最长等待时间，默认 10 分钟。",
    "Member node": "成员集群节点",
    "Must match the schedulerName requested by policies. Default default-scheduler.": "必须与策略请求的 schedulerName 一致，默认为 default-scheduler。",
    "Off": "关闭",
    "Optional": "可选",
    "Optional registry prefix": "可选的镜像仓库前缀",
    "Path": "路径",
    "Port": "端口",
    "Prefer placements close to dependent resources.": "优先将工作负载调度到靠近依赖资源的位置。",
    "PropagationPolicy API": "PropagationPolicy API",
    "Proxy path": "代理路径",
    "Rate": "速率",
    "Realized resource": "实际资源",
    "Reject clusters that cannot serve the requested API.": "排除无法提供所需 API 的集群。",
    "Remove from": "从以下位置移除",
    "Remove the deployment from": "从以下位置移除部署",
    "Replicas changed 1 → 2": "副本数从 1 调整为 2",
    "Rescheduling triggered": "已触发重新调度",
    "Reserve": "预留",
    "Resource": "资源",
    "Resource YAML": "资源 YAML",
    "ResourceBinding API": "ResourceBinding API",
    "ResourceBinding reconciliation workers. Default 5.": "ResourceBinding 协调 Worker 数，默认 5。",
    "Restarts": "重启次数",
    "Review processor": "检查处理器",
    "Rollback": "回滚",
    "Routes": "路由",
    "Run now": "立即运行",
    "Scale": "伸缩",
    "Scheduling constraints represented as key=value:effect.": "调度约束使用 key=value:effect 表示。",
    "Schema": "Schema",
    "Scoped lifecycle manager": "受限的生命周期管理器",
    "Score": "评分",
    "Searchable metadata used by placement rules and inventory filters.": "用于调度规则和资源清单筛选的可搜索元数据。",
    "Select effect": "选择效果",
    "Selects": "选择对象",
    "Sensitive values remain masked in the prototype.": "敏感值在原型中始终保持遮罩。",
    "Served": "提供服务",
    "Short member API burst limit. Default 60.": "成员集群 API 短时突发上限，默认 60。",
    "Short request burst limit. Default 60.": "请求短时突发上限，默认 60。",
    "Skip estimator calls for agent-managed member clusters.": "跳过对 Agent 管理成员集群的 Estimator 调用。",
    "Skipped namespaces": "跳过的命名空间",
    "Start forwarding": "开始转发",
    "Started": "开始时间",
    "Startup grace period": "启动宽限期",
    "Status update frequency": "状态更新频率",
    "Stored": "存储版本",
    "Success": "成功",
    "Summary": "摘要",
    "Superseded": "已被替代",
    "Suspended": "已暂停",
    "Sustained requests to karmada-apiserver. Default 40.": "对 karmada-apiserver 的持续请求速率，默认 40。",
    "Sustained requests to member APIs. Default 40.": "对成员集群 API 的持续请求速率，默认 40。",
    "Sync Node and Pod capacity for dynamic replica assignment.": "同步 Node 与 Pod 容量，用于动态分配副本。",
    "Synced": "已同步",
    "Taint": "污点",
    "Taint manager": "污点管理器",
    "Taint removed": "污点已移除",
    "Telemetry stale": "遥测已过期",
    "Terminal command": "终端命令",
    "The binding records the resolved placement decision produced from the matched propagation policy.": "Binding 记录匹配传播策略后生成的最终调度决策。",
    "The current filtered stream is ready to download.": "当前筛选后的日志流已可下载。",
    "The member agent pulls resources from the control plane.": "成员集群 Agent 从控制面拉取资源。",
    "The member-cluster deployment is ready.": "成员集群中的 Deployment 已就绪。",
    "The prototype deployment state was removed.": "已移除原型中的部署状态。",
    "The source workload template before policy matching, scheduling, and override resolution.": "策略匹配、调度和覆盖解析之前的源工作负载模板。",
    "This removes the member cluster from Karmada management. Workloads already running in the cluster are not deleted.": "这会将成员集群移出 Karmada 管理，但不会删除集群中已运行的工作负载。",
    "Topology viewport and layout controls": "拓扑视口与布局控制",
    "Tune how quickly the controller manager detects member-cluster failures and recovery.": "调整 Controller Manager 检测成员集群故障与恢复的速度。",
    "Type a command": "输入命令",
    "Uncordon": "解除封锁",
    "Uncordon node": "解除节点封锁",
    "Uninstall Karmada Descheduler before removing its last estimator.": "移除最后一个 Estimator 前，请先卸载 Karmada Descheduler。",
    "Unresponsive time before a running cluster is unhealthy. Default 40s.": "运行中集群无响应达到该时长后判定为不健康，默认 40 秒。",
    "Update the connection, credentials, labels, and taints for this member cluster.": "更新该成员集群的连接、凭据、标签和污点。",
    "Upgrade confirmation": "升级确认",
    "Upgrade instruction": "升级说明",
    "Upgrade simulation completed": "升级模拟已完成",
    "Usage": "使用量",
    "Use a DNS-compatible lowercase cluster name.": "使用兼容 DNS 的小写集群名称。",
    "Use cluster-side estimates when assigning replicas by available capacity.": "按可用容量分配副本时使用集群侧估算。",
    "User access belongs to API resources": "用户访问权限由 API 资源管理",
    "Value": "值",
    "Value copied": "值已复制",
    "Verbs": "操作动词",
    "Volume": "存储卷",
    "Webhook CA can be injected into conversion patches": "Webhook CA 可注入转换补丁",
    "Weight": "权重",
    "Within target": "目标范围内",
    "Work reconciliation workers. Default 5.": "Work 协调 Worker 数，默认 5。",
    "Workqueue retries": "工作队列重试次数",
    "YAML copied": "YAML 已复制",
    "YAML manifest": "YAML 清单",
    "Yes": "是"
  });

  Object.assign(zhCopy, {
    "Control plane ready": "控制面就绪",
    "Control plane connected": "控制面已连接",
    "Policies · resources · scheduling": "策略 · 资源 · 调度",
    "Member clusters": "成员集群",
    "Member cluster management": "成员集群管理",
    "Connection topology": "连接拓扑",
    "Cluster operations": "集群操作",
    "Operational": "运行正常",
    "Operational overview": "运行概览",
    "Resource inventory": "资源清单",
    "Allocated capacity": "已分配容量",
    "Workload health": "工作负载健康状态",
    "Warning events": "警告事件",
    "Node realization": "节点运行状态",
    "Recent events": "近期事件",
    "Recent changes": "近期变更",
    "Live topology": "实时拓扑",
    "Live event stream": "实时事件流",
    "Open resource": "打开资源",
    "All": "全部",
    "All scopes": "全部范围",
    "All healthy": "全部健康",
    "All ready": "全部就绪",
    "Across current selectors": "基于当前选择器",
    "Active policies": "生效策略",
    "Matched resources": "匹配资源",
    "POLICY DETAILS": "策略详情",
    "PLACEMENT ROUTE": "调度路径",
    "OVERRIDE ROUTE": "覆盖路径",
    "Resolved placement": "已解析调度位置",
    "Manifest overrides": "清单覆盖",
    "Matched resource": "匹配资源",
    "Distribute": "分发",
    "Eligible clusters": "候选集群",
    "Override targets": "覆盖目标",
    "Conflicts": "冲突",
    "Override rules": "覆盖规则",
    "Policy scope": "策略范围",
    "Cluster-scoped": "集群范围",
    "Namespaced": "命名空间范围",
    "Inherited": "继承",
    "Observed": "已观测",
    "Review requested": "需要检查",
    "No matching policies": "没有匹配的策略",
    "Adjust the family, scope, or search query.": "请调整策略类型、范围或搜索条件。",
    "Propagation routes": "传播路径",
    "Matched propagation policy": "匹配的传播策略",
    "Applied override policy": "已应用覆盖策略",
    "Stale observation": "观测数据已过期",
    "Global resource topology": "全局资源拓扑",
    "Resource kind": "资源类型",
    "Resource relation": "资源关系",
    "Auto layout": "自动布局",
    "End-to-end": "端到端",
    "Query": "查询",
    "Trace": "追踪",
    "RESOURCE DELIVERY TRACE": "资源分发追踪",
    "DIRECT CLUSTER SCOPE": "成员集群直连范围",
    "LIVE METRICS": "实时指标",
    "LIVE SNAPSHOT": "实时快照",
    "KARMADA TELEMETRY": "KARMADA 遥测",
    "Resource configuration": "资源配置",
    "Resource type": "资源类型",
    "API version": "API 版本",
    "Basic information": "基本信息",
    "Advanced options": "高级选项",
    "Creation summary": "创建摘要",
    "Environment variables": "环境变量",
    "Add variable": "添加变量",
    "+ Add variable": "+ 添加变量",
    "Container image": "容器镜像",
    "Container name": "容器名称",
    "Container port": "容器端口",
    "CPU request": "CPU 请求",
    "CPU limit": "CPU 限制",
    "Memory request": "内存请求",
    "Memory limit": "内存限制",
    "Image pull policy": "镜像拉取策略",
    "Service account": "服务账户",
    "Update strategy": "更新策略",
    "Revision history": "版本历史",
    "Progress deadline": "进度截止时间",
    "Max surge": "最大超额副本数",
    "Max unavailable": "最大不可用副本数",
    "Dry run": "试运行",
    "Server validation": "服务端校验",
    "Field manager": "字段管理器",
    "Selected from the resource page": "已从资源页面选择",
    "Literal values passed to the primary container": "传递给主容器的字面值",
    "Choose the API object and where it will live.": "选择 API 对象及其所在范围。",
    "Optional identifiers for automation and ownership.": "用于自动化和归属关系的可选标识。",
    "The prototype validates the draft but never writes to a cluster.": "原型会校验草稿，但不会写入任何集群。",
    "Deployments": "部署",
    "StatefulSets": "有状态副本集",
    "DaemonSets": "守护进程集",
    "Jobs": "任务",
    "CronJobs": "定时任务",
    "Services": "服务",
    "Ingresses": "Ingress",
    "ConfigMaps": "配置字典",
    "Secrets": "密钥",
    "Persistent Volume Claims": "持久卷声明",
    "Persistent Volumes": "持久卷",
    "Storage Classes": "存储类",
    "Service Accounts": "服务账户",
    "Roles": "角色",
    "Role Bindings": "角色绑定",
    "Cluster Roles": "集群角色",
    "Cluster Role Bindings": "集群角色绑定",
    "Namespaces": "命名空间",
    "Custom Resource Definitions": "自定义资源定义",
    "Network Policies": "网络策略",
    "Network Policy": "网络策略",
    "MultiClusterServices": "多集群服务",
    "MultiClusterService": "多集群服务",
    "ServiceExports": "服务导出",
    "ServiceExport": "服务导出",
    "Pod Disruption Budgets": "Pod 中断预算",
    "Horizontal Pod Autoscalers": "Pod 水平自动伸缩",
    "HTTP Routes": "HTTP 路由",
    "Helm Charts": "Helm Charts",
    "Helm Releases": "Helm 发布",
    "Helm releases": "Helm 发布",
    "Token automount": "Token 自动挂载",
    "Cross-cluster service discovery, endpoint aggregation, and exported ports.": "查看跨集群服务发现、端点聚合和导出端口。",
    "Services exported from member clusters and their active consumers.": "查看成员集群导出的服务及其活跃使用方。",
    "Container readiness, restarts, node placement, and live resource usage.": "查看容器就绪状态、重启次数、节点位置和实时资源使用情况。",
    "Workload identities, token references, and automount behavior.": "查看工作负载身份、Token 引用和自动挂载行为。",
    "Operate this Kubernetes cluster directly: inspect nodes, workloads, signals, and recent events.": "直接操作该 Kubernetes 集群，检查节点、工作负载、信号和近期事件。",
    "Push connection is current. Kubernetes objects and resource metrics are both inside freshness targets.": "Push 连接正常，Kubernetes 对象和资源指标均在新鲜度目标范围内。",
    "Kite-inspired entry points for day-to-day diagnosis in this member cluster.": "面向成员集群日常诊断的快捷入口。",
    "The control plane is running on": "控制面运行在",
    "Latest sample is 2m 14s old": "最新样本采集于 2 分 14 秒前",
    "No credentials": "无凭据",
    "Not assigned": "未分配",
    "Not set": "未设置",
    "Not tested": "未测试",
    "None": "无",
    "Always": "始终",
    "Recreate": "重新创建",
    "Reset": "重置",
    "Seconds": "秒",
    "Region": "区域",
    "Sync mode": "同步模式",
    "Time range": "时间范围",
    "Window": "时间窗口",
    "Resolution": "分辨率",
    "Streaming": "流式更新",
    "Last 30 min": "最近 30 分钟",
    "Panels": "面板",
    "Sample": "样本",
    "Last": "最新值",
    "Missing series": "缺失序列",
    "Recording rules": "记录规则",
    "Scrape targets": "抓取目标",
    "Leader election": "Leader 选举",
    "Inside target": "目标范围内",
    "Counter": "计数器",
    "Gauge": "仪表值",
    "Histogram": "直方图",
    "Control Plane metrics": "控制面指标",
    "Panel metric JSON": "面板指标 JSON",
    "Metrics dashboards": "指标看板",
    "Menu configuration": "菜单配置",
    "Advanced runtime settings": "高级运行时设置",
    "Component startup arguments": "组件启动参数",
    "Current key": "当前键值",
    "Available data keys": "可用数据键",
    "Runtime key selection": "运行时键值选择",
    "Dashboard API · read only": "Dashboard API · 只读",
    "Dashboard ConfigMap YAML": "Dashboard ConfigMap YAML",
    "ConfigMap configuration": "ConfigMap 配置",
    "ConfigMap editor": "ConfigMap 编辑器",
    "All changes saved": "所有更改均已保存",
    "Changes are local to this prototype": "更改仅保存在当前原型中",
    "Built-in plugins": "内置插件",
    "Optional controllers": "可选控制器",
    "Default controllers: *": "默认控制器：*",
    "API selector": "API 选择器",
    "API throughput, reconciliation concurrency, feature gates, and propagation exclusions.": "配置 API 吞吐量、协调并发数、特性开关和传播排除项。",
    "Current policy, cluster health, taints, and available APIs": "当前策略、集群健康状态、污点和可用 API",
    "Atomic operations": "原子操作",
    "Operation timeout": "操作超时",
    "Status update frequency should remain comfortably below the monitor grace period to avoid false failure detection.": "状态更新频率应明显低于监控宽限期，以避免误判故障。",
    "Manage RoleBinding and ClusterRoleBinding objects from Access control.": "请在访问控制中管理 RoleBinding 和 ClusterRoleBinding 对象。",
    "Settings are generated from official component flags. Saving stages a change; applying it performs a rolling restart of the affected workloads.": "设置基于官方组件参数生成；保存会暂存更改，应用后将滚动重启受影响的工作负载。",
    "Chart repositories": "Chart 仓库",
    "Chart registries": "Chart 镜像仓库",
    "Configured repositories": "已配置仓库",
    "Configured registries": "已配置镜像仓库",
    "Repository name": "仓库名称",
    "Repository URL": "仓库 URL",
    "Repository type": "仓库类型",
    "Repository credentials are referenced from Secrets and are not stored directly in this configuration.": "仓库凭据通过 Secret 引用，不会直接存储在此配置中。",
    "Registry endpoint": "镜像仓库端点",
    "Mirror endpoint": "镜像端点",
    "Allow insecure connection": "允许不安全连接",
    "Skip TLS verification": "跳过 TLS 校验",
    "Test connection": "测试连接",
    "Test repository": "测试仓库",
    "OCI registry": "OCI 镜像仓库",
    "Add registry": "添加镜像仓库",
    "Add repository": "添加仓库",
    "Registry and route defaults": "镜像仓库与路由默认值",
    "Default pull policy": "默认拉取策略",
    "Release defaults": "发布默认值",
    "Release name": "发布名称",
    "Release namespace": "发布命名空间",
    "Release history limit": "发布历史上限",
    "Wait for resources": "等待资源就绪",
    "Current release values": "当前发布 Values",
    "Helm repository": "Helm 仓库",
    "Helm release used for lifecycle operations.": "用于生命周期操作的 Helm 发布。",
    "Repository and chart name passed to Helm.": "传递给 Helm 的仓库和 Chart 名称。",
    "Maximum install or upgrade duration in minutes.": "安装或升级的最长时限（分钟）。",
    "Automatically roll back failed installs and upgrades.": "安装或升级失败时自动回滚。",
    "Wait until workloads, Services, and Jobs are ready before completing the operation.": "等待工作负载、Service 和 Job 就绪后再完成操作。",
    "Review and roll out": "检查并发布",
    "Rollout status": "发布状态",
    "Next supported minor": "下一个受支持的次版本",
    "Review the v1.15 to v1.16 upgrade instruction for deprecated arguments before changing component images.": "更改组件镜像前，请检查 v1.15 到 v1.16 的废弃参数升级说明。",
    "Application failover requires": "应用故障迁移需要",
    "Policy-scoped behavior": "策略级行为",
    "Binding operation, not a global policy": "Binding 操作，而非全局策略",
    "Manual rescheduling updates": "手动重新调度更新",
    "Target namespace": "目标命名空间",
    "Scheduler": "调度器",
    "Scheduler Estimator": "Scheduler Estimator",
    "Fresh · 15s resolution": "数据新鲜 · 15 秒分辨率",
    "READ ONLY": "只读",
    "READY": "就绪",
    "STALE": "已过期",
    "OVERVIEW": "概览",
    "TOPOLOGY": "拓扑",
    "WORKLOAD": "工作负载",
    "METRICS": "指标",
    "NAMESPACE": "命名空间",
    "SERVICE": "服务",
    "STAGE": "阶段"
  });

  Object.assign(zhCopy, {
    ". Policies are propagating without errors across all member clusters.": "。策略正在所有成员集群中正常传播。",
    "MultiCluster / Policies": "多集群 / 策略",
    "Events": "事件",
    "Gateway": "网关",
    "Gateways": "网关",
    "Explore →": "浏览 →",
    "Inspect →": "检查 →",
    "Open →": "打开 →",
    "Review →": "检查 →",
    "mode": "模式",
    "Evaluated": "已评估",
    "30 seconds": "30 秒",
    "4 Prometheus types": "4 种 Prometheus 指标类型",
    "29 RESOURCE VIEWS": "29 个资源视图",
    "of 1.5s threshold": "阈值为 1.5 秒",
    "member3 node metrics": "member3 节点指标",
    "member3 metrics delayed": "member3 指标延迟",
    "demo-policy propagated": "demo-policy 已传播",
    "nginx deployment healthy": "nginx 部署健康",
    "etcd snapshot completed 18 minutes ago": "etcd 快照已于 18 分钟前完成",
    "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.": "按 Enter 或空格键选择节点，然后可使用方向键移动节点；按 Delete 删除，按 Escape 取消。",
    "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.": "按 Enter 或空格键选择连线；按 Delete 删除，按 Escape 取消。",
    "Add a lowercase DNS-compatible resource name.": "请输入兼容 DNS 的小写资源名称。",
    "Annotation": "注解",
    "Cluster": "集群",
    "Form": "表单",
    "Lowercase DNS name": "小写 DNS 名称",
    "Metadata": "元数据",
    "Draft needs attention": "草稿需要完善",
    "No": "否",
    "Configure replica rollout, update strategy, revision history, and the managed Pod template.": "配置副本发布、更新策略、版本历史和受管 Pod 模板。",
    "Optionally create placement and override policies in the same validated workflow.": "可在同一校验流程中同时创建调度策略和覆盖策略。",
    "System / Karmada config": "系统 / Karmada 配置",
    "System / Dashboard config": "系统 / Dashboard 配置",
    "System / Registry": "系统 / 镜像仓库",
    "System / Helm configuration": "系统 / Helm 配置",
    "System / Upgrade": "系统 / 升级",
    "System / Failover": "系统 / 故障迁移",
    "System / Reschedule": "系统 / 重新调度",
    "System / Permissions": "系统 / 权限",
    "System / Add-ons": "系统 / 附加组件",
    "CRD source": "CRD 来源",
    "Helm upgrade command": "Helm 升级命令",
    "Chart reference": "Chart 引用",
    "Credentials reference": "凭据引用",
    "Controller Manager": "Controller Manager",
    "Control Plane health": "控制面健康状态",
    "Base definitions + conversion patches": "基础定义与转换补丁",
    "Docker registries": "Docker 镜像仓库",
    "Path / Sidebar key": "路径 / 侧边栏键值",
    "Path prefix": "路径前缀",
    "Required for": "依赖项",
    "Service restart required": "需要重启服务",
    "Values source": "Values 来源",
    "Top-level values from prod.yaml.": "来自 prod.yaml 的顶层 Values。",
    "Web mount": "Web 挂载",
    "Leader Election Master Status": "Leader 选举主节点状态",
    "Workqueue Depth": "工作队列深度",
    "Workqueue Longest Running Processor Seconds": "工作队列最长处理时长（秒）",
    "Workqueue Retries Total": "工作队列重试总数",
    "Kubernetes RBAC is the source of truth": "Kubernetes RBAC 是权限事实来源",
    "Kubernetes RBAC resources": "Kubernetes RBAC 资源",
    "Live configuration discovered from the karmada-host context.": "从 karmada-host 上下文发现的实时配置。",
    "Configure the Helm and OCI sources available to Karmada lifecycle operations.": "配置 Karmada 生命周期操作可用的 Helm 和 OCI 来源。",
    "Defaults applied when installing or upgrading the Karmada control-plane release.": "安装或升级 Karmada 控制面版本时应用的默认值。",
    "Manage registry-specific mirrors, credentials, connection security, and image pull behavior.": "管理每个镜像仓库的镜像端点、凭据、连接安全和镜像拉取行为。",
    "Name used by Helm commands and chart references.": "Helm 命令和 Chart 引用使用的名称。",
    "Optional pull-through mirror for this registry.": "该镜像仓库可选的拉取代理端点。",
    "Permit HTTP or an untrusted certificate for this registry only.": "仅允许该镜像仓库使用 HTTP 或不受信任的证书。",
    "Rules are evaluated against the registry hostname in each workload image reference.": "规则会根据每个工作负载镜像引用中的仓库主机名进行匹配。",
    "Use only for repositories with an internally managed certificate.": "仅用于使用内部管理证书的仓库。",
    "HTTP chart index or OCI registry endpoint.": "HTTP Chart 索引或 OCI 镜像仓库端点。",
    "Hostname used by workload image references.": "工作负载镜像引用使用的主机名。",
    "How the legacy copy is removed after migration.": "迁移后移除旧副本的方式。",
    "The official default enables all six plugins.": "官方默认启用全部六个插件。",
    "Disabled by default in Karmada v1.18.": "Karmada v1.18 默认禁用。",
    "Drag the handle or focus it and use Arrow Up / Arrow Down. Cross-parent moves are disabled.": "拖动手柄，或聚焦后使用上/下方向键调整顺序；不支持跨父级移动。",
    "Expand, enable, and reorder menu items within the same level.": "可展开、启用并调整同级菜单项的顺序。",
    "ENV_NAME is a Deployment-level setting and is read only on this page.": "ENV_NAME 是 Deployment 级设置，在此页面只读。",
    "The prod.yaml data is editable here. Save changes to update the Dashboard configuration draft.": "prod.yaml 数据可在此编辑；保存后会更新 Dashboard 配置草稿。",
    "ENV_NAME is not set in the current Deployment, so the code falls back to prod.yaml.": "当前 Deployment 未设置 ENV_NAME，因此代码会回退到 prod.yaml。",
    "Edit the complete ConfigMap YAML, including all menu definitions and 113 metric panels. ENV_NAME remains outside this editor.": "编辑完整的 ConfigMap YAML，其中包含全部菜单定义和 113 个指标面板；ENV_NAME 不在此编辑器中管理。",
    "Namespace containing the Karmada release.": "Karmada 发布所在的命名空间。",
    "Last scheduled": "上次调度",
    "Certificates, tokens, OIDC, and request-header authentication are not a Dashboard default-role setting.": "证书、Token、OIDC 和请求头认证不属于 Dashboard 默认角色设置。",
    "Mark HPA scale targets for federated autoscaling.": "标记用于联邦自动伸缩的 HPA 伸缩目标。",
    "Synchronize Deployment replica status across clusters.": "跨集群同步 Deployment 副本状态。",
    "Version and component are read only. Select a panel to inspect its metric JSON.": "版本和组件只读；选择面板可检查其指标 JSON。",
    "Apply this fragment to a PropagationPolicy or ClusterPropagationPolicy. A nil failover field disables failover for that policy.": "将此片段应用到 PropagationPolicy 或 ClusterPropagationPolicy；failover 字段为空时，该策略不会启用故障迁移。",
    "Automatic recalculation already occurs when candidate clusters, relevant labels, or matching propagation policies change. There is no official global retry interval or maximum-attempts setting.": "候选集群、相关标签或匹配的传播策略发生变化时会自动重新计算；官方没有全局重试间隔或最大尝试次数设置。",
    "State preservation remains excluded from this form because it requires the alpha": "此表单不包含状态保留，因为它依赖 alpha 级",
    "feature gate and workload-specific JSONPath rules.": "特性开关和工作负载专用 JSONPath 规则。",
    "These values generate": "这些值会生成",
    "and a Resource Interpreter health rule for the selected workload kind.": "以及所选工作负载类型对应的 Resource Interpreter 健康规则。",
    "The upgrade workflow follows the official Helm path for the existing": "升级流程遵循现有安装方式对应的官方 Helm 路径：",
    "release.": "发布。",
    "To change": "如需更改",
    "is not set in the current Deployment, so the code falls back to": "当前 Deployment 未设置该值，因此代码会回退到",
    ", edit the Deployment manually and restart or roll out the Dashboard service. All ConfigMap content below remains editable.": "，请手动编辑 Deployment 并重启或滚动发布 Dashboard 服务。下方所有 ConfigMap 内容仍可编辑。",
    "data is editable here. Save changes to update the Dashboard configuration draft.": "数据可在此编辑；保存后会更新 Dashboard 配置草稿。",
    ". They are not global control-plane switches.": "。它们并非全局控制面开关。",
    ". Lifecycle actions below update this interactive prototype only.": "。下方生命周期操作仅更新当前交互原型。",
    "Install and manage the four components supported by": "安装并管理以下工具支持的四个组件：",
    "6 REQUIRED": "6 项必需",
    "Components installed:": "已安装组件："
  });

  Object.assign(zhCopy, {
    "Karmada Control Plane overview": "Karmada 控制面概览",
    "Collapse navigation": "收起导航",
    "Expand navigation": "展开导航",
    "Search resources and commands": "搜索资源和命令",
    "Search resources, policies, member clusters…": "搜索资源、策略或成员集群…",
    "Open attention queue": "打开待处理队列",
    "Close attention queue": "关闭待处理队列",
    "Switch to English": "切换至英文",
    "Switch to dark theme": "切换至暗色主题",
    "Switch to light theme": "切换至亮色主题",
    "Refresh policies": "刷新策略",
    "Policy summary": "策略摘要",
    "Policy family": "策略类型",
    "Search policies": "搜索策略",
    "Federation / Global topology": "联邦 / 全局拓扑",
    "Federation / Cluster management": "联邦 / 集群管理",
    "Federation / Metrics visualization": "联邦 / 指标可视化",
    "Resource management / Pods": "资源管理 / Pods",
    "Resource management / Service Accounts": "资源管理 / 服务账户",
    "Federation-aware creation": "联邦资源创建",
    "WORKLOADS": "工作负载",
    "ACCESS": "访问控制",
    "HEALTH": "健康状态",
    "OPERATIONS": "操作",
    "TOKEN AUTOMOUNT": "TOKEN 自动挂载"
  });

  Object.assign(zhCopy, {
    "Display columns": "显示列",
    "Always visible": "始终显示",
    "Reset columns": "重置列设置",
    "Drag headers to resize": "拖动表头调整列宽",
    "Columns": "列设置"
  });

  Object.assign(zhCopy, {
    "objects": "个对象",
    "namespaces": "个命名空间",
    "logs": "日志",
    "terminal": "终端",
    "metrics": "指标",
    "endpoints": "端点",
    "instances": "实例",
    "manifests": "清单",
    "references": "引用",
    "events": "事件",
    "history": "历史",
    "inventory": "清单",
    "workspace": "工作区",
    "stream": "流",
    "rollout": "发布状态",
    "service map": "服务映射",
    "backends": "后端",
    "backend": "后端",
    "object": "对象",
    "claim": "声明",
    "shell": "Shell",
    "simulator": "模拟器",
    "resolver": "解析器",
    "trace": "追踪",
    "versions": "版本",
    "conversion": "转换",
    "comparison": "对比",
    "coverage": "覆盖情况",
    "policy": "策略",
    "consumers": "使用方",
    "provisioner": "供应器",
    "graph": "图谱",
    "audit": "审计",
    "quota": "配额",
    "copy": "副本",
    "Control Plane / workloads": "控制面 / 工作负载",
    "Control Plane / access": "控制面 / 访问控制"
  });

  Object.assign(zhCopy, {
    "pods": "Pod",
    "namespace": "命名空间",
    "ready": "就绪副本",
    "status": "状态",
    "restarts": "重启次数",
    "node": "节点",
    "cpu": "CPU",
    "cpu Percent": "CPU 使用率",
    "cpu Request": "CPU 请求",
    "cpu Request Percent": "CPU 请求占比",
    "cpu Limit": "CPU 限制",
    "memory": "内存",
    "memory Percent": "内存使用率",
    "memory Request": "内存请求",
    "memory Request Percent": "内存请求占比",
    "memory Limit": "内存限制"
  });

  Object.assign(zhCopy, {
    "Member cluster workspace": "成员集群工作区",
    "Member cluster operations": "成员集群操作",
    "Member cluster health": "成员集群健康状态",
    "Refresh signals": "刷新信号",
    "Data current": "数据为最新",
    "Search name, label, or status": "搜索名称、标签或状态"
  });

  Object.assign(zhCopy, {
    "Member cluster / Observability": "成员集群 / 可观测性",
    "Capacity, utilization, and recent operational signals for member1.": "查看 member1 的容量、利用率和近期运行信号。",
    "Prometheus connected": "Prometheus 已连接",
    "Last 30 minutes": "最近 30 分钟",
    "Last 1 hour": "最近 1 小时",
    "Last 24 hours": "最近 24 小时",
    "Every 30 seconds": "每 30 秒",
    "Every 10 seconds": "每 10 秒",
    "Live": "实时",
    "Resource allocation": "资源分配",
    "Requests and limits compared with allocatable capacity.": "对比资源请求、限制与可分配容量。",
    "Recent signals": "近期信号",
    "Latest events affecting health and capacity.": "影响健康状态与容量的最新事件。",
    "No recent signals": "暂无近期信号",
    "Metrics pipeline healthy": "指标链路运行正常",
    "Top pod consumers": "Pod 资源消耗排行",
    "Current usage from metrics-server, ordered by CPU.": "来自 metrics-server 的当前用量，按 CPU 排序。",
    "Node saturation": "节点饱和度",
    "Pressure, pod allocation, and current resource usage.": "查看压力状态、Pod 分配和当前资源用量。",
    "No pressure": "无压力",
    "Now": "现在",
    "Usage": "使用量",
    "Request": "请求",
    "Limit": "限制",
    "Allocatable": "可分配",
    "Requests": "请求",
    "Limits": "限制",
    "Pressure": "压力",
    "Across this member cluster": "当前成员集群范围",
    "Container image nginx:1.27 already present on machine": "节点上已存在容器镜像 nginx:1.27",
    "Readiness probe failed once and recovered": "就绪探针曾失败一次，现已恢复",
    "Unhealthy": "不健康",
    "running": "运行中",
    "Drag to resize column · double-click to reset": "拖动调整列宽 · 双击恢复默认宽度",
    "Fold line": "折叠此行",
    "Unfold line": "展开此行",
    "Install Release": "安装发布",
    "Add Repository": "添加仓库",
    "Deployed": "已部署",
    "Complete": "已完成",
    "Bound": "已绑定",
    "Accepted": "已接受",
    "Programmed": "已配置",
    "Protected": "受保护",
    "Active": "活动",
    "Retain": "保留",
    "Immediate": "立即绑定",
    "WaitForFirstConsumer": "等待首个使用方",
    "Egress": "出站",
    "Class": "类别",
    "Hosts": "主机",
    "TLS": "TLS",
    "Schedule": "调度计划",
    "Service": "服务",
    "Strategy": "策略",
    "Cluster IP": "集群 IP",
    "Pod selector": "Pod 选择器",
    "Policy types": "策略类型",
    "Rules": "规则",
    "Gateway class": "网关类别",
    "Addresses": "地址",
    "Listeners": "监听器",
    "Hostnames": "主机名",
    "Parents": "父级资源",
    "Backends": "后端",
    "Chart": "Chart",
    "Latest version": "最新版本",
    "App version": "应用版本",
    "Repository": "仓库",
    "Data keys": "数据键",
    "Immutable": "不可变",
    "Phase": "阶段",
    "Capacity": "容量",
    "Access": "访问模式",
    "Storage class": "存储类",
    "Metric": "指标",
    "Selector": "选择器",
    "Min available": "最小可用数",
    "Disruptions allowed": "允许中断数",
    "Role reference": "角色引用",
    "Subjects": "主体",
    "Labels": "标签",
    "Scheduling": "调度状态",
    "Roles": "角色",
    "Kubelet": "Kubelet",
    "Internal IP": "内部 IP",
    "Reclaim": "回收策略",
    "Reclaim policy": "回收策略",
    "Volume binding": "卷绑定模式",
    "Expansion": "扩容",
    "Parameters": "参数",
    "API group": "API 组",
    "Stored version": "存储版本",
    "Scheduled workloads, latest readiness, and image revisions.": "查看定时工作负载、最近就绪状态和镜像版本。",
    "Node-wide agents and their desired, ready, and available replica state.": "查看节点级 Agent 的期望、就绪和可用副本状态。",
    "Replica health and rollout state for namespaced applications.": "查看命名空间应用的副本健康状态和发布进度。",
    "Ordered replicas, stable identities, persistent storage, and update strategy.": "查看有序副本、稳定身份、持久存储和更新策略。",
    "One-shot execution history and completion status.": "查看一次性任务的执行历史和完成状态。",
    "External routes, ingress class, address, and TLS coverage.": "查看外部路由、Ingress 类别、地址和 TLS 覆盖情况。",
    "Stable virtual IPs, exposed ports, and endpoint readiness.": "查看稳定虚拟 IP、开放端口和端点就绪状态。",
    "Namespace traffic boundaries, selectors, and ingress or egress policy types.": "查看命名空间流量边界、选择器以及入站或出站策略类型。",
    "Gateway API listeners, addresses, attached routes, and programmed conditions.": "查看 Gateway API 监听器、地址、关联路由和配置状态。",
    "Gateway API hostnames, parent gateways, matching rules, and resolved backends.": "查看 Gateway API 主机名、父级网关、匹配规则和已解析后端。",
    "Installed applications, chart revisions, values, managed resources, and rollback history.": "查看已安装应用、Chart 版本、Values、受管资源和回滚历史。",
    "Available application packages from configured Helm repositories.": "查看已配置 Helm 仓库中的可用应用包。",
    "Non-sensitive runtime configuration and the keys exposed to workloads.": "查看非敏感运行时配置以及向工作负载公开的数据键。",
    "Namespaced storage requests, binding state, capacity, and access mode.": "查看命名空间存储请求、绑定状态、容量和访问模式。",
    "Sensitive references are visible; secret values remain masked by design.": "敏感引用可见，但 Secret 值始终保持遮罩。",
    "Scaling targets, replica bounds, and current utilization signals.": "查看伸缩目标、副本上下限和当前利用率信号。",
    "Voluntary disruption limits and current workload availability.": "查看自愿中断限制和当前工作负载可用性。",
    "Non-namespaced identities mapped to privileged roles.": "查看映射到特权角色的集群范围身份。",
    "Cluster-scoped permission rules and their effective verbs.": "查看集群范围权限规则及其有效操作。",
    "Recent Kubernetes events ordered by last occurrence and severity.": "按最近发生时间和严重程度查看 Kubernetes 事件。",
    "Isolation boundaries and ownership labels available.": "查看可用的隔离边界和归属标签。",
    "Node readiness, scheduling state, runtime, address, and current allocation.": "查看节点就绪状态、调度状态、运行时、地址和当前资源分配。",
    "Member cluster storage inventory, reclaim policy, binding, and claims.": "查看成员集群存储清单、回收策略、绑定和声明。",
    "Dynamic provisioners, reclaim policies, volume binding, and expansion support.": "查看动态供应器、回收策略、卷绑定和扩容支持。",
    "Namespace-scoped identity assignments and role references.": "查看命名空间范围的身份分配和角色引用。",
    "Namespace-scoped permission rules, resources, verbs, and labels.": "查看命名空间范围的权限规则、资源、操作和标签。",
    "Installed API extensions, scope, versions, and current conditions.": "查看已安装的 API 扩展、范围、版本和当前状态。",
    "Allow insecure connection": "允许不安全连接",
    "Skip TLS verification": "跳过 TLS 校验",
    "Remove registry": "移除镜像仓库",
    "Remove repository": "移除仓库",
    "karmada release is ready and has no pending operation": "karmada 发布已就绪，没有待处理操作",
    "v1.15 to v1.16 changes reviewed": "已检查 v1.15 到 v1.16 的变更",
    "Karmada CRs, deployments, StatefulSets, services, secrets, PDBs, events, leases, and /healthz.": "Karmada CR、Deployment、StatefulSet、Service、Secret、PDB、Event、Lease 和 /healthz。",
    "kube-apiserver startup configuration": "kube-apiserver 启动配置",
    "host cluster": "宿主集群",
    "Ingress controller for Kubernetes": "Kubernetes Ingress 控制器",
    "Kubernetes monitoring stack": "Kubernetes 监控组件栈",
    "Private container registry": "私有容器镜像仓库",
    "Service Account": "服务账户",
    "Related": "关联资源",
    "Automount": "Token 自动挂载",
    "Effective access": "有效权限",
    "Open workspace": "打开工作区",
    "Edit connection": "编辑连接",
    "Trace schedule": "追踪调度过程",
    "Open policy": "打开策略",
    "Reschedule": "重新调度",
    "View manifests": "查看清单",
    "Retry apply": "重试应用",
    "Open cluster": "打开集群",
    "View logs": "查看日志",
    "Open terminal": "打开终端",
    "Delete Pod": "删除 Pod",
    "Restart rollout": "重启滚动发布",
    "Rollout status": "发布状态",
    "Update partition": "更新分区",
    "Node coverage": "节点覆盖情况",
    "Run again": "再次运行",
    "Delete Job": "删除 Job",
    "Suspend schedule": "暂停调度计划",
    "Job history": "Job 历史",
    "View endpoints": "查看端点",
    "Export service": "导出服务",
    "Test route": "测试路由",
    "TLS details": "TLS 详情",
    "Open backend": "打开后端",
    "Compare clusters": "对比集群",
    "Used by": "引用方",
    "Download data": "下载数据",
    "Rotate": "轮换",
    "Inspect keys": "检查数据键",
    "Mounted by": "挂载方",
    "Storage events": "存储事件",
    "Open claim": "打开声明",
    "Provisioner status": "供应器状态",
    "Set default": "设为默认",
    "Test provision": "测试供应",
    "Token audit": "Token 审计",
    "Disable automount": "停用 Token 自动挂载",
    "Enable automount": "启用 Token 自动挂载",
    "Who can": "查看授权主体",
    "Duplicate": "创建副本",
    "Manage subjects": "管理主体",
    "Inventory": "资源清单",
    "Edit labels": "编辑标签",
    "Resource quota": "资源配额",
    "View instances": "查看实例",
    "API versions": "API 版本",
    "Conversion config": "转换配置",
    "Service Account security": "服务账户安全",
    "Review long-lived and projected credentials associated with this Service Account.": "检查与此服务账户关联的长期凭据和投射凭据。",
    "Subject": "主体",
    "Token sources": "Token 来源",
    "Last authentication": "最近认证",
    "Expiry": "过期时间",
    "Last used": "最近使用",
    "Risk": "风险",
    "Projected token": "投射 Token",
    "No expiry": "永不过期",
    "Run audit": "运行审计",
    "Token audit completed": "Token 审计已完成",
    "RBAC review": "RBAC 检查",
    "Recalculate access": "重新计算权限",
    "Effective access recalculated": "有效权限已重新计算",
    "allowed": "允许",
    "roles": "角色",
    "bindings": "绑定",
    "Affected Pods": "受影响的 Pod",
    "Existing Pods keep their current mounted token until they are recreated.": "现有 Pod 会保留当前挂载的 Token，直到重新创建。",
    "New Pods using this Service Account will not receive a Kubernetes API token automatically. Explicit projected token volumes are unchanged.": "使用此服务账户的新 Pod 不会自动获得 Kubernetes API Token；显式投射的 Token 卷不受影响。",
    "New Pods using this Service Account may receive a Kubernetes API token unless the Pod overrides this setting.": "使用此服务账户的新 Pod 可能会获得 Kubernetes API Token，除非 Pod 覆盖此设置。",
    "Desired replicas": "期望副本数",
    "Availability and disruption budgets are checked before applying.": "应用前会检查可用性和中断预算。",
    "Ignore DaemonSet pods": "忽略 DaemonSet Pod",
    "Respect disruption budgets": "遵守中断预算",
    "Grace period": "宽限时间",
    "Effect": "效果",
    "Service port": "Service 端口",
    "Local port": "本地端口",
    "New capacity": "新容量",
    "Volume shrink is not supported.": "不支持缩小存储卷。",
    "Revision 4 · current": "版本 4 · 当前",
    "DESIRED PLACEMENT": "期望调度位置",
    "Not scheduled": "尚未调度",
    "All clusters": "全部集群",
    "Recent resource events": "近期资源事件",
    "Event": "事件",
    "Clusters": "集群",
    "Register Cluster": "注册集群",
    "Cluster scope": "集群范围",
    "scope": "范围",
    "federation": "联邦",
    "workloads": "工作负载",
    "network": "网络",
    "configuration": "配置",
    "storage": "存储",
    "access": "访问控制",
    "cluster": "集群资源",
    "Resource Bindings": "资源绑定",
    "Cluster Resource Bindings": "集群资源绑定",
    "Works": "Work",
    "Registered member clusters, synchronization mode, Kubernetes version, and API freshness.": "查看已注册成员集群、同步模式、Kubernetes 版本和 API 新鲜度。",
    "Resolved scheduling decisions for namespaced resources and their replica distribution.": "查看命名空间资源的调度结果和副本分布。",
    "Resolved scheduling decisions for cluster-scoped resources.": "查看集群范围资源的调度结果。",
    "Per-member delivery units, manifest application progress, and failed reconciliation.": "查看各成员集群的分发单元、清单应用进度和协调失败状态。",
    "Scheduled workloads, latest readiness, and image revisions across the federation.": "查看联邦范围内的定时工作负载、最近就绪状态和镜像版本。",
    "Federated storage inventory, reclaim policy, binding, and claims.": "查看联邦存储清单、回收策略、绑定和声明。",
    "Cluster-scoped permission rules and their effective verbs across the federation.": "查看联邦范围内的集群级权限规则及其有效操作。",
    "Non-namespaced identities mapped to privileged roles across the federation.": "查看联邦范围内映射到特权角色的集群级身份。",
    "Isolation boundaries and ownership labels available across the federation.": "查看联邦范围内可用的隔离边界和归属标签。"
  });

  Object.assign(zhCopy, {
    "Run cluster health check": "运行集群健康检查",
    "Probe API reachability, credentials, Kubernetes version, and member heartbeat.": "检查 API 可达性、凭据、Kubernetes 版本和成员集群心跳。",
    "Run check": "运行检查",
    "Edit cluster connection": "编辑集群连接",
    "Review Push or Pull mode, API endpoint, credentials, and heartbeat thresholds.": "检查 Push 或 Pull 模式、API 端点、凭据和心跳阈值。",
    "Review changes": "检查变更",
    "Placement preview": "调度预览",
    "Evaluate resource selectors against current clusters and show the resulting replica distribution before applying.": "根据当前集群评估资源选择器，并在应用前展示最终副本分布。",
    "Run preview": "运行预览",
    "Validate policy": "校验策略",
    "Check selectors, cluster affinity, replica strategy, dependencies, and override conflicts.": "检查选择器、集群亲和性、副本策略、依赖项和覆盖冲突。",
    "Validate": "校验",
    "Suspend policy": "暂停策略",
    "Pause future propagation while preserving current member-cluster objects.": "暂停后续分发，同时保留成员集群中的现有对象。",
    "Review suspension": "检查暂停影响",
    "Override preview": "覆盖预览",
    "Render the manifest before and after every JSON patch for each target cluster.": "展示每个目标集群应用各项 JSON Patch 前后的清单。",
    "Generate preview": "生成预览",
    "Resolve override conflict": "解决覆盖冲突",
    "Compare competing rule priority and choose the effective operation for the target path.": "比较冲突规则的优先级，并选择目标路径的有效操作。",
    "Open resolver": "打开冲突解析器",
    "Scheduling trace": "调度追踪",
    "Inspect candidate clusters, affinity scoring, taints, replica assignment, and the final binding decision.": "检查候选集群、亲和性评分、污点、副本分配和最终绑定决策。",
    "Open trace": "打开追踪",
    "Related policy": "关联策略",
    "Open the policy that produced this binding and review its current placement intent.": "打开生成此 Binding 的策略并检查当前调度意图。",
    "Reschedule resource": "重新调度资源",
    "Re-evaluate this binding against current cluster health and policy constraints.": "根据当前集群健康状态和策略约束重新评估此 Binding。",
    "Preview reschedule": "预览重新调度",
    "Work manifests": "Work 清单",
    "Inspect the exact manifests delivered to the selected member cluster and their apply result.": "检查分发到所选成员集群的实际清单及其应用结果。",
    "Retry Work apply": "重试应用 Work",
    "Queue failed manifests for reconciliation without changing their desired content.": "将失败清单重新加入协调队列，不修改期望内容。",
    "Resource logs": "资源日志",
    "Choose member cluster, Pod, container, time range, and follow mode for the log stream.": "选择成员集群、Pod、容器、时间范围和日志跟随模式。",
    "Open log viewer": "打开日志查看器",
    "Resource terminal": "资源终端",
    "Choose member cluster, Pod, container, and shell for an audited terminal session.": "选择成员集群、Pod、容器和 Shell，开启受审计的终端会话。",
    "Review owning workload and disruption impact before recreating this propagated Pod.": "重新创建此分发 Pod 前，检查所属工作负载和中断影响。",
    "Review deletion": "检查删除影响",
    "Set desired replicas per member cluster and preview availability before applying.": "设置各成员集群的期望副本数，并在应用前预览可用性。",
    "Trigger a rolling restart across placements while respecting availability budgets.": "在遵守可用性预算的前提下，对所有调度位置执行滚动重启。",
    "Review restart": "检查重启影响",
    "Compare desired, updated, ready, and unavailable replicas in every member cluster.": "比较各成员集群中的期望、已更新、就绪和不可用副本数。",
    "Open rollout": "打开发布状态",
    "StatefulSet update partition": "StatefulSet 更新分区",
    "Choose which ordinal range receives the next template revision.": "选择接收下一模板版本的序号范围。",
    "Review partition": "检查更新分区",
    "DaemonSet node coverage": "DaemonSet 节点覆盖情况",
    "Compare desired and available Pods against eligible nodes in every member cluster.": "按各成员集群的合格节点比较期望和可用 Pod。",
    "Open coverage": "打开覆盖详情",
    "Run Job again": "再次运行 Job",
    "Create a new Job from the selected spec with a unique execution name.": "根据所选 Spec 创建具有唯一执行名称的新 Job。",
    "Review run": "检查运行配置",
    "Review Pods, logs, and retention policy before removing this Job.": "移除此 Job 前，检查 Pod、日志和保留策略。",
    "Create a one-off Job from the current CronJob template and placement policy.": "根据当前 CronJob 模板和调度策略创建一次性 Job。",
    "Pause future CronJob schedules across all placements; existing Jobs remain unchanged.": "暂停所有调度位置的后续 CronJob 计划，现有 Job 保持不变。",
    "Compare recent executions, completion time, failures, and retained logs by member cluster.": "按成员集群比较近期执行、完成时间、失败情况和保留日志。",
    "Open history": "打开历史"
  });

  Object.assign(zhCopy, {
    "Choose a member-cluster endpoint, remote port, and local browser-session port.": "选择成员集群端点、远程端口和当前浏览器会话的本地端口。",
    "Configure forward": "配置端口转发",
    "Endpoint inventory": "端点清单",
    "Inspect ready and not-ready endpoints grouped by member cluster and zone.": "按成员集群和可用区检查就绪与未就绪端点。",
    "Open endpoints": "打开端点",
    "Select consumer clusters and publish this Service through multi-cluster discovery.": "选择消费集群，并通过多集群服务发现发布此 Service。",
    "Review export": "检查导出配置",
    "Test ingress route": "测试 Ingress 路由",
    "Send a synthetic request from each member cluster and compare status, latency, and TLS result.": "从各成员集群发送模拟请求，并比较状态、延迟和 TLS 结果。",
    "Run route test": "运行路由测试",
    "Inspect certificate issuer, SANs, expiry, and secret synchronization by cluster.": "按集群检查证书签发者、SAN、过期时间和 Secret 同步状态。",
    "Inspect TLS": "检查 TLS",
    "Ingress backends": "Ingress 后端",
    "Open the referenced Services and endpoint health behind every ingress rule.": "打开每条 Ingress 规则引用的 Service 及其端点健康状态。",
    "Open backends": "打开后端",
    "Network policy graph": "网络策略图",
    "Visualize selected Pods and allowed ingress or egress paths across namespaces.": "可视化所选 Pod 以及跨命名空间允许的入站或出站路径。",
    "Open graph": "打开图谱",
    "Traffic audit": "流量审计",
    "Compare observed traffic with declared policy rules and flag unexpected flows.": "将观测流量与已声明策略规则比较，并标记异常流量。",
    "Policy simulation": "策略模拟",
    "Simulate a source, destination, protocol, and port without changing enforcement.": "模拟来源、目标、协议和端口，不修改实际执行策略。",
    "Open simulator": "打开模拟器",
    "Multi-cluster service map": "多集群服务映射",
    "Service map": "服务映射",
    "Trace exported Services, aggregated endpoints, and consuming clusters.": "追踪已导出的 Service、聚合端点和消费集群。",
    "Open service map": "打开服务映射",
    "Refresh discovery": "刷新服务发现",
    "Reconcile ServiceImports and endpoint slices from all participating clusters.": "协调所有参与集群的 ServiceImport 和 EndpointSlice。",
    "Revoke ServiceExport": "撤销 ServiceExport",
    "Revoke export": "撤销服务导出",
    "Review consumer impact before removing this service from multi-cluster discovery.": "从多集群服务发现中移除此服务前，检查对消费方的影响。",
    "Review revoke": "检查撤销影响",
    "Compare ConfigMap": "比较 ConfigMap",
    "Diff keys and values across propagated member-cluster copies.": "比较已分发成员集群副本之间的键和值。",
    "Open comparison": "打开比较",
    "Resource references": "资源引用",
    "List workloads, volumes, and controllers that currently reference this object.": "列出当前引用此对象的工作负载、存储卷和控制器。",
    "View references": "查看引用",
    "Download ConfigMap data": "下载 ConfigMap 数据",
    "Export non-sensitive keys as YAML or a directory archive.": "将非敏感数据键导出为 YAML 或目录归档。",
    "Choose format": "选择格式",
    "Rotate Secret": "轮换 Secret",
    "Create a new revision and preview which workloads require restart.": "创建新版本并预览需要重启的工作负载。",
    "Review rotation": "检查轮换影响",
    "Inspect Secret keys": "检查 Secret 数据键",
    "Show key names and checksums only; secret values remain masked.": "仅显示键名和校验和，Secret 值保持遮罩。",
    "Inspect metadata": "检查元数据",
    "Autoscaler metrics": "自动伸缩器指标",
    "Compare current and target metrics with replica recommendations by cluster.": "按集群比较当前指标、目标指标和副本建议。",
    "Open metrics": "打开指标",
    "Edit scaling bounds": "编辑伸缩边界",
    "Review minimum, maximum, stabilization, and scaling policies.": "检查最小值、最大值、稳定窗口和伸缩策略。",
    "Review bounds": "检查伸缩边界",
    "Disruption impact": "中断影响",
    "Calculate currently allowed disruptions and workloads blocked by this budget.": "计算当前允许的中断数和被此预算阻止的工作负载。",
    "Analyze impact": "分析影响",
    "Simulate node drain": "模拟节点驱逐",
    "Evaluate this budget against Pods selected on a candidate node.": "针对候选节点上的所选 Pod 评估此预算。",
    "Run simulation": "运行模拟",
    "Edit disruption budget": "编辑中断预算",
    "Update minAvailable or maxUnavailable and preview availability impact.": "更新 minAvailable 或 maxUnavailable，并预览可用性影响。",
    "Review budget": "检查预算",
    "Expand volume claim": "扩容存储声明",
    "Choose a larger requested capacity and validate StorageClass expansion support.": "选择更大的请求容量，并校验 StorageClass 是否支持扩容。",
    "List workloads and Pods mounting this claim in every member cluster.": "列出各成员集群中挂载此声明的工作负载和 Pod。",
    "Open consumers": "打开使用方",
    "Inspect provisioning, binding, mount, resize, and reclaim events.": "检查供应、绑定、挂载、扩容和回收事件。",
    "Open events": "打开事件",
    "Bound claim": "已绑定声明",
    "Open the PersistentVolumeClaim currently bound to this volume.": "打开当前绑定到此卷的 PersistentVolumeClaim。",
    "Review Retain or Delete behavior and data-loss impact.": "检查 Retain 或 Delete 行为以及数据丢失影响。",
    "Review policy": "检查策略",
    "Inspect CSI controller health, supported capabilities, and recent errors.": "检查 CSI 控制器健康状态、支持的能力和近期错误。",
    "Open provisioner": "打开供应器",
    "Set default StorageClass": "设置默认 StorageClass",
    "Review affected claims before changing the federation default.": "更改联邦默认值前，检查受影响的声明。",
    "Review change": "检查变更",
    "Create a temporary claim in a selected member cluster and verify bind latency.": "在所选成员集群中创建临时声明并验证绑定延迟。",
    "Run test": "运行测试"
  });

  Object.assign(zhCopy, {
    "Review token Secrets, projected tokens, expiry, and recent authentication.": "检查 Token Secret、投射 Token、过期时间和近期认证。",
    "Open audit": "打开审计",
    "Resolve roles and bindings into the effective verbs granted to this subject.": "解析角色和绑定，得到授予此主体的有效操作。",
    "Calculate access": "计算权限",
    "Disable token automount": "停用 Token 自动挂载",
    "Preview workloads that rely on the default ServiceAccount token.": "预览依赖默认 ServiceAccount Token 的工作负载。",
    "Find subjects that can perform selected verbs on this resource scope.": "查找可在此资源范围内执行所选操作的主体。",
    "Run query": "运行查询",
    "Duplicate role": "复制角色",
    "Create a namespaced copy and review rule scope before saving.": "创建命名空间范围的副本，并在保存前检查规则范围。",
    "Open copy": "打开副本",
    "Manage binding subjects": "管理绑定主体",
    "Add or remove users, groups, and ServiceAccounts with an access preview.": "添加或移除用户、用户组和 ServiceAccount，并预览权限。",
    "Review subjects": "检查主体",
    "Namespace inventory": "命名空间资源清单",
    "Summarize workloads, config, storage, policies, and placement for this namespace.": "汇总此命名空间的工作负载、配置、存储、策略和调度位置。",
    "Open inventory": "打开资源清单",
    "Edit namespace labels": "编辑命名空间标签",
    "Update organization and policy-selection labels with an impact preview.": "更新组织和策略选择标签，并预览影响。",
    "Review labels": "检查标签",
    "Review aggregate requests, limits, object counts, and quota headroom.": "检查聚合请求、限制、对象数量和配额余量。",
    "Open quota": "打开配额",
    "Related object": "关联对象",
    "Open the object referenced by this event in its resource workspace.": "在资源工作区中打开此事件引用的对象。",
    "Open object": "打开对象",
    "Acknowledge event": "确认事件",
    "Record this warning as reviewed without removing it from event history.": "将此警告标记为已检查，不从事件历史中移除。",
    "Acknowledge": "确认",
    "Live event stream": "实时事件流",
    "Follow control-plane and member-cluster events with severity filters.": "使用严重程度筛选器跟踪控制面和成员集群事件。",
    "Open stream": "打开事件流",
    "Custom resource instances": "自定义资源实例",
    "List all objects served by this definition across namespaces.": "列出此定义在所有命名空间中提供的对象。",
    "Inspect served, storage, deprecated, and conversion status for every version.": "检查各版本的 Served、Storage、Deprecated 和转换状态。",
    "Open versions": "打开版本",
    "Conversion configuration": "转换配置",
    "Inspect webhook service, CA bundle state, and conversion review versions.": "检查 Webhook 服务、CA Bundle 状态和转换审查版本。",
    "Open conversion": "打开转换配置",
    "Choose one of the target member clusters before opening its resource workspace.": "打开资源工作区前，请选择一个目标成员集群。",
    "Choose cluster": "选择集群"
  });

  const zhCopyLookup = new Map(Object.entries(zhCopy).map(([key, translated]) => [key.toLocaleLowerCase("en"), translated]));

  const navItems = [
    ["MultiCluster", [
      ["overview", "index.html", "Overview"],
      ["topology", "topology.html", "Global topology"],
      ["clusters", "clusters.html", "Cluster management"],
      ["metrics", "metrics.html", "Metrics visualization"],
      ["policies", "policies.html", "Policies"]
    ]],
    ["Resource management", [
      ["resources", "resources.html", "Resources"]
    ]],
    ["System", [
      ["settings", "settings.html", "Configuration"]
    ]]
  ];

  const settingsSections = [
    ["karmada", "Karmada config"],
    ["dashboard", "Dashboard config"],
    ["registry", "Registry"],
    ["helm", "Helm configuration"],
    ["upgrade", "Upgrade"],
    ["failover", "Failover policies"],
    ["reschedule", "Rescheduling"],
    ["permissions", "Component permissions"],
    ["addons", "Add-ons"]
  ];

  function activeSettingsSection() {
    const requested = location.hash.replace(/^#/, "");
    return settingsSections.some(([id]) => id === requested) ? requested : "karmada";
  }

  function settingsHeaderPresentation(section = activeSettingsSection()) {
    const presentations = {
      karmada: {
        breadcrumb: "System / Karmada config",
        contextLabel: "Runtime source",
        contextValue: "Component arguments",
        description: "Tune official controller-manager and scheduler flags, then apply changes through a controlled rolling restart.",
        eyebrow: "CONTROL PLANE CONFIGURATION",
        icon: "clusters",
        title: "Karmada control plane"
      },
      dashboard: {
        breadcrumb: "System / Dashboard config",
        contextLabel: "Configuration source",
        contextValue: "prod.yaml",
        description: "Configure Dashboard navigation, metric panels, registries, routes, and runtime defaults from one ConfigMap.",
        eyebrow: "DASHBOARD CONFIGURATION",
        icon: "overview",
        title: "Dashboard configuration"
      },
      registry: {
        breadcrumb: "System / Registry",
        contextLabel: "Registry rules",
        contextValue: "2 configured",
        description: "Manage multiple image registries with registry-specific mirrors, credentials, security, and pull behavior.",
        eyebrow: "IMAGE DISTRIBUTION",
        icon: "resources",
        title: "Image registries"
      },
      helm: {
        breadcrumb: "System / Helm configuration",
        contextLabel: "Release manager",
        contextValue: "Helm v3",
        description: "Manage chart repositories and the default Helm release behavior used for Karmada lifecycle operations.",
        eyebrow: "PACKAGE MANAGEMENT",
        icon: "configuration",
        title: "Helm configuration"
      },
      upgrade: {
        breadcrumb: "System / Upgrade",
        contextLabel: "Upgrade method",
        contextValue: "Helm · v1.15.2",
        description: "Upgrade the Karmada CRD bundle and control-plane components with the workflow supported by the detected installation method.",
        eyebrow: "RELEASE MANAGEMENT",
        icon: "states",
        title: "Control plane upgrade"
      },
      failover: {
        breadcrumb: "System / Failover",
        contextLabel: "Configuration scope",
        contextValue: "PropagationPolicy",
        description: "Configure official application and cluster failover fields used by PropagationPolicy and ClusterPropagationPolicy resources.",
        eyebrow: "CLUSTER RECOVERY",
        icon: "topology",
        title: "Failover policies"
      },
      reschedule: {
        breadcrumb: "System / Reschedule",
        contextLabel: "Operation target",
        contextValue: "ResourceBinding",
        description: "Trigger a fresh scheduling calculation for an existing binding using its rescheduleTriggeredAt field.",
        eyebrow: "PLACEMENT RECOVERY",
        icon: "workloads",
        title: "Binding rescheduling"
      },
      permissions: {
        breadcrumb: "System / Permissions",
        contextLabel: "Authorization source",
        contextValue: "Kubernetes RBAC",
        description: "Audit Karmada component permissions and manage human access through standard Roles, ClusterRoles, and bindings.",
        eyebrow: "IDENTITY AND ACCESS",
        icon: "policies",
        title: "Component permissions"
      },
      addons: {
        breadcrumb: "System / Add-ons",
        contextLabel: "Supported add-ons",
        contextValue: "4 official components",
        description: "Install, configure, and monitor optional Karmada components across the host and member clusters.",
        eyebrow: "ADD-ON MANAGEMENT",
        icon: "resources",
        title: "Karmada add-ons"
      }
    };
    return presentations[section] || presentations.karmada;
  }

  function getTheme() {
    return localStorage.getItem("karmada-theme") || (prefersDark.matches ? "dark" : "light");
  }

  function getLanguage() {
    return localStorage.getItem("karmada-language") || "en";
  }

  function currentPageMeta() {
    if (page === "create") return [isMemberScope ? `Member Clusters / ${D.member.name} / Create` : "Resource management / Create resource", "Create resource", isMemberScope ? `Create a Kubernetes object directly in ${D.member.name}.` : "Create Kubernetes resources and Karmada policies from one validated workspace."];
    if (page === "settings") {
      const presentation = settingsHeaderPresentation();
      return [presentation.breadcrumb, presentation.title, presentation.description];
    }
    if (page !== "member") return pageMeta[page];
    return [`Member Clusters / ${D.member.name}`, D.member.name, `A ${D.member.status.toLowerCase()} ${D.member.syncMode.toLowerCase()}-mode Kubernetes member cluster connected to this Karmada control plane.`];
  }

  function translateText(value) {
    const trimmed = value.trim();
    if (!trimmed) return value;
    const lookupZh = (candidate) => zhCopy[candidate] || zhCopyLookup.get(String(candidate).toLocaleLowerCase("en"));
    const timeUnit = { second: "秒", seconds: "秒", minute: "分钟", minutes: "分钟", hour: "小时", hours: "小时", day: "天", days: "天" };
    const formatActionTarget = (prefix, target) => {
      const sentenceCase = target ? `${target[0].toUpperCase()}${target.slice(1)}` : target;
      const translatedTarget = lookupZh(target) || lookupZh(sentenceCase) || target;
      const spacer = /[\u3400-\u9fff]/.test(translatedTarget) ? "" : " ";
      return `${prefix}${spacer}${translatedTarget}`;
    };
    const dynamicRules = [
      [/^(\d+) workloads? currently sampled$/i, (_, count) => `当前已采样 ${count} 个工作负载`],
      [/^(\d+) ready endpoints?$/i, (_, count) => `${count} 个端点就绪`],
      [/^(\d+) rules?$/i, (_, count) => `${count} 条规则`],
      [/^(\d+) panels?$/i, (_, count) => `${count} 个面板`],
      [/^(\d+) roots?$/i, (_, count) => `${count} 个根节点`],
      [/^(\d+) enabled$/i, (_, count) => `已启用 ${count} 项`],
      [/^Version (.+) · (\d+) panels?$/i, (_, version, count) => `版本 ${version} · ${count} 个面板`],
      [/^(\d+) bindings?$/i, (_, count) => `${count} 个 Binding`],
      [/^(\d+) allowed capabilities$/i, (_, count) => `${count} 项允许的能力`],
      [/^(.+) · (\d+\/\d+) replicas$/i, (_, target, replicas) => `${target} · ${replicas} 个副本`],
      [/^(\d+) selected$/i, (_, count) => `已选择 ${count} 个`],
      [/^(\d+) targets?$/i, (_, count) => `${count} 个目标`],
      [/^(.+) · (\d+) clusters?$/i, (_, prefix, count) => `${prefix} · ${count} 个集群`],
      [/^Assigned to (.+)$/i, (_, target) => `已分配到 ${target}`],
      [/^Control Plane \/ (federation|workloads|network|configuration|storage|access|cluster)$/i, (_, group) => `控制面 / ${{ federation: "联邦", workloads: "工作负载", network: "网络与发现", configuration: "配置", storage: "存储", access: "访问控制", cluster: "集群资源" }[group.toLowerCase()]}`],
      [/^Resource management \/ (.+)$/i, (_, target) => `资源管理 / ${lookupZh(target) || target}`],
      [/^(.+) reconciliation is (.+)$/i, (_, kind, state) => `${kind} 协调状态：${lookupZh(state) || state}`],
      [/^Resource scheduled to (\d+) member clusters?$/i, (_, count) => `资源已调度到 ${count} 个成员集群`],
      [/^CronJob is suspended in (.+)$/i, (_, cluster) => `${cluster} 中的 CronJob 已暂停`],
      [/^(\d+) active warnings?$/i, (_, count) => `${count} 条活动警告`],
      [/^(Token audit|Effective access) · (.+)$/i, (_, action, target) => `${lookupZh(action) || action} · ${target}`],
      [/^(\d+) secrets? · (\d+) projected$/i, (_, secrets, projected) => `${secrets} 个 Secret · ${projected} 个投射 Token`],
      [/^Resolved permissions for (.+)\.$/i, (_, subject) => `${subject} 的已解析权限。`],
      [/^(.+): 1 long-lived token requires review\.$/i, (_, subject) => `${subject}：有 1 个长期 Token 需要检查。`],
      [/^RBAC bindings for (.+) are current\.$/i, (_, subject) => `${subject} 的 RBAC 绑定为最新状态。`],
      [/^(Disable|Enable) token automount for (.+)\?$/i, (_, action, target) => `${action.toLowerCase() === "disable" ? "停用" : "启用"} ${target} 的 Token 自动挂载？`],
      [/^(\d+) active workloads?$/i, (_, count) => `${count} 个活动工作负载`],
      [/^Token automount (disabled|enabled)$/i, (_, state) => `Token 自动挂载已${state.toLowerCase() === "enabled" ? "启用" : "停用"}`],
      [/^(.+) now reports (Enabled|Disabled)\.$/i, (_, subject, state) => `${subject} 当前状态为${lookupZh(state) || state}。`],
      [/^Stop scheduling new workloads on (.+)\. Existing Pods continue running\.$/i, (_, node) => `停止向 ${node} 调度新工作负载；现有 Pod 会继续运行。`],
      [/^Allow the scheduler to place new workloads on (.+) again\.$/i, (_, node) => `允许调度器再次将新工作负载放置到 ${node}。`],
      [/^Remove (.+) from (.+)\? Workloads previously blocked by this taint may become schedulable\.$/i, (_, taint, node) => `从 ${node} 移除 ${taint}？此前被此污点阻止的工作负载可能变为可调度。`],
      [/^(.+) was removed from (.+)\.$/i, (_, taint, node) => `已从 ${node} 移除 ${taint}。`],
      [/^Restart (.+) with a rolling update while preserving the configured availability budget\.$/i, (_, target) => `在保留已配置可用性预算的情况下，滚动重启 ${target}。`],
      [/^Create a one-off Job from the current (.+) template\.$/i, (_, target) => `根据当前 ${target} 模板创建一次性 Job。`],
      [/^This operation is available in the (.+) workspace\. Review the target before applying\.$/i, (_, kind) => `此操作可在 ${kind} 工作区中使用；应用前请检查目标。`],
      [/^([A-Za-z][A-Za-z ]+) applied$/i, (_, action) => `${lookupZh(action) || action}已应用`],
      [/^([A-Za-z][A-Za-z ]+) ready$/i, (_, action) => `${lookupZh(action) || action}已就绪`],
      [/^(.+) was updated in the (.+) prototype\.$/i, (_, target, kind) => `${kind} 原型中的 ${target} 已更新。`],
      [/^(.+) is current in (.+)\.$/i, (_, target, member) => `${target} 在 ${member} 中为最新状态。`],
      [/^Expansion is supported by storage class (.+)\.$/i, (_, storageClass) => `存储类 ${storageClass} 支持扩容。`],
      [/^(.+) installed successfully$/i, (_, target) => `${target} 安装成功`],
      [/^Every (\d+) seconds?$/i, (_, count) => `每 ${count} 秒`],
      [/^Last (\d+) minutes?$/i, (_, count) => `最近 ${count} 分钟`],
      [/^Last (\d+) hours?$/i, (_, count) => `最近 ${count} 小时`],
      [/^(.+) used$/i, (_, value) => `已使用 ${value}`],
      [/^(.+) allocatable$/i, (_, value) => `可分配 ${value}`],
      [/^(\d+(?:\.\d+)?)% of capacity$/i, (_, value) => `占容量的 ${value}%`],
      [/^(\d+(?:\.\d+)?)% currently in use$/i, (_, value) => `当前使用率 ${value}%`],
      [/^Usage (.+) · Request (.+) · Limit (.+)$/i, (_, usage, request, limit) => `使用量 ${usage} · 请求 ${request} · 限制 ${limit}`],
      [/^Usage (.+) · Request (.+) · Allocatable (.+)$/i, (_, usage, request, allocatable) => `使用量 ${usage} · 请求 ${request} · 可分配 ${allocatable}`],
      [/^(.+) · Container image (.+) already present on machine$/i, (_, object, image) => `${object} · 容器镜像 ${image} 已存在于节点`],
      [/^(.+) · Readiness probe failed once and recovered$/i, (_, object) => `${object} · 就绪探针曾失败一次，现已恢复`],
      [/^Allow insecure connection for (.+)$/i, (_, target) => `允许 ${target} 使用不安全连接`],
      [/^Skip TLS verification for (.+)$/i, (_, target) => `为 ${target} 跳过 TLS 校验`],
      [/^Remove Helm repository (\d+)$/i, (_, index) => `移除 Helm 仓库 ${index}`],
      [/^Remove registry (\d+)$/i, (_, index) => `移除镜像仓库 ${index}`],
      [/^Enable (\/.+|config|namespace|service|workload)$/i, (_, target) => `启用 ${target}`],
      [/^Expand (\/.+|config|namespace|service|workload)$/i, (_, target) => `展开 ${target}`],
      [/^Collapse (\/.+|config|namespace|service|workload)$/i, (_, target) => `收起 ${target}`],
      [/^Reorder (\/.+|config|namespace|service|workload)$/i, (_, target) => `调整 ${target} 顺序`],
      [/^(.+) · host cluster$/i, (_, target) => `${target} · 宿主集群`],
      [/^(\d+) results?$/i, (_, count) => `${count} 条结果`],
      [/^(\d+) objects?$/i, (_, count) => `${count} 个对象`],
      [/^(\d+) namespaces?$/i, (_, count) => `${count} 个命名空间`],
      [/^(\d+) member clusters?$/i, (_, count) => `${count} 个成员集群`],
      [/^(\d+) clusters?$/i, (_, count) => `${count} 个集群`],
      [/^(\d+) resources?$/i, (_, count) => `${count} 个资源`],
      [/^(\d+) bindings?$/i, (_, count) => `${count} 个 Binding`],
      [/^(\d+) templates?$/i, (_, count) => `${count} 个模板`],
      [/^(\d+) nodes?$/i, (_, count) => `${count} 个节点`],
      [/^(\d+) routes?$/i, (_, count) => `${count} 条路由`],
      [/^(\d+) endpoints?$/i, (_, count) => `${count} 个端点`],
      [/^(\d+) registries?$/i, (_, count) => `${count} 个镜像仓库`],
      [/^(\d+) repositories?$/i, (_, count) => `${count} 个仓库`],
      [/^(\d+) revisions?$/i, (_, count) => `${count} 个版本`],
      [/^(\d+) identities?$/i, (_, count) => `${count} 个身份`],
      [/^(\d+) warnings?$/i, (_, count) => `${count} 条警告`],
      [/^(\d+) restarts?$/i, (_, count) => `${count} 次重启`],
      [/^(\d+) matched$/i, (_, count) => `已匹配 ${count} 个`],
      [/^(\d+) configured$/i, (_, count) => `已配置 ${count} 项`],
      [/^(\d+) deployed$/i, (_, count) => `已部署 ${count} 个`],
      [/^(\d+) ready$/i, (_, count) => `${count} 个就绪`],
      [/^(\d+) running$/i, (_, count) => `${count} 个运行中`],
      [/^(\d+) Works?$/i, (_, count) => `${count} 个 Work`],
      [/^(\d+) workloads? · (\d+) member clusters?$/i, (_, workloads, clusters) => `${workloads} 个工作负载 · ${clusters} 个成员集群`],
      [/^(\d+) Pods?$/i, (_, count) => `${count} 个 Pod`],
      [/^(\d+) recent events?$/i, (_, count) => `${count} 条近期事件`],
      [/^(\d+) signals?$/i, (_, count) => `${count} 条信号`],
      [/^(\d+) components? installed$/i, (_, count) => `已安装 ${count} 个组件`],
      [/^(\d+) official components?$/i, (_, count) => `${count} 个官方组件`],
      [/^(\d+) estimator targets?$/i, (_, count) => `${count} 个 Estimator 目标`],
      [/^(\d+) in progress$/i, (_, count) => `${count} 项进行中`],
      [/^(\d+) applied · (\d+) needs review$/i, (_, applied, review) => `${applied} 个已应用 · ${review} 个需检查`],
      [/^(\d+) ready · (\d+) schedulable$/i, (_, ready, schedulable) => `${ready} 个就绪 · ${schedulable} 个可调度`],
      [/^(\d+) running · (\d+) restarts?$/i, (_, running, restarts) => `${running} 个运行中 · ${restarts} 次重启`],
      [/^(\d+) warnings? needs? review$/i, (_, count) => `${count} 条警告需要检查`],
      [/^(\d+) \/ (\d+) READY$/i, (_, ready, total) => `${ready} / ${total} 就绪`],
      [/^(\d+)% allocated$/i, (_, count) => `已分配 ${count}%`],
      [/^(\d+)s resolution$/i, (_, count) => `${count} 秒分辨率`],
      [/^(\d+) panels? · current saturation$/i, (_, count) => `${count} 个面板 · 当前饱和度`],
      [/^(\d+) panels? · bucket distribution$/i, (_, count) => `${count} 个面板 · 桶分布`],
      [/^(\d+) panels? · client quantiles$/i, (_, count) => `${count} 个面板 · 客户端分位数`],
      [/^(\d+) panels? · rate and increase$/i, (_, count) => `${count} 个面板 · 速率与增量`],
      [/^(\d+) of (\d+)$/i, (_, shown, total) => `${shown} / ${total}`],
      [/^Showing (\d+) of (\d+)$/i, (_, shown, total) => `显示 ${shown} / ${total}`],
      [/^Latest · (.+)$/i, (_, time) => `最新 · ${translateText(time)}`],
      [/^Updated (.+)$/i, (_, time) => `更新于 ${translateText(time)}`],
      [/^LAST SYNC (.+) · (.+) AGO$/i, (_, stamp, time) => `上次同步 ${stamp} · ${translateText(`${time.toLowerCase()} ago`)}`],
      [/^Last sync (.+)$/i, (_, time) => `上次同步：${translateText(time)}`],
      [/^Last scheduled (.+)$/i, (_, time) => `上次调度：${translateText(time)}`],
      [/^Last sample (.+)$/i, (_, time) => `最新样本：${translateText(time)}`],
      [/^Lease renewed (.+)$/i, (_, time) => `Lease 续期于 ${translateText(time)}`],
      [/^Latest sample is (.+) old$/i, (_, time) => `最新样本采集于 ${translateText(time)}前`],
      [/^Observed from (.+) · (.+)$/i, (_, source, time) => `观测来源：${source} · ${translateText(time)}`],
      [/^cpu usage (.+)$/i, (_, value) => `CPU 使用量 ${value}`],
      [/^memory usage (.+)$/i, (_, value) => `内存使用量 ${value}`],
      [/^SYNC (.+) AGO$/i, (_, time) => `同步于 ${translateText(`${time.toLowerCase()} ago`)}`],
      [/^(Push|Pull) mode · (.+)$/i, (_, mode, time) => `${mode} 模式 · ${translateText(time)}`],
      [/^(Push|Pull) · (.+)$/i, (_, mode, time) => `${mode} · ${translateText(time)}`],
      [/^Namespace (.+)$/i, (_, namespace) => `命名空间 ${namespace}`],
      [/^Actions for (.+)$/i, (_, target) => `${target} 的操作`],
      [/^Resize (.+) column$/i, (_, target) => `调整${lookupZh(target) || target}列宽`],
      [/^Run cluster health check · (.+)$/, (_, target) => `运行集群健康检查 · ${target}`],
      [/^Create (.+)$/, (_, target) => formatActionTarget("创建", target)],
      [/^Edit (.+)$/, (_, target) => formatActionTarget("编辑", target)],
      [/^Delete (.+)$/, (_, target) => formatActionTarget("删除", target)],
      [/^Install (.+)\?$/, (_, target) => `${formatActionTarget("安装", target)}？`],
      [/^Uninstall (.+)\?$/, (_, target) => `${formatActionTarget("卸载", target)}？`],
      [/^Search (.+)$/, (_, target) => formatActionTarget("搜索", target)],
      [/^View ([^.!?]{1,48})$/, (_, target) => formatActionTarget("查看", target)],
      [/^Open ([^.!?]{1,48})$/, (_, target) => formatActionTarget("打开", target)],
      [/^Review ([^.!?]{1,48})$/, (_, target) => formatActionTarget("检查", target)],
      [/^Run ([^.!?]{1,48})$/, (_, target) => formatActionTarget("运行", target)],
      [/^Test ([^.!?]{1,48})$/, (_, target) => formatActionTarget("测试", target)],
      [/^(\d+)m (\d+)s ago$/i, (_, minutes, seconds) => `${minutes} 分 ${seconds} 秒前`],
      [/^(\d+) (second|seconds|minute|minutes|hour|hours|day|days) ago$/i, (_, count, unit) => `${count} ${timeUnit[unit.toLowerCase()]}前`],
      [/^(\d+)(s|m|h|d) ago$/i, (_, count, unit) => `${count}${({ s: "秒", m: "分钟", h: "小时", d: "天" })[unit.toLowerCase()]}前`],
      [/^(.+) · (.+)$/i, (_, prefix, target) => {
        const translatedPrefix = lookupZh(prefix);
        const translatedTarget = lookupZh(target);
        return translatedPrefix || translatedTarget ? `${translatedPrefix || prefix} · ${translatedTarget || target}` : trimmed;
      }]
    ];
    const exact = zhCopy[trimmed];
    const dynamic = exact ? null : dynamicRules.find(([pattern]) => pattern.test(trimmed));
    const structuredLabel = trimmed.length <= 80 && !/[.!?。！？]/.test(trimmed);
    const translated = exact || (dynamic ? trimmed.replace(dynamic[0], dynamic[1]) : structuredLabel ? trimmed
      .replace(/Control Plane/g, "控制面")
      .replace(/Federation/g, "联邦")
      .replace(/Resource management/g, "资源管理")
      .replace(/Member Clusters?/g, "成员集群")
      .replace(/member clusters?/g, "成员集群")
      .replace(/Host cluster/g, "宿主集群") : trimmed);
    return translated === trimmed ? value : value.replace(trimmed, translated);
  }

  const i18nIgnoredSelector = "script, style, pre, code, kbd, textarea, svg, [contenteditable='true'], [data-i18n-ignore]";

  function shouldTranslateNode(node) {
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return parent instanceof Element && !parent.closest(i18nIgnoredSelector);
  }

  function translateAttributes(element) {
    if (!(element instanceof Element) || element.closest(i18nIgnoredSelector)) return;
    ["placeholder", "aria-label", "title", "data-tooltip"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const translated = translateText(value);
      if (translated !== value) element.setAttribute(attribute, translated);
    });
  }

  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      if (!shouldTranslateNode(root)) return;
      const translated = translateText(root.nodeValue || "");
      if (translated !== root.nodeValue) root.nodeValue = translated;
      return;
    }
    if (!(root instanceof Element) || root.matches(i18nIgnoredSelector)) return;
    translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      if (!shouldTranslateNode(node)) return;
      const translated = translateText(node.nodeValue || "");
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
    root.querySelectorAll("[placeholder], [aria-label], [title], [data-tooltip]").forEach(translateAttributes);
  }

  function applyLanguage(root = pageRoot) {
    const language = getLanguage();
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    document.querySelectorAll("[data-language-choice]").forEach((button) => {
      button.classList.toggle("active", button.dataset.languageChoice === language);
      button.setAttribute("aria-pressed", String(button.dataset.languageChoice === language));
    });
    if (language !== "zh" || !root) return;
    translateTree(root);
  }

  function installLanguageObserver() {
    if (getLanguage() !== "zh" || !document.body || document.body.dataset.i18nObserver === "ready") return;
    document.body.dataset.i18nObserver = "ready";
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") translateTree(mutation.target);
        mutation.addedNodes.forEach(translateTree);
      });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  window.KD_I18N = {
    apply: applyLanguage,
    getLanguage,
    t: (value) => getLanguage() === "zh" ? translateText(value) : value
  };

  function applyTheme(theme, animate = false) {
    if (animate) {
      document.documentElement.classList.remove("theme-changing");
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add("theme-changing");
      window.setTimeout(() => document.documentElement.classList.remove("theme-changing"), 280);
    }
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.classList.toggle("active", button.dataset.themeChoice === theme);
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
    });
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const isDark = theme === "dark";
      const isZh = getLanguage() === "zh";
      const label = isDark ? (isZh ? "切换至亮色主题" : "Switch to light theme") : (isZh ? "切换至暗色主题" : "Switch to dark theme");
      button.innerHTML = isDark ? moonIcon() : sunIcon();
      button.setAttribute("aria-label", label);
      button.dataset.tooltip = label;
      button.setAttribute("aria-pressed", String(isDark));
      if (button.getAttribute("aria-describedby") === "app-tooltip") {
        const tooltip = document.getElementById("app-tooltip");
        if (tooltip) tooltip.textContent = label;
      }
    });
  }

  function themeSwitch() {
    const isDark = getTheme() === "dark";
    const isZh = getLanguage() === "zh";
    const label = isDark ? (isZh ? "切换至亮色主题" : "Switch to light theme") : (isZh ? "切换至暗色主题" : "Switch to dark theme");
    return `<button class="utility-icon theme-toggle" type="button" data-theme-toggle data-tooltip="${label}" aria-label="${label}" aria-pressed="${isDark}">${isDark ? moonIcon() : sunIcon()}</button>`;
  }

  function languageSwitch() {
    const isZh = getLanguage() === "zh";
    const label = isZh ? "Switch to English" : "切换至中文";
    return `<button class="utility-icon language-toggle" type="button" data-language-toggle data-tooltip="${label}" aria-label="${label}">${globeIcon()}</button>`;
  }

  function sunIcon() {
    return `<svg class="utility-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`;
  }

  function moonIcon() {
    return `<svg class="utility-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path></svg>`;
  }

  function globeIcon() {
    return `<svg class="utility-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 0 18"></path><path d="M12 3a14 14 0 0 0 0 18"></path></svg>`;
  }

  function terminalIcon() {
    return `<svg class="utility-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m7 9 3 3-3 3"></path><path d="M13 15h4"></path></svg>`;
  }

  function notificationIcon() {
    return `<svg class="utility-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>`;
  }

  function actionIcon(kind) {
    const shapes = {
      inspect: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.5"></circle>',
      edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>',
      refresh: '<path d="M21 12a9 9 0 0 1-15.22 6.49L3 16"></path><path d="M3 21v-5h5"></path><path d="M3 12A9 9 0 0 1 18.22 5.51L21 8"></path><path d="M21 3v5h-5"></path>',
      logs: '<path d="M4 5h16"></path><path d="M4 10h16"></path><path d="M4 15h10"></path><path d="M4 20h7"></path>',
      terminal: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m7 9 3 3-3 3"></path><path d="M13 15h4"></path>',
      delete: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>',
      more: '<circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle>',
      open: '<path d="M14 3h7v7"></path><path d="M10 14 21 3"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>'
    };
    return `<svg class="action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[kind] || shapes.more}</svg>`;
  }

  function refreshButton(label, attributes, className = "btn") {
    return `<button class="${className} refresh-icon-button" type="button" ${attributes} data-tooltip="${label}" aria-label="${label}">${actionIcon("refresh")}</button>`;
  }

  function chevronDownIcon(className = "") {
    return `<svg class="ui-chevron ${className}" data-icon="inline-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`;
  }

  function checkIcon(className = "") {
    return `<svg class="shadcn-select-check ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>`;
  }

  function shadcnSelect(id, label, options, value, dataAttribute, className = "") {
    const entries = options.map((option) => typeof option === "object" ? option : { value: option, label: option });
    const selectedEntry = entries.find((entry) => String(entry.value) === String(value));
    const items = entries.map((entry) => {
      const selected = String(entry.value) === String(value);
      return `<button class="shadcn-select-item" type="button" role="option" aria-selected="${selected}" data-state="${selected ? "checked" : "unchecked"}" data-shadcn-item data-value="${esc(entry.value)}">${checkIcon()}<span>${esc(entry.label)}</span></button>`;
    }).join("");
    return `<div class="shadcn-field ${className}"><label class="shadcn-field-label" id="${id}-label">${label}</label><div class="shadcn-select" data-shadcn-select data-select-name="${id}"><button class="shadcn-select-trigger" type="button" role="combobox" aria-controls="${id}-content" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="${id}-label ${id}-value" data-shadcn-trigger><span class="shadcn-select-value" id="${id}-value" data-shadcn-value>${esc(selectedEntry?.label || value)}</span>${chevronDownIcon()}</button><div class="shadcn-select-content" id="${id}-content" role="listbox" aria-labelledby="${id}-label" data-shadcn-content hidden><div class="shadcn-select-group" role="group" data-shadcn-group>${items}</div></div><input type="hidden" value="${esc(value)}" ${dataAttribute}></div></div>`;
  }

  function initShadcnSelect(element) {
    if (!element) return null;
    if (element._shadcnSelect) return element._shadcnSelect;
    const trigger = element.querySelector("[data-shadcn-trigger]");
    const content = element.querySelector("[data-shadcn-content]");
    const group = element.querySelector("[data-shadcn-group]");
    const valueLabel = element.querySelector("[data-shadcn-value]");
    const input = element.querySelector("input[type='hidden']");
    if (window.mountShadcnSelect && trigger && content && group && input) {
      const mountPoint = document.createElement("div");
      mountPoint.className = "shadcn-real-select-mount";
      element.insertBefore(mountPoint, input);
      const options = [...group.querySelectorAll("[data-shadcn-item]")].map((item) => ({
        value: item.dataset.value || "",
        label: item.querySelector("span")?.textContent || item.dataset.value || "",
        group: item.previousElementSibling?.classList.contains("shadcn-select-group-label") ? item.previousElementSibling.textContent : ""
      }));
      trigger.remove();
      content.remove();
      let api;
      api = window.mountShadcnSelect(mountPoint, {
        value: input.value,
        options,
        ariaLabel: trigger.getAttribute("aria-label") || undefined,
        ariaLabelledBy: trigger.getAttribute("aria-labelledby") || undefined,
        triggerClassName: trigger.className,
        contentClassName: content.className
      });
      const originalSetOptions = api.setOptions.bind(api);
      api.setOptions = (nextOptions, preferredValue = "") => originalSetOptions(nextOptions.map((option) => typeof option === "object" ? {
        value: String(option.value),
        label: String(option.label),
        group: option.group || ""
      } : { value: String(option), label: String(option), group: "" }), String(preferredValue));
      const originalSetValue = api.setValue.bind(api);
      api.setValue = (value, emit = true) => {
        input.value = String(value);
        originalSetValue(String(value), false);
        if (emit) {
          input.dispatchEvent(new Event("change", { bubbles: true }));
          api.onValueChange?.(String(value));
        }
      };
      element._shadcnSelect = api;
      return api;
    }
    let api;
    const items = () => [...group.querySelectorAll("[data-shadcn-item]")];
    const close = (restoreFocus = false) => {
      element.dataset.state = "closed";
      trigger.setAttribute("aria-expanded", "false");
      content.hidden = true;
      if (restoreFocus) trigger.focus();
    };
    const closeOthers = () => document.querySelectorAll("[data-shadcn-select]").forEach((candidate) => {
      if (candidate === element) return;
      candidate.dataset.state = "closed";
      candidate.querySelector("[data-shadcn-trigger]")?.setAttribute("aria-expanded", "false");
      const candidateContent = candidate.querySelector("[data-shadcn-content]");
      if (candidateContent) candidateContent.hidden = true;
    });
    const open = (focusDirection = "selected") => {
      closeOthers();
      element.dataset.state = "open";
      trigger.setAttribute("aria-expanded", "true");
      content.hidden = false;
      const available = items();
      const selected = available.find((item) => item.dataset.value === input.value);
      const target = focusDirection === "last" ? available.at(-1) : selected || available[0];
      target?.focus();
    };
    const setValue = (value, emit = true) => {
      input.value = value;
      const selectedItem = items().find((item) => item.dataset.value === value);
      valueLabel.textContent = selectedItem?.querySelector("span")?.textContent || value || "Select an option";
      items().forEach((item) => {
        const selected = item.dataset.value === value;
        item.setAttribute("aria-selected", String(selected));
        item.dataset.state = selected ? "checked" : "unchecked";
      });
      if (emit) {
        input.dispatchEvent(new Event("change", { bubbles: true }));
        api.onValueChange?.(value);
      }
    };
    const bindItems = () => items().forEach((item) => item.addEventListener("click", (event) => {
      setValue(event.currentTarget.dataset.value);
      close(true);
    }));
    const setOptions = (options, preferredValue = "") => {
      let previousGroup = "";
      group.innerHTML = options.map((option) => {
        const entry = typeof option === "object" ? option : { value: option, label: option, group: "" };
        const groupLabel = entry.group && entry.group !== previousGroup ? `<div class="shadcn-select-group-label" role="presentation">${esc(entry.group)}</div>` : "";
        previousGroup = entry.group || previousGroup;
        return `${groupLabel}<button class="shadcn-select-item" type="button" role="option" aria-selected="false" data-state="unchecked" data-shadcn-item data-value="${esc(entry.value)}">${checkIcon()}<span>${esc(entry.label)}</span></button>`;
      }).join("");
      bindItems();
      const values = options.map((option) => typeof option === "object" ? option.value : option);
      setValue(values.includes(preferredValue) ? preferredValue : values[0] || "", false);
    };
    api = { get value() { return input.value; }, setValue, setOptions, onValueChange: null };
    element._shadcnSelect = api;
    trigger.addEventListener("click", () => content.hidden ? open() : close());
    trigger.addEventListener("keydown", (event) => {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        open(event.key === "ArrowUp" ? "last" : "selected");
      }
    });
    content.addEventListener("keydown", (event) => {
      const available = items();
      if (event.key === "Escape") { event.preventDefault(); close(true); return; }
      if (event.key === "Tab") { close(); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) return;
      event.preventDefault();
      const current = available.indexOf(document.activeElement);
      if (["Enter", " "].includes(event.key) && current >= 0) {
        setValue(available[current].dataset.value);
        close(true);
        return;
      }
      const next = event.key === "Home" ? 0 : event.key === "End" ? available.length - 1 : event.key === "ArrowDown" ? (current + 1) % available.length : (current <= 0 ? available.length - 1 : current - 1);
      available[next]?.focus();
    });
    document.addEventListener("click", (event) => { if (!element.contains(event.target)) close(); });
    element.dataset.state = "closed";
    bindItems();
    setValue(input.value, false);
    return api;
  }

  function initShadcnSelects(root = document) {
    root.querySelectorAll("[data-shadcn-select]").forEach(initShadcnSelect);
  }

  let createSelectSequence = 0;

  function createSelectOptions(select) {
    return [...select.children].flatMap((child) => {
      if (child.tagName === "OPTGROUP") return [...child.children].map((option) => ({ value: option.value, label: option.textContent, group: child.label }));
      return child.tagName === "OPTION" ? [{ value: child.value, label: child.textContent, group: "" }] : [];
    });
  }

  function syncCreateSelect(select, rebuild = false) {
    const enhancement = select?._createShadcnSelect;
    if (!enhancement) return;
    if (rebuild) enhancement.api.setOptions(createSelectOptions(select), select.value);
    else enhancement.api.setValue(select.value, false);
    enhancement.api.setDisabled?.(select.disabled);
    if (enhancement.trigger) enhancement.trigger.disabled = select.disabled;
    enhancement.wrapper.dataset.disabled = String(select.disabled);
    if (select.disabled) {
      enhancement.wrapper.dataset.state = "closed";
      enhancement.trigger?.setAttribute("aria-expanded", "false");
      if (enhancement.content) enhancement.content.hidden = true;
    }
  }

  function enhanceCreateSelect(select) {
    if (!select || select._createShadcnSelect) return;
    let field = select.closest("label.create-field");
    if (field) {
      const replacement = document.createElement("div");
      [...field.attributes].forEach((attribute) => replacement.setAttribute(attribute.name, attribute.value));
      while (field.firstChild) replacement.appendChild(field.firstChild);
      field.replaceWith(replacement);
      field = replacement;
    } else field = select.closest(".create-field");

    const selectId = select.id || `create-select-${++createSelectSequence}`;
    select.id = selectId;
    const fieldLabel = field?.querySelector(":scope > span");
    const labelId = `${selectId}-label`;
    if (fieldLabel) fieldLabel.id = labelId;
    select.classList.add("shadcn-native-select");
    select.hidden = true;
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const wrapper = document.createElement("div");
    wrapper.className = "shadcn-select create-shadcn-select";
    wrapper.dataset.shadcnSelect = "";
    wrapper.dataset.selectName = select.name || selectId;
    wrapper.innerHTML = `<button class="shadcn-select-trigger" type="button" role="combobox" aria-controls="${selectId}-content" aria-expanded="false" aria-haspopup="listbox" ${fieldLabel ? `aria-labelledby="${labelId} ${selectId}-value"` : `aria-label="Select ${esc(select.name || "option")}"`} data-shadcn-trigger><span class="shadcn-select-value" id="${selectId}-value" data-shadcn-value></span>${chevronDownIcon()}</button><div class="shadcn-select-content create-select-content" id="${selectId}-content" role="listbox" ${fieldLabel ? `aria-labelledby="${labelId}"` : ""} data-shadcn-content hidden><div class="shadcn-select-group" role="group" data-shadcn-group></div></div><input type="hidden" value="${esc(select.value)}"></div>`;
    select.after(wrapper);
    const api = initShadcnSelect(wrapper);
    const trigger = wrapper.querySelector("[data-shadcn-trigger]");
    const content = wrapper.querySelector("[data-shadcn-content]");
    api.onValueChange = (value) => {
      if (select.value === value) return;
      select.value = value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    select._createShadcnSelect = { wrapper, trigger, content, api };
    select.addEventListener("change", () => syncCreateSelect(select));
    syncCreateSelect(select, true);
  }

  function enhanceCreatePrimitives(root) {
    if (!root) return;
    root.querySelectorAll("label.create-field").forEach((field) => {
      if (!field.querySelector(".create-cluster-checks")) return;
      const replacement = document.createElement("div");
      [...field.attributes].forEach((attribute) => replacement.setAttribute(attribute.name, attribute.value));
      while (field.firstChild) replacement.appendChild(field.firstChild);
      field.replaceWith(replacement);
    });
    root.querySelectorAll('input:not([type="checkbox"]):not([type="file"]):not([type="hidden"])').forEach((input) => input.classList.add("shadcn-input"));
    root.querySelectorAll("select").forEach(enhanceCreateSelect);
    root.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.classList.add("shadcn-checkbox-input");
      input.closest("label")?.classList.add("shadcn-checkbox-card");
    });
    root.querySelectorAll("[data-add-row]").forEach((button) => button.classList.add("shadcn-button", "shadcn-button-outline", "shadcn-button-sm"));
    root.querySelectorAll("[data-remove-row]").forEach((button) => button.classList.add("shadcn-button", "shadcn-button-ghost", "shadcn-icon-button-sm"));
  }

  function searchIcon(className = "") {
    return `<svg class="search-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`;
  }

  function closeIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
  }

  function searchField(placeholder, dataAttribute, label = placeholder, className = "search-field") {
    return `<div class="${className} search-control" data-search-root>${searchIcon()}<input type="search" placeholder="${placeholder}" aria-label="${label}" autocomplete="off" spellcheck="false" ${dataAttribute}><button class="search-clear" type="button" data-search-clear aria-label="Clear search">${closeIcon()}</button></div>`;
  }

  function panelLeftIcon() {
    return `<svg class="ui-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path></svg>`;
  }

  function navigationIcon(key) {
    const normalized = ({
      workload: "workloads",
      applications: "resources",
      configuration: "settings",
      federation: "topology",
      "global-topology": "topology",
      cluster: "clusters",
      "cluster-scoped": "clusters",
      access: "policies"
    })[key] || key;
    const shapes = {
      overview: '<rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect>',
      metrics: '<path d="M4 19V9"></path><path d="M10 19V5"></path><path d="M16 19v-7"></path><path d="M22 19V3"></path>',
      topology: '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 10.5 6.8-4"></path><path d="m8.6 13.5 6.8 4"></path>',
      resources: '<path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"></path><path d="m4 12 8 4.5 8-4.5"></path><path d="m4 16.5 8 4.5 8-4.5"></path>',
      workloads: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
      network: '<circle cx="12" cy="5" r="2.5"></circle><circle cx="5" cy="19" r="2.5"></circle><circle cx="19" cy="19" r="2.5"></circle><path d="M12 7.5v4"></path><path d="M5 16.5v-2h14v2"></path>',
      settings: '<path d="M4 7h10"></path><path d="M18 7h2"></path><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="16" cy="7" r="2"></circle><circle cx="8" cy="17" r="2"></circle>',
      storage: '<ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"></path><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>',
      clusters: '<rect x="4" y="4" width="16" height="6" rx="1"></rect><rect x="4" y="14" width="16" height="6" rx="1"></rect><path d="M8 7h.01"></path><path d="M8 17h.01"></path>',
      policies: '<path d="M12 3 20 7v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z"></path><path d="m9 12 2 2 4-4"></path>',
      states: '<path d="M3 12h4l2-5 4 10 2-5h6"></path>'
    };
    return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[normalized] || shapes.resources}</svg>`;
  }

  function setRailCollapsed(collapsed, trigger = document.querySelector('[data-action="side-collapse"]')) {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    shell.classList.toggle("rail-collapsed", collapsed);
    localStorage.setItem("karmada-rail-collapsed", collapsed ? "1" : "0");
    trigger?.setAttribute("aria-label", collapsed ? "Expand navigation" : "Collapse navigation");
    if (trigger) trigger.dataset.tooltip = collapsed ? "Expand navigation" : "Collapse navigation";
    trigger?.setAttribute("aria-expanded", String(!collapsed));
  }

  function expandRailToGroup(group, groupToggle, content) {
    const shell = document.querySelector(".app-shell");
    if (!shell?.classList.contains("rail-collapsed")) return false;
    setRailCollapsed(false);
    group.classList.add("open");
    group.dataset.state = "open";
    groupToggle.setAttribute("aria-expanded", "true");
    content?.setAttribute("aria-hidden", "false");
    if (content) content.inert = false;
    return true;
  }

  function navActive(key) {
    if (key === page) return true;
    if (isMemberScope && key === "clusters") return true;
    if (page === "create" && !isMemberScope && key === "resources") return true;
    return false;
  }

  function globalTopbar() {
    const scopeLabel = isMemberScope ? `Member Cluster · ${D.member.name}` : "Control Plane";
    const railCollapsed = localStorage.getItem("karmada-rail-collapsed") === "1";
    const memberLinks = D.clusters.map((cluster) => `<a class="scope-option ${isMemberScope && D.member.name === cluster.name ? "active" : ""}" href="member-cluster.html?cluster=${cluster.name}#overview"><span><b>${cluster.name}</b><small>${cluster.mode} · ${cluster.version}</small></span>${statusPill(cluster.status)}</a>`).join("");
    return `<header class="global-topbar">
      <a class="global-brand" href="index.html" aria-label="Karmada Control Plane overview"><img src="${logoUrl}" alt=""><strong>Karmada</strong></a>
      <div class="global-topbar-center">
        <button class="rail-collapse topbar-sidebar-trigger" type="button" data-action="side-collapse" data-tooltip="${railCollapsed ? "Expand" : "Collapse"} navigation" aria-label="${railCollapsed ? "Expand" : "Collapse"} navigation" aria-controls="primary-navigation" aria-expanded="${!railCollapsed}">${panelLeftIcon()}</button>
        <div class="top-control scope-control">
          <button class="top-scope-trigger disclosure-trigger" type="button" data-action="scope-menu" aria-haspopup="true" aria-controls="scope-popover" aria-expanded="false"><span><small>Current workspace</small><b>${scopeLabel}</b></span>${chevronDownIcon()}</button>
          <div class="top-popover scope-popover" id="scope-popover" data-popover="scope" hidden>
            <div class="popover-label">Switch workspace</div>
            <a class="scope-option ${!isMemberScope ? "active" : ""}" href="index.html"><span><b>Control Plane</b><small>Policies · resources · scheduling</small></span>${statusPill("Healthy")}</a>
            <div class="popover-label member-label">Member Clusters</div>
            ${memberLinks}
          </div>
        </div>
        <button class="global-search" type="button" data-action="command" aria-label="Search resources and commands">${searchIcon()}<span class="global-search-copy">Search resources, policies, member clusters…</span><kbd>⌘ K</kbd></button>
      </div>
      <div class="global-actions">
        <button class="utility-icon notification-launch" type="button" data-action="notifications" data-tooltip="Attention queue" aria-label="Open attention queue" aria-haspopup="dialog">${notificationIcon()}<i>1</i></button>
        <button class="utility-icon terminal-launch" type="button" data-action="control-plane-terminal" data-tooltip="Control Plane Terminal" aria-label="Control Plane Terminal" aria-haspopup="dialog" aria-expanded="false">${terminalIcon()}</button>
        ${languageSwitch()}
        ${themeSwitch()}
        <div class="top-control user-control">
          <button class="user-trigger disclosure-trigger utility-icon" type="button" data-action="user-menu" data-tooltip="Account" aria-label="Account" aria-haspopup="true" aria-controls="user-popover" aria-expanded="false"><span class="user-avatar">PA</span></button>
          <div class="top-popover user-popover" id="user-popover" data-popover="user" hidden>
            <div class="popover-label">Account</div>
            <button type="button" data-action="profile"><span>Profile & access</span><small>cluster-admin</small></button>
            <button class="sign-out" type="button" data-action="logout"><span>Sign out</span><small>platform-admin</small></button>
          </div>
        </div>
      </div>
    </header>`;
  }

  function sideRail() {
    const requestedCreateKind = new URLSearchParams(location.search).get("kind");
    const memberCreateKind = page === "create" ? (createKindAliases[requestedCreateKind] || requestedCreateKind || "Deployment") : "";
    const initialMemberView = (memberCreateKind && createResourceIdForKind(memberCreateKind)) || location.hash.replace(/^#/, "") || "overview";
    const initialControlView = new URLSearchParams(location.search).get("resource") || location.hash.replace(/^#/, "") || "pods";
    const nav = isMemberScope ? memberSideNav(initialMemberView) : controlPlaneSideNav(initialControlView);
    return `<aside class="side-rail">
      <div class="rail-navigation" id="primary-navigation" data-rail-navigation>${nav}</div>
      <div class="rail-footer"><span class="rail-status-dot"></span><span class="rail-footer-copy"><b>Control plane ready</b><small>v1.17.0 · 3 clusters</small></span></div>
    </aside>`;
  }

  function controlPlaneSideNav(viewId = "pods", createKindOverride = "") {
    if (page === "resources") return controlResourceSideNav(viewId);
    const requestedCreateKind = new URLSearchParams(location.search).get("kind");
    const createKind = page === "create" ? (createKindOverride || createKindAliases[requestedCreateKind] || requestedCreateKind || "Deployment") : "";
    const activeResourceView = createKind ? createResourceIdForKind(createKind) : "pods";
    const renderPrimarySection = (groupName) => {
      const [, items] = navItems.find(([group]) => group === groupName);
      return `<div class="nav-group">${groupName}</div><nav class="primary-nav">${items.map(([key, href, label]) => `<a href="${href}" class="${navActive(key) ? "active" : ""}" aria-label="${label}" data-tooltip="${label}" data-tooltip-side="right" data-rail-tooltip><span class="nav-signal">${navigationIcon(key)}</span><span class="nav-label">${label}</span></a>`).join("")}</nav>`;
    };
    return `${renderPrimarySection("MultiCluster")}<div class="nav-group">Resource management</div>${controlResourcesMenu(activeResourceView, false, Boolean(createKind))}${settingsSideNav()}`;
  }

  function topbar() {
    if (isMemberScope) return "";
    const meta = currentPageMeta();
    if (page === "create") {
      const requestedKind = new URLSearchParams(location.search).get("kind") || "Deployment";
      const kind = createKindAliases[requestedKind] || requestedKind;
      const backLabel = isPolicyKind(kind) ? "Policies" : "Resource management";
      return `<div class="topbar"><nav class="breadcrumb create-breadcrumb" aria-label="Breadcrumb"><a data-create-breadcrumb-back href="${createResourceListHref(kind)}" aria-label="Back to ${backLabel}">${backLabel}</a><span aria-hidden="true">/</span><span data-create-breadcrumb-current>${kind}</span></nav></div>`;
    }
    return `<div class="topbar"><div class="breadcrumb">${meta[0]}</div></div>`;
  }

  function pageHeader(primaryAction, secondaryAction, showDescription = true) {
    const meta = currentPageMeta();
    return `<header class="page-header"><div><h1>${meta[1]}</h1>${showDescription ? `<p>${meta[2]}</p>` : ""}</div><div class="header-actions">${secondaryAction || ""}${primaryAction || ""}</div></header>`;
  }

  function panel(title, meta, body, extraClass = "") {
    return `<section class="panel ${extraClass}"><div class="panel-head"><strong>${title}</strong><span class="meta">${meta}</span></div>${body}</section>`;
  }

  function statusPill(status) {
    const normalized = status.toLowerCase();
    const cls = /healthy|ready|running|applied|complete|operational|active|bound|normal|established|protected/.test(normalized) ? "good" : /stale|degraded|review|suspended|syncing|warning/.test(normalized) ? "warn" : /failed|error|disconnected/.test(normalized) ? "bad" : "neutral";
    return `<span class="status-pill ${cls}">${status}</span>`;
  }

  function eventTimeline(limit = 4) {
    return `<div class="timeline">${D.events.slice(0, limit).map((event) => `<div class="timeline-item"><time>${event.time} · ${event.type.toUpperCase()}</time><b class="${event.level === "warn" ? "text-warn" : ""}">${event.title}</b><p>${event.detail}</p></div>`).join("")}</div>`;
  }

  function overviewPage() {
    const memberClusters = D.clusters.map((cluster) => `<div class="member-cluster-row"><div class="member-cluster-name">${cluster.name}<small>${cluster.mode.toUpperCase()} · ${cluster.version}</small></div><div class="route-line ${cluster.status === "Stale" ? "stale" : ""}"></div><div class="member-cluster-stat"><b class="${cluster.status === "Stale" ? "stale" : ""}">${cluster.status.toUpperCase()}</b><br>${cluster.nodes} node</div></div>`).join("");
    return `${pageHeader("", "")}
      <section class="overview-status">
        <article class="panel health-hero"><div class="status-row"><span>Control Plane health</span><span>3 / 3 member clusters</span></div><div class="health-title"><span class="dot"></span>Operational</div><p>The control plane is running on <strong>v1.17.0</strong>. Policies are propagating without errors across all member clusters.</p><span class="freshness">LAST SYNC 10:33:18 · 12s AGO</span></article>
        <article class="panel capacity-grid"><div class="capacity-cell"><label>Nodes</label><b>3 / 3</b><div class="meter"><i style="--value:100%"></i></div></div><div class="capacity-cell"><label>Pods</label><b>38 / 330</b><div class="meter"><i style="--value:12%"></i></div></div><div class="capacity-cell"><label>CPU</label><b>3.15 / 48</b><div class="meter"><i style="--value:7%"></i></div></div><div class="capacity-cell"><label>Memory</label><b>1.40 / 183 GiB</b><div class="meter"><i style="--value:1%"></i></div></div></article>
      </section>
      <section class="split-grid">${panel("Propagation routes", "Live topology", `<div class="member-cluster-list">${memberClusters}</div>`)}${panel("Recent changes", "Last 30 min", eventTimeline(3))}</section>`;
  }

  function attentionQueueContent() {
    return `<article class="attention is-open"><div class="meta-line"><span class="text-warn">Stale signal</span><span>2m ago</span></div><h3>member3 metrics are delayed</h3><p>Resource state is current, but CPU and memory samples exceeded the 90s freshness target.</p><a href="member-cluster.html?cluster=member3#overview">Inspect member3 →</a></article><article class="attention"><div class="meta-line"><span>Capacity</span><span>Today</span></div><h3>Pod allocation is below 12%</h3><p>No action required. Current headroom supports the expected workload window.</p><a href="metrics.html">Open capacity view →</a></article><article class="attention"><div class="meta-line"><span class="text-good">Policy</span><span>Current</span></div><h3>No policy conflicts</h3><p>All propagation and override policies resolved successfully.</p></article>`;
  }

  function attentionQueueDrawer() {
    if (window.KD_SHADCN) {
      closePopovers();
      const trigger = document.querySelector('[data-action="notifications"]');
      trigger?.setAttribute("aria-expanded", "true");
      window.KD_SHADCN.openSheet({
        title: "Attention queue",
        description: "Operational signals that may need review.",
        contentClassName: "attention-drawer w-[min(420px,100vw)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none",
        headerHtml: `<header class="attention-drawer-head"><div><span class="eyebrow">CONTROL PLANE / NOTIFICATIONS</span><h2>Attention queue</h2><p>Operational signals that may need review.</p></div></header>`,
        bodyHtml: `<div class="attention-drawer-summary"><div><span class="attention-summary-dot"></span><strong>1 signal needs attention</strong></div><span>3 signals · updated 12s ago</span></div><div class="attention-drawer-body">${attentionQueueContent()}</div>`,
        onMount: (root) => applyLanguage(root),
        onClose: () => {
          trigger?.setAttribute("aria-expanded", "false");
          trigger?.focus();
        }
      });
      return;
    }
    document.querySelector(".attention-drawer-backdrop")?.remove();
    closePopovers();
    const backdrop = document.createElement("div");
    backdrop.className = "attention-drawer-backdrop";
    backdrop.innerHTML = `<aside class="attention-drawer" role="dialog" aria-modal="true" aria-labelledby="attention-drawer-title"><header class="attention-drawer-head"><div><span class="eyebrow">CONTROL PLANE / NOTIFICATIONS</span><h2 id="attention-drawer-title">Attention queue</h2><p>Operational signals that may need review.</p></div><button class="drawer-close" type="button" data-attention-close aria-label="Close attention queue">×</button></header><div class="attention-drawer-summary"><div><span class="attention-summary-dot"></span><strong>1 signal needs attention</strong></div><span>3 signals · updated 12s ago</span></div><div class="attention-drawer-body">${attentionQueueContent()}</div></aside>`;
    document.body.appendChild(backdrop);
    applyLanguage(backdrop);
    const trigger = document.querySelector('[data-action="notifications"]');
    trigger?.setAttribute("aria-expanded", "true");
    const close = () => {
      trigger?.setAttribute("aria-expanded", "false");
      backdrop.remove();
      trigger?.focus();
    };
    backdrop.querySelector("[data-attention-close]").addEventListener("click", close);
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    backdrop.querySelector("[data-attention-close]").focus();
  }

  function globalTopologyPage() {
    return `${pageHeader("", "")}
      <section class="global-topology-controls" aria-label="Topology query controls">
        ${shadcnSelect("topology-namespace", "Namespace", ["default", "platform", "monitoring"], "default", "data-global-namespace")}
        ${shadcnSelect("topology-kind", "Resource kind", ["Deployment", "StatefulSet", "DaemonSet", "CronJob", "Job"], "Deployment", "data-global-kind")}
        ${shadcnSelect("topology-resource", "Resource", ["nginx", "checkout-api", "frontend"], "nginx", "data-global-resource", "global-resource-query")}
        <button class="shadcn-button shadcn-button-default global-query-action" type="button" data-global-query>Query</button>
      </section>
      <section class="panel global-topology-workspace" data-global-topology-root data-layout="tb">
        <div class="topology-statusbar"><div><span class="live-indicator"></span><b>RESOURCE DELIVERY TRACE</b><span data-global-trace-label>Deployment / default / nginx</span></div><div><span>1 template</span><span>1 binding</span><span>3 Works</span><span>3 resources</span><span>6 Pods</span></div></div>
        <div class="global-topology-canvas" data-global-canvas>
          <div class="global-react-flow-mount" data-global-flow-mount></div>
          <aside class="global-topology-inspector" data-global-inspector hidden><button type="button" data-global-inspector-close aria-label="Close inspector">×</button><span class="eyebrow" data-global-inspector-stage>STAGE</span><h2 data-global-inspector-title>Resource</h2><div><span class="node-health good"></span><b data-global-inspector-status>Current</b></div><p data-global-inspector-detail></p><dl><div><dt>Trace</dt><dd>End-to-end</dd></div><div><dt>Source</dt><dd>Karmada API</dd></div></dl><a class="btn primary" data-global-inspector-link>Open resource</a></aside>
          <div class="global-topology-legend"><span><i class="flow-legend desired"></i>Resource relation</span><span><i class="flow-legend warning"></i>Stale observation</span><span><b class="legend-policy-badge">PP</b>Matched propagation policy</span><span><b class="legend-policy-badge op">OP</b>Applied override policy</span></div>
        </div>
      </section>`;
  }

  function clusterTopologyView() {
    const positions = [18, 50, 82];
    const leafPositions = [[9, 27], [41, 59], [73, 91]];
    const workloadCounts = D.clusters.map((cluster) => D.resources.filter((resource) => resource.cluster.includes(cluster.name)).length);
    const memberNodes = D.clusters.map((cluster, index) => {
      const stale = cluster.status === "Stale";
      return `<button class="topology-node topology-member ${stale ? "is-stale" : ""}" style="--node-x:${positions[index]}%;--node-y:270px" type="button" data-topology-node="${cluster.name}" data-topology-kind="Member cluster" data-topology-title="${cluster.name}" data-topology-status="${cluster.status}" data-topology-detail="${cluster.mode} synchronization · Kubernetes ${cluster.version} · ${cluster.freshness}" data-topology-link="member-cluster.html?cluster=${cluster.name}#overview">
        <img class="topology-member-logo" src="${kubernetesLogoUrl}" alt=""><span class="topology-member-content"><span class="topology-node-head"><span class="topology-node-kind">MEMBER CLUSTER</span><span class="node-health ${stale ? "warn" : "good"}"></span></span>
        <strong>${cluster.name}</strong><span class="topology-node-meta"><b>${cluster.mode}</b><span>${cluster.version}</span><span>${cluster.freshness}</span></span></span>
      </button>`;
    }).join("");
    const leafNodes = D.clusters.map((cluster, index) => {
      const degraded = cluster.name === "member3";
      return `<button class="topology-node topology-leaf" style="--node-x:${leafPositions[index][0]}%;--node-y:490px" type="button" data-topology-node="${cluster.name}-node" data-topology-node-path="resource" data-topology-kind="Kubernetes node" data-topology-title="${cluster.name}-control-plane" data-topology-status="Ready" data-topology-detail="Ubuntu 24.04 · containerd 2.0.4 · 12 / 110 pods" data-topology-link="member-cluster.html?cluster=${cluster.name}#nodes">
          <span class="leaf-glyph node-glyph"></span><span><small>NODE</small><strong>${cluster.name}-control-plane</strong><em><i class="node-health good"></i>Ready · 1 / 1</em></span>
        </button>
        <button class="topology-node topology-leaf ${degraded ? "is-stale" : ""}" style="--node-x:${leafPositions[index][1]}%;--node-y:490px" type="button" data-topology-node="${cluster.name}-workloads" data-topology-node-path="policy" data-topology-kind="Workload group" data-topology-title="${cluster.name} workloads" data-topology-status="${degraded ? "1 degraded" : "Healthy"}" data-topology-detail="${workloadCounts[index]} workload kinds placed by active propagation policies" data-topology-link="member-cluster.html?cluster=${cluster.name}#workloads-deployments">
          <span class="leaf-glyph workload-glyph"></span><span><small>WORKLOADS</small><strong>${workloadCounts[index]} placed resources</strong><em><i class="node-health ${degraded ? "warn" : "good"}"></i>${degraded ? "1 degraded" : "All healthy"}</em></span>
        </button>`;
    }).join("");
    return `<section class="panel topology-workspace" data-topology-root data-path-mode="all">
        <div class="topology-statusbar"><div><span class="live-indicator"></span><b>LIVE GRAPH</b><span>Updated 8s ago</span></div><div><span>1 control plane</span><span>3 member clusters</span><span>6 downstream groups</span></div></div>
        <div class="topology-plane">
          <svg class="topology-edge-layer" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
              <marker id="route-arrow-warn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker>
            </defs>
            <g class="route-group route-push" data-route-type="push" data-edge-path="policy resource">
              <path id="route-member1" d="M500 92 C500 170 180 150 180 226"></path>
              <path id="route-member2" d="M500 92 C500 150 500 168 500 226"></path>
            </g>
            <g class="route-group route-pull route-stale" data-route-type="pull stale" data-edge-path="policy resource">
              <path id="route-member3" d="M820 226 C820 150 500 170 500 92"></path>
            </g>
            <g class="route-group route-resource" data-route-type="push" data-edge-path="resource">
              <path d="M180 314 C180 385 90 390 90 450"></path><path d="M500 314 C500 385 410 390 410 450"></path>
            </g>
            <g class="route-group route-policy" data-route-type="push" data-edge-path="policy resource">
              <path d="M180 314 C180 385 270 390 270 450"></path><path d="M500 314 C500 385 590 390 590 450"></path>
            </g>
            <g class="route-group route-resource route-stale" data-route-type="pull stale" data-edge-path="resource">
              <path d="M820 314 C820 385 730 390 730 450"></path>
            </g>
            <g class="route-group route-policy route-stale" data-route-type="pull stale" data-edge-path="policy resource">
              <path d="M820 314 C820 385 910 390 910 450"></path>
            </g>
            <g class="route-labels"><text x="292" y="164">PUSH · 8s</text><text x="514" y="174">PUSH · 11s</text><text class="warn" x="713" y="164">PULL AGENT · 2m 14s</text></g>
            <circle class="route-pulse" r="3"><animateMotion dur="3.2s" repeatCount="indefinite"><mpath href="#route-member1"></mpath></animateMotion></circle>
            <circle class="route-pulse" r="3"><animateMotion dur="3.8s" repeatCount="indefinite"><mpath href="#route-member2"></mpath></animateMotion></circle>
            <circle class="route-pulse warn" r="3"><animateMotion dur="5.4s" repeatCount="indefinite"><mpath href="#route-member3"></mpath></animateMotion></circle>
          </svg>
          <button class="topology-node topology-control" style="--node-x:50%;--node-y:56px" type="button" data-topology-node="control-plane" data-topology-kind="Federation control plane" data-topology-title="Karmada Control Plane" data-topology-status="Operational" data-topology-detail="karmada-apiserver · scheduler · controller-manager · 24 active policies">
            <img src="${logoUrl}" alt=""><span><small>CONTROL PLANE</small><strong>Karmada</strong><em><i class="node-health good"></i>Operational · v1.17.0</em></span><b>38<small>WORKLOADS</small></b>
          </button>
          ${memberNodes}${leafNodes}
          <div class="topology-legend"><span><i class="legend-line push"></i>Push → member</span><span><i class="legend-line pull"></i>Pull → control plane</span><span><i class="legend-line stale"></i>Stale signal</span><span><i class="legend-dot"></i>Click a node for details</span></div>
          <aside class="topology-inspector" data-topology-inspector hidden><button class="inspector-close" type="button" data-topology-inspector-close aria-label="Close inspector">×</button><span class="eyebrow" data-inspector-kind>NODE</span><h2 data-inspector-title>Node details</h2><div class="inspector-status"><span class="node-health good" data-inspector-health></span><b data-inspector-status>Ready</b></div><p data-inspector-detail></p><dl><div><dt>Observed</dt><dd>Just now</dd></div><div><dt>Source</dt><dd>Karmada API</dd></div></dl><a class="btn primary" data-inspector-link hidden>Open workspace</a></aside>
        </div>
      </section>`;
  }

  function resourcesPage() {
    return `<div data-control-view-root></div>`;
  }

  function policiesPage() {
    return `${pageHeader('<button class="shadcn-button shadcn-button-default" type="button" data-policy-create>Create Propagation Policy</button>', refreshButton("Refresh policies", "data-policy-refresh", "shadcn-button shadcn-button-outline policy-refresh"))}
      <section class="shadcn-card policy-summary" aria-label="Policy summary" data-policy-summary></section>
      <div class="shadcn-tabs policy-tabs" role="tablist" aria-label="Policy family"><button class="active" type="button" role="tab" aria-selected="true" data-policy-tab="propagation">Propagation Policy</button><button type="button" role="tab" aria-selected="false" data-policy-tab="override">Override Policy</button></div>
      <div class="toolbar policy-toolbar">${searchField("Search policy, type, or namespace", "data-policy-search", "Search policies")}${shadcnSelect("policy-scope", "Policy scope", ["All scopes", "Namespaced", "Cluster-scoped"], "All scopes", "data-policy-scope-filter", "policy-scope-select")}</div>
      <div class="data-panel shadcn-data-table"><table class="data-table"><thead><tr><th>Name</th><th>Scope</th><th>Resources</th><th>Placement</th><th>Conflicts</th><th>Status</th><th>Updated</th><th class="table-actions-header policy-actions-header">Actions</th></tr></thead><tbody data-policy-body></tbody></table><div class="table-empty" data-policy-empty hidden><strong>No matching policies</strong><span>Adjust the family, scope, or search query.</span></div></div>`;
  }

  function policyFamily(policy) {
    return policy.type.includes("Override") ? "override" : "propagation";
  }

  function policyScope(policy) {
    return policy.type.startsWith("Cluster") ? "Cluster-scoped" : "Namespaced";
  }

  function policyMatchedCount(policy) {
    const matched = String(policy.resources || "").match(/\d+/);
    return matched ? Number(matched[0]) : policy.resources && policy.resources !== "None" ? 1 : 0;
  }

  function policyTargetClusters(policy) {
    return placementTargetClusters(policy.placement).map((cluster) => cluster.name);
  }

  function placementTargetClusters(placement) {
    const value = Array.isArray(placement) ? placement.join(" · ") : String(placement || "");
    if (/all clusters|\d+\s+member clusters?/i.test(value)) return D.clusters;
    return D.clusters.filter((cluster) => value.includes(cluster.name));
  }

  function placementCellMarkup(placement, id) {
    const targets = placementTargetClusters(placement);
    if (targets.length === 0) return esc(Array.isArray(placement) ? placement.join(" · ") : String(placement || "—"));
    if (targets.length <= 2) {
      const label = targets.map((cluster) => cluster.name).join(" · ");
      return `<span class="table-overflow-value" tabindex="0" data-tooltip="${esc(label)}" data-tooltip-side="top">${esc(label)}</span>`;
    }
    const tooltipId = `member-placement-${id}`;
    const details = targets.map((cluster) => `<span class="member-placement-cluster"><i class="node-health ${cluster.status === "Stale" ? "warn" : "good"}"></i><span><b>${esc(cluster.name)}</b><small>${esc(cluster.mode || cluster.syncMode || "Unknown")} mode · ${esc(cluster.freshness || "Unknown")}</small></span><em>${esc(cluster.status || "Unknown")}</em></span>`).join("");
    return `<span class="member-placement-hovercard"><button class="member-placement-trigger" type="button" aria-describedby="${tooltipId}">${targets.length} member clusters</button><span class="member-placement-content" id="${tooltipId}" role="tooltip"><strong>Target clusters</strong>${details}</span></span>`;
  }

  function policyYaml(policy) {
    const namespaced = policyScope(policy) === "Namespaced";
    const namespace = namespaced ? `\n  namespace: ${policy.namespace || "default"}` : "";
    const targets = policyTargetClusters(policy);
    const isOverride = policyFamily(policy) === "override";
    const selector = String(policy.resources || "Deployment/*").replace(/\s+matched/i, " resources");
    const spec = isOverride
      ? `resourceSelectors:\n    - apiVersion: apps/v1\n      kind: Deployment\n  targetCluster:\n    clusterNames:\n${targets.map((name) => `      - ${name}`).join("\n") || "      - member1"}\n  overriders:\n    plaintext:\n      - path: /spec/template/spec/containers/0/resources/limits/cpu\n        operator: replace\n        value: 500m`
      : `resourceSelectors:\n    - apiVersion: apps/v1\n      kind: ${selector.includes("StatefulSet") ? "StatefulSet" : "Deployment"}\n  placement:\n    clusterAffinity:\n      clusterNames:\n${targets.map((name) => `        - ${name}`).join("\n") || "        - member1"}\n    replicaScheduling:\n      replicaDivisionPreference: Weighted`;
    return `apiVersion: policy.karmada.io/v1alpha1\nkind: ${policy.type}\nmetadata:\n  name: ${policy.name}${namespace}\nspec:\n  ${spec}`;
  }

  function policySummaryMarkup() {
    const active = D.policies.filter((policy) => policy.status !== "Suspended").length;
    const applied = D.policies.filter((policy) => policy.status === "Applied").length;
    const suspended = D.policies.filter((policy) => policy.status === "Suspended").length;
    const review = D.policies.filter((policy) => policy.status === "Review").length;
    const matched = D.policies.reduce((total, policy) => total + policyMatchedCount(policy), 0);
    const overrides = D.policies.filter((policy) => policyFamily(policy) === "override");
    const overrideRules = overrides.reduce((total, policy) => total + (policy.ruleCount || 1), 0);
    const namespaces = new Set(overrides.map((policy) => policy.namespace).filter(Boolean)).size;
    const conflicts = D.policies.filter((policy) => policy.conflicts !== "None").length;
    return `<div><label>Active policies</label><b>${active}</b><small>${applied} applied · ${review ? `${review} needs review` : `${suspended} suspended`}</small></div><div><label>Matched resources</label><b>${matched}</b><small>Across current selectors</small></div><div><label>Override rules</label><b>${overrideRules}</b><small>${namespaces} namespace${namespaces === 1 ? "" : "s"}</small></div><div><label>Conflicts</label><b class="${conflicts ? "text-warn" : "text-good"}">${conflicts}</b><small class="${conflicts ? "text-warn" : "text-good"}">${conflicts ? "Review requested" : "No unresolved paths"}</small></div>`;
  }

  function policyRowMarkup(policy, index) {
    const scope = policyScope(policy);
    const namespace = scope === "Namespaced" ? policy.namespace : "All namespaces";
    return `<tr data-policy-row data-policy-index="${index}" data-policy-family="${policyFamily(policy)}" data-policy-scope="${scope}" data-search="${esc([policy.name, policy.namespace, policy.type, policy.resources, policy.placement, policy.status, scope].join(" ").toLowerCase())}"><td><button class="row-link button-link" type="button" data-policy-inspect="${index}">${esc(policy.name)}</button></td><td><span class="policy-scope-label">${esc(scope)}</span><span class="sub">${esc(namespace)}</span></td><td>${esc(policy.resources)}</td><td>${placementCellMarkup(policy.placement, `policy-${index}`)}</td><td class="${policy.conflicts !== "None" ? "text-warn" : ""}">${esc(policy.conflicts)}</td><td>${statusPill(policy.status)}</td><td class="mono">${esc(policy.updated)}</td><td class="table-actions-cell policy-actions-cell"><button class="row-action icon-action table-action-trigger" type="button" data-policy-menu="${index}" data-tooltip="Policy actions" aria-label="Actions for ${esc(policy.name)}" aria-haspopup="menu" aria-expanded="false">${actionIcon("more")}</button></td></tr>`;
  }

  function clustersPage() {
    return `<div data-shadcn-cluster-management-root></div>`;
  }

  const memberNavGroups = [
    { id: "overview", label: "Overview", views: [["overview", "Overview"]] },
    { id: "metrics", label: "Metrics", views: [["metrics", "Metrics"]] },
    { id: "applications", label: "Applications", views: [["helm-releases", "Helm Releases"], ["helm-charts", "Helm Charts"]] },
    { id: "workload", label: "Workloads", views: [["pods", "Pods"], ["deployments", "Deployments"], ["statefulsets", "StatefulSets"], ["daemonsets", "DaemonSets"], ["jobs", "Jobs"], ["cronjobs", "CronJobs"]] },
    { id: "network", label: "Network & traffic", views: [["services", "Services"], ["ingress", "Ingresses"], ["network-policies", "Network Policies"], ["gateways", "Gateways"], ["http-routes", "HTTP Routes"]] },
    { id: "storage", label: "Storage", views: [["pvcs", "Persistent Volume Claims"], ["pvs", "Persistent Volumes"], ["storage-classes", "Storage Classes"]] },
    { id: "configuration", label: "Configuration", views: [["configmaps", "ConfigMaps"], ["secrets", "Secrets"], ["hpas", "Horizontal Pod Autoscalers"], ["pdbs", "Pod Disruption Budgets"]] },
    { id: "access", label: "Access control", views: [["service-accounts", "Service Accounts"], ["roles", "Roles"], ["role-bindings", "Role Bindings"], ["cluster-roles", "Cluster Roles"], ["cluster-role-bindings", "Cluster Role Bindings"]] },
    { id: "cluster", label: "Cluster resources", views: [["nodes", "Nodes"], ["namespaces", "Namespaces"], ["events", "Events"], ["crds", "Custom Resource Definitions"]] }
  ];

  const memberTableConfigs = {
    pods: { group: "workloads", title: "Pods", description: "Container readiness, restarts, node placement, and live resource usage.", dataKey: "pods", namespace: true, create: "Create Pod", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["ready", "Ready", "mono"], ["status", "Status", "status"], ["restarts", "Restarts", "mono"], ["node", "Node", "mono"], ["cpu", "CPU", "metric-cpu"], ["memory", "Memory", "metric-memory"], ["age", "Age", "mono"]] },
    cronjobs: { group: "workload", title: "CronJobs", description: "Scheduled workloads, latest readiness, and image revisions in member1.", dataKey: "cronjobs", namespace: true, create: "Create CronJob", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["ready", "Ready", "mono"], ["schedule", "Schedule", "mono"], ["image", "Image", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    daemonsets: { group: "workload", title: "DaemonSets", description: "Node-wide agents and their desired, ready, and available replica state.", dataKey: "daemonsets", namespace: true, create: "Create DaemonSet", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["ready", "Ready", "mono"], ["available", "Available", "mono"], ["image", "Image", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    deployments: { group: "workload", title: "Deployments", description: "Replica health and rollout state for namespaced applications.", dataKey: "deployments", namespace: true, create: "Create Deployment", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["ready", "Ready", "mono"], ["updated", "Updated", "mono"], ["image", "Image", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    statefulsets: { group: "workloads", title: "StatefulSets", description: "Ordered replicas, stable identities, persistent storage, and update strategy.", dataKey: "statefulsets", namespace: true, create: "Create StatefulSet", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["ready", "Ready", "mono"], ["service", "Service"], ["strategy", "Strategy"], ["image", "Image", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    jobs: { group: "workload", title: "Jobs", description: "One-shot execution history and completion status.", dataKey: "jobs", namespace: true, create: "Create Job", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["completions", "Completions", "mono"], ["image", "Image", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    ingress: { group: "service", title: "Ingress", description: "External routes, ingress class, address, and TLS coverage.", dataKey: "ingress", namespace: true, create: "Create Ingress", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["class", "Class"], ["hosts", "Hosts", "mono"], ["address", "Address", "mono"], ["tls", "TLS"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    services: { group: "service", title: "Services", description: "Stable virtual IPs, exposed ports, and endpoint readiness.", dataKey: "services", namespace: true, create: "Create Service", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["type", "Type", "tag"], ["clusterIp", "Cluster IP", "mono"], ["ports", "Ports", "mono"], ["endpoints", "Endpoints", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    "network-policies": { group: "network", title: "Network Policies", description: "Namespace traffic boundaries, selectors, and ingress or egress policy types.", dataKey: "networkPolicies", namespace: true, create: "Create Network Policy", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["podSelector", "Pod selector", "mono"], ["types", "Policy types", "tags"], ["rules", "Rules", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    gateways: { group: "network", title: "Gateways", description: "Gateway API listeners, addresses, attached routes, and programmed conditions.", dataKey: "gateways", namespace: true, create: "Create Gateway", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["class", "Gateway class"], ["addresses", "Addresses", "mono"], ["listeners", "Listeners", "mono"], ["routes", "Routes", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    "http-routes": { group: "network", title: "HTTP Routes", description: "Gateway API hostnames, parent gateways, matching rules, and resolved backends.", dataKey: "httpRoutes", namespace: true, create: "Create HTTP Route", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["hostnames", "Hostnames", "mono"], ["parents", "Parents", "tags"], ["rules", "Rules", "mono"], ["backends", "Backends", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    "helm-releases": { group: "applications", title: "Helm Releases", description: "Installed applications, chart revisions, values, managed resources, and rollback history.", dataKey: "helmReleases", namespace: true, create: "Install Release", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["chart", "Chart", "mono"], ["version", "Version", "mono"], ["revision", "Revision", "mono"], ["updated", "Updated", "mono"], ["status", "Status", "status"]] },
    "helm-charts": { group: "applications", title: "Helm Charts", description: "Available application packages from configured Helm repositories.", dataKey: "helmCharts", create: "Add Repository", columns: [["name", "Name", "name"], ["repository", "Repository"], ["version", "Latest version", "mono"], ["appVersion", "App version", "mono"], ["description", "Description"], ["updated", "Updated", "mono"], ["status", "Status", "status"]] },
    configmaps: { group: "config", title: "ConfigMaps", description: "Non-sensitive runtime configuration and the keys exposed to workloads.", dataKey: "configmaps", namespace: true, create: "Create ConfigMap", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["keys", "Data keys", "tags"], ["immutable", "Immutable"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    pvcs: { group: "config", title: "Persistent Volume Claims", description: "Namespaced storage requests, binding state, capacity, and access mode.", dataKey: "pvcs", namespace: true, create: "Create PVC", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["phase", "Phase", "status"], ["volume", "Volume", "mono"], ["capacity", "Capacity", "mono"], ["access", "Access", "tags"], ["storageClass", "Storage class"], ["age", "Age", "mono"]] },
    secrets: { group: "config", title: "Secrets", description: "Sensitive references are visible; secret values remain masked by design.", dataKey: "secrets", namespace: true, create: "Create Secret", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["type", "Type", "mono"], ["dataKeys", "Data keys", "tags"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    hpas: { group: "configuration", title: "Horizontal Pod Autoscalers", description: "Scaling targets, replica bounds, and current utilization signals.", dataKey: "hpas", namespace: true, create: "Create HPA", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["target", "Target", "mono"], ["metric", "Metric"], ["replicas", "Replicas", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    pdbs: { group: "configuration", title: "Pod Disruption Budgets", description: "Voluntary disruption limits and current workload availability.", dataKey: "pdbs", namespace: true, create: "Create PDB", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["selector", "Selector", "mono"], ["minAvailable", "Min available", "mono"], ["allowed", "Disruptions allowed", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    "cluster-role-bindings": { group: "cluster-scoped", title: "Cluster Role Bindings", description: "Non-namespaced identities mapped to privileged roles in member1.", dataKey: "clusterRoleBindings", columns: [["name", "Name", "name"], ["role", "Role reference", "tag"], ["subjects", "Subjects", "tags"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    "cluster-roles": { group: "cluster-scoped", title: "Cluster Roles", description: "Cluster-scoped permission rules and their effective verbs in member1.", dataKey: "clusterRoles", columns: [["name", "Name", "name"], ["rules", "Rules", "tag"], ["resources", "Resources", "tags"], ["verbs", "Verbs", "tags"], ["labels", "Labels", "tags"], ["age", "Age", "mono"]] },
    events: { group: "cluster-scoped", title: "Events", description: "Recent Kubernetes events ordered by last occurrence and severity.", dataKey: "events", namespace: true, editable: false, columns: [["eventType", "Type", "status"], ["reason", "Reason", "tag"], ["object", "Object", "mono"], ["namespace", "Namespace"], ["message", "Message"], ["source", "Source", "mono"], ["lastSeen", "Last seen", "mono"], ["count", "Count", "mono"]] },
    namespaces: { group: "cluster-scoped", title: "Namespaces", description: "Isolation boundaries and ownership labels available in member1.", dataKey: "namespaces", create: "Create Namespace", columns: [["name", "Name", "name"], ["labels", "Labels", "tags"], ["phase", "Phase", "status"], ["age", "Age", "mono"]] },
    nodes: { group: "cluster-scoped", title: "Nodes", description: "Node readiness, scheduling state, runtime, address, and current allocation.", dataKey: "nodes", editable: false, columns: [["name", "Name", "name"], ["status", "Status", "status"], ["scheduling", "Scheduling", "tag"], ["roles", "Roles", "tags"], ["version", "Kubelet", "mono"], ["internalIp", "Internal IP", "mono"], ["cpu", "CPU", "metric-cpu"], ["memory", "Memory", "metric-memory"], ["pods", "Pods", "mono"], ["age", "Age", "mono"]] },
    pvs: { group: "cluster-scoped", title: "Persistent Volumes", description: "Member cluster storage inventory, reclaim policy, binding, and claims.", dataKey: "pvs", columns: [["name", "Name", "name"], ["capacity", "Capacity", "mono"], ["access", "Access", "tags"], ["reclaim", "Reclaim"], ["phase", "Phase", "status"], ["claim", "Claim", "mono"], ["storageClass", "Storage class"], ["age", "Age", "mono"]] },
    "storage-classes": { group: "storage", title: "Storage Classes", description: "Dynamic provisioners, reclaim policies, volume binding, and expansion support.", dataKey: "storageClasses", create: "Create Storage Class", columns: [["name", "Name", "name"], ["provisioner", "Provisioner", "mono"], ["reclaim", "Reclaim policy"], ["binding", "Volume binding"], ["expansion", "Expansion"], ["parameters", "Parameters", "tags"], ["age", "Age", "mono"]] },
    "role-bindings": { group: "cluster-scoped", title: "Role Bindings", description: "Namespace-scoped identity assignments and role references.", dataKey: "roleBindings", namespace: true, columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["role", "Role reference", "tag"], ["subjects", "Subjects", "tags"], ["age", "Age", "mono"]] },
    roles: { group: "cluster-scoped", title: "Roles", description: "Namespace-scoped permission rules, resources, verbs, and labels.", dataKey: "roles", namespace: true, columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["rules", "Rules", "tag"], ["resources", "Resources", "tags"], ["verbs", "Verbs", "tags"], ["labels", "Labels", "tags"], ["age", "Age", "mono"]] },
    "service-accounts": { group: "cluster-scoped", title: "Service Accounts", description: "Workload identities, token references, and automount behavior.", dataKey: "serviceAccounts", namespace: true, create: "Create Service Account", columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["secrets", "Secrets", "mono"], ["automount", "Token automount"], ["age", "Age", "mono"], ["status", "Status", "status"]] },
    crds: { group: "cluster", title: "Custom Resource Definitions", description: "Installed API extensions, scope, versions, and current conditions.", dataKey: "crds", editable: false, columns: [["name", "Name", "name"], ["group", "API group", "mono"], ["scope", "Scope"], ["versions", "Versions", "tags"], ["kindName", "Kind"], ["stored", "Stored version", "mono"], ["age", "Age", "mono"], ["status", "Status", "status"]] }
  };

  const controlResourceGroups = [
    { id: "federation", label: "Karmada Federation", views: [["clusters", "Clusters"], ["resource-bindings", "Resource Bindings"], ["cluster-resource-bindings", "Cluster Resource Bindings"], ["works", "Works"]] },
    { id: "workloads", label: "Workloads", views: [["pods", "Pods"], ["deployments", "Deployments"], ["statefulsets", "StatefulSets"], ["daemonsets", "DaemonSets"], ["jobs", "Jobs"], ["cronjobs", "CronJobs"]] },
    { id: "network", label: "Network & discovery", views: [["services", "Services"], ["ingress", "Ingresses"], ["network-policies", "Network Policies"], ["multi-cluster-services", "MultiClusterServices"], ["service-exports", "ServiceExports"]] },
    { id: "configuration", label: "Configuration", views: [["configmaps", "ConfigMaps"], ["secrets", "Secrets"], ["hpas", "Horizontal Pod Autoscalers"], ["pdbs", "Pod Disruption Budgets"]] },
    { id: "storage", label: "Storage", views: [["pvcs", "Persistent Volume Claims"], ["pvs", "Persistent Volumes"], ["storage-classes", "Storage Classes"]] },
    { id: "access", label: "Access control", views: [["service-accounts", "Service Accounts"], ["roles", "Roles"], ["role-bindings", "Role Bindings"], ["cluster-roles", "Cluster Roles"], ["cluster-role-bindings", "Cluster Role Bindings"]] },
    { id: "cluster", label: "Cluster resources", views: [["namespaces", "Namespaces"], ["events", "Events"], ["crds", "Custom Resource Definitions"]] }
  ];

  function canonicalControlView(viewId) {
    return viewId;
  }

  function controlConfigFromMember(viewId, group, actions, overrides = {}) {
    const source = memberTableConfigs[viewId];
    const columns = source.columns.some(([key]) => key === "placement") ? source.columns : [
      ...source.columns.slice(0, Math.min(source.columns.length, source.namespace ? 2 : 1)),
      ["placement", "Placement"],
      ...source.columns.slice(Math.min(source.columns.length, source.namespace ? 2 : 1))
    ];
    return {
      ...source,
      group,
      description: source.description.replace(/ in member1/g, " across the federation").replace(/Member cluster/g, "Federated"),
      columns,
      create: source.editable === false ? undefined : (source.create || `Create ${source.title.replace(/ies$/, "y").replace(/s$/, "")}`),
      actions,
      ...overrides
    };
  }

  const controlResourceConfigs = {
    clusters: { group: "federation", title: "Clusters", description: "Registered member clusters, synchronization mode, Kubernetes version, and API freshness.", dataKey: "clusters", create: "Register Cluster", editable: false, actions: [["open-cluster", "Open workspace"], ["health-check", "Run health check"], ["edit-cluster", "Edit connection"]], columns: [["name", "Name", "name"], ["syncMode", "Sync mode", "tag"], ["kubernetes", "Kubernetes", "mono"], ["nodes", "Nodes", "mono"], ["freshness", "Freshness", "mono"], ["status", "Status", "status"], ["age", "Age", "mono"]] },
    "resource-bindings": { group: "federation", title: "Resource Bindings", description: "Resolved scheduling decisions for namespaced resources and their replica distribution.", dataKey: "resourceBindings", namespace: true, editable: false, actions: [["trace-schedule", "Trace schedule"], ["open-policy", "Open policy"], ["reschedule", "Reschedule"]], columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["resource", "Resource", "mono"], ["policy", "Policy"], ["clusters", "Clusters", "tags"], ["replicas", "Replicas", "mono"], ["status", "Status", "status"], ["age", "Age", "mono"]] },
    "cluster-resource-bindings": { group: "federation", title: "Cluster Resource Bindings", description: "Resolved scheduling decisions for cluster-scoped resources.", dataKey: "clusterResourceBindings", editable: false, actions: [["trace-schedule", "Trace schedule"], ["open-policy", "Open policy"], ["reschedule", "Reschedule"]], columns: [["name", "Name", "name"], ["resource", "Resource", "mono"], ["policy", "Policy"], ["clusters", "Clusters", "tags"], ["scheduler", "Scheduler", "mono"], ["status", "Status", "status"], ["age", "Age", "mono"]] },
    works: { group: "federation", title: "Works", description: "Per-member delivery units, manifest application progress, and failed reconciliation.", dataKey: "works", namespace: true, editable: false, actions: [["view-manifests", "View manifests"], ["retry-apply", "Retry apply"], ["open-cluster", "Open cluster"]], columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["cluster", "Member cluster"], ["workload", "Workload", "mono"], ["manifests", "Manifests", "mono"], ["applied", "Applied", "mono"], ["status", "Status", "status"], ["age", "Age", "mono"]] },
    pods: controlConfigFromMember("pods", "workloads", [["logs", "View logs"], ["exec", "Open terminal"], ["delete-pod", "Delete Pod"]]),
    deployments: controlConfigFromMember("deployments", "workloads", [["scale", "Scale"], ["restart", "Restart rollout"], ["rollout", "Rollout status"]]),
    statefulsets: controlConfigFromMember("statefulsets", "workloads", [["scale", "Scale"], ["restart", "Restart rollout"], ["partition", "Update partition"]]),
    daemonsets: controlConfigFromMember("daemonsets", "workloads", [["restart", "Restart rollout"], ["rollout", "Rollout status"], ["node-coverage", "Node coverage"]]),
    jobs: controlConfigFromMember("jobs", "workloads", [["rerun-job", "Run again"], ["logs", "View logs"], ["delete-job", "Delete Job"]]),
    cronjobs: controlConfigFromMember("cronjobs", "workloads", [["run", "Run now"], ["toggle-schedule", "Suspend schedule"], ["history", "Job history"]]),
    services: controlConfigFromMember("services", "network", [["forward", "Port forward"], ["endpoints", "View endpoints"], ["export-service", "Export service"]]),
    ingress: controlConfigFromMember("ingress", "network", [["test-route", "Test route"], ["tls-details", "TLS details"], ["open-service", "Open backend"]]),
    "network-policies": controlConfigFromMember("network-policies", "network", [["visualize-policy", "Visualize rules"], ["audit-policy", "Audit traffic"], ["test-policy", "Test policy"]]),
    "multi-cluster-services": { group: "network", title: "MultiClusterServices", description: "Cross-cluster service discovery, endpoint aggregation, and exported ports.", dataKey: "multiClusterServices", namespace: true, create: "Create MultiClusterService", actions: [["service-map", "Service map"], ["endpoints", "View endpoints"], ["refresh-discovery", "Refresh discovery"]], columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["service", "Service", "mono"], ["clusters", "Clusters", "tags"], ["ports", "Ports", "mono"], ["endpoints", "Endpoints", "mono"], ["discovery", "Discovery", "status"], ["age", "Age", "mono"]] },
    "service-exports": { group: "network", title: "ServiceExports", description: "Services exported from member clusters and their active consumers.", dataKey: "serviceExports", namespace: true, create: "Create ServiceExport", actions: [["service-map", "Service map"], ["endpoints", "View endpoints"], ["revoke-export", "Revoke export"]], columns: [["name", "Name", "name"], ["namespace", "Namespace"], ["cluster", "Source cluster"], ["service", "Service"], ["ports", "Ports", "mono"], ["consumers", "Consumers", "tags"], ["status", "Status", "status"], ["age", "Age", "mono"]] },
    configmaps: controlConfigFromMember("configmaps", "configuration", [["compare-config", "Compare clusters"], ["references", "Used by"], ["download-data", "Download data"]]),
    secrets: controlConfigFromMember("secrets", "configuration", [["rotate-secret", "Rotate"], ["references", "Used by"], ["reveal-keys", "Inspect keys"]]),
    hpas: controlConfigFromMember("hpas", "configuration", [["metrics", "View metrics"], ["edit-bounds", "Edit bounds"], ["scale", "Manual scale"]]),
    pdbs: controlConfigFromMember("pdbs", "configuration", [["disruption-impact", "Impact analysis"], ["simulate-drain", "Simulate drain"], ["edit-budget", "Edit budget"]]),
    pvcs: controlConfigFromMember("pvcs", "storage", [["expand-volume", "Expand"], ["mounted-by", "Mounted by"], ["storage-events", "Storage events"]]),
    pvs: controlConfigFromMember("pvs", "storage", [["open-claim", "Open claim"], ["reclaim-policy", "Reclaim policy"], ["storage-events", "Storage events"]]),
    "storage-classes": controlConfigFromMember("storage-classes", "storage", [["provisioner", "Provisioner status"], ["set-default", "Set default"], ["test-provision", "Test provision"]]),
    "service-accounts": controlConfigFromMember("service-accounts", "access", [["token-audit", "Token audit"], ["effective-access", "Effective access"], ["disable-automount", "Disable automount"]]),
    roles: controlConfigFromMember("roles", "access", [["effective-access", "Effective access"], ["who-can", "Who can"], ["duplicate-role", "Duplicate"]]),
    "role-bindings": controlConfigFromMember("role-bindings", "access", [["effective-access", "Effective access"], ["manage-subjects", "Manage subjects"], ["who-can", "Who can"]]),
    "cluster-roles": controlConfigFromMember("cluster-roles", "access", [["effective-access", "Effective access"], ["who-can", "Who can"], ["duplicate-role", "Duplicate"]]),
    "cluster-role-bindings": controlConfigFromMember("cluster-role-bindings", "access", [["effective-access", "Effective access"], ["manage-subjects", "Manage subjects"], ["who-can", "Who can"]]),
    namespaces: controlConfigFromMember("namespaces", "cluster", [["namespace-inventory", "Inventory"], ["edit-labels", "Edit labels"], ["quota", "Resource quota"]]),
    events: controlConfigFromMember("events", "cluster", [["open-object", "Open object"], ["acknowledge", "Acknowledge"], ["event-stream", "Live stream"]], { editable: false }),
    crds: controlConfigFromMember("crds", "cluster", [["crd-instances", "View instances"], ["api-versions", "API versions"], ["conversion", "Conversion config"]], { editable: true, create: "Create CRD" })
  };

  const deletableControlWorkloads = new Set(["pods", "deployments", "statefulsets", "daemonsets", "jobs", "cronjobs"]);

  function controlResourceGroupFor(viewId) {
    const canonicalView = canonicalControlView(viewId);
    return controlResourceGroups.find((group) => group.views.some(([id]) => id === canonicalView)) || controlResourceGroups[0];
  }

  function controlResourcesMenu(viewId = "pods", workspace = page === "resources", showActive = workspace) {
    const activeGroup = controlResourceGroupFor(viewId);
    const activeView = canonicalControlView(viewId);
    const resourceItem = (id, label) => `<a href="resources.html?resource=${encodeURIComponent(id)}" ${workspace ? `data-control-view="${id}"` : ""} class="${showActive && id === activeView ? "active" : ""}"><span>${label}</span></a>`;
    return `<div class="resource-section-list">
      ${controlResourceGroups.slice(1).map((group) => {
        const open = showActive && group.id === activeGroup.id;
        return `<section class="resource-nav-group ${open ? "open" : ""}" data-state="${open ? "open" : "closed"}" data-control-nav-group data-resource-keywords="${group.label.toLowerCase()} ${group.views.map(([, label]) => label.toLowerCase()).join(" ")}">
          <button class="resource-group-trigger ${open ? "active" : ""}" type="button" data-control-group-toggle="${group.id}" aria-label="${group.label}" aria-controls="control-group-${group.id}" aria-expanded="${open}"><span class="nav-signal">${navigationIcon(group.id)}</span><span class="nav-label">${group.label}</span>${chevronDownIcon()}</button>
          <div class="resource-group-links" id="control-group-${group.id}" role="region" aria-hidden="${!open}" ${open ? "" : "inert"}><div class="resource-group-links-inner">${group.views.map(([id, label]) => resourceItem(id, label)).join("")}</div></div>
        </section>`;
      }).join("")}
    </div>`;
  }

  function settingsSideNav() {
    const open = page === "settings";
    const activeSection = activeSettingsSection();
    const links = settingsSections.map(([id, label]) => `<a href="settings.html#${id}" class="${open && id === activeSection ? "active" : ""}" data-settings-nav-section="${id}"><span>${label}</span></a>`).join("");
    return `<div class="nav-group">System</div><div class="resource-section-list system-section-list">
      <section class="resource-nav-group ${open ? "open" : ""}" data-state="${open ? "open" : "closed"}" data-control-nav-group>
        <button class="resource-group-trigger ${open ? "active" : ""}" type="button" data-control-group-toggle="settings" aria-label="Configuration" aria-controls="control-group-settings" aria-expanded="${open}"><span class="nav-signal">${navigationIcon("settings")}</span><span class="nav-label">Configuration</span>${chevronDownIcon()}</button>
        <div class="resource-group-links" id="control-group-settings" role="region" aria-hidden="${!open}" ${open ? "" : "inert"}><div class="resource-group-links-inner">${links}</div></div>
      </section>
    </div>`;
  }

  function controlResourceSideNav(viewId) {
    return `<div class="member-resource-nav control-resource-nav">
      <div class="control-plane-nav-block">
        <div class="nav-group">MultiCluster</div>
        <nav class="primary-nav control-plane-primary-nav">
          <a href="index.html" aria-label="Overview" data-tooltip="Overview" data-tooltip-side="right" data-rail-tooltip><span class="nav-signal">${navigationIcon("overview")}</span><span class="nav-label">Overview</span></a>
          <a href="topology.html" aria-label="Global topology" data-tooltip="Global topology" data-tooltip-side="right" data-rail-tooltip><span class="nav-signal">${navigationIcon("topology")}</span><span class="nav-label">Global topology</span></a>
          <a href="clusters.html" aria-label="Cluster management" data-tooltip="Cluster management" data-tooltip-side="right" data-rail-tooltip><span class="nav-signal">${navigationIcon("clusters")}</span><span class="nav-label">Cluster management</span></a>
          <a href="metrics.html" aria-label="Metrics visualization" data-tooltip="Metrics visualization" data-tooltip-side="right" data-rail-tooltip><span class="nav-signal">${navigationIcon("metrics")}</span><span class="nav-label">Metrics visualization</span></a>
          <a href="policies.html" aria-label="Policies" data-tooltip="Policies" data-tooltip-side="right" data-rail-tooltip><span class="nav-signal">${navigationIcon("policies")}</span><span class="nav-label">Policies</span></a>
        </nav>
        <div class="nav-group resource-management-label">Resource management</div>
      </div>
      ${controlResourcesMenu(viewId, true)}
      ${settingsSideNav()}
    </div>`;
  }

  function renderControlCell(row, column, rowIndex, viewId) {
    const [key, _label, type] = column;
    const value = row[key] ?? "—";
    const displayValue = Array.isArray(value) ? value.join(" · ") : String(value);
    if (key === "placement") return placementCellMarkup(value, `${viewId}-${rowIndex}`);
    if (type === "name") return `<button type="button" class="table-name" data-control-action="inspect" data-control-index="${rowIndex}" data-control-source="${viewId}">${esc(displayValue)}</button>`;
    if (type === "status") return statusPill(String(value));
    if (type === "tags") return `<div class="tag-list">${(Array.isArray(value) ? value : String(value).split(" · ")).map((item) => `<span class="data-tag">${esc(item)}</span>`).join("")}</div>`;
    if (type === "tag") return `<span class="data-tag">${esc(displayValue)}</span>`;
    if (type === "mono") return `<span class="mono">${esc(displayValue)}</span>`;
    return `<span class="cell-text">${esc(displayValue)}</span>`;
  }

  function controlResourceTableView(viewId) {
    const config = controlResourceConfigs[viewId];
    const displayTitle = config.title;
    const displayDescription = config.description;
    const rows = D.controlResources[config.dataKey] || [];
    const namespaceOptions = [...new Set(rows.map((row) => row.namespace).filter(Boolean))];
    const columnStorageKey = `karmada-control-columns-${viewId}`;
    let hiddenColumns = [];
    try { hiddenColumns = JSON.parse(localStorage.getItem(columnStorageKey) || "[]"); } catch (_error) { hiddenColumns = []; }
    const columnHidden = (key) => hiddenColumns.includes(key);
    const tableRows = rows.map((row, rowIndex) => {
      return `<tr data-search="${Object.values(row).flat().join(" ").toLowerCase()}" data-namespace="${row.namespace || ""}">${config.columns.map((column) => `<td data-control-column="${column[0]}" ${columnHidden(column[0]) ? "hidden" : ""}>${renderControlCell(row, column, rowIndex, viewId)}</td>`).join("")}<td class="table-actions-cell" data-control-column="actions"><button class="row-action icon-action table-action-trigger" type="button" data-control-menu="${rowIndex}" data-control-source="${viewId}" aria-label="Actions for ${esc(row.name || row.kind || "resource")}" aria-haspopup="menu" aria-expanded="false">${actionIcon("more")}</button></td></tr>`;
    }).join("");
    return `<section class="member-view control-resource-view"><header class="member-view-header"><div><span class="eyebrow">Control Plane / ${config.group}</span><h2>${displayTitle}</h2><p>${displayDescription}</p></div><div class="header-actions">${refreshButton("Refresh", 'data-control-action="refresh"')}${config.create ? `<button class="btn primary" type="button" data-control-action="create" data-control-source="${viewId}">${config.create}</button>` : ""}</div></header>
      <div class="member-signal-strip"><span>${statusPill(rows.some((row) => /review|degraded|stale|failed/i.test(row.status || "")) ? "Review" : "Current")} <b>Federation state</b></span><span><b>${rows.length}</b> objects</span><span><b>${namespaceOptions.length || "Cluster"}</b> ${namespaceOptions.length ? "namespaces" : "scope"}</span><span>Observed <b>8s ago</b></span></div>
      <div class="toolbar member-toolbar">${searchField(`Search ${displayTitle.toLowerCase()}`, "data-control-search")} ${config.namespace ? `<select class="select" data-control-namespace aria-label="Namespace"><option value="">All namespaces</option>${namespaceOptions.map((namespace) => `<option>${namespace}</option>`).join("")}</select>` : ""}<div class="member-toolbar-actions"><div data-control-columns-root></div></div></div>
      <div class="data-panel member-table-wrap"><table class="data-table member-table"><thead><tr>${config.columns.map((column) => `<th data-control-column="${column[0]}" ${columnHidden(column[0]) ? "hidden" : ""}>${column[1]}</th>`).join("")}<th class="table-actions-header" data-control-column="actions">Actions</th></tr></thead><tbody data-control-filter-body>${tableRows}</tbody></table></div>
      <footer class="table-footer"><span data-control-showing>Showing ${rows.length} of ${rows.length}</span><span>Scope <b>${config.namespace ? "Namespaced" : "Cluster-scoped"}</b></span></footer></section>`;
  }

  function bindControlResourceFilters() {
    const search = document.querySelector("[data-control-search]");
    const namespace = document.querySelector("[data-control-namespace]");
    const rows = [...document.querySelectorAll("[data-control-filter-body] tr")];
    if (!rows.length) return;
    const apply = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const selectedNamespace = namespace?.value || "";
      let shown = 0;
      rows.forEach((row) => {
        const visible = (!query || row.dataset.search.includes(query)) && (!selectedNamespace || row.dataset.namespace === selectedNamespace);
        row.classList.toggle("hidden", !visible);
        if (visible) shown += 1;
      });
      document.querySelector("[data-control-showing]").textContent = `Showing ${shown} of ${rows.length}`;
    };
    search?.addEventListener("input", apply);
    namespace?.addEventListener("change", apply);
  }

  function controlResourceYaml(row) {
    const namespace = row.namespace ? `\n  namespace: ${row.namespace}` : "";
    const apiVersions = {
      Cluster: "cluster.karmada.io/v1alpha1",
      PropagationPolicy: "policy.karmada.io/v1alpha1",
      ClusterPropagationPolicy: "policy.karmada.io/v1alpha1",
      OverridePolicy: "policy.karmada.io/v1alpha1",
      ClusterOverridePolicy: "policy.karmada.io/v1alpha1",
      ResourceBinding: "work.karmada.io/v1alpha2",
      ClusterResourceBinding: "work.karmada.io/v1alpha2",
      Work: "work.karmada.io/v1alpha1",
      MultiClusterService: "networking.karmada.io/v1alpha1",
      ServiceExport: "multicluster.x-k8s.io/v1alpha1",
      Deployment: "apps/v1",
      StatefulSet: "apps/v1",
      DaemonSet: "apps/v1",
      Job: "batch/v1",
      CronJob: "batch/v1",
      Ingress: "networking.k8s.io/v1",
      NetworkPolicy: "networking.k8s.io/v1",
      HorizontalPodAutoscaler: "autoscaling/v2",
      PodDisruptionBudget: "policy/v1",
      StorageClass: "storage.k8s.io/v1",
      Role: "rbac.authorization.k8s.io/v1",
      RoleBinding: "rbac.authorization.k8s.io/v1",
      ClusterRole: "rbac.authorization.k8s.io/v1",
      ClusterRoleBinding: "rbac.authorization.k8s.io/v1",
      CustomResourceDefinition: "apiextensions.k8s.io/v1"
    };
    return `apiVersion: ${apiVersions[row.kind] || "v1"}\nkind: ${row.kind || "KubernetesObject"}\nmetadata:\n  name: ${row.name || "unnamed"}${namespace}\n  labels:\n    app.kubernetes.io/managed-by: karmada-dashboard\nspec:\n  # Federation-aware static prototype manifest\n  revision: review-required`;
  }

  const controlActionSpecs = {
    "health-check": ["Run cluster health check", "Probe API reachability, credentials, Kubernetes version, and member heartbeat.", "Run check"],
    "edit-cluster": ["Edit cluster connection", "Review Push or Pull mode, API endpoint, credentials, and heartbeat thresholds.", "Review changes"],
    "preview-placement": ["Placement preview", "Evaluate resource selectors against current clusters and show the resulting replica distribution before applying.", "Run preview"],
    "validate-policy": ["Validate policy", "Check selectors, cluster affinity, replica strategy, dependencies, and override conflicts.", "Validate"],
    "suspend-policy": ["Suspend policy", "Pause future propagation while preserving current member-cluster objects.", "Review suspension", true],
    "preview-override": ["Override preview", "Render the manifest before and after every JSON patch for each target cluster.", "Generate preview"],
    "resolve-conflict": ["Resolve override conflict", "Compare competing rule priority and choose the effective operation for the target path.", "Open resolver"],
    "trace-schedule": ["Scheduling trace", "Inspect candidate clusters, affinity scoring, taints, replica assignment, and the final binding decision.", "Open trace"],
    "open-policy": ["Related policy", "Open the policy that produced this binding and review its current placement intent.", "Open policy"],
    reschedule: ["Reschedule resource", "Re-evaluate this binding against current cluster health and policy constraints.", "Preview reschedule"],
    "view-manifests": ["Work manifests", "Inspect the exact manifests delivered to the selected member cluster and their apply result.", "View manifests"],
    "retry-apply": ["Retry Work apply", "Queue failed manifests for reconciliation without changing their desired content.", "Retry apply"],
    logs: ["Resource logs", "Choose member cluster, Pod, container, time range, and follow mode for the log stream.", "Open log viewer"],
    exec: ["Resource terminal", "Choose member cluster, Pod, container, and shell for an audited terminal session.", "Open terminal"],
    "delete-pod": ["Delete Pod", "Review owning workload and disruption impact before recreating this propagated Pod.", "Review deletion", true],
    scale: ["Scale workload", "Set desired replicas per member cluster and preview availability before applying.", "Review scale"],
    restart: ["Restart rollout", "Trigger a rolling restart across placements while respecting availability budgets.", "Review restart"],
    rollout: ["Rollout status", "Compare desired, updated, ready, and unavailable replicas in every member cluster.", "Open rollout"],
    partition: ["StatefulSet update partition", "Choose which ordinal range receives the next template revision.", "Review partition"],
    "node-coverage": ["DaemonSet node coverage", "Compare desired and available Pods against eligible nodes in every member cluster.", "Open coverage"],
    "rerun-job": ["Run Job again", "Create a new Job from the selected spec with a unique execution name.", "Review run"],
    "delete-job": ["Delete Job", "Review Pods, logs, and retention policy before removing this Job.", "Review deletion", true],
    run: ["Run CronJob now", "Create a one-off Job from the current CronJob template and placement policy.", "Review run"],
    "toggle-schedule": ["Suspend schedule", "Pause future CronJob schedules across all placements; existing Jobs remain unchanged.", "Review suspension"],
    history: ["Job history", "Compare recent executions, completion time, failures, and retained logs by member cluster.", "Open history"],
    forward: ["Port forward", "Choose a member-cluster endpoint, remote port, and local browser-session port.", "Configure forward"],
    endpoints: ["Endpoint inventory", "Inspect ready and not-ready endpoints grouped by member cluster and zone.", "Open endpoints"],
    "export-service": ["Export service", "Select consumer clusters and publish this Service through multi-cluster discovery.", "Review export"],
    "test-route": ["Test ingress route", "Send a synthetic request from each member cluster and compare status, latency, and TLS result.", "Run route test"],
    "tls-details": ["TLS details", "Inspect certificate issuer, SANs, expiry, and secret synchronization by cluster.", "Inspect TLS"],
    "open-service": ["Ingress backends", "Open the referenced Services and endpoint health behind every ingress rule.", "Open backends"],
    "visualize-policy": ["Network policy graph", "Visualize selected Pods and allowed ingress or egress paths across namespaces.", "Open graph"],
    "audit-policy": ["Traffic audit", "Compare observed traffic with declared policy rules and flag unexpected flows.", "Run audit"],
    "test-policy": ["Policy simulation", "Simulate a source, destination, protocol, and port without changing enforcement.", "Open simulator"],
    "service-map": ["Multi-cluster service map", "Trace exported Services, aggregated endpoints, and consuming clusters.", "Open service map"],
    "refresh-discovery": ["Refresh discovery", "Reconcile ServiceImports and endpoint slices from all participating clusters.", "Refresh"],
    "revoke-export": ["Revoke ServiceExport", "Review consumer impact before removing this service from multi-cluster discovery.", "Review revoke", true],
    "compare-config": ["Compare ConfigMap", "Diff keys and values across propagated member-cluster copies.", "Open comparison"],
    references: ["Resource references", "List workloads, volumes, and controllers that currently reference this object.", "View references"],
    "download-data": ["Download ConfigMap data", "Export non-sensitive keys as YAML or a directory archive.", "Choose format"],
    "rotate-secret": ["Rotate Secret", "Create a new revision and preview which workloads require restart.", "Review rotation"],
    "reveal-keys": ["Inspect Secret keys", "Show key names and checksums only; secret values remain masked.", "Inspect metadata"],
    metrics: ["Autoscaler metrics", "Compare current and target metrics with replica recommendations by cluster.", "Open metrics"],
    "edit-bounds": ["Edit scaling bounds", "Review minimum, maximum, stabilization, and scaling policies.", "Review bounds"],
    "disruption-impact": ["Disruption impact", "Calculate currently allowed disruptions and workloads blocked by this budget.", "Analyze impact"],
    "simulate-drain": ["Simulate node drain", "Evaluate this budget against Pods selected on a candidate node.", "Run simulation"],
    "edit-budget": ["Edit disruption budget", "Update minAvailable or maxUnavailable and preview availability impact.", "Review budget"],
    "expand-volume": ["Expand volume claim", "Choose a larger requested capacity and validate StorageClass expansion support.", "Review expansion"],
    "mounted-by": ["Mounted by", "List workloads and Pods mounting this claim in every member cluster.", "Open consumers"],
    "storage-events": ["Storage events", "Inspect provisioning, binding, mount, resize, and reclaim events.", "Open events"],
    "open-claim": ["Bound claim", "Open the PersistentVolumeClaim currently bound to this volume.", "Open claim"],
    "reclaim-policy": ["Reclaim policy", "Review Retain or Delete behavior and data-loss impact.", "Review policy"],
    provisioner: ["Provisioner status", "Inspect CSI controller health, supported capabilities, and recent errors.", "Open provisioner"],
    "set-default": ["Set default StorageClass", "Review affected claims before changing the federation default.", "Review change"],
    "test-provision": ["Test provision", "Create a temporary claim in a selected member cluster and verify bind latency.", "Run test"],
    "token-audit": ["Token audit", "Review token Secrets, projected tokens, expiry, and recent authentication.", "Open audit"],
    "effective-access": ["Effective access", "Resolve roles and bindings into the effective verbs granted to this subject.", "Calculate access"],
    "disable-automount": ["Disable token automount", "Preview workloads that rely on the default ServiceAccount token.", "Review change"],
    "who-can": ["Who can", "Find subjects that can perform selected verbs on this resource scope.", "Run query"],
    "duplicate-role": ["Duplicate role", "Create a namespaced copy and review rule scope before saving.", "Open copy"],
    "manage-subjects": ["Manage binding subjects", "Add or remove users, groups, and ServiceAccounts with an access preview.", "Review subjects"],
    "namespace-inventory": ["Namespace inventory", "Summarize workloads, config, storage, policies, and placement for this namespace.", "Open inventory"],
    "edit-labels": ["Edit namespace labels", "Update organization and policy-selection labels with an impact preview.", "Review labels"],
    quota: ["Resource quota", "Review aggregate requests, limits, object counts, and quota headroom.", "Open quota"],
    "open-object": ["Related object", "Open the object referenced by this event in its resource workspace.", "Open object"],
    acknowledge: ["Acknowledge event", "Record this warning as reviewed without removing it from event history.", "Acknowledge"],
    "event-stream": ["Live event stream", "Follow control-plane and member-cluster events with severity filters.", "Open stream"],
    "crd-instances": ["Custom resource instances", "List all objects served by this definition across namespaces.", "View instances"],
    "api-versions": ["API versions", "Inspect served, storage, deprecated, and conversion status for every version.", "Open versions"],
    conversion: ["Conversion configuration", "Inspect webhook service, CA bundle state, and conversion review versions.", "Open conversion"]
  };

  function resourceDetailOverview(row, facts, sourceLabel, observedAt = "8s ago") {
    const state = row.status || row.phase || "Current";
    const warning = /review|degraded|stale|failed|warning/i.test(state);
    return `<div class="resource-detail-overview">
      <div class="resource-detail-status">
        <div class="resource-detail-state-copy"><span class="${warning ? "warning" : ""}"></span><div><strong>${esc(state)}</strong><small>Observed from ${esc(sourceLabel)} · ${esc(observedAt)}</small></div></div>
        ${statusPill(state)}
      </div>
      <section class="resource-detail-facts-card">
        <dl class="resource-detail-facts">${facts.map(([key, value]) => {
          const label = key.replace(/([A-Z])/g, " $1").trim();
          const normalizedLabel = label ? `${label[0].toUpperCase()}${label.slice(1)}` : label;
          return `<div><dt>${esc(normalizedLabel)}</dt><dd title="${esc(Array.isArray(value) ? value.join(" · ") : value)}">${esc(Array.isArray(value) ? value.join(" · ") : value)}</dd></div>`;
        }).join("")}</dl>
      </section>
    </div>`;
  }

  function controlResourceEvents(row) {
    const kind = row.kind || "Resource";
    const warning = /review|degraded|stale|failed|warning/i.test(row.status || "");
    const events = /serviceaccount/i.test(kind) ? [
      {
        type: warning ? "Warning" : "Normal",
        reason: warning ? "ReconcilePending" : "Reconciled",
        message: row.message || `${kind} reconciliation is ${row.status || "Ready"}`,
        source: "karmada-controller-manager",
        count: warning ? 2 : 1,
        lastSeen: "8s ago"
      },
      { type: "Normal", reason: "Synced", message: "Member cluster copies are current", source: "karmada-controller-manager", count: 1, lastSeen: "42s ago" },
      { type: "Normal", reason: "TokenProjection", message: "Projected service account token was refreshed", source: "kubelet", count: 3, lastSeen: "11m ago" },
      { type: "Normal", reason: "RBACResolved", message: "Role bindings and effective access were evaluated", source: "authorization-controller", count: 1, lastSeen: "16m ago" }
    ] : [
      {
        type: warning ? "Warning" : "Normal",
        reason: warning ? "ReconcilePending" : "Reconciled",
        message: row.message || `${kind} reconciliation is ${row.status || "current"}`,
        source: "karmada-controller-manager",
        count: warning ? 2 : 1,
        lastSeen: "8s ago"
      },
      { type: "Normal", reason: "PlacementResolved", message: "Target member clusters were resolved", source: "karmada-scheduler", count: 1, lastSeen: "42s ago" },
      { type: "Normal", reason: "ManifestApplied", message: "Desired manifest was applied to member clusters", source: "karmada-controller-manager", count: 3, lastSeen: "6m ago" },
      { type: "Normal", reason: "StatusObserved", message: "Latest resource status was collected", source: "karmada-agent", count: 1, lastSeen: "12m ago" }
    ];
    const warningCount = events.filter((event) => event.type === "Warning").length;
    return `<div class="resource-event-panel">
      <div class="resource-event-summary">
        <div><span>Event history</span><strong>${events.length} recent events</strong></div>
        <span class="resource-event-health ${warningCount ? "warning" : ""}">${warningCount ? `${warningCount} active warning${warningCount > 1 ? "s" : ""}` : "No active warnings"}</span>
        <small>Latest · 8s ago</small>
      </div>
      <div class="resource-event-list" role="table" aria-label="Recent resource events">
        <div class="resource-event-row resource-event-head" role="row"><span>Type</span><span>Event</span><span>Source</span><span>Count</span><span>Last seen</span></div>
        ${events.map((event) => `<div class="resource-event-row" role="row">
          <span class="resource-event-type ${event.type === "Warning" ? "warning" : ""}">${esc(event.type)}</span>
          <div class="resource-event-copy"><strong>${esc(event.reason)}</strong><small title="${esc(event.message)}">${esc(event.message)}</small></div>
          <span class="resource-event-source" title="${esc(event.source)}">${esc(event.source)}</span>
          <span class="resource-event-count">${esc(event.count)}</span>
          <time>${esc(event.lastSeen)}</time>
        </div>`).join("")}
      </div>
    </div>`;
  }

  function openControlResourceDrawer(row, viewId, initialTab = "overview") {
    const config = controlResourceConfigs[viewId];
    const facts = Object.entries(row).filter(([key]) => !["name", "kind", "message", "sensitive"].includes(key)).slice(0, 11);
    const placement = row.placement || row.target || row.cluster || (row.clusters || []).join(" · ") || (config.group === "federation" ? "Control Plane" : "Not scheduled");
    const overview = resourceDetailOverview(row, facts, "Karmada API");
    const tabs = [
      { value: "overview", label: "Overview", contentHtml: overview },
      { value: "placement", label: "Placement", contentHtml: `<div class="control-placement"><span>DESIRED PLACEMENT</span><h3>${placement}</h3><p>${config.group === "federation" ? "This object participates directly in Karmada control-plane reconciliation." : "Propagation state is compared with realized objects in every target member cluster."}</p>${D.clusters.map((cluster) => `<div><b>${cluster.name}</b><span>${String(placement).includes(cluster.name) || placement === "All clusters" ? statusPill(cluster.status === "Stale" ? "Signal stale" : "Realized") : statusPill("Not targeted")}</span><small>${cluster.mode} · ${cluster.freshness}</small></div>`).join("")}</div>` },
      { value: "events", label: "Events", contentHtml: controlResourceEvents(row) },
      { value: "yaml", label: "YAML", contentHtml: `<textarea class="yaml-editor" spellcheck="false" aria-label="YAML manifest" aria-readonly="true" readonly>${controlResourceYaml(row)}</textarea><div class="yaml-actions yaml-readonly-note"><span>Manifest snapshot · read only</span><small>Edit YAML is available from the row Actions menu.</small></div>` }
    ];
    if (window.KD_SHADCN) {
      window.KD_SHADCN.openSheet({
        title: row.name || row.object || config.title,
        description: `${row.namespace ? `${row.namespace} · ` : ""}${config.title}`,
        contentClassName: "detail-drawer control-detail-drawer w-[min(620px,48vw)] min-w-[520px] max-w-none gap-0 overflow-auto p-0 sm:max-w-none",
        headerHtml: `<header class="drawer-head"><div><span class="eyebrow">Resource details</span><h2>${row.name || row.object || config.title}</h2><p>${row.namespace ? `${row.namespace} · ` : ""}${config.title}</p></div></header>`,
        toolbarHtml: "",
        tabs,
        initialTab,
        onMount: (root) => {
          applyLanguage(root);
        }
      });
      return;
    }
    document.querySelector(".drawer-backdrop")?.remove();
    const backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop";
    backdrop.innerHTML = `<aside class="detail-drawer control-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="control-drawer-title"><header class="drawer-head"><div><span class="eyebrow">Resource details</span><h2 id="control-drawer-title">${row.name || row.object || config.title}</h2><p>${row.namespace ? `${row.namespace} · ` : ""}${config.title}</p></div><button class="drawer-close" type="button" aria-label="Close details">×</button></header><div class="drawer-tabs"><button type="button" data-drawer-tab="overview">Overview</button><button type="button" data-drawer-tab="placement">Placement</button><button type="button" data-drawer-tab="events">Events</button><button type="button" data-drawer-tab="yaml">YAML</button></div><div class="drawer-content"><section data-drawer-panel="overview">${overview}</section><section data-drawer-panel="placement"><div class="control-placement"><span>DESIRED PLACEMENT</span><h3>${placement}</h3><p>${config.group === "federation" ? "This object participates directly in Karmada control-plane reconciliation." : "Propagation state is compared with realized objects in every target member cluster."}</p>${D.clusters.map((cluster) => `<div><b>${cluster.name}</b><span>${String(placement).includes(cluster.name) || placement === "All clusters" ? statusPill(cluster.status === "Stale" ? "Signal stale" : "Realized") : statusPill("Not targeted")}</span><small>${cluster.mode} · ${cluster.freshness}</small></div>`).join("")}</div></section><section data-drawer-panel="events">${controlResourceEvents(row)}</section><section data-drawer-panel="yaml"><textarea class="yaml-editor" spellcheck="false" aria-label="YAML manifest" aria-readonly="true" readonly>${controlResourceYaml(row)}</textarea><div class="yaml-actions yaml-readonly-note"><span>Manifest snapshot · read only</span><small>Edit YAML is available from the row Actions menu.</small></div></section></div></aside>`;
    document.body.appendChild(backdrop);
    applyLanguage(backdrop);
    const setTab = (tabId) => {
      backdrop.querySelectorAll("[data-drawer-tab]").forEach((button) => button.classList.toggle("active", button.dataset.drawerTab === tabId));
      backdrop.querySelectorAll("[data-drawer-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.drawerPanel === tabId));
    };
    setTab(initialTab);
    backdrop.querySelector(".drawer-close").addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) backdrop.remove(); });
    backdrop.querySelectorAll("[data-drawer-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.drawerTab)));
  }

  function openServiceAccountAction(action, row) {
    const subject = `system:serviceaccount:${row.namespace || "default"}:${row.name}`;
    if (!window.KD_SHADCN) {
      const spec = controlActionSpecs[action === "enable-automount" ? "disable-automount" : action];
      if (spec) modal(`${spec[0]} · ${row.name}`, spec[1], spec[2], action === "disable-automount");
      return;
    }
    if (action === "token-audit") {
      window.KD_SHADCN.openDialog({
        eyebrow: "Service Account security",
        title: `Token audit · ${row.name}`,
        description: "Review long-lived and projected credentials associated with this Service Account.",
        bodyHtml: `<div class="service-account-action-summary"><div><span>Subject</span><code>${esc(subject)}</code></div><div><span>Token sources</span><strong>${esc(row.secrets || "0")} secret · 2 projected</strong></div><div><span>Last authentication</span><strong>11 minutes ago</strong></div></div><div class="service-account-action-table"><div class="service-account-action-head"><span>Source</span><span>Expiry</span><span>Last used</span><span>Risk</span></div><div><strong>Projected token</strong><span>47m</span><span>11m ago</span><em class="good">Healthy</em></div><div><strong>${esc(row.name)}-token</strong><span>No expiry</span><span>6d ago</span><em class="warning">Review</em></div></div>`,
        confirmLabel: "Run audit",
        onConfirm: () => toast("Token audit completed", `${row.namespace}/${row.name}: 1 long-lived token requires review.`)
      });
      return;
    }
    if (action === "effective-access") {
      window.KD_SHADCN.openDialog({
        eyebrow: "RBAC review",
        title: `Effective access · ${row.name}`,
        description: `Resolved permissions for ${subject}.`,
        bodyHtml: `<div class="service-account-access-summary"><span><b>12</b><small>allowed</small></span><span><b>3</b><small>roles</small></span><span><b>2</b><small>bindings</small></span></div><div class="service-account-action-table access"><div class="service-account-action-head"><span>Resource</span><span>Verbs</span><span>Scope</span></div><div><strong>pods</strong><span>get · list · watch</span><span>${esc(row.namespace || "default")}</span></div><div><strong>configmaps</strong><span>get · update</span><span>${esc(row.namespace || "default")}</span></div><div><strong>services</strong><span>get · list</span><span>${esc(row.namespace || "default")}</span></div></div>`,
        confirmLabel: "Recalculate access",
        onConfirm: () => toast("Effective access recalculated", `RBAC bindings for ${row.namespace}/${row.name} are current.`)
      });
      return;
    }
    if (action === "disable-automount" || action === "enable-automount") {
      const disabling = action === "disable-automount";
      window.KD_SHADCN.openDialog({
        destructive: disabling,
        title: `${disabling ? "Disable" : "Enable"} token automount for ${row.name}?`,
        description: disabling
          ? "New Pods using this Service Account will not receive a Kubernetes API token automatically. Explicit projected token volumes are unchanged."
          : "New Pods using this Service Account may receive a Kubernetes API token unless the Pod overrides this setting.",
        details: [
          { label: "Namespace", value: row.namespace || "default" },
          { label: "Current", value: row.automount || "Inherited" },
          { label: "Affected Pods", value: row.name === "default" ? "2 active workloads" : "1 active workload" }
        ],
        note: "Existing Pods keep their current mounted token until they are recreated.",
        confirmLabel: `${disabling ? "Disable" : "Enable"} automount`,
        onConfirm: () => {
          row.automount = disabling ? "Disabled" : "Enabled";
          renderControlResourceRoute();
          toast(`Token automount ${disabling ? "disabled" : "enabled"}`, `${row.namespace}/${row.name} now reports ${row.automount}.`);
        }
      });
    }
  }

  function handleControlResourceAction(action, row, viewId) {
    if (action === "logs") return openPodLogsWorkspace(row);
    if (action === "exec") return openPodTerminalWorkspace(row);
    if (action === "delete-resource" || action === "delete-pod") return openDeleteControlResourceDialog(row, viewId);
    if (viewId === "service-accounts" && ["token-audit", "effective-access", "disable-automount", "enable-automount"].includes(action)) return openServiceAccountAction(action, row);
    if (action === "open-cluster") {
      const cluster = row.cluster || row.name || (row.clusters || [])[0];
      if (D.clusters.some((item) => item.name === cluster)) location.href = `member-cluster.html?cluster=${cluster}#overview`;
      else modal("Member cluster workspace", "Choose one of the target member clusters before opening its resource workspace.", "Choose cluster");
      return;
    }
    const spec = controlActionSpecs[action];
    if (!spec) return;
    modal(`${spec[0]} · ${row.name || controlResourceConfigs[viewId].title}`, spec[1], spec[2], Boolean(spec[3]));
  }

  function podContainerName(row) {
    if (row.name.startsWith("coredns")) return "coredns";
    if (row.name.startsWith("metrics-server")) return "metrics-server";
    return row.name.split("-")[0] || "container";
  }

  function createPodOperationWorkspace(kind, row, content, onMount) {
    const namespace = row.namespace || "default";
    const cluster = row.placement || "member1";
    const operationLabel = kind === "logs" ? "Pod logs" : "Pod terminal";
    if (window.KD_SHADCN?.openWorkspaceDialog) {
      const initializeWorkspace = (root) => {
        if (!root || root.dataset.podWorkspaceMounted === "true") return;
        root.dataset.podWorkspaceMounted = "true";
        applyLanguage(root);
        initShadcnSelects(root);
        onMount?.(root);
      };
      window.KD_SHADCN.openWorkspaceDialog({
        eyebrow: operationLabel,
        title: row.name,
        description: `${namespace} namespace · ${cluster}`,
        bodyHtml: content,
        onMount: initializeWorkspace
      });
      const initializeRenderedDialog = (attempt = 0) => {
        const root = document.querySelector('[data-slot="dialog-content"].pod-operation-dialog');
        if (root) initializeWorkspace(root);
        else if (attempt < 4) requestAnimationFrame(() => initializeRenderedDialog(attempt + 1));
      };
      requestAnimationFrame(() => initializeRenderedDialog());
      return;
    }
    document.querySelector(".pod-operation-backdrop")?.remove();
    const trigger = document.activeElement;
    const backdrop = document.createElement("div");
    backdrop.className = `pod-operation-backdrop pod-${kind}-backdrop`;
    backdrop.innerHTML = `<section class="pod-operation-dialog" role="dialog" aria-modal="true" aria-labelledby="pod-operation-title">
      <header class="pod-operation-head"><div><h2 id="pod-operation-title">${kind === "logs" ? "Pod logs" : "Pod terminal"}</h2><p>${esc(row.name)}</p></div><button class="drawer-close" type="button" data-pod-operation-close aria-label="Close">${closeIcon()}</button></header>
      <div class="pod-operation-body">${content}</div>
    </section>`;
    document.body.appendChild(backdrop);
    applyLanguage(backdrop);
    initShadcnSelects(backdrop);
    const close = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
    const onKeydown = (event) => { if (event.key === "Escape") close(); };
    backdrop.querySelector("[data-pod-operation-close]").addEventListener("click", close);
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    document.addEventListener("keydown", onKeydown);
    requestAnimationFrame(() => backdrop.querySelector("input, button, select")?.focus());
    onMount?.(backdrop);
  }

  function openPodLogsWorkspace(row) {
    const container = podContainerName(row);
    const initialLogs = [
      `[10:41:02.184] INFO  starting ${container} in namespace ${row.namespace || "default"}`,
      `[10:41:02.311] INFO  configuration loaded successfully`,
      `[10:41:02.527] INFO  listening on 0.0.0.0:${container === "nginx" ? "80" : "4443"}`,
      `[10:41:05.104] INFO  readiness probe succeeded`,
      `[10:42:18.772] INFO  request completed method=GET path=/healthz status=200 duration=2ms`,
      `[10:43:01.209] INFO  request completed method=GET path=/readyz status=200 duration=1ms`,
      `[10:44:16.893] INFO  metrics collected cpu=${row.cpu || "12m"} memory=${row.memory || "32 MiB"}`,
      `[10:45:32.415] INFO  request completed method=GET path=/healthz status=200 duration=2ms`
    ];
    createPodOperationWorkspace("logs", row, `<section class="log-workspace">
      <div class="detail-toolbar pod-log-toolbar">
        ${shadcnSelect("pod-log-cluster", "Cluster", [row.placement || "member1"], row.placement || "member1", "data-log-cluster", "pod-operation-select pod-log-cluster")}
        ${shadcnSelect("pod-log-container", "Container", [container], container, "data-log-container", "pod-operation-select pod-log-container")}
        ${shadcnSelect("pod-log-range", "Range", [{ value: "5", label: "Last 5 minutes" }, { value: "15", label: "Last 15 minutes" }, { value: "60", label: "Last hour" }], "15", "data-log-range", "pod-operation-select pod-log-range")}
        <div class="pod-log-search-host" data-log-search-host></div>
        <button class="shadcn-button shadcn-button-outline active" type="button" data-log-follow aria-pressed="true">Follow on</button>
        <button class="shadcn-button shadcn-button-outline" type="button" data-log-refresh>Refresh</button><button class="shadcn-button shadcn-button-outline" type="button" data-log-clear>Clear</button>
      </div>
      <pre class="detail-log" data-log-output aria-live="polite"></pre>
      <footer><span data-log-count></span><span data-log-state>Connected · following new output</span></footer>
    </section>`, (backdrop) => {
      const output = backdrop.querySelector("[data-log-output]");
      const count = backdrop.querySelector("[data-log-count]");
      const state = backdrop.querySelector("[data-log-state]");
      const searchApi = window.mountShadcnSearchInput?.(backdrop.querySelector("[data-log-search-host]"), {
        ariaLabel: "Filter log output",
        className: "pod-log-search",
        clearable: true,
        placeholder: "Filter log output",
      });
      const follow = backdrop.querySelector("[data-log-follow]");
      let logs = [...initialLogs];
      let following = true;
      const render = () => {
        const query = (searchApi?.value || "").trim().toLowerCase();
        const visible = logs.filter((line) => !query || line.toLowerCase().includes(query));
        output.textContent = visible.length ? visible.join("\n") : query ? "No log lines match this filter." : "Log output cleared. Refresh to load the latest lines.";
        count.textContent = `${visible.length} of ${logs.length} lines`;
        if (following) output.scrollTop = output.scrollHeight;
      };
      if (searchApi) searchApi.onValueChange = render;
      follow.addEventListener("click", () => {
        following = !following;
        follow.classList.toggle("active", following);
        follow.setAttribute("aria-pressed", String(following));
        follow.textContent = `Follow ${following ? "on" : "off"}`;
        state.textContent = following ? "Connected · following new output" : "Connected · stream paused";
        render();
      });
      backdrop.querySelector("[data-log-refresh]").addEventListener("click", () => {
        const now = new Date().toLocaleTimeString("en-GB", { hour12: false });
        logs.push(`[${now}.000] INFO  log stream refreshed pod=${row.name} container=${container}`);
        state.textContent = following ? "Connected · following new output" : "Connected · latest output loaded";
        render();
      });
      backdrop.querySelector("[data-log-clear]").addEventListener("click", () => { logs = []; render(); });
      backdrop.querySelector("[data-log-range]").addEventListener("change", (event) => {
        state.textContent = `Connected · loaded the last ${event.target.value} minutes`;
      });
      render();
      requestAnimationFrame(() => searchApi?.focus());
    });
  }

  function openPodTerminalWorkspace(row) {
    const container = podContainerName(row);
    createPodOperationWorkspace("terminal", row, `<div class="pod-terminal-controls">
      ${shadcnSelect("pod-terminal-cluster", "Cluster", [row.placement || "member1"], row.placement || "member1", "data-pod-terminal-cluster", "pod-operation-select")}
      ${shadcnSelect("pod-terminal-container", "Container", [container], container, "data-pod-terminal-container", "pod-operation-select")}
      ${shadcnSelect("pod-terminal-shell", "Shell", ["/bin/sh", "/bin/bash"], "/bin/sh", "data-pod-shell", "pod-operation-select")}
      <span class="pod-session-state"><i></i>Connected</span>
    </div><section class="detail-terminal pod-detail-terminal">
      <header><span class="terminal-live"></span><b>${esc(container)}@${esc(row.name)}</b><small>Interactive session</small></header>
      <div data-pod-terminal-output><span>Connected to</span> ${row.name} (${row.namespace || "default"}) · ${row.placement || "member1"}\n<span>Container</span>: ${container} · <span>type "help" for available commands.</span></div>
      <form data-pod-terminal-form><span>$</span><input data-pod-terminal-input aria-label="Terminal command" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="submit">Run</button></form>
    </section>`, (backdrop) => {
      const output = backdrop.querySelector("[data-pod-terminal-output]");
      const form = backdrop.querySelector("[data-pod-terminal-form]");
      const input = backdrop.querySelector("[data-pod-terminal-input]");
      const shell = backdrop.querySelector("[data-pod-shell]");
      const history = [];
      let historyIndex = 0;
      const responses = (command) => {
      const normalized = command.trim().toLowerCase();
      if (normalized === "help") return "Available commands: help, clear, pwd, whoami, date, env, ls, cat /etc/hostname, ps";
      if (normalized === "pwd") return "/app";
      if (normalized === "whoami") return "root";
      if (normalized === "date") return new Date().toString();
      if (normalized === "env") return `HOSTNAME=${row.name}\nPOD_NAMESPACE=${row.namespace || "default"}\nKUBERNETES_SERVICE_HOST=10.96.0.1`;
      if (normalized === "ls" || normalized === "ls -la") return "bin  dev  etc  lib  proc  root  run  tmp  usr  var";
      if (normalized === "cat /etc/hostname") return row.name;
      if (normalized === "ps" || normalized === "ps aux") return `PID   USER     COMMAND\n1     root     ${container}\n24    root     ${normalized}`;
      return `${shell.value}: ${command}: command not found`;
      };
      const append = (text) => {
      output.append(document.createTextNode(`\n${text}`));
      output.scrollTop = output.scrollHeight;
      };
      const runCommand = () => {
      const command = input.value.trim();
      if (!command) return;
      history.push(command);
      historyIndex = history.length;
      input.value = "";
      if (command.toLowerCase() === "clear") output.textContent = "";
      else append(`$ ${command}\n${responses(command)}`);
      };
      form.addEventListener("submit", (event) => {
      event.preventDefault();
      runCommand();
      });
      input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runCommand();
        return;
      }
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      historyIndex = event.key === "ArrowUp" ? Math.max(0, historyIndex - 1) : Math.min(history.length, historyIndex + 1);
      input.value = historyIndex === history.length ? "" : history[historyIndex];
      input.setSelectionRange(input.value.length, input.value.length);
      });
      shell.addEventListener("change", () => append(`Shell changed to ${shell.value}`));
      input.focus();
    });
  }

  function openDeleteControlResourceDialog(row, viewId) {
    const resourceKind = row.kind || "Resource";
    const resourceScope = row.namespace || "Cluster-scoped";
    const placement = row.placement || "Control Plane";
    const isPod = resourceKind === "Pod";
    const description = isPod
      ? `Delete ${row.name} from ${placement}. Its owning workload may recreate it automatically.`
      : `Delete ${resourceKind} ${row.name} from the control plane. Propagated copies in ${placement} will be reconciled.`;
    const removalNote = isPod
      ? "Its owning workload may recreate this Pod."
      : "Related bindings and member-cluster copies may be removed by reconciliation.";
    const removeResource = () => {
      const config = controlResourceConfigs[viewId];
      const resources = D.controlResources[config?.dataKey] || [];
      const index = resources.findIndex((item) => item === row || (item.name === row.name && item.namespace === row.namespace));
      if (index < 0) return false;
      resources.splice(index, 1);
      renderControlResourceRoute();
      toast(`${resourceKind} deletion queued`, `${resourceScope}/${row.name} was removed from the current prototype session.`);
      return true;
    };
    if (window.KD_SHADCN) {
      window.KD_SHADCN.openDialog({
        eyebrow: "Destructive action",
        title: `Delete ${resourceKind}`,
        description,
        details: [
          { label: "Namespace", value: resourceScope },
          { label: "Placement", value: placement },
          { label: "Status", value: row.status || "Unknown" }
        ],
        note: removalNote,
        confirmLabel: `Delete ${resourceKind}`,
        confirmationLabel: "Type",
        confirmationValue: row.name,
        destructive: true,
        onMount: (root) => applyLanguage(root),
        onConfirm: removeResource
      });
      return;
    }
    document.querySelector(".pod-delete-backdrop")?.remove();
    const trigger = document.activeElement;
    const backdrop = document.createElement("div");
    backdrop.className = "detail-dialog-backdrop pod-delete-backdrop";
    backdrop.innerHTML = `<section class="detail-dialog pod-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="pod-delete-title" aria-describedby="pod-delete-description">
      <header><div><h3 id="pod-delete-title">Delete ${esc(resourceKind)}</h3></div><button type="button" data-dialog-close aria-label="Close">×</button></header>
      <form data-pod-delete-form><div class="detail-dialog-body"><p id="pod-delete-description">${esc(description)}</p>
        <dl class="pod-delete-summary"><div><dt>Namespace</dt><dd>${esc(resourceScope)}</dd></div><div><dt>Placement</dt><dd>${esc(placement)}</dd></div><div><dt>Status</dt><dd>${esc(row.status || "Unknown")}</dd></div></dl>
        <label for="pod-delete-confirm">Type <code>${esc(row.name)}</code> to confirm<input id="pod-delete-confirm" data-pod-delete-input autocomplete="off" spellcheck="false"></label><small class="pod-delete-note">${esc(removalNote)}</small>
      </div><footer><button class="btn" type="button" data-dialog-close>Cancel</button><button class="btn danger" type="submit" data-pod-delete-confirm disabled>Delete ${esc(resourceKind)}</button></footer></form>
    </section>`;
    document.body.appendChild(backdrop);
    applyLanguage(backdrop);
    const input = backdrop.querySelector("[data-pod-delete-input]");
    const confirm = backdrop.querySelector("[data-pod-delete-confirm]");
    const close = () => {
      document.removeEventListener("keydown", onKeydown);
      backdrop.remove();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
    const onKeydown = (event) => { if (event.key === "Escape") close(); };
    backdrop.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", close));
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
    document.addEventListener("keydown", onKeydown);
    input.addEventListener("input", () => { confirm.disabled = input.value !== row.name; });
    backdrop.querySelector("[data-pod-delete-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      if (input.value !== row.name) return;
      if (!removeResource()) return;
      close();
    });
    input.focus();
  }

  function openControlEditor(viewId, row = null) {
    const config = controlResourceConfigs[viewId] || { title: "Resource", group: "resource" };
    const exemplar = D.controlResources[config.dataKey]?.[0];
    const draft = row || { kind: exemplar?.kind || config.title.replace(/ies$/, "y").replace(/s$/, ""), name: "new-resource", namespace: config.namespace ? "default" : undefined };
    if (window.KD_SHADCN) {
      window.KD_SHADCN.openYamlDialog({
        eyebrow: `Control Plane / ${config.group}`,
        title: row ? `Edit ${row.name}` : config.create || `Import ${config.title}`,
        description: "Review and update the resource manifest, then apply the changes.",
        yaml: controlResourceYaml(draft),
        applyLabel: "Apply",
        onApply: () => toast(`${config.title} applied`, "The YAML changes were applied to the current prototype session.")
      });
      return;
    }
    document.querySelector(".modal-backdrop")?.remove();
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<section class="modal control-editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><h2 id="editor-title">${row ? `Edit ${row.name}` : config.create || `Import ${config.title}`}</h2><p>Review and update the resource manifest, then apply the changes.</p><textarea class="yaml-editor" spellcheck="false">${controlResourceYaml(draft)}</textarea><div class="modal-actions"><button class="btn" type="button" data-editor-close>Cancel</button><button class="btn primary" type="button" data-editor-apply>Apply</button></div></section>`;
    document.body.appendChild(backdrop);
    applyLanguage(backdrop);
    backdrop.querySelector("[data-editor-close]").addEventListener("click", () => backdrop.remove());
    backdrop.querySelector("[data-editor-apply]").addEventListener("click", () => { backdrop.remove(); toast(`${config.title} applied`, "The YAML changes were applied to the current prototype session."); });
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) backdrop.remove(); });
  }

  function controlResourceRouteFromLocation() {
    return new URLSearchParams(location.search).get("resource") || location.hash.replace(/^#/, "") || "pods";
  }

  function mountControlColumns(viewId) {
    const mountPoint = document.querySelector("[data-control-columns-root]");
    const config = controlResourceConfigs[viewId];
    if (!mountPoint || !config || !window.mountShadcnControlColumns) return;
    window.mountShadcnControlColumns(mountPoint, {
      columns: config.columns,
      title: config.title,
      viewId,
    });
  }

  window.addEventListener("shadcn-columns-ready", () => {
    if (page === "resources") mountControlColumns(controlResourceRouteFromLocation());
  });

  function renderControlResourceRoute() {
    closeTableActionMenu();
    const requested = controlResourceRouteFromLocation();
    const visibleControlViews = controlResourceGroups.flatMap((group) => group.views.map(([id]) => id));
    const viewId = visibleControlViews.includes(canonicalControlView(requested)) ? requested : "pods";
    const nav = document.querySelector("[data-rail-navigation]");
    const root = document.querySelector("[data-control-view-root]");
    if (!nav || !root) return;
    const breadcrumb = document.querySelector(".breadcrumb");
    if (breadcrumb) {
      const destination = controlResourceConfigs[viewId].title;
      breadcrumb.textContent = `Resource management / ${destination}`;
      applyLanguage(breadcrumb);
    }
    nav.innerHTML = controlResourceSideNav(viewId);
    root.innerHTML = controlResourceTableView(viewId);
    applyLanguage(nav);
    applyLanguage(root);
    bindControlResourceFilters();
    mountControlColumns(viewId);
  }

  function initControlResourceWorkspace() {
    if (!new URLSearchParams(location.search).has("resource")) {
      const canonicalUrl = new URL(location.href);
      canonicalUrl.searchParams.set("resource", location.hash.replace(/^#/, "") || "pods");
      canonicalUrl.hash = "";
      history.replaceState({ resource: canonicalUrl.searchParams.get("resource") }, "", canonicalUrl);
    }
    renderControlResourceRoute();
    window.addEventListener("popstate", renderControlResourceRoute);
    document.addEventListener("click", (event) => {
      const route = event.target.closest("[data-control-view]");
      if (route) {
        event.preventDefault();
        const next = route.dataset.controlView;
        if (controlResourceRouteFromLocation() === next) renderControlResourceRoute();
        else {
          const nextUrl = new URL(location.href);
          nextUrl.searchParams.set("resource", next);
          nextUrl.hash = "";
          history.pushState({ resource: next }, "", nextUrl);
          renderControlResourceRoute();
        }
        return;
      }
      const menuTrigger = event.target.closest("[data-control-menu]");
      if (menuTrigger) {
        event.stopPropagation();
        const source = menuTrigger.dataset.controlSource;
        const index = Number(menuTrigger.dataset.controlMenu || 0);
        const config = controlResourceConfigs[source];
        const row = D.controlResources[config?.dataKey]?.[index];
        if (row) openControlActionMenu(menuTrigger, row, index, source);
        return;
      }
      const action = event.target.closest("[data-control-action]");
      if (!action) {
        if (!event.target.closest("[data-table-action-menu]")) closeTableActionMenu();
        return;
      }
      closeTableActionMenu();
      const actionId = action.dataset.controlAction;
      const viewId = controlResourceRouteFromLocation();
      if (actionId === "refresh") {
        return window.KD_REFRESH.run(action, () => {
          toast("Control-plane discovery refreshed", "Karmada API resources and member realization state are current.");
        });
      }
      if (actionId === "import") {
        location.href = `create-resource.html?mode=yaml&kind=${encodeURIComponent(viewId)}`;
        return;
      }
      if (actionId === "create") {
        location.href = `create-resource.html?kind=${encodeURIComponent(action.dataset.controlSource || viewId)}`;
        return;
      }
      if (["logs", "exec", "delete-pod", "delete-resource", "open-cluster", "enable-automount"].includes(actionId) || controlActionSpecs[actionId]) {
        const source = action.dataset.controlSource;
        const index = Number(action.dataset.controlIndex || 0);
        const config = controlResourceConfigs[source];
        const row = D.controlResources[config?.dataKey]?.[index];
        if (row) handleControlResourceAction(actionId, row, source);
        return;
      }
      if (["inspect", "edit"].includes(actionId)) {
        const source = action.dataset.controlSource;
        const index = Number(action.dataset.controlIndex || 0);
        const config = controlResourceConfigs[source];
        const row = D.controlResources[config?.dataKey]?.[index];
        if (row) actionId === "edit" ? openControlEditor(source, row) : openControlResourceDrawer(row, source);
      }
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeTableActionMenu(); });
  }

  function memberGroupFor(viewId) {
    return memberNavGroups.find((group) => group.views.some(([id]) => id === viewId)) || memberNavGroups[0];
  }

  function memberViewControl(viewId, label, active, primary = false) {
    const className = active ? "active" : "";
    if (page === "create") {
      const content = primary ? `<span class="nav-signal">${navigationIcon(viewId)}</span><span class="nav-label">${label}</span>` : `<span>${label}</span>`;
      const tooltip = primary ? ` data-tooltip="${label}" data-tooltip-side="right" data-rail-tooltip` : "";
      return `<a href="member-cluster.html?cluster=${encodeURIComponent(D.member.name)}#${viewId}" class="${className}" aria-label="${label}"${tooltip}>${content}</a>`;
    }
    if (primary) return `<button type="button" data-member-view="${viewId}" class="${className}" data-tooltip="${label}" data-tooltip-side="right" data-rail-tooltip aria-label="${label}"><span class="nav-signal">${navigationIcon(viewId)}</span><span class="nav-label">${label}</span></button>`;
    return `<button type="button" data-member-view="${viewId}" class="${className}"><span>${label}</span></button>`;
  }

  function memberSideNav(viewId) {
    const activeGroup = memberGroupFor(viewId);
    return `<div class="member-resource-nav">
      <div class="nav-group">Cluster workspace</div>
      <nav class="primary-nav member-overview-link" aria-label="Member cluster workspace">${memberNavGroups.slice(0, 2).map((group) => memberViewControl(group.id, group.label, viewId === group.id, true)).join("")}</nav>
      <div class="nav-group resource-management-label">Resources</div>
      <div class="resource-section-list">${memberNavGroups.slice(2).map((group) => {
        const open = group.id === activeGroup.id;
        return `<section class="resource-nav-group ${open ? "open" : ""}" data-state="${open ? "open" : "closed"}" data-resource-nav-group data-resource-keywords="${group.label.toLowerCase()} ${group.views.map(([, label]) => label.toLowerCase()).join(" ")}">
          <button class="resource-group-trigger ${open ? "active" : ""}" type="button" data-member-group-toggle="${group.id}" data-tooltip="${group.label}" data-tooltip-side="right" data-rail-tooltip aria-label="${group.label}" aria-controls="member-group-${group.id}" aria-expanded="${open}"><span class="nav-signal">${navigationIcon(group.id)}</span><span class="nav-label">${group.label}</span>${chevronDownIcon()}</button>
          <div class="resource-group-links" id="member-group-${group.id}" role="region" aria-hidden="${!open}" ${open ? "" : "inert"}><div class="resource-group-links-inner">${group.views.map(([id, label]) => memberViewControl(id, label, id === viewId)).join("")}</div></div>
        </section>`;
      }).join("")}</div>
    </div>`;
  }

  function renderMemberCell(row, column, rowIndex, viewId) {
    const [key, _label, type] = column;
    const value = key === "scheduling" ? (row.unschedulable ? "Cordoned" : "Schedulable") : row[key] ?? "—";
    const displayValue = Array.isArray(value) ? value.join(" · ") : String(value);
    if (type === "name") return `<button type="button" class="table-name" data-member-action="inspect" data-member-index="${rowIndex}" data-member-source="${viewId}">${esc(displayValue)}</button>`;
    if (type === "status") return statusPill(String(value));
    if (type === "tags") return `<div class="tag-list">${(Array.isArray(value) ? value : [value]).map((item) => `<span class="data-tag">${esc(item)}</span>`).join("")}</div>`;
    if (type === "tag") return `<span class="data-tag">${esc(displayValue)}</span>`;
    if (type === "metric-cpu" || type === "metric-memory") {
      const metric = type === "metric-cpu" ? "cpu" : "memory";
      const percent = Math.max(0, Math.min(100, Number(row[`${metric}Percent`] || 0)));
      const requestPercent = Number(row[`${metric}RequestPercent`] || 0);
      const request = row[`${metric}Request`] || "Not set";
      const limit = row[`${metric}Limit`] || (viewId === "nodes" ? "Allocatable" : "Not set");
      const level = percent > 90 ? "critical" : percent > 60 ? "warning" : "normal";
      return `<div class="member-metric-cell ${level}" title="Usage ${value} · Request ${request} · ${viewId === "nodes" ? "Allocatable" : "Limit"} ${limit}" aria-label="${metric} usage ${value}"><span class="member-metric-track"><i style="--metric:${percent}%"></i>${requestPercent ? `<em style="--request:${requestPercent}%"></em>` : ""}</span><b>${value}</b></div>`;
    }
    if (type === "mono") return `<span class="mono">${esc(displayValue)}</span>`;
    return `<span class="cell-text">${esc(displayValue)}</span>`;
  }

  function memberTableView(viewId) {
    const config = memberTableConfigs[viewId];
    const rows = D.memberResources[config.dataKey] || [];
    const namespaceOptions = [...new Set(rows.map((row) => row.namespace).filter(Boolean))];
    const tableRows = rows.map((row, rowIndex) => `<tr data-search="${Object.values(row).flat().join(" ").toLowerCase()}" data-namespace="${row.namespace || ""}">${config.columns.map((column) => `<td>${renderMemberCell(row, column, rowIndex, viewId)}</td>`).join("")}<td class="table-actions-cell"><button class="row-action icon-action table-action-trigger" type="button" data-member-menu="${rowIndex}" data-member-source="${viewId}" aria-label="Actions for ${esc(row.name || "resource")}" aria-haspopup="menu" aria-expanded="false">${actionIcon("more")}</button></td></tr>`).join("");
    const description = config.description.replace(/\s+in member1\.?$/i, ".").replace(/\s+available in member1\.?$/i, ".");
    return `<section class="member-view"><header class="member-view-header"><div><h2>${config.title}</h2><p>${description}</p><div class="member-view-meta">${statusPill(D.member.status)}<span>Data current</span><i></i><span>Last sync ${D.member.lastSync}</span></div></div><div class="header-actions">${refreshButton("Refresh", 'data-member-action="refresh"')}${config.create ? `<button class="btn primary" type="button" data-member-action="create">${config.create}</button>` : ""}</div></header>
      <div class="toolbar member-toolbar">${searchField("Search name, label, or status", "data-member-search")} ${config.namespace ? `<select class="select" data-member-namespace aria-label="Namespace"><option value="">All namespaces</option>${namespaceOptions.map((namespace) => `<option>${namespace}</option>`).join("")}</select>` : ""}<div class="member-toolbar-actions"><button class="row-action" type="button" data-member-action="columns">Columns</button></div></div>
      <div class="data-panel member-table-wrap"><table class="data-table member-table"><thead><tr>${config.columns.map((column) => `<th>${column[1]}</th>`).join("")}<th class="table-actions-header">Actions</th></tr></thead><tbody data-member-filter-body>${tableRows}</tbody></table></div>
      <footer class="table-footer"><span data-member-showing>Showing ${rows.length} of ${rows.length}</span>${rows.length > 10 ? `<span>Rows per page <b>10</b></span>` : ""}</footer></section>`;
  }

  function memberOverviewView() {
    const member = D.member;
    const nodes = D.memberResources.nodes || [];
    const pods = D.memberResources.pods || [];
    const events = D.memberResources.events || [];
    const readyNodes = nodes.filter((node) => node.status === "Ready").length;
    const schedulableNodes = nodes.filter((node) => !node.unschedulable).length;
    const runningPods = pods.filter((pod) => pod.status === "Running").length;
    const podRestarts = pods.reduce((total, pod) => total + Number(pod.restarts || 0), 0);
    const warningEvents = events.filter((event) => /warning/i.test(event.eventType || event.type || "")).length;
    return `<header class="member-view-header"><div><span class="eyebrow">Member Cluster operations / ${member.name}</span><h2>Operational overview</h2><p>Operate this Kubernetes cluster directly: inspect nodes, workloads, signals, and recent events.</p></div><div class="header-actions">${refreshButton("Refresh signals", 'data-member-action="refresh"')}</div></header>
      <section class="member-overview-grid"><article class="panel member-health"><div class="status-row"><span>Member Cluster health</span><span>SYNC ${member.lastSync.toUpperCase()}</span></div><div class="member-health-title"><span class="dot"></span>${member.status}</div><p>Push connection is current. Kubernetes objects and resource metrics are both inside freshness targets.</p><dl class="member-facts"><div><dt>Sync mode</dt><dd>${member.syncMode}</dd></div><div><dt>Kubernetes</dt><dd>${member.version}</dd></div><div><dt>Region</dt><dd>${member.region}</dd></div></dl></article>
        <article class="panel member-capacity"><div class="panel-head"><strong>Allocated capacity</strong><span class="meta">LIVE METRICS</span></div><div class="member-capacity-list"><div><span>CPU <b>${member.cpu.percent}%</b></span><small>${member.cpu.used} / ${member.cpu.total}</small><div class="meter"><i style="--value:${member.cpu.percent}%"></i></div></div><div><span>Memory <b>${member.memory.percent}%</b></span><small>${member.memory.used} / ${member.memory.total}</small><div class="meter"><i style="--value:${member.memory.percent}%"></i></div></div><div><span>Pods <b>${member.pods.used} / ${member.pods.total}</b></span><small>${Math.round(member.pods.used / member.pods.total * 100)}% allocated</small><div class="meter"><i style="--value:${member.pods.used / member.pods.total * 100}%"></i></div></div></div></article></section>
      <section class="panel member-operations-panel"><div class="panel-head"><div><strong>Cluster operations</strong><small>Kite-inspired entry points for day-to-day diagnosis in this member cluster.</small></div><span class="meta">DIRECT CLUSTER SCOPE</span></div><div class="member-operation-grid">
        <button type="button" data-member-view="nodes"><span class="member-operation-icon">${navigationIcon("cluster")}</span><span><strong>Nodes</strong><small>${readyNodes} ready · ${schedulableNodes} schedulable</small></span><i>Open →</i></button>
        <button type="button" data-member-view="pods"><span class="member-operation-icon">${navigationIcon("workload")}</span><span><strong>Workload health</strong><small>${runningPods} running · ${podRestarts} restarts</small></span><i>Inspect →</i></button>
        <button type="button" data-member-view="events"><span class="member-operation-icon">${navigationIcon("states")}</span><span><strong>Warning events</strong><small class="${warningEvents ? "text-warn" : "text-good"}">${warningEvents ? `${warningEvents} warning${warningEvents === 1 ? "" : "s"} need review` : "No active warnings"}</small></span><i>Review →</i></button>
        <button type="button" data-member-view="metrics"><span class="member-operation-icon">${navigationIcon("metrics")}</span><span><strong>Metrics</strong><small>Fresh · 15s resolution</small></span><i>Explore →</i></button>
      </div></section>
      <section class="member-overview-lower"><article class="panel"><div class="panel-head"><strong>Resource inventory</strong><span class="meta">29 RESOURCE VIEWS</span></div><div class="inventory-grid"><button data-member-view="pods"><b>3</b><span>Pods</span><small>3 running</small></button><button data-member-view="deployments"><b>3</b><span>Deployments</span><small>3 ready</small></button><button data-member-view="services"><b>3</b><span>Services</span><small>4 endpoints</small></button><button data-member-view="gateways"><b>1</b><span>Gateway</span><small>2 routes</small></button><button data-member-view="helm-releases"><b>2</b><span>Helm releases</span><small>2 deployed</small></button><button data-member-view="events"><b>2</b><span>Recent events</span><small class="text-warn">1 warning</small></button></div></article>
        <article class="panel"><div class="panel-head"><strong>Node realization</strong><span class="meta">1 / 1 READY</span></div><div class="node-summary"><div><span class="node-glyph"></span><div><button class="table-name" data-member-action="inspect" data-member-source="nodes" data-member-index="0">${D.memberResources.nodes[0].name}</button><small>Ubuntu 24.04 · containerd 2.0.4</small></div>${statusPill("Ready")}</div><dl><div><dt>CPU</dt><dd>6.56%</dd></div><div><dt>Memory</dt><dd>0.76%</dd></div><div><dt>Pods</dt><dd>12 / 110</dd></div><div><dt>Address</dt><dd>192.168.10.11</dd></div></dl></div></article></section>`;
  }

  function memberPage() {
    return `<div class="member-workspace-shell"><div class="member-view-host" data-member-workspace-root></div></div>`;
  }

  const createKindAliases = {
    pods: "Pod", deployments: "Deployment", statefulsets: "StatefulSet", daemonsets: "DaemonSet", jobs: "Job", cronjobs: "CronJob",
    services: "Service", ingress: "Ingress", configmaps: "ConfigMap", secrets: "Secret", pvcs: "PersistentVolumeClaim", pvs: "PersistentVolume", namespaces: "Namespace",
    "service-accounts": "ServiceAccount", roles: "Role", "role-bindings": "RoleBinding", "cluster-roles": "ClusterRole", "cluster-role-bindings": "ClusterRoleBinding", crds: "CustomResourceDefinition",
    "propagation-policies": "PropagationPolicy", "cluster-propagation-policies": "ClusterPropagationPolicy",
    "network-policies": "NetworkPolicy", hpas: "HorizontalPodAutoscaler", pdbs: "PodDisruptionBudget", gateways: "Gateway", "http-routes": "HTTPRoute",
    "helm-releases": "HelmRelease", "helm-charts": "HelmRepository", "storage-classes": "StorageClass", clusters: "Cluster",
    "override-policies": "OverridePolicy", "cluster-override-policies": "ClusterOverridePolicy", "multi-cluster-services": "MultiClusterService", "service-exports": "ServiceExport"
  };
  const policyKinds = new Set(["PropagationPolicy", "ClusterPropagationPolicy", "OverridePolicy", "ClusterOverridePolicy"]);

  function isPolicyKind(kind) {
    return policyKinds.has(kind);
  }

  function policyWorkspaceHref(kind) {
    const params = new URLSearchParams();
    if (kind.includes("Override")) params.set("family", "override");
    if (kind.startsWith("Cluster")) params.set("scope", "cluster");
    const query = params.toString();
    return `policies.html${query ? `?${query}` : ""}`;
  }

  function createResourceIdForKind(kind) {
    const route = Object.entries(createKindAliases).find(([resourceId, resourceKind]) => resourceKind === kind && controlResourceConfigs[resourceId]);
    return route?.[0] || "";
  }

  function createResourceListHref(kind) {
    if (isPolicyKind(kind)) return policyWorkspaceHref(kind);
    return `resources.html?resource=${encodeURIComponent(createResourceIdForKind(kind) || "pods")}`;
  }

  const createApiVersions = {
    Pod: "v1", Service: "v1", ConfigMap: "v1", Secret: "v1", Namespace: "v1", ServiceAccount: "v1", PersistentVolumeClaim: "v1", PersistentVolume: "v1",
    Deployment: "apps/v1", StatefulSet: "apps/v1", DaemonSet: "apps/v1", Job: "batch/v1", CronJob: "batch/v1", Ingress: "networking.k8s.io/v1",
    Role: "rbac.authorization.k8s.io/v1", RoleBinding: "rbac.authorization.k8s.io/v1", ClusterRole: "rbac.authorization.k8s.io/v1", ClusterRoleBinding: "rbac.authorization.k8s.io/v1",
    CustomResourceDefinition: "apiextensions.k8s.io/v1",
    NetworkPolicy: "networking.k8s.io/v1", HorizontalPodAutoscaler: "autoscaling/v2", PodDisruptionBudget: "policy/v1",
    Gateway: "gateway.networking.k8s.io/v1", HTTPRoute: "gateway.networking.k8s.io/v1", StorageClass: "storage.k8s.io/v1",
    HelmRelease: "helm.toolkit.fluxcd.io/v2", HelmRepository: "source.toolkit.fluxcd.io/v1", Cluster: "cluster.karmada.io/v1alpha1",
    PropagationPolicy: "policy.karmada.io/v1alpha1", ClusterPropagationPolicy: "policy.karmada.io/v1alpha1", OverridePolicy: "policy.karmada.io/v1alpha1", ClusterOverridePolicy: "policy.karmada.io/v1alpha1",
    MultiClusterService: "networking.karmada.io/v1alpha1", ServiceExport: "multicluster.x-k8s.io/v1alpha1"
  };

  const createKindDescriptions = {
    Pod: "Configure a standalone Pod spec, restart behavior, identity, resources, and container environment.",
    Deployment: "Configure replica rollout, update strategy, revision history, and the managed Pod template.",
    StatefulSet: "Configure stable identity, ordered rollout, headless service, Pod template, and persistent claim template.",
    DaemonSet: "Configure node-wide scheduling, rollout availability, node selection, and the managed Pod template.",
    Job: "Configure finite completions, parallelism, retry limits, deadline, and the Job Pod template.",
    CronJob: "Configure the cron schedule, concurrency, history limits, deadlines, and nested Job template.",
    Service: "Configure stable service discovery, selectors, ports, protocol, affinity, and traffic policy.",
    Ingress: "Configure ingress class, host and path matching, backend service, and optional TLS termination.",
    ConfigMap: "Configure immutable behavior and non-sensitive key-value configuration data.",
    Secret: "Configure Secret type, immutable behavior, and string data converted by the API server.",
    PersistentVolumeClaim: "Configure a namespaced storage request, access and volume modes, class, and optional pre-binding.",
    PersistentVolume: "Configure cluster storage capacity, access and reclaim policy, class, mode, and volume source.",
    StorageClass: "Configure dynamic provisioning, reclaim and binding policies, expansion, and mount options.",
    ServiceAccount: "Configure workload API credentials, token automount behavior, and registry pull credentials.",
    Namespace: "Configure namespace lifecycle finalizers and Pod Security admission labels.",
    Role: "Configure namespaced RBAC policy rules with API groups, resources, optional names, and verbs.",
    ClusterRole: "Configure cluster-scoped RBAC policy rules with API groups, resources, optional names, and verbs.",
    RoleBinding: "Bind a namespaced Role or ClusterRole to a user, group, or ServiceAccount subject.",
    ClusterRoleBinding: "Bind a ClusterRole to a cluster-wide user, group, or ServiceAccount subject.",
    CustomResourceDefinition: "Define a new API group, scope, resource names, served version, storage version, and structural OpenAPI schema.",
    NetworkPolicy: "Configure selected Pods, isolated traffic directions, ingress peers and ports, and allowed egress ranges.",
    HorizontalPodAutoscaler: "Configure the scale target, replica bounds, and autoscaling/v2 CPU utilization metric.",
    PodDisruptionBudget: "Configure the selected Pods, availability constraint, and unhealthy Pod eviction policy."
  };

  function isCreateClusterScoped(kind) {
    return ["Namespace", "PersistentVolume", "StorageClass", "ClusterRole", "ClusterRoleBinding", "CustomResourceDefinition", "Cluster", "ClusterPropagationPolicy", "ClusterOverridePolicy"].includes(kind);
  }

  function isCreateKindAvailable(kind) {
    if (!createApiVersions[kind]) return false;
    const controlOnly = ["Cluster", "PropagationPolicy", "ClusterPropagationPolicy", "OverridePolicy", "ClusterOverridePolicy", "MultiClusterService", "ServiceExport"];
    return !isMemberScope || !controlOnly.includes(kind);
  }

  function createKindOptions() {
    const groups = [
      ["Workloads", ["Deployment", "StatefulSet", "DaemonSet", "Job", "CronJob", "Pod"]],
      ["Network", ["Service", "Ingress"]],
      ["Configuration", ["ConfigMap", "Secret"]],
      ["Storage", ["PersistentVolumeClaim", "PersistentVolume", "StorageClass"]],
      ["Access control", ["ServiceAccount", "Role", "RoleBinding", "ClusterRole", "ClusterRoleBinding"]],
      ["Cluster resources", ["Namespace", "CustomResourceDefinition"]],
      ["Additional APIs", ["NetworkPolicy", "HorizontalPodAutoscaler", "PodDisruptionBudget", "Gateway", "HTTPRoute", "HelmRelease", "HelmRepository"]]
    ];
    if (!isMemberScope) groups.push(["Karmada", ["Cluster", "PropagationPolicy", "ClusterPropagationPolicy", "OverridePolicy", "ClusterOverridePolicy", "MultiClusterService", "ServiceExport"]]);
    return groups.map(([label, kinds]) => `<optgroup label="${label}">${kinds.map((kind) => `<option value="${kind}">${kind}</option>`).join("")}</optgroup>`).join("");
  }

  function createSpecFields(kind) {
    const containerFields = () => `<label class="create-field create-field-wide"><span>Container image</span><input name="image" value="nginx:1.27-alpine" placeholder="registry/image:tag"></label><label class="create-field"><span>Container name</span><input name="containerName" value="app"></label><label class="create-field"><span>Image pull policy</span><select name="imagePullPolicy"><option>IfNotPresent</option><option>Always</option><option>Never</option></select></label><label class="create-field"><span>Container port</span><input name="containerPort" type="number" min="1" max="65535" value="8080"></label><label class="create-field"><span>Service account</span><input name="serviceAccountName" value="default"></label><label class="create-field"><span>CPU request</span><input name="cpuRequest" value="100m"></label><label class="create-field"><span>Memory request</span><input name="memoryRequest" value="128Mi"></label><label class="create-field"><span>CPU limit</span><input name="cpuLimit" value="500m"></label><label class="create-field"><span>Memory limit</span><input name="memoryLimit" value="512Mi"></label>`;
    const envFields = () => `<div class="create-subsection"><div><b>Environment variables</b><small>Literal values passed to the primary container</small></div><div class="create-key-value-list" data-create-list="env"><div class="create-key-value"><input name="envKey" placeholder="KEY"><input name="envValue" placeholder="Value"><button type="button" data-remove-row aria-label="Remove row">${actionIcon("delete")}</button></div></div><button class="btn quiet small" type="button" data-add-row="env">+ Add variable</button></div>`;
    if (kind === "Pod") return `<div class="create-field-grid"><label class="create-field"><span>Restart policy</span><select name="restartPolicy"><option>Always</option><option>OnFailure</option><option>Never</option></select></label><label class="create-field"><span>DNS policy</span><select name="dnsPolicy"><option>ClusterFirst</option><option>Default</option><option>ClusterFirstWithHostNet</option><option>None</option></select></label>${containerFields()}</div>${envFields()}`;
    if (kind === "Deployment") return `<div class="create-field-grid"><label class="create-field"><span>Replicas</span><input name="replicas" type="number" min="0" value="2"></label><label class="create-field"><span>Update strategy</span><select name="deploymentStrategy"><option>RollingUpdate</option><option>Recreate</option></select></label><label class="create-field"><span>Max surge</span><input name="maxSurge" value="25%"></label><label class="create-field"><span>Max unavailable</span><input name="maxUnavailable" value="25%"></label><label class="create-field"><span>Progress deadline</span><input name="progressDeadlineSeconds" type="number" min="1" value="600"><small>Seconds</small></label><label class="create-field"><span>Revision history</span><input name="revisionHistoryLimit" type="number" min="0" value="10"></label>${containerFields()}</div>${envFields()}`;
    if (kind === "StatefulSet") return `<div class="create-field-grid"><label class="create-field"><span>Replicas</span><input name="replicas" type="number" min="0" value="2"></label><label class="create-field"><span>Headless service</span><input name="statefulServiceName" value="example-headless"></label><label class="create-field"><span>Pod management</span><select name="podManagementPolicy"><option>OrderedReady</option><option>Parallel</option></select></label><label class="create-field"><span>Update strategy</span><select name="statefulUpdateStrategy"><option>RollingUpdate</option><option>OnDelete</option></select></label><label class="create-field"><span>Claim storage</span><input name="claimStorage" value="10Gi"></label><label class="create-field"><span>Claim storage class</span><input name="storageClass" value="standard"></label>${containerFields()}</div>${envFields()}`;
    if (kind === "DaemonSet") return `<div class="create-field-grid"><label class="create-field"><span>Update strategy</span><select name="daemonUpdateStrategy"><option>RollingUpdate</option><option>OnDelete</option></select></label><label class="create-field"><span>Max unavailable</span><input name="maxUnavailable" value="1"></label><label class="create-field"><span>Min ready seconds</span><input name="minReadySeconds" type="number" min="0" value="0"></label><label class="create-field"><span>Node selector</span><input name="nodeSelector" value="kubernetes.io/os=linux"></label>${containerFields()}</div>${envFields()}`;
    if (kind === "Job") return `<div class="create-field-grid"><label class="create-field"><span>Completions</span><input name="completions" type="number" min="1" value="1"></label><label class="create-field"><span>Parallelism</span><input name="parallelism" type="number" min="1" value="1"></label><label class="create-field"><span>Backoff limit</span><input name="backoffLimit" type="number" min="0" value="6"></label><label class="create-field"><span>Active deadline</span><input name="activeDeadlineSeconds" type="number" min="1" value="3600"><small>Seconds</small></label><label class="create-field"><span>Restart policy</span><select name="restartPolicy"><option>Never</option><option>OnFailure</option></select></label>${containerFields()}</div>${envFields()}`;
    if (kind === "CronJob") return `<div class="create-field-grid"><label class="create-field"><span>Schedule</span><input name="schedule" value="*/5 * * * *"><small>Standard cron expression</small></label><label class="create-field"><span>Concurrency policy</span><select name="concurrencyPolicy"><option>Allow</option><option>Forbid</option><option>Replace</option></select></label><label class="create-field"><span>Suspend</span><select name="suspend"><option value="false">No</option><option value="true">Yes</option></select></label><label class="create-field"><span>Starting deadline</span><input name="startingDeadlineSeconds" type="number" min="0" value="300"><small>Seconds</small></label><label class="create-field"><span>Successful history</span><input name="successfulJobsHistoryLimit" type="number" min="0" value="3"></label><label class="create-field"><span>Failed history</span><input name="failedJobsHistoryLimit" type="number" min="0" value="1"></label><label class="create-field"><span>Job backoff limit</span><input name="backoffLimit" type="number" min="0" value="6"></label><label class="create-field"><span>Restart policy</span><select name="restartPolicy"><option>OnFailure</option><option>Never</option></select></label>${containerFields()}</div>${envFields()}`;
    if (kind === "Service") return `<div class="create-field-grid"><label class="create-field"><span>Service type</span><select name="serviceType"><option>ClusterIP</option><option>NodePort</option><option>LoadBalancer</option><option>ExternalName</option></select></label><label class="create-field"><span>Session affinity</span><select name="sessionAffinity"><option>None</option><option>ClientIP</option></select></label><label class="create-field"><span>Port name</span><input name="portName" value="http"></label><label class="create-field"><span>Protocol</span><select name="serviceProtocol"><option>TCP</option><option>UDP</option><option>SCTP</option></select></label><label class="create-field"><span>Port</span><input name="port" type="number" min="1" max="65535" value="80"></label><label class="create-field"><span>Target port</span><input name="targetPort" type="number" min="1" max="65535" value="8080"></label><label class="create-field"><span>Pod selector</span><input name="selector" value="app=example"></label><label class="create-field"><span>External traffic policy</span><select name="externalTrafficPolicy"><option>Cluster</option><option>Local</option></select></label></div>`;
    if (kind === "Ingress") return `<div class="create-field-grid"><label class="create-field"><span>Ingress class</span><input name="ingressClass" value="nginx"></label><label class="create-field"><span>Host</span><input name="host" value="app.example.local"></label><label class="create-field"><span>Path</span><input name="path" value="/"></label><label class="create-field"><span>Path type</span><select name="pathType"><option>Prefix</option><option>Exact</option><option>ImplementationSpecific</option></select></label><label class="create-field"><span>Backend service</span><input name="backendService" value="example-service"></label><label class="create-field"><span>Backend port</span><input name="backendPort" type="number" min="1" max="65535" value="80"></label><label class="create-field create-field-wide"><span>TLS secret</span><input name="tlsSecret" placeholder="Optional secret containing tls.crt and tls.key"></label></div>`;
    if (kind === "NetworkPolicy") return `<div class="create-field-grid"><label class="create-field"><span>Pod selector</span><input name="networkPodSelector" value="app=example"></label><label class="create-field"><span>Policy types</span><select name="networkPolicyTypes"><option value="Ingress,Egress">Ingress and Egress</option><option value="Ingress">Ingress only</option><option value="Egress">Egress only</option></select></label><label class="create-field"><span>Ingress namespace selector</span><input name="ingressNamespaceSelector" value="kubernetes.io/metadata.name=default"></label><label class="create-field"><span>Ingress port</span><input name="networkPort" type="number" min="1" max="65535" value="8080"></label><label class="create-field create-field-wide"><span>Allowed egress CIDR</span><input name="egressCidr" value="10.0.0.0/8"></label></div>`;
    if (kind === "HorizontalPodAutoscaler") return `<div class="create-field-grid"><label class="create-field"><span>Target API version</span><input name="scaleTargetApiVersion" value="apps/v1"></label><label class="create-field"><span>Target kind</span><input name="scaleTargetKind" value="Deployment"></label><label class="create-field"><span>Target name</span><input name="scaleTargetName" value="example-deployment"></label><label class="create-field"><span>Minimum replicas</span><input name="minReplicas" type="number" min="1" value="1"></label><label class="create-field"><span>Maximum replicas</span><input name="maxReplicas" type="number" min="1" value="5"></label><label class="create-field"><span>CPU target utilization</span><input name="targetCpuUtilization" type="number" min="1" max="100" value="70"><small>Percent</small></label></div>`;
    if (kind === "PodDisruptionBudget") return `<div class="create-field-grid"><label class="create-field"><span>Pod selector</span><input name="pdbSelector" value="app=example"></label><label class="create-field"><span>Availability rule</span><select name="pdbRule"><option value="minAvailable">Minimum available</option><option value="maxUnavailable">Maximum unavailable</option></select></label><label class="create-field"><span>Availability value</span><input name="pdbValue" value="1"><small>Integer or percentage</small></label><label class="create-field"><span>Unhealthy eviction policy</span><select name="unhealthyPodEvictionPolicy"><option>IfHealthyBudget</option><option>AlwaysAllow</option></select></label></div>`;
    if (kind === "Gateway") return `<div class="create-field-grid"><label class="create-field"><span>Gateway class</span><input name="gatewayClass" value="nginx"></label><label class="create-field"><span>Listener name</span><input name="listenerName" value="http"></label><label class="create-field"><span>Protocol</span><select name="protocol"><option>HTTP</option><option>HTTPS</option><option>TCP</option></select></label><label class="create-field"><span>Listener port</span><input name="listenerPort" type="number" value="80"></label><label class="create-field create-field-wide"><span>Hostname</span><input name="hostname" value="*.example.local"></label></div>`;
    if (kind === "HTTPRoute") return `<div class="create-field-grid"><label class="create-field"><span>Parent gateway</span><input name="parentGateway" value="main-gateway"></label><label class="create-field"><span>Hostname</span><input name="hostname" value="app.example.local"></label><label class="create-field"><span>Path prefix</span><input name="path" value="/"></label><label class="create-field"><span>Backend service</span><input name="backendService" value="example-service"></label><label class="create-field"><span>Backend port</span><input name="backendPort" type="number" value="80"></label></div>`;
    if (kind === "HelmRelease") return `<div class="create-field-grid"><label class="create-field"><span>Chart</span><input name="chart" value="nginx"></label><label class="create-field"><span>Chart version</span><input name="chartVersion" value="18.2.4"></label><label class="create-field create-field-wide"><span>Repository URL</span><input name="repositoryUrl" value="https://charts.bitnami.com/bitnami"></label><label class="create-field"><span>Reconcile interval</span><input name="interval" value="10m"></label></div>`;
    if (kind === "HelmRepository") return `<div class="create-field-grid"><label class="create-field create-field-wide"><span>Repository URL</span><input name="repositoryUrl" value="https://charts.bitnami.com/bitnami"></label><label class="create-field"><span>Reconcile interval</span><input name="interval" value="10m"></label></div>`;
    if (kind === "ConfigMap") return `<div class="create-field-grid"><label class="create-field"><span>Immutable</span><select name="immutable"><option value="false">No</option><option value="true">Yes</option></select></label></div><div class="create-subsection"><div><b>Configuration data</b><small>UTF-8 values written to the data map</small></div><div class="create-key-value-list" data-create-list="data"><div class="create-key-value"><input name="dataKey" value="config.yaml" placeholder="Key"><input name="dataValue" value="enabled: true" placeholder="Value"><button type="button" data-remove-row aria-label="Remove row">${actionIcon("delete")}</button></div></div><button class="btn quiet small" type="button" data-add-row="data">+ Add entry</button></div>`;
    if (kind === "Secret") return `<div class="create-field-grid"><label class="create-field"><span>Secret type</span><select name="secretType"><option value="Opaque">Opaque</option><option value="kubernetes.io/tls">kubernetes.io/tls</option><option value="kubernetes.io/dockerconfigjson">kubernetes.io/dockerconfigjson</option><option value="kubernetes.io/basic-auth">kubernetes.io/basic-auth</option><option value="kubernetes.io/ssh-auth">kubernetes.io/ssh-auth</option></select></label><label class="create-field"><span>Immutable</span><select name="immutable"><option value="false">No</option><option value="true">Yes</option></select></label></div><div class="create-subsection"><div><b>String data</b><small>Plain values are converted to Secret data by the API server</small></div><div class="create-key-value-list" data-create-list="data"><div class="create-key-value"><input name="dataKey" value="username" placeholder="Key"><input name="dataValue" placeholder="Value"><button type="button" data-remove-row aria-label="Remove row">${actionIcon("delete")}</button></div></div><button class="btn quiet small" type="button" data-add-row="data">+ Add entry</button></div>`;
    if (kind === "PersistentVolumeClaim") return `<div class="create-field-grid"><label class="create-field"><span>Requested storage</span><input name="storage" value="10Gi"></label><label class="create-field"><span>Storage class</span><input name="storageClass" value="standard"></label><label class="create-field"><span>Access mode</span><select name="accessMode"><option>ReadWriteOnce</option><option>ReadOnlyMany</option><option>ReadWriteMany</option><option>ReadWriteOncePod</option></select></label><label class="create-field"><span>Volume mode</span><select name="volumeMode"><option>Filesystem</option><option>Block</option></select></label><label class="create-field create-field-wide"><span>Volume name</span><input name="volumeName" placeholder="Optional pre-bound PersistentVolume"></label></div>`;
    if (kind === "PersistentVolume") return `<div class="create-field-grid"><label class="create-field"><span>Capacity</span><input name="storage" value="10Gi"></label><label class="create-field"><span>Storage class</span><input name="storageClass" value="manual"></label><label class="create-field"><span>Access mode</span><select name="accessMode"><option>ReadWriteOnce</option><option>ReadOnlyMany</option><option>ReadWriteMany</option></select></label><label class="create-field"><span>Volume mode</span><select name="volumeMode"><option>Filesystem</option><option>Block</option></select></label><label class="create-field"><span>Reclaim policy</span><select name="reclaimPolicy"><option>Retain</option><option>Delete</option><option>Recycle</option></select></label><label class="create-field"><span>Host path</span><input name="hostPath" value="/mnt/data"></label></div>`;
    if (kind === "StorageClass") return `<div class="create-field-grid"><label class="create-field create-field-wide"><span>Provisioner</span><input name="provisioner" value="kubernetes.io/no-provisioner"></label><label class="create-field"><span>Reclaim policy</span><select name="reclaimPolicy"><option>Delete</option><option>Retain</option></select></label><label class="create-field"><span>Volume binding</span><select name="volumeBinding"><option>WaitForFirstConsumer</option><option>Immediate</option></select></label><label class="create-field"><span>Allow expansion</span><select name="allowExpansion"><option value="true">Yes</option><option value="false">No</option></select></label><label class="create-field"><span>Mount options</span><input name="mountOptions" value="discard"></label></div>`;
    if (kind === "ServiceAccount") return `<div class="create-field-grid"><label class="create-field"><span>Automount API token</span><select name="automountToken"><option value="true">Yes</option><option value="false">No</option></select></label><label class="create-field"><span>Image pull secret</span><input name="imagePullSecret" placeholder="Optional registry credential secret"></label></div>`;
    if (kind === "Namespace") return `<div class="create-field-grid"><label class="create-field"><span>Finalizer</span><input name="namespaceFinalizer" value="kubernetes"></label><label class="create-field"><span>Pod security enforcement</span><select name="podSecurityEnforce"><option>baseline</option><option>restricted</option><option>privileged</option></select></label><label class="create-field"><span>Pod security audit</span><select name="podSecurityAudit"><option>restricted</option><option>baseline</option><option>privileged</option></select></label></div>`;
    if (kind === "CustomResourceDefinition") return `<div class="create-field-grid"><label class="create-field"><span>API group</span><input name="crdGroup" value="example.io"></label><label class="create-field"><span>Scope</span><select name="crdScope"><option>Namespaced</option><option>Cluster</option></select></label><label class="create-field"><span>Kind</span><input name="crdKind" value="Widget"></label><label class="create-field"><span>Plural name</span><input name="crdPlural" value="widgets"></label><label class="create-field"><span>Singular name</span><input name="crdSingular" value="widget"></label><label class="create-field"><span>Short name</span><input name="crdShortName" value="wdg"></label><label class="create-field"><span>Version</span><input name="crdVersion" value="v1"></label><label class="create-field"><span>Served</span><select name="crdServed"><option value="true">Yes</option><option value="false">No</option></select></label><label class="create-field"><span>Storage version</span><select name="crdStorage"><option value="true">Yes</option><option value="false">No</option></select></label><label class="create-field"><span>Preserve unknown spec fields</span><select name="crdPreserveUnknown"><option value="true">Yes</option><option value="false">No</option></select></label></div>`;
    if (kind === "Role") return `<div class="create-field-grid"><label class="create-field"><span>API groups</span><input name="ruleApiGroups" value="apps"><small>Comma-separated, use an empty string for core APIs</small></label><label class="create-field"><span>Resources</span><input name="ruleResources" value="deployments,pods"></label><label class="create-field"><span>Verbs</span><input name="ruleVerbs" value="get,list,watch"></label><label class="create-field"><span>Resource names</span><input name="ruleResourceNames" placeholder="Optional comma-separated names"></label></div>`;
    if (kind === "ClusterRole") return `<div class="create-field-grid"><label class="create-field"><span>API groups</span><input name="ruleApiGroups" value="apps"><small>Comma-separated, use an empty string for core APIs</small></label><label class="create-field"><span>Resources</span><input name="ruleResources" value="deployments,pods"></label><label class="create-field"><span>Verbs</span><input name="ruleVerbs" value="get,list,watch"></label><label class="create-field"><span>Resource names</span><input name="ruleResourceNames" placeholder="Optional comma-separated names"></label><label class="create-field create-field-wide"><span>Aggregation selector</span><input name="aggregationLabel" placeholder="Optional label, for example rbac.example.com/aggregate-to-monitoring=true"></label></div>`;
    if (kind === "RoleBinding") return `<div class="create-field-grid"><label class="create-field"><span>Role reference kind</span><select name="roleRefKind"><option>Role</option><option>ClusterRole</option></select></label><label class="create-field"><span>Role reference name</span><input name="roleRefName" value="view"></label><label class="create-field"><span>Subject kind</span><select name="subjectKind"><option>ServiceAccount</option><option>User</option><option>Group</option></select></label><label class="create-field"><span>Subject name</span><input name="subjectName" value="default"></label><label class="create-field"><span>Subject namespace</span><input name="subjectNamespace" value="default"><small>Used for ServiceAccount subjects</small></label></div>`;
    if (kind === "ClusterRoleBinding") return `<div class="create-field-grid"><label class="create-field"><span>ClusterRole reference</span><input name="roleRefName" value="view"></label><input type="hidden" name="roleRefKind" value="ClusterRole"><label class="create-field"><span>Subject kind</span><select name="subjectKind"><option>ServiceAccount</option><option>User</option><option>Group</option></select></label><label class="create-field"><span>Subject name</span><input name="subjectName" value="default"></label><label class="create-field"><span>Subject namespace</span><input name="subjectNamespace" value="default"><small>Used for ServiceAccount subjects</small></label></div>`;
    if (kind === "Cluster") return `<div class="create-field-grid"><label class="create-field"><span>Synchronization mode</span><select name="syncMode"><option>Push</option><option>Pull</option></select></label><label class="create-field"><span>Kubernetes version</span><input name="kubernetesVersion" value="v1.35.0"></label><label class="create-field create-field-wide"><span>API endpoint</span><input name="apiEndpoint" value="https://member-api.example.local:6443"></label><label class="create-field"><span>Region</span><input name="region" value="cn-east-1"></label><label class="create-field"><span>Credential secret</span><input name="credentialSecret" value="member-kubeconfig"></label></div>`;
    if (["PropagationPolicy", "ClusterPropagationPolicy"].includes(kind)) return `<div class="create-field-grid"><label class="create-field"><span>Resource API version</span><input name="resourceApiVersion" value="apps/v1"></label><label class="create-field"><span>Resource kind</span><input name="resourceKind" value="Deployment"></label><label class="create-field"><span>Resource name</span><input name="resourceName" placeholder="Optional — match by labels"></label><label class="create-field create-field-wide"><span>Target member clusters</span><div class="create-cluster-checks">${D.clusters.map((cluster) => `<label><input type="checkbox" name="targetCluster" value="${cluster.name}" ${cluster.name !== "member3" ? "checked" : ""}><span>${cluster.name}<small>${cluster.mode} · ${cluster.status}</small></span></label>`).join("")}</div></label></div>`;
    if (["OverridePolicy", "ClusterOverridePolicy"].includes(kind)) return `<div class="create-field-grid"><label class="create-field"><span>Resource API version</span><input name="resourceApiVersion" value="apps/v1"></label><label class="create-field"><span>Resource kind</span><input name="resourceKind" value="Deployment"></label><label class="create-field"><span>JSON path</span><input name="overridePath" value="/spec/replicas"></label><label class="create-field"><span>Override value</span><input name="overrideValue" value="3"></label><label class="create-field create-field-wide"><span>Target member clusters</span><div class="create-cluster-checks">${D.clusters.map((cluster) => `<label><input type="checkbox" name="targetCluster" value="${cluster.name}" ${cluster.name !== "member3" ? "checked" : ""}><span>${cluster.name}<small>${cluster.mode} · ${cluster.status}</small></span></label>`).join("")}</div></label></div>`;
    if (["MultiClusterService", "ServiceExport"].includes(kind)) return `<div class="create-field-grid"><label class="create-field"><span>Service name</span><input name="serviceName" value="example-service"></label><label class="create-field"><span>Discovery mode</span><select name="discoveryMode"><option>EndpointSlice</option><option>DNS</option></select></label>${kind === "MultiClusterService" ? `<label class="create-field create-field-wide"><span>Provider clusters</span><div class="create-cluster-checks">${D.clusters.map((cluster) => `<label><input type="checkbox" name="targetCluster" value="${cluster.name}" checked><span>${cluster.name}<small>${cluster.mode} · ${cluster.status}</small></span></label>`).join("")}</div></label>` : ""}</div>`;
    return `<div class="create-empty-spec"><span>${kind.slice(0, 2).toUpperCase()}</span><div><b>No additional specification required</b><p>Add labels or annotations below, or switch to YAML for advanced fields.</p></div></div>`;
  }

  function createPage() {
    const params = new URLSearchParams(location.search);
    const requestedKind = createKindAliases[params.get("kind")] || params.get("kind") || "Deployment";
    const initialKind = isCreateKindAvailable(requestedKind) ? requestedKind : "Deployment";
    const initialMode = params.get("mode") === "yaml" ? "yaml" : "form";
    const targetLabel = isMemberScope ? D.member.name : "Control Plane";
    return `<section class="create-workspace shadcn-create-workspace" data-create-workspace data-mode="${initialMode}">
      <div class="create-toolbar shadcn-card"><div class="create-mode-switch shadcn-tabs" role="tablist" aria-label="Resource editor mode"><button type="button" role="tab" data-create-mode="form">Form</button><button type="button" role="tab" data-create-mode="yaml">YAML</button></div><div class="create-tools"><button class="shadcn-button shadcn-button-ghost" type="button" data-create-reset>Reset</button></div></div>
      <div class="create-layout"><div class="create-main">
        <form data-create-form>
          <section class="create-section shadcn-card"><header><span>01</span><div><h2>Basic information</h2><p>Choose the API object and where it will live.</p></div></header><div class="create-section-body"><div class="create-field-grid create-basic-grid"><label class="create-field"><span>Resource type</span><select data-create-kind disabled aria-describedby="create-resource-type-help">${createKindOptions()}</select><input type="hidden" name="kind" value="${initialKind}" data-create-kind-input><small id="create-resource-type-help">Selected from the resource page</small></label><label class="create-field"><span>Name</span><input name="name" placeholder="example-resource" autocomplete="off"><small>Lowercase DNS name</small></label><label class="create-field" data-create-namespace-field><span>Namespace</span><select name="namespace"><option>default</option><option>platform</option><option>monitoring</option><option>karmada-system</option></select><small>Target namespace</small></label></div></div></section>
          <section class="create-section shadcn-card"><header><span>02</span><div><h2>Resource configuration</h2><p data-create-kind-description>Configure the fields used most often for this resource.</p></div></header><div class="create-section-body" data-create-spec>${createSpecFields(initialKind)}</div></section>
          <section class="create-section shadcn-card"><header><span>03</span><div><h2>Metadata</h2><p>Optional identifiers for automation and ownership.</p></div></header><div class="create-section-body"><div class="create-field-grid"><label class="create-field"><span>Label</span><input name="label" value="app.kubernetes.io/managed-by=karmada-dashboard"></label><label class="create-field"><span>Annotation</span><input name="annotation" placeholder="owner=platform-team"></label></div><details class="create-advanced shadcn-accordion"><summary><span>Advanced options</span>${chevronDownIcon()}</summary><div class="create-field-grid"><label class="create-field"><span>Dry run</span><select name="dryRun"><option>No</option><option>Server validation</option></select></label><label class="create-field"><span>Field manager</span><input name="fieldManager" value="karmada-dashboard"></label></div></details></div></section>
        </form>
        <section class="create-yaml-panel" data-create-yaml-panel><div class="create-code-editor"><pre data-create-lines>1</pre><textarea class="shadcn-textarea" spellcheck="false" aria-label="Resource YAML" data-create-yaml></textarea></div></section>
        <div data-create-associated-policies></div>
        <div class="create-validation shadcn-alert" role="status" data-create-validation><span></span><div><b>Draft ready</b><small>Complete the resource name before creating.</small></div></div>
      </div><aside class="create-summary"><section class="shadcn-card"><header><span class="create-check">✓</span><h2>Creation summary</h2></header><dl><div><dt>Target</dt><dd>${targetLabel}</dd></div><div><dt>API version</dt><dd data-create-summary="apiVersion">${createApiVersions[initialKind]}</dd></div><div><dt>Kind</dt><dd data-create-summary="kind">${initialKind}</dd></div><div><dt>Name</dt><dd data-create-summary="name">Not set</dd></div><div><dt>Namespace</dt><dd data-create-summary="namespace">default</dd></div><div><dt>Policies</dt><dd data-create-summary="policies">None</dd></div></dl><button class="shadcn-button shadcn-button-default create-submit" type="button" data-create-submit>Create ${initialKind}</button><p>The prototype validates the draft but never writes to a cluster.</p></section><section class="create-scope-note shadcn-alert neutral"><b>${isMemberScope ? "Direct member operation" : "Federation-aware creation"}</b><p>${isMemberScope ? `This resource will exist only in ${D.member.name}; no Karmada propagation policy is created.` : "Optionally create placement and override policies in the same validated workflow."}</p></section></aside></div>
    </section>`;
  }

  function createYamlValue(value) {
    const text = String(value ?? "");
    if (!text) return '""';
    if (/^[a-zA-Z0-9._/@:-]+$/.test(text) && !/^(true|false|null|~|\d+(?:\.\d+)?)$/i.test(text)) return text;
    return JSON.stringify(text);
  }

  function createPair(value) {
    const index = String(value || "").indexOf("=");
    if (index < 1) return null;
    return [String(value).slice(0, index).trim(), String(value).slice(index + 1).trim()];
  }

  function createFormState(form) {
    const data = new FormData(form);
    const kind = data.get("kind") || "Deployment";
    const clusterScoped = isCreateClusterScoped(kind);
    const pairs = (prefix) => [...form.querySelectorAll(`[name="${prefix}Key"]`)].map((input) => {
      const row = input.closest(".create-key-value");
      return [input.value.trim(), row?.querySelector(`[name="${prefix}Value"]`)?.value || ""];
    }).filter(([key]) => key);
    return {
      kind,
      apiVersion: createApiVersions[kind] || "v1",
      name: String(data.get("name") || "").trim(),
      namespace: clusterScoped ? "" : String(data.get("namespace") || "default"),
      label: createPair(data.get("label")),
      annotation: createPair(data.get("annotation")),
      replicas: Number(data.get("replicas") || 1),
      completions: Number(data.get("completions") || 1),
      parallelism: Number(data.get("parallelism") || 1),
      backoffLimit: Number(data.get("backoffLimit") || 6),
      activeDeadlineSeconds: Number(data.get("activeDeadlineSeconds") || 3600),
      schedule: data.get("schedule") || "*/5 * * * *",
      concurrencyPolicy: data.get("concurrencyPolicy") || "Allow",
      suspend: data.get("suspend") === "true",
      startingDeadlineSeconds: Number(data.get("startingDeadlineSeconds") || 300),
      successfulJobsHistoryLimit: Number(data.get("successfulJobsHistoryLimit") || 3),
      failedJobsHistoryLimit: Number(data.get("failedJobsHistoryLimit") || 1),
      image: data.get("image") || "nginx:1.27-alpine",
      containerName: data.get("containerName") || "app",
      containerPort: Number(data.get("containerPort") || 8080),
      imagePullPolicy: data.get("imagePullPolicy") || "IfNotPresent",
      restartPolicy: data.get("restartPolicy") || "Always",
      dnsPolicy: data.get("dnsPolicy") || "ClusterFirst",
      serviceAccountName: data.get("serviceAccountName") || "default",
      cpuRequest: data.get("cpuRequest") || "100m",
      memoryRequest: data.get("memoryRequest") || "128Mi",
      cpuLimit: data.get("cpuLimit") || "500m",
      memoryLimit: data.get("memoryLimit") || "512Mi",
      env: pairs("env"),
      data: pairs("data"),
      deploymentStrategy: data.get("deploymentStrategy") || "RollingUpdate",
      maxSurge: data.get("maxSurge") || "25%",
      maxUnavailable: data.get("maxUnavailable") || "25%",
      progressDeadlineSeconds: Number(data.get("progressDeadlineSeconds") || 600),
      revisionHistoryLimit: Number(data.get("revisionHistoryLimit") || 10),
      statefulServiceName: data.get("statefulServiceName") || "example-headless",
      podManagementPolicy: data.get("podManagementPolicy") || "OrderedReady",
      statefulUpdateStrategy: data.get("statefulUpdateStrategy") || "RollingUpdate",
      claimStorage: data.get("claimStorage") || "10Gi",
      daemonUpdateStrategy: data.get("daemonUpdateStrategy") || "RollingUpdate",
      minReadySeconds: Number(data.get("minReadySeconds") || 0),
      nodeSelector: createPair(data.get("nodeSelector")) || ["kubernetes.io/os", "linux"],
      serviceType: data.get("serviceType") || "ClusterIP",
      sessionAffinity: data.get("sessionAffinity") || "None",
      portName: data.get("portName") || "http",
      serviceProtocol: data.get("serviceProtocol") || "TCP",
      externalTrafficPolicy: data.get("externalTrafficPolicy") || "Cluster",
      port: Number(data.get("port") || 80),
      targetPort: Number(data.get("targetPort") || 8080),
      selector: createPair(data.get("selector")) || ["app", "example"],
      ingressClass: data.get("ingressClass") || "nginx",
      host: data.get("host") || "app.example.local",
      path: data.get("path") || "/",
      pathType: data.get("pathType") || "Prefix",
      backendService: data.get("backendService") || "example-service",
      backendPort: Number(data.get("backendPort") || 80),
      tlsSecret: data.get("tlsSecret") || "",
      networkPodSelector: createPair(data.get("networkPodSelector")) || ["app", "example"],
      networkPolicyTypes: String(data.get("networkPolicyTypes") || "Ingress,Egress").split(",").filter(Boolean),
      ingressNamespaceSelector: createPair(data.get("ingressNamespaceSelector")) || ["kubernetes.io/metadata.name", "default"],
      networkPort: Number(data.get("networkPort") || 8080),
      egressCidr: data.get("egressCidr") || "10.0.0.0/8",
      scaleTargetApiVersion: data.get("scaleTargetApiVersion") || "apps/v1",
      scaleTargetKind: data.get("scaleTargetKind") || "Deployment",
      scaleTargetName: data.get("scaleTargetName") || "example-deployment",
      minReplicas: Number(data.get("minReplicas") || 1),
      maxReplicas: Number(data.get("maxReplicas") || 5),
      targetCpuUtilization: Number(data.get("targetCpuUtilization") || 70),
      pdbSelector: createPair(data.get("pdbSelector")) || ["app", "example"],
      pdbRule: data.get("pdbRule") || "minAvailable",
      pdbValue: data.get("pdbValue") || "1",
      unhealthyPodEvictionPolicy: data.get("unhealthyPodEvictionPolicy") || "IfHealthyBudget",
      gatewayClass: data.get("gatewayClass") || "nginx",
      listenerName: data.get("listenerName") || "http",
      protocol: data.get("protocol") || "HTTP",
      listenerPort: Number(data.get("listenerPort") || 80),
      hostname: data.get("hostname") || "app.example.local",
      parentGateway: data.get("parentGateway") || "main-gateway",
      chart: data.get("chart") || "nginx",
      chartVersion: data.get("chartVersion") || "18.2.4",
      repositoryUrl: data.get("repositoryUrl") || "https://charts.bitnami.com/bitnami",
      interval: data.get("interval") || "10m",
      storage: data.get("storage") || "10Gi",
      storageClass: data.get("storageClass") || "standard",
      accessMode: data.get("accessMode") || "ReadWriteOnce",
      volumeMode: data.get("volumeMode") || "Filesystem",
      volumeName: data.get("volumeName") || "",
      hostPath: data.get("hostPath") || "/mnt/data",
      provisioner: data.get("provisioner") || "kubernetes.io/no-provisioner",
      reclaimPolicy: data.get("reclaimPolicy") || "Delete",
      volumeBinding: data.get("volumeBinding") || "WaitForFirstConsumer",
      allowExpansion: data.get("allowExpansion") || "true",
      mountOptions: String(data.get("mountOptions") || "").split(",").map((value) => value.trim()).filter(Boolean),
      immutable: data.get("immutable") === "true",
      secretType: data.get("secretType") || "Opaque",
      automountToken: data.get("automountToken") !== "false",
      imagePullSecret: data.get("imagePullSecret") || "",
      namespaceFinalizer: data.get("namespaceFinalizer") || "kubernetes",
      podSecurityEnforce: data.get("podSecurityEnforce") || "baseline",
      podSecurityAudit: data.get("podSecurityAudit") || "restricted",
      crdGroup: data.get("crdGroup") || "example.io",
      crdScope: data.get("crdScope") || "Namespaced",
      crdKind: data.get("crdKind") || "Widget",
      crdPlural: data.get("crdPlural") || "widgets",
      crdSingular: data.get("crdSingular") || "widget",
      crdShortName: data.get("crdShortName") || "wdg",
      crdVersion: data.get("crdVersion") || "v1",
      crdServed: data.get("crdServed") !== "false",
      crdStorage: data.get("crdStorage") !== "false",
      crdPreserveUnknown: data.get("crdPreserveUnknown") !== "false",
      ruleApiGroups: String(data.get("ruleApiGroups") ?? "apps").split(",").map((value) => value.trim()),
      ruleResources: String(data.get("ruleResources") || "deployments,pods").split(",").map((value) => value.trim()).filter(Boolean),
      ruleVerbs: String(data.get("ruleVerbs") || "get,list,watch").split(",").map((value) => value.trim()).filter(Boolean),
      ruleResourceNames: String(data.get("ruleResourceNames") || "").split(",").map((value) => value.trim()).filter(Boolean),
      aggregationLabel: createPair(data.get("aggregationLabel")),
      roleRefKind: data.get("roleRefKind") || "Role",
      roleRefName: data.get("roleRefName") || "view",
      subjectKind: data.get("subjectKind") || "ServiceAccount",
      subjectName: data.get("subjectName") || "default",
      subjectNamespace: data.get("subjectNamespace") || "default",
      syncMode: data.get("syncMode") || "Push",
      kubernetesVersion: data.get("kubernetesVersion") || "v1.35.0",
      apiEndpoint: data.get("apiEndpoint") || "https://member-api.example.local:6443",
      region: data.get("region") || "cn-east-1",
      credentialSecret: data.get("credentialSecret") || "member-kubeconfig",
      resourceApiVersion: data.get("resourceApiVersion") || "apps/v1",
      resourceKind: data.get("resourceKind") || "Deployment",
      resourceName: String(data.get("resourceName") || "").trim(),
      overridePath: data.get("overridePath") || "/spec/replicas",
      overrideValue: data.get("overrideValue") || "3",
      serviceName: data.get("serviceName") || "example-service",
      discoveryMode: data.get("discoveryMode") || "EndpointSlice",
      targetClusters: data.getAll("targetCluster")
    };
  }

  function createResourceYaml(state) {
    const manifestName = state.kind === "CustomResourceDefinition" && !state.name ? `${state.crdPlural}.${state.crdGroup}` : state.name;
    const lines = [`apiVersion: ${state.apiVersion}`, `kind: ${state.kind}`, "metadata:", `  name: ${createYamlValue(manifestName)}`];
    if (state.namespace) lines.push(`  namespace: ${state.namespace}`);
    if (state.label || state.kind === "Namespace") lines.push("  labels:");
    if (state.label) lines.push(`    ${state.label[0]}: ${createYamlValue(state.label[1])}`);
    if (state.kind === "Namespace") lines.push(`    pod-security.kubernetes.io/enforce: ${state.podSecurityEnforce}`, `    pod-security.kubernetes.io/audit: ${state.podSecurityAudit}`);
    if (state.annotation) lines.push("  annotations:", `    ${state.annotation[0]}: ${createYamlValue(state.annotation[1])}`);
    const addPodSpec = (indent, restartPolicy, includeNodeSelector = false) => {
      const prefix = " ".repeat(indent);
      lines.push(`${prefix}serviceAccountName: ${createYamlValue(state.serviceAccountName)}`, `${prefix}dnsPolicy: ${state.dnsPolicy}`);
      if (includeNodeSelector) lines.push(`${prefix}nodeSelector:`, `${prefix}  ${state.nodeSelector[0]}: ${createYamlValue(state.nodeSelector[1])}`);
      lines.push(`${prefix}containers:`, `${prefix}  - name: ${createYamlValue(state.containerName)}`, `${prefix}    image: ${createYamlValue(state.image)}`, `${prefix}    imagePullPolicy: ${state.imagePullPolicy}`, `${prefix}    ports:`, `${prefix}      - name: http`, `${prefix}        containerPort: ${state.containerPort}`, `${prefix}        protocol: TCP`, `${prefix}    resources:`, `${prefix}      requests:`, `${prefix}        cpu: ${createYamlValue(state.cpuRequest)}`, `${prefix}        memory: ${createYamlValue(state.memoryRequest)}`, `${prefix}      limits:`, `${prefix}        cpu: ${createYamlValue(state.cpuLimit)}`, `${prefix}        memory: ${createYamlValue(state.memoryLimit)}`);
      if (state.env.length) {
        lines.push(`${prefix}    env:`);
        state.env.forEach(([key, value]) => lines.push(`${prefix}      - name: ${createYamlValue(key)}`, `${prefix}        value: ${createYamlValue(value)}`));
      }
      lines.push(`${prefix}restartPolicy: ${restartPolicy}`);
    };
    const addPodTemplate = (indent, restartPolicy = "Always", includeNodeSelector = false) => {
      const prefix = " ".repeat(indent);
      lines.push(`${prefix}metadata:`, `${prefix}  labels:`, `${prefix}    app: ${createYamlValue(state.name || "example-resource")}`, `${prefix}spec:`);
      addPodSpec(indent + 2, restartPolicy, includeNodeSelector);
    };
    if (state.kind === "Pod") {
      lines.push("spec:");
      addPodSpec(2, state.restartPolicy);
    } else if (state.kind === "Deployment") {
      lines.push("spec:", `  replicas: ${Math.max(0, state.replicas)}`, `  revisionHistoryLimit: ${Math.max(0, state.revisionHistoryLimit)}`, `  progressDeadlineSeconds: ${Math.max(1, state.progressDeadlineSeconds)}`, "  selector:", "    matchLabels:", `      app: ${createYamlValue(state.name || "example-resource")}`, "  strategy:", `    type: ${state.deploymentStrategy}`);
      if (state.deploymentStrategy === "RollingUpdate") lines.push("    rollingUpdate:", `      maxSurge: ${createYamlValue(state.maxSurge)}`, `      maxUnavailable: ${createYamlValue(state.maxUnavailable)}`);
      lines.push("  template:");
      addPodTemplate(4);
    } else if (state.kind === "StatefulSet") {
      lines.push("spec:", `  serviceName: ${createYamlValue(state.statefulServiceName)}`, `  replicas: ${Math.max(0, state.replicas)}`, `  podManagementPolicy: ${state.podManagementPolicy}`, "  selector:", "    matchLabels:", `      app: ${createYamlValue(state.name || "example-resource")}`, "  updateStrategy:", `    type: ${state.statefulUpdateStrategy}`, "  template:");
      addPodTemplate(4);
      lines.push("  volumeClaimTemplates:", "    - metadata:", "        name: data", "      spec:", "        accessModes:", "          - ReadWriteOnce", `        storageClassName: ${createYamlValue(state.storageClass)}`, "        resources:", "          requests:", `            storage: ${createYamlValue(state.claimStorage)}`);
    } else if (state.kind === "DaemonSet") {
      lines.push("spec:", `  minReadySeconds: ${Math.max(0, state.minReadySeconds)}`, "  selector:", "    matchLabels:", `      app: ${createYamlValue(state.name || "example-resource")}`, "  updateStrategy:", `    type: ${state.daemonUpdateStrategy}`);
      if (state.daemonUpdateStrategy === "RollingUpdate") lines.push("    rollingUpdate:", `      maxUnavailable: ${createYamlValue(state.maxUnavailable)}`);
      lines.push("  template:");
      addPodTemplate(4, "Always", true);
    } else if (state.kind === "Job") {
      lines.push("spec:", `  completions: ${Math.max(1, state.completions)}`, `  parallelism: ${Math.max(1, state.parallelism)}`, `  backoffLimit: ${Math.max(0, state.backoffLimit)}`, `  activeDeadlineSeconds: ${Math.max(1, state.activeDeadlineSeconds)}`, "  template:");
      addPodTemplate(4, state.restartPolicy);
    } else if (state.kind === "CronJob") {
      lines.push("spec:", `  schedule: ${createYamlValue(state.schedule)}`, `  concurrencyPolicy: ${state.concurrencyPolicy}`, `  suspend: ${state.suspend}`, `  startingDeadlineSeconds: ${Math.max(0, state.startingDeadlineSeconds)}`, `  successfulJobsHistoryLimit: ${Math.max(0, state.successfulJobsHistoryLimit)}`, `  failedJobsHistoryLimit: ${Math.max(0, state.failedJobsHistoryLimit)}`, "  jobTemplate:", "    spec:", `      backoffLimit: ${Math.max(0, state.backoffLimit)}`, "      template:");
      addPodTemplate(8, state.restartPolicy);
    } else if (state.kind === "Service") {
      lines.push("spec:", `  type: ${state.serviceType}`, `  sessionAffinity: ${state.sessionAffinity}`, "  selector:", `    ${state.selector[0]}: ${createYamlValue(state.selector[1])}`, "  ports:", `    - name: ${createYamlValue(state.portName)}`, `      protocol: ${state.serviceProtocol}`, `      port: ${state.port}`, `      targetPort: ${state.targetPort}`);
      if (["NodePort", "LoadBalancer"].includes(state.serviceType)) lines.push(`  externalTrafficPolicy: ${state.externalTrafficPolicy}`);
    } else if (state.kind === "Ingress") {
      lines.push("spec:", `  ingressClassName: ${state.ingressClass}`);
      if (state.tlsSecret) lines.push("  tls:", `    - hosts:`, `        - ${createYamlValue(state.host)}`, `      secretName: ${createYamlValue(state.tlsSecret)}`);
      lines.push("  rules:", `    - host: ${state.host}`, "      http:", "        paths:", `          - path: ${state.path}`, `            pathType: ${state.pathType}`, "            backend:", "              service:", `                name: ${state.backendService}`, "                port:", `                  number: ${state.backendPort}`);
    } else if (state.kind === "Gateway") {
      lines.push("spec:", `  gatewayClassName: ${state.gatewayClass}`, "  listeners:", `    - name: ${state.listenerName}`, `      protocol: ${state.protocol}`, `      port: ${state.listenerPort}`, `      hostname: ${createYamlValue(state.hostname)}`);
    } else if (state.kind === "HTTPRoute") {
      lines.push("spec:", "  parentRefs:", `    - name: ${state.parentGateway}`, "  hostnames:", `    - ${createYamlValue(state.hostname)}`, "  rules:", "    - matches:", "        - path:", "            type: PathPrefix", `            value: ${createYamlValue(state.path)}`, "      backendRefs:", `        - name: ${state.backendService}`, `          port: ${state.backendPort}`);
    } else if (state.kind === "HelmRelease") {
      lines.push("spec:", `  interval: ${state.interval}`, "  chart:", "    spec:", `      chart: ${state.chart}`, `      version: ${createYamlValue(state.chartVersion)}`, "      sourceRef:", "        kind: HelmRepository", `        name: ${createYamlValue(state.name ? `${state.name}-repo` : "chart-repository")}`);
    } else if (state.kind === "HelmRepository") {
      lines.push("spec:", `  interval: ${state.interval}`, `  url: ${state.repositoryUrl}`);
    } else if (state.kind === "ConfigMap") {
      lines.push(`immutable: ${state.immutable}`, "data:");
      if (state.data.length) state.data.forEach(([key, value]) => lines.push(`  ${key}: ${createYamlValue(value)}`));
      else lines.push("  example: \"\"");
    } else if (state.kind === "Secret") {
      lines.push(`type: ${state.secretType}`, `immutable: ${state.immutable}`, "stringData:");
      if (state.data.length) state.data.forEach(([key, value]) => lines.push(`  ${key}: ${createYamlValue(value)}`));
      else lines.push("  example: \"\"");
    } else if (state.kind === "PersistentVolumeClaim") {
      lines.push("spec:", "  accessModes:", `    - ${state.accessMode}`, `  volumeMode: ${state.volumeMode}`, `  storageClassName: ${createYamlValue(state.storageClass)}`);
      if (state.volumeName) lines.push(`  volumeName: ${createYamlValue(state.volumeName)}`);
      lines.push("  resources:", "    requests:", `      storage: ${createYamlValue(state.storage)}`);
    } else if (state.kind === "PersistentVolume") {
      lines.push("spec:", "  capacity:", `    storage: ${createYamlValue(state.storage)}`, `  volumeMode: ${state.volumeMode}`, "  accessModes:", `    - ${state.accessMode}`, `  persistentVolumeReclaimPolicy: ${state.reclaimPolicy}`, `  storageClassName: ${createYamlValue(state.storageClass)}`, "  hostPath:", `    path: ${createYamlValue(state.hostPath)}`, "    type: DirectoryOrCreate");
    } else if (state.kind === "StorageClass") {
      lines.push(`provisioner: ${state.provisioner}`, `reclaimPolicy: ${state.reclaimPolicy}`, `volumeBindingMode: ${state.volumeBinding}`, `allowVolumeExpansion: ${state.allowExpansion}`);
      if (state.mountOptions.length) lines.push("mountOptions:", ...state.mountOptions.map((option) => `  - ${createYamlValue(option)}`));
    } else if (state.kind === "ServiceAccount") {
      lines.push(`automountServiceAccountToken: ${state.automountToken}`);
      if (state.imagePullSecret) lines.push("imagePullSecrets:", `  - name: ${createYamlValue(state.imagePullSecret)}`);
    } else if (state.kind === "Namespace") {
      lines.push("spec:", "  finalizers:", `    - ${createYamlValue(state.namespaceFinalizer)}`);
    } else if (state.kind === "CustomResourceDefinition") {
      lines.push("spec:", `  group: ${createYamlValue(state.crdGroup)}`, `  scope: ${state.crdScope}`, "  names:", `    kind: ${createYamlValue(state.crdKind)}`, `    plural: ${createYamlValue(state.crdPlural)}`, `    singular: ${createYamlValue(state.crdSingular)}`, "    shortNames:", `      - ${createYamlValue(state.crdShortName)}`, "  versions:", `    - name: ${createYamlValue(state.crdVersion)}`, `      served: ${state.crdServed}`, `      storage: ${state.crdStorage}`, "      schema:", "        openAPIV3Schema:", "          type: object", "          properties:", "            spec:", "              type: object", `              x-kubernetes-preserve-unknown-fields: ${state.crdPreserveUnknown}`);
    } else if (["Role", "ClusterRole"].includes(state.kind)) {
      if (state.kind === "ClusterRole" && state.aggregationLabel) lines.push("aggregationRule:", "  clusterRoleSelectors:", "    - matchLabels:", `        ${state.aggregationLabel[0]}: ${createYamlValue(state.aggregationLabel[1])}`);
      lines.push("rules:", "  - apiGroups:");
      state.ruleApiGroups.forEach((group) => lines.push(`      - ${createYamlValue(group)}`));
      lines.push("    resources:");
      state.ruleResources.forEach((resource) => lines.push(`      - ${createYamlValue(resource)}`));
      if (state.ruleResourceNames.length) {
        lines.push("    resourceNames:");
        state.ruleResourceNames.forEach((name) => lines.push(`      - ${createYamlValue(name)}`));
      }
      lines.push("    verbs:");
      state.ruleVerbs.forEach((verb) => lines.push(`      - ${createYamlValue(verb)}`));
    } else if (["RoleBinding", "ClusterRoleBinding"].includes(state.kind)) {
      lines.push("subjects:", `  - kind: ${state.subjectKind}`, `    name: ${createYamlValue(state.subjectName)}`);
      if (state.subjectKind === "ServiceAccount") lines.push(`    namespace: ${createYamlValue(state.subjectNamespace)}`);
      lines.push("roleRef:", "  apiGroup: rbac.authorization.k8s.io", `  kind: ${state.roleRefKind}`, `  name: ${createYamlValue(state.roleRefName)}`);
    } else if (state.kind === "Cluster") {
      lines.push("spec:", `  syncMode: ${state.syncMode}`, `  apiEndpoint: ${state.apiEndpoint}`, "  secretRef:", `    name: ${state.credentialSecret}`, "    namespace: karmada-cluster", "  region: ", `    name: ${state.region}`, `  kubernetesVersion: ${state.kubernetesVersion}`);
    } else if (["PropagationPolicy", "ClusterPropagationPolicy"].includes(state.kind)) {
      lines.push("spec:", "  resourceSelectors:", `    - apiVersion: ${state.resourceApiVersion}`, `      kind: ${state.resourceKind}`);
      if (state.resourceName) lines.push(`      name: ${state.resourceName}`);
      lines.push("  placement:", "    clusterAffinity:", "      clusterNames:");
      (state.targetClusters.length ? state.targetClusters : ["member1"]).forEach((cluster) => lines.push(`        - ${cluster}`));
    } else if (["OverridePolicy", "ClusterOverridePolicy"].includes(state.kind)) {
      lines.push("spec:", "  resourceSelectors:", `    - apiVersion: ${state.resourceApiVersion}`, `      kind: ${state.resourceKind}`, "  overrideRules:", "    - targetCluster:", "        clusterNames:");
      (state.targetClusters.length ? state.targetClusters : ["member1"]).forEach((cluster) => lines.push(`          - ${cluster}`));
      lines.push("      overriders:", "        plaintext:", `          - path: ${createYamlValue(state.overridePath)}`, "            operator: replace", `            value: ${createYamlValue(state.overrideValue)}`);
    } else if (state.kind === "MultiClusterService") {
      lines.push("spec:", "  types:", "    - CrossCluster", "  range:", "    clusterNames:");
      (state.targetClusters.length ? state.targetClusters : ["member1"]).forEach((cluster) => lines.push(`      - ${cluster}`));
      lines.push("  serviceProvisionClusters:", "    clusterNames:", "      - member1", "  consumerClusters:", "    clusterNames:", "      - member2");
    } else if (state.kind === "ServiceExport") {
      lines.push("spec:", `  serviceName: ${state.serviceName}`, `  discoveryMode: ${state.discoveryMode}`);
    } else if (state.kind === "NetworkPolicy") {
      lines.push("spec:", "  podSelector:", "    matchLabels:", `      ${state.networkPodSelector[0]}: ${createYamlValue(state.networkPodSelector[1])}`, "  policyTypes:");
      state.networkPolicyTypes.forEach((type) => lines.push(`    - ${type}`));
      if (state.networkPolicyTypes.includes("Ingress")) lines.push("  ingress:", "    - from:", "        - namespaceSelector:", "            matchLabels:", `              ${state.ingressNamespaceSelector[0]}: ${createYamlValue(state.ingressNamespaceSelector[1])}`, "      ports:", "        - protocol: TCP", `          port: ${state.networkPort}`);
      if (state.networkPolicyTypes.includes("Egress")) lines.push("  egress:", "    - to:", "        - ipBlock:", `            cidr: ${state.egressCidr}`);
    } else if (state.kind === "HorizontalPodAutoscaler") {
      lines.push("spec:", "  scaleTargetRef:", `    apiVersion: ${state.scaleTargetApiVersion}`, `    kind: ${state.scaleTargetKind}`, `    name: ${createYamlValue(state.scaleTargetName)}`, `  minReplicas: ${Math.max(1, state.minReplicas)}`, `  maxReplicas: ${Math.max(state.minReplicas, state.maxReplicas)}`, "  metrics:", "    - type: Resource", "      resource:", "        name: cpu", "        target:", "          type: Utilization", `          averageUtilization: ${state.targetCpuUtilization}`);
    } else if (state.kind === "PodDisruptionBudget") {
      lines.push("spec:", `  ${state.pdbRule}: ${createYamlValue(state.pdbValue)}`, `  unhealthyPodEvictionPolicy: ${state.unhealthyPodEvictionPolicy}`, "  selector:", "    matchLabels:", `      ${state.pdbSelector[0]}: ${createYamlValue(state.pdbSelector[1])}`);
    }
    return `${lines.join("\n")}\n`;
  }

  function parseCreateYaml(source) {
    const text = String(source || "");
    const metadata = text.match(/^metadata:\s*\n((?:[ \t]+.*(?:\n|$))*)/m)?.[1] || "";
    return {
      apiVersion: text.match(/^apiVersion:\s*["']?([^\s"']+)/m)?.[1] || "",
      kind: text.match(/^kind:\s*["']?([^\s"']+)/m)?.[1] || "",
      name: metadata.match(/^\s{2}name:\s*["']?([^\n"']+)/m)?.[1]?.trim() || "",
      namespace: metadata.match(/^\s{2}namespace:\s*["']?([^\n"']+)/m)?.[1]?.trim() || ""
    };
  }

  function isAssociatedPolicyEligible(kind) {
    return !isMemberScope && !isPolicyKind(kind) && kind !== "Cluster";
  }

  function associatedPolicyContext(draft, fixedKind) {
    const kind = fixedKind || draft.kind || "Deployment";
    return {
      apiVersion: draft.apiVersion || createApiVersions[kind] || "v1",
      clusterScoped: isCreateClusterScoped(kind),
      eligible: isAssociatedPolicyEligible(kind),
      kind,
      name: draft.name || "",
      namespace: isCreateClusterScoped(kind) ? "" : (draft.namespace || "default")
    };
  }

  function associatedPolicyIssue(config) {
    if (!config) return "";
    const validName = (value) => /^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(value || "");
    if (config.propagation.enabled) {
      if (!validName(config.propagation.name)) return "Add a valid lowercase DNS name for the Propagation Policy.";
      if (!config.propagation.clusters.length) return "Select at least one target cluster for the Propagation Policy.";
    }
    if (config.override.enabled) {
      if (!validName(config.override.name)) return "Add a valid lowercase DNS name for the Override Policy.";
      if (!config.override.clusters.length) return "Select at least one target cluster for the Override Policy.";
      if (!config.override.path.startsWith("/")) return "Override JSON path must start with /.";
      if (!config.override.value.trim()) return "Override value cannot be empty.";
    }
    return "";
  }

  function associatedPolicyManifests(draft, config) {
    if (!config || !isAssociatedPolicyEligible(draft.kind)) return [];
    const clusterScoped = isCreateClusterScoped(draft.kind);
    const namespace = clusterScoped ? "" : (draft.namespace || "default");
    const metadata = (name) => [`metadata:`, `  name: ${createYamlValue(name)}`, ...(namespace ? [`  namespace: ${createYamlValue(namespace)}`] : [])];
    const selector = [`  resourceSelectors:`, `    - apiVersion: ${draft.apiVersion}`, `      kind: ${draft.kind}`, `      name: ${createYamlValue(draft.name)}`];
    const manifests = [];
    if (config.propagation.enabled) {
      const kind = clusterScoped ? "ClusterPropagationPolicy" : "PropagationPolicy";
      const lines = [`apiVersion: policy.karmada.io/v1alpha1`, `kind: ${kind}`, ...metadata(config.propagation.name), `spec:`, ...selector, `  placement:`, `    clusterAffinity:`, `      clusterNames:`, ...config.propagation.clusters.map((cluster) => `        - ${cluster}`)];
      manifests.push({ kind, name: config.propagation.name, yaml: config.propagation.yaml || `${lines.join("\n")}\n` });
    }
    if (config.override.enabled) {
      const kind = clusterScoped ? "ClusterOverridePolicy" : "OverridePolicy";
      const lines = [`apiVersion: policy.karmada.io/v1alpha1`, `kind: ${kind}`, ...metadata(config.override.name), `spec:`, ...selector, `  overrideRules:`, `    - targetCluster:`, `        clusterNames:`, ...config.override.clusters.map((cluster) => `          - ${cluster}`), `      overriders:`, `        plaintext:`, `          - path: ${createYamlValue(config.override.path)}`, `            operator: replace`, `            value: ${createYamlValue(config.override.value)}`];
      manifests.push({ kind, name: config.override.name, yaml: config.override.yaml || `${lines.join("\n")}\n` });
    }
    return manifests;
  }

  function bindCreateWorkspace() {
    const workspace = document.querySelector("[data-create-workspace]");
    if (!workspace) return;
    enhanceCreatePrimitives(workspace);
    const form = workspace.querySelector("[data-create-form]");
    const kindSelect = workspace.querySelector("[data-create-kind]");
    const kindInput = workspace.querySelector("[data-create-kind-input]");
    const spec = workspace.querySelector("[data-create-spec]");
    const namespaceField = workspace.querySelector("[data-create-namespace-field]");
    const yaml = workspace.querySelector("[data-create-yaml]");
    const lineNumbers = workspace.querySelector("[data-create-lines]");
    const validation = workspace.querySelector("[data-create-validation]");
    const associatedPoliciesRoot = workspace.querySelector("[data-create-associated-policies]");
    const params = new URLSearchParams(location.search);
    const requestedKind = createKindAliases[params.get("kind")] || params.get("kind") || "Deployment";
    const initialKind = isCreateKindAvailable(requestedKind) ? requestedKind : "Deployment";
    const initialMode = params.get("mode") === "yaml" ? "yaml" : "form";
    let syncingYaml = false;
    let associatedPoliciesApi;
    let associatedPoliciesConfig;

    const updateCreateRoute = (kind, mode, method = "push") => {
      const nextUrl = new URL(location.href);
      nextUrl.searchParams.set("kind", kind);
      if (mode === "yaml") nextUrl.searchParams.set("mode", "yaml");
      else nextUrl.searchParams.delete("mode");
      history[method === "replace" ? "replaceState" : "pushState"]({ kind, mode }, "", nextUrl);
    };

    const setMode = (mode, routeMethod = "") => {
      const previousMode = workspace.dataset.mode;
      workspace.dataset.mode = mode;
      workspace.querySelectorAll("[data-create-mode]").forEach((button) => {
        const active = button.dataset.createMode === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });
      if (mode === "form" && previousMode === "yaml") syncBasicYamlToForm();
      associatedPoliciesApi?.setMode(mode);
      window.syncCreateShadcnControls?.(workspace);
      if (routeMethod) updateCreateRoute(kindSelect.value, mode, routeMethod);
    };

    const updateLines = () => {
      const count = Math.max(1, yaml.value.split("\n").length);
      lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
      lineNumbers.scrollTop = yaml.scrollTop;
    };

    const updateSummary = (draft = parseCreateYaml(yaml.value)) => {
      const clusterScoped = isCreateClusterScoped(draft.kind);
      const manifests = associatedPolicyManifests(draft, associatedPoliciesConfig);
      const policySummary = manifests.length ? manifests.map(({ kind }) => kind.includes("Propagation") ? "PP" : "OP").join(" + ") : "None";
      const summary = { apiVersion: draft.apiVersion || "Unknown", kind: draft.kind || "Unknown", name: draft.name || "Not set", namespace: clusterScoped ? "Cluster scoped" : (draft.namespace || "default"), policies: policySummary };
      Object.entries(summary).forEach(([key, value]) => {
        const target = workspace.querySelector(`[data-create-summary="${key}"]`);
        if (target) target.textContent = value;
      });
      const validName = /^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(draft.name || "");
      const validKind = draft.kind === kindSelect.value;
      const policyIssue = isAssociatedPolicyEligible(draft.kind) ? associatedPolicyIssue(associatedPoliciesConfig) : "";
      const ready = validName && validKind && Boolean(draft.apiVersion) && !policyIssue;
      validation.classList.toggle("ready", ready);
      validation.classList.toggle("success", ready);
      validation.querySelector("b").textContent = !validKind ? "Resource type is fixed" : policyIssue ? "Policy needs attention" : validName ? "Ready to validate" : "Draft needs attention";
      validation.querySelector("small").textContent = !validKind ? `Use kind: ${kindSelect.value} on this creation page.` : policyIssue || (validName ? `${1 + manifests.length} manifest${manifests.length ? "s" : ""} ready for validation.` : "Add a lowercase DNS-compatible resource name.");
      const submit = workspace.querySelector("[data-create-submit]");
      submit.textContent = manifests.length ? `Create ${kindSelect.value} + ${manifests.length} ${manifests.length === 1 ? "policy" : "policies"}` : `Create ${kindSelect.value}`;
      window.syncCreateShadcnControls?.(workspace);
    };

    const syncFormToYaml = () => {
      if (syncingYaml) return;
      yaml.value = createResourceYaml(createFormState(form));
      updateLines();
      const draft = parseCreateYaml(yaml.value);
      associatedPoliciesApi?.setContext(associatedPolicyContext(draft, kindSelect.value));
      updateSummary(draft);
    };

    const setKind = (kind, generate = true, routeMethod = "") => {
      const safeKind = isCreateKindAvailable(kind) ? kind : "Deployment";
      kindSelect.value = safeKind;
      kindInput.value = safeKind;
      spec.innerHTML = createSpecFields(safeKind);
      enhanceCreatePrimitives(spec);
      const clusterScoped = isCreateClusterScoped(safeKind);
      namespaceField.hidden = clusterScoped;
      const namespaceSelect = namespaceField.querySelector("select");
      namespaceSelect.disabled = clusterScoped;
      syncCreateSelect(kindSelect);
      syncCreateSelect(namespaceSelect);
      workspace.querySelector("[data-create-kind-description]").textContent = createKindDescriptions[safeKind] || `Configure the Kubernetes or Karmada manifest fields for ${safeKind}.`;
      const breadcrumbCurrent = document.querySelector("[data-create-breadcrumb-current]");
      const breadcrumbBack = document.querySelector("[data-create-breadcrumb-back]");
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = safeKind;
      if (breadcrumbBack) {
        breadcrumbBack.href = createResourceListHref(safeKind);
        breadcrumbBack.textContent = isPolicyKind(safeKind) ? "Policies" : "Resource management";
        breadcrumbBack.setAttribute("aria-label", `Back to ${isPolicyKind(safeKind) ? "Policies" : `${safeKind} resources`}`);
      }
      const railNavigation = document.querySelector("[data-rail-navigation]");
      if (railNavigation) {
        railNavigation.innerHTML = isMemberScope
          ? memberSideNav(createResourceIdForKind(safeKind) || "overview")
          : controlPlaneSideNav(createResourceIdForKind(safeKind), safeKind);
        applyLanguage(railNavigation);
      }
      document.title = `Karmada · Create ${safeKind}`;
      if (generate) syncFormToYaml();
      if (routeMethod) updateCreateRoute(safeKind, workspace.dataset.mode, routeMethod);
    };

    function syncBasicYamlToForm() {
      const draft = parseCreateYaml(yaml.value);
      syncingYaml = true;
      if (draft.kind && draft.kind !== kindSelect.value) {
        yaml.value = yaml.value.replace(/^kind:\s*.*$/m, `kind: ${kindSelect.value}`);
        draft.kind = kindSelect.value;
        updateLines();
      }
      if (draft.name) form.elements.name.value = draft.name;
      if (draft.namespace && form.elements.namespace && !form.elements.namespace.disabled) {
        if (![...form.elements.namespace.options].some((option) => option.value === draft.namespace)) form.elements.namespace.add(new Option(draft.namespace, draft.namespace));
        form.elements.namespace.value = draft.namespace;
        syncCreateSelect(form.elements.namespace, true);
      }
      syncingYaml = false;
      associatedPoliciesApi?.setContext(associatedPolicyContext(draft, kindSelect.value));
      window.syncCreateShadcnControls?.(workspace);
      updateSummary(draft);
    }

    kindSelect.value = initialKind;
    setKind(initialKind, false);
    syncFormToYaml();
    const initialDraft = parseCreateYaml(yaml.value);
    associatedPoliciesApi = window.mountCreateAssociatedPolicies?.(associatedPoliciesRoot, {
      clusters: D.clusters,
      context: associatedPolicyContext(initialDraft, initialKind),
      onChange: (config) => {
        associatedPoliciesConfig = config;
        updateSummary();
      }
    });
    setMode(initialMode);
    updateCreateRoute(initialKind, initialMode, "replace");

    window.addEventListener("popstate", () => {
      const route = new URLSearchParams(location.search);
      const routeKind = createKindAliases[route.get("kind")] || route.get("kind") || "Deployment";
      setKind(isCreateKindAvailable(routeKind) ? routeKind : "Deployment", true);
      setMode(route.get("mode") === "yaml" ? "yaml" : "form");
    });

    workspace.addEventListener("click", (event) => {
      const mode = event.target.closest("[data-create-mode]");
      if (mode) return setMode(mode.dataset.createMode, "push");
      const add = event.target.closest("[data-add-row]");
      if (add) {
        const prefix = add.dataset.addRow;
        const list = workspace.querySelector(`[data-create-list="${prefix}"]`);
        const row = document.createElement("div");
        row.className = "create-key-value";
        row.innerHTML = `<input name="${prefix}Key" placeholder="${prefix === "env" ? "KEY" : "Key"}"><input name="${prefix}Value" placeholder="Value"><button type="button" data-remove-row aria-label="Remove row">${actionIcon("delete")}</button>`;
        list?.appendChild(row);
        enhanceCreatePrimitives(row);
        row.querySelector("input")?.focus();
        return syncFormToYaml();
      }
      const remove = event.target.closest("[data-remove-row]");
      if (remove) {
        const list = remove.closest("[data-create-list]");
        if (list.children.length > 1) remove.closest(".create-key-value").remove();
        else list.querySelectorAll("input").forEach((input) => { input.value = ""; });
        return syncFormToYaml();
      }
      if (event.target.closest("[data-create-reset]")) {
        const resetKind = kindSelect.value;
        const resetMode = workspace.dataset.mode;
        form.reset();
        setKind(resetKind, false);
        workspace.querySelectorAll("select").forEach((select) => syncCreateSelect(select, true));
        syncFormToYaml();
        associatedPoliciesApi?.reset();
        setMode(resetMode);
        return toast("Draft reset", "The prototype defaults have been restored.");
      }
      if (event.target.closest("[data-create-submit]")) {
        const draft = parseCreateYaml(yaml.value);
        if (draft.kind !== kindSelect.value) return toast("Resource type is fixed", `This page only creates ${kindSelect.value} resources.`);
        if (!draft.apiVersion || !draft.kind || !/^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$/.test(draft.name || "")) {
          setMode(workspace.dataset.mode);
          return toast("Draft is incomplete", "Add apiVersion, kind, and a lowercase DNS-compatible metadata.name.");
        }
        const issue = associatedPolicyIssue(associatedPoliciesConfig);
        if (isAssociatedPolicyEligible(draft.kind) && issue) return toast("Policy configuration is incomplete", issue);
        const policies = associatedPolicyManifests(draft, associatedPoliciesConfig);
        const policySummary = policies.length ? ` Associated policies: ${policies.map(({ kind, name }) => `${kind}/${name}`).join(", ")}.` : " No associated policy will be created.";
        return modal(`Review ${draft.kind} · ${draft.name}`, `The draft targets ${isMemberScope ? D.member.name : "the Karmada control plane"}.${policySummary} Validation succeeds in this interactive mock, but no API request or cluster write will occur.`, "Confirm mock creation");
      }
    });

    form.addEventListener("input", (event) => {
      if (event.target === kindSelect) return setKind(kindSelect.value, true, "push");
      syncFormToYaml();
    });
    form.addEventListener("change", (event) => {
      if (event.target === kindSelect) return;
      syncFormToYaml();
    });
    yaml.addEventListener("input", () => {
      updateLines();
      const draft = parseCreateYaml(yaml.value);
      associatedPoliciesApi?.setContext(associatedPolicyContext(draft, kindSelect.value));
      updateSummary(draft);
    });
    yaml.addEventListener("scroll", () => { lineNumbers.scrollTop = yaml.scrollTop; });
  }

  function metricsPage() {
    return `${pageHeader(refreshButton("Refresh metrics", 'data-action="refresh"', "shadcn-button shadcn-button-outline metrics-refresh-button"), '')}
      <section class="metrics-context shadcn-card"><div><span class="eyebrow">KARMADA TELEMETRY</span><b data-metrics-component-label>karmada-scheduler</b><small data-metrics-context>karmada-system · scheduler-0 · sample interval 9s</small></div><div>${statusPill("Streaming")}<span data-metrics-sample>Last sample 8s ago</span></div></section>
      <div class="metrics-toolbar shadcn-card">${shadcnSelect("metrics-component", "Component", ["karmada-scheduler", "karmada-apiserver", "karmada-controller-manager"], "karmada-scheduler", "data-metrics-component")}${shadcnSelect("metrics-pod", "Pod", ["karmada-scheduler-7f67c89b-5lrkg", "All replicas"], "karmada-scheduler-7f67c89b-5lrkg", "data-metrics-pod")}${shadcnSelect("metrics-resolution", "Resolution", ["30 seconds", "1 minute", "5 minutes"], "30 seconds", "data-metrics-resolution")}<div class="shadcn-field metrics-range-field"><span class="shadcn-field-label">Time range</span><div class="shadcn-toggle-group" role="group" aria-label="Time range"><button class="active" type="button" data-metrics-range="60m" aria-pressed="true">1h</button><button type="button" data-metrics-range="6h" aria-pressed="false">6h</button><button type="button" data-metrics-range="24h" aria-pressed="false">24h</button></div></div></div>
      <section class="shadcn-card policy-summary metrics-stat-band"><div><label>Panels</label><b>8</b><small data-metrics-signal>4 Prometheus types</small></div><div><label>Pods</label><b data-metrics-pod-count>2</b><small>All ready</small></div><div><label>Sample</label><b data-metrics-sample-rate>9s</b><small>Inside target</small></div><div><label>Window</label><b data-metrics-window>60m</b><small data-metrics-window-detail>30s resolution</small></div></section>
      <div data-metrics-dashboard-root></div>
      <section class="metrics-health-strip"><div><span class="node-health good"></span><b>Leader election</b><strong>scheduler-0</strong><small>Lease renewed 6s ago</small></div><div><span class="node-health good"></span><b>Scrape targets</b><strong>8 / 8</strong><small>All healthy</small></div><div><span class="node-health warn"></span><b>Missing series</b><strong>1</strong><small>member3 node metrics</small></div><div><span class="node-health good"></span><b>Recording rules</b><strong>23</strong><small>Evaluated</small></div></section>`;
  }

  function settingInput(id, label, value, description, type = "text", attributes = "") {
    return `<div class="shadcn-form-field"><label for="${id}">${label}</label><input id="${id}" class="shadcn-input" type="${type}" value="${value}" data-settings-control ${attributes}><small>${description}</small></div>`;
  }

  function settingSwitch(id, title, description, enabled = false) {
    return `<div class="shadcn-switch-row"><div><label id="${id}-label">${title}</label><small>${description}</small></div><button class="shadcn-switch ${enabled ? "on" : ""}" type="button" role="switch" aria-checked="${enabled}" aria-labelledby="${id}-label" data-settings-switch="${id}"><span></span></button></div>`;
  }

  function settingsCard(title, description, content, meta = "") {
    return `<section class="shadcn-card settings-card"><header><div><h3>${title}</h3><p>${description}</p></div>${meta}</header><div class="settings-card-body">${content}</div></section>`;
  }

  function registryEditorRow(registry, index, total) {
    const id = registry.id || `registry-${index + 1}`;
    const credentialOptions = ["platform/registry-pull", "karmada-system/global-pull", "No credentials"];
    const pullPolicyOptions = ["IfNotPresent", "Always", "Never"];
    return `<article class="registry-editor-row" data-registry-row data-registry-id="${esc(id)}">
      <header class="registry-editor-row-header">
        <div><span class="registry-editor-index">${String(index + 1).padStart(2, "0")}</span><div><strong>Registry ${index + 1}</strong><small>${esc(registry.endpoint || "New registry")}</small></div></div>
        <button class="shadcn-button shadcn-button-ghost shadcn-icon-button-sm registry-remove" type="button" data-registry-remove aria-label="Remove registry ${index + 1}" data-tooltip="Remove registry" ${total === 1 ? "disabled" : ""}>${actionIcon("delete")}</button>
      </header>
      <div class="registry-editor-fields">
        <div class="shadcn-form-field"><label for="${id}-endpoint">Registry endpoint</label><input id="${id}-endpoint" class="shadcn-input" type="text" value="${esc(registry.endpoint || "")}" placeholder="registry.example.com" data-registry-field="endpoint"><small>Hostname used by workload image references.</small></div>
        <div class="shadcn-form-field"><label for="${id}-mirror">Mirror endpoint</label><input id="${id}-mirror" class="shadcn-input" type="text" value="${esc(registry.mirror || "")}" placeholder="https://mirror.example.com" data-registry-field="mirror"><small>Optional pull-through mirror for this registry.</small></div>
        ${shadcnSelect(`${id}-credential`, "Credentials reference", credentialOptions, registry.credential || "No credentials", 'data-registry-field="credential"')}
        ${shadcnSelect(`${id}-pull-policy`, "Default pull policy", pullPolicyOptions, registry.pullPolicy || "IfNotPresent", 'data-registry-field="pullPolicy"')}
      </div>
      <footer class="registry-editor-row-footer">
        <div class="registry-insecure-control"><button class="shadcn-switch ${registry.insecure ? "on" : ""}" type="button" role="switch" aria-checked="${Boolean(registry.insecure)}" aria-label="Allow insecure connection for registry ${index + 1}" data-registry-insecure><span></span></button><span><strong>Allow insecure connection</strong><small>Permit HTTP or an untrusted certificate for this registry only.</small></span></div>
        <div class="settings-inline-actions"><button class="shadcn-button shadcn-button-outline shadcn-button-sm" type="button" data-registry-test>Test connection</button><span class="settings-test-result" data-registry-test-result>Not tested</span></div>
      </footer>
    </article>`;
  }

  function helmRepositoryRow(repository, index, total) {
    const id = repository.id || `helm-repository-${index + 1}`;
    return `<article class="registry-editor-row helm-repository-row" data-helm-repository-row data-helm-repository-id="${esc(id)}">
      <header class="registry-editor-row-header">
        <div><span class="registry-editor-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(repository.name || `Repository ${index + 1}`)}</strong><small>${esc(repository.url || "New chart repository")}</small></div></div>
        <button class="shadcn-button shadcn-button-ghost shadcn-icon-button-sm registry-remove" type="button" data-helm-repository-remove aria-label="Remove Helm repository ${index + 1}" data-tooltip="Remove repository" ${total === 1 ? "disabled" : ""}>${actionIcon("delete")}</button>
      </header>
      <div class="registry-editor-fields">
        <div class="shadcn-form-field"><label for="${id}-name">Repository name</label><input id="${id}-name" class="shadcn-input" type="text" value="${esc(repository.name || "")}" placeholder="karmada" data-helm-repository-field="name"><small>Name used by Helm commands and chart references.</small></div>
        <div class="shadcn-form-field"><label for="${id}-url">Repository URL</label><input id="${id}-url" class="shadcn-input" type="url" value="${esc(repository.url || "")}" placeholder="https://charts.example.com" data-helm-repository-field="url"><small>HTTP chart index or OCI registry endpoint.</small></div>
        ${shadcnSelect(`${id}-type`, "Repository type", ["Helm repository", "OCI registry"], repository.type || "Helm repository", 'data-helm-repository-field="type"')}
        ${shadcnSelect(`${id}-credential`, "Credentials reference", ["No credentials", "karmada-system/helm-repository", "platform/registry-pull"], repository.credential || "No credentials", 'data-helm-repository-field="credential"')}
      </div>
      <footer class="registry-editor-row-footer">
        <div class="registry-insecure-control"><button class="shadcn-switch ${repository.skipTlsVerify ? "on" : ""}" type="button" role="switch" aria-checked="${Boolean(repository.skipTlsVerify)}" aria-label="Skip TLS verification for Helm repository ${index + 1}" data-helm-repository-insecure><span></span></button><span><strong>Skip TLS verification</strong><small>Use only for repositories with an internally managed certificate.</small></span></div>
        <div class="settings-inline-actions"><button class="shadcn-button shadcn-button-outline shadcn-button-sm" type="button" data-helm-repository-test>Test repository</button><span class="settings-test-result" data-helm-repository-test-result>Not tested</span></div>
      </footer>
    </article>`;
  }

  function settingsPage() {
    const karmada = `<input type="hidden" value="" data-settings-control data-karmada-config-state><div data-shadcn-karmada-config-root></div>`;

    const dashboardYamlPreview = window.KD_DASHBOARD_CONFIG_YAML || `apiVersion: v1
kind: ConfigMap
metadata:
  name: karmada-dashboard-configmap
  namespace: karmada-system
data:
  prod.yaml: |`;
    const dashboard = `<div class="dashboard-config-editor">
      <div class="shadcn-alert dashboard-config-notice" role="note"><strong>ConfigMap configuration</strong><span>The prod.yaml data is editable here. Save changes to update the Dashboard configuration draft.</span><code>karmada-system / karmada-dashboard-configmap / prod.yaml</code></div>
      ${settingsCard("Configuration source", "Live configuration discovered from the karmada-host context.", `<dl class="dashboard-config-facts"><div><dt>ConfigMap</dt><dd>karmada-dashboard-configmap</dd></div><div><dt>Namespace</dt><dd>karmada-system</dd></div><div><dt>Available data keys</dt><dd><span class="badge good">prod.yaml</span></dd></div><div><dt>Current key</dt><dd><code>prod.yaml</code></dd></div><div><dt>API selector</dt><dd><code>ENV_NAME</code>, default <code>prod</code></dd></div><div><dt>Web mount</dt><dd><code>/config/dashboard-config.yaml</code></dd></div></dl>`, '<span class="badge good">LIVE SNAPSHOT</span>')}
      ${settingsCard("Runtime key selection", "ENV_NAME is a Deployment-level setting and is read only on this page.", `<div class="dashboard-config-selection"><div><span>Dashboard API · read only</span><strong>ENV_NAME → <code>\${ENV_NAME}.yaml</code></strong><small>ENV_NAME is not set in the current Deployment, so the code falls back to prod.yaml.</small></div></div><div class="shadcn-alert neutral"><strong>Service restart required</strong><span>To change <code>ENV_NAME</code>, edit the Deployment manually and restart or roll out the Dashboard service. All ConfigMap content below remains editable.</span></div>`)}
      ${settingsCard("Registry and route defaults", "Top-level values from prod.yaml.", `<dl class="dashboard-config-facts compact"><div><dt>Path prefix</dt><dd><code>""</code> (root)</dd></div><div><dt>Docker registries</dt><dd>0 configured</dd></div><div><dt>Chart registries</dt><dd>0 configured</dd></div></dl>`)}
      <input type="hidden" value="" data-settings-control data-dashboard-config-state>
      <div data-shadcn-dashboard-config-root></div>
      ${settingsCard("ConfigMap editor", "Edit the complete ConfigMap YAML, including all menu definitions and 113 metric panels. ENV_NAME remains outside this editor.", `<textarea class="yaml-editor dashboard-config-yaml-source" data-dashboard-config-yaml data-settings-control aria-label="Dashboard ConfigMap YAML editor" spellcheck="false">${esc(dashboardYamlPreview)}</textarea>`)}
    </div>`;

    const registries = [
      { id: "registry-internal", endpoint: "registry.internal.example.com", mirror: "https://mirror.internal.example.com", credential: "platform/registry-pull", pullPolicy: "IfNotPresent", insecure: false },
      { id: "registry-ghcr", endpoint: "ghcr.io", mirror: "", credential: "No credentials", pullPolicy: "IfNotPresent", insecure: false }
    ];
    const registryState = esc(JSON.stringify(registries));
    const registry = `${settingsCard("Image registries", "Manage registry-specific mirrors, credentials, connection security, and image pull behavior.", `<div class="registry-list-toolbar"><div><strong>Configured registries</strong><small>Rules are evaluated against the registry hostname in each workload image reference.</small></div><button class="shadcn-button shadcn-button-default shadcn-button-sm" type="button" data-registry-add>Add registry</button></div><input type="hidden" value="${registryState}" data-settings-control data-registry-state><div class="registry-editor-list" data-registry-list>${registries.map((entry, index) => registryEditorRow(entry, index, registries.length)).join("")}</div>`, '<span class="badge" data-registry-count>2 registries</span>')}`;

    const helmRepositories = [
      { id: "helm-karmada", name: "karmada", url: "https://raw.githubusercontent.com/karmada-io/karmada/master/charts", type: "Helm repository", credential: "No credentials", skipTlsVerify: false },
      { id: "helm-internal", name: "platform", url: "oci://registry.internal.example.com/charts", type: "OCI registry", credential: "karmada-system/helm-repository", skipTlsVerify: false }
    ];
    const helmRepositoryState = esc(JSON.stringify(helmRepositories));
    const helm = `<div class="helm-settings-stack">
      ${settingsCard("Chart repositories", "Configure the Helm and OCI sources available to Karmada lifecycle operations.", `<div class="registry-list-toolbar helm-repository-toolbar"><div><strong>Configured repositories</strong><small>Repository credentials are referenced from Secrets and are not stored directly in this configuration.</small></div><button class="shadcn-button shadcn-button-default shadcn-button-sm" type="button" data-helm-repository-add>Add repository</button></div><input type="hidden" value="${helmRepositoryState}" data-settings-control data-helm-repository-state><div class="registry-editor-list" data-helm-repository-list>${helmRepositories.map((entry, index) => helmRepositoryRow(entry, index, helmRepositories.length)).join("")}</div>`, '<span class="badge" data-helm-repository-count>2 repositories</span>')}
      ${settingsCard("Release defaults", "Defaults applied when installing or upgrading the Karmada control-plane release.", `<div class="settings-form-grid">${settingInput("helm-release-name", "Release name", "karmada", "Helm release used for lifecycle operations.")}${settingInput("helm-release-namespace", "Release namespace", "karmada-system", "Namespace containing the Karmada release.")}${settingInput("helm-chart-reference", "Chart reference", "karmada/karmada", "Repository and chart name passed to Helm.")}${settingInput("helm-operation-timeout", "Operation timeout", "10", "Maximum install or upgrade duration in minutes.", "number", 'min="1" max="60"')}${shadcnSelect("helm-history-limit", "Release history limit", ["5 revisions", "10 revisions", "20 revisions"], "10 revisions", "data-settings-control")}${shadcnSelect("helm-values-source", "Values source", ["Current release values", "Dashboard managed values", "ConfigMap reference"], "Current release values", "data-settings-control")}</div>${settingSwitch("helm-wait", "Wait for resources", "Wait until workloads, Services, and Jobs are ready before completing the operation.", true)}${settingSwitch("helm-atomic", "Atomic operations", "Automatically roll back failed installs and upgrades.", true)}`)}
    </div>`;

    const upgrade = `<div data-official-config-root="upgrade"></div>`;

    const failover = `<input type="hidden" value="" data-settings-control data-failover-config-state><div data-official-config-root="failover"></div>`;

    const reschedule = `<div data-official-config-root="reschedule"></div>`;

    const permissions = `<div data-official-config-root="permissions"></div>`;

    const addons = `<div data-shadcn-addons-root></div>`;

    const activeSection = activeSettingsSection();
    const headerPresentation = settingsHeaderPresentation(activeSection);
    const isActionSection = ["addons", "upgrade", "reschedule", "permissions"].includes(activeSection);
    const panels = [["karmada", karmada], ["dashboard", dashboard], ["registry", registry], ["helm", helm], ["upgrade", upgrade], ["failover", failover], ["reschedule", reschedule], ["permissions", permissions], ["addons", addons]].map(([id, content]) => `<div class="settings-panel" data-settings-panel="${id}" ${id === activeSection ? "" : "hidden"}>${content}</div>`).join("");
    return `<header class="settings-page-header ${isActionSection ? "is-addon-section" : ""}" data-settings-header>
      <div class="settings-page-header-main">
        <div class="settings-page-heading"><span class="settings-page-mark" data-settings-header-icon>${navigationIcon(headerPresentation.icon)}</span><div><span class="settings-page-eyebrow" data-settings-header-eyebrow>${headerPresentation.eyebrow}</span><h1 data-settings-header-title>${headerPresentation.title}</h1><p data-settings-header-description>${headerPresentation.description}</p></div></div>
        <div class="settings-page-command"><div class="settings-active-section"><span data-settings-context-label>${headerPresentation.contextLabel}</span><strong data-settings-section-label>${headerPresentation.contextValue}</strong></div><div class="settings-page-actions" data-settings-header-actions ${isActionSection ? "hidden" : ""}><button class="shadcn-button shadcn-button-outline" type="button" data-settings-discard disabled>Discard</button><button class="shadcn-button shadcn-button-default" type="button" data-settings-save disabled>Save changes</button></div></div>
      </div>
      <div class="settings-page-statusbar">
        <div class="settings-save-state" data-settings-save-state role="status" aria-live="polite" ${isActionSection ? "hidden" : ""}><i aria-hidden="true"></i><div><strong data-settings-dirty>All changes saved</strong><small>Changes are local to this prototype</small></div></div>
        <div class="settings-runtime-context"><span><i class="node-health good"></i>Control plane connected</span><span>Namespace <code>karmada-system</code></span></div>
      </div>
    </header>
      <section class="settings-content settings-page-content" data-settings-root>${panels}</section>`;
  }

  let refreshPoliciesView = () => {};
  let activePolicyFamily = "propagation";

  let activeTableActionTrigger = null;

  function closeTableActionMenu(restoreFocus = false) {
    document.querySelector("[data-table-action-menu]")?.remove();
    document.querySelectorAll(".table-action-trigger").forEach((button) => button.setAttribute("aria-expanded", "false"));
    if (restoreFocus && activeTableActionTrigger?.isConnected) activeTableActionTrigger.focus();
    activeTableActionTrigger = null;
  }

  function openTableActionMenu(trigger, menuHtml) {
    closeTableActionMenu();
    const menu = document.createElement("div");
    menu.className = "table-action-menu policy-action-menu";
    menu.dataset.tableActionMenu = "";
    menu.setAttribute("role", "menu");
    menu.innerHTML = menuHtml;
    document.body.appendChild(menu);
    applyLanguage(menu);
    const rect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(window.innerWidth - menuRect.width - 12, rect.right - menuRect.width))}px`;
    menu.style.top = `${Math.max(12, Math.min(window.innerHeight - menuRect.height - 12, rect.bottom + 5))}px`;
    trigger.setAttribute("aria-expanded", "true");
    activeTableActionTrigger = trigger;
    menu.addEventListener("keydown", (event) => {
      const items = [...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')];
      const current = items.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        closeTableActionMenu(true);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !items.length) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (current + 1 + items.length) % items.length : (current - 1 + items.length) % items.length;
      items[next].focus();
    });
    menu.querySelector("button")?.focus();
  }

  function openControlActionMenu(trigger, row, index, viewId) {
    const config = controlResourceConfigs[viewId];
    const attrs = `data-control-index="${index}" data-control-source="${viewId}"`;
    const editItem = config.editable === false ? "" : `<button type="button" role="menuitem" data-control-action="edit" ${attrs}>${actionIcon("edit")}<span>Edit YAML</span></button>`;
    const contextualItems = (config.actions || []).filter(([action]) => !["delete-pod", "delete-job"].includes(action)).map(([action, label], actionIndex) => {
      const isAutomountAction = action === "disable-automount";
      const resolvedAction = isAutomountAction && row.automount === "Disabled" ? "enable-automount" : action;
      const resolvedLabel = resolvedAction === "enable-automount" ? "Enable automount" : label;
      const icon = action === "logs" ? "logs" : action === "exec" ? "terminal" : action.includes("delete") || action.includes("revoke") ? "delete" : action.includes("edit") || action.includes("scale") ? "edit" : actionIndex === 0 ? "inspect" : "open";
      const tone = action.includes("delete") || action.includes("revoke") ? "danger" : action === "disable-automount" ? "warning" : "";
      return `<button class="${tone}" type="button" role="menuitem" data-control-action="${resolvedAction}" ${attrs}>${actionIcon(icon)}<span>${esc(resolvedLabel)}</span></button>`;
    }).join("");
    const contextualBlock = contextualItems ? `<div class="policy-menu-separator"></div>${contextualItems}` : "";
    const deleteItem = deletableControlWorkloads.has(viewId) ? `<div class="policy-menu-separator"></div><button class="danger" type="button" role="menuitem" data-control-action="delete-resource" ${attrs}>${actionIcon("delete")}<span>Delete</span></button>` : "";
    openTableActionMenu(trigger, `<button type="button" role="menuitem" data-control-action="inspect" ${attrs}>${actionIcon("inspect")}<span>Details</span></button>${editItem}${contextualBlock}${deleteItem}`);
  }

  function openMemberActionMenu(trigger, row, index, viewId) {
    const config = memberTableConfigs[viewId];
    const attrs = `data-member-index="${index}" data-member-source="${viewId}"`;
    const editItem = config.editable === false ? "" : `<button type="button" role="menuitem" data-member-action="edit" ${attrs}>${actionIcon("edit")}<span>Edit YAML</span></button>`;
    const operationSets = {
      pods: [["logs", "View logs"], ["exec", "Open terminal"], ["monitor", "Monitor"]],
      deployments: [["scale", "Scale"], ["restart", "Restart rollout"], ["monitor", "Monitor"]],
      statefulsets: [["scale", "Scale"], ["restart", "Restart rollout"], ["monitor", "Monitor"]],
      daemonsets: [["restart", "Restart rollout"], ["monitor", "Monitor"]],
      jobs: [["logs", "View logs"], ["monitor", "Monitor"]],
      cronjobs: [["run", "Run now"], ["monitor", "Monitor"]],
      nodes: [[row.unschedulable ? "uncordon" : "cordon", row.unschedulable ? "Uncordon" : "Cordon"], ["taint", "Add taint"], ["drain", "Drain"]],
      services: [["proxy", "API proxy"], ["forward", "Port forward"]],
      pvcs: [["expand", "Expand volume"]],
      "helm-releases": [["rollback", "Rollback"]]
    };
    const contextualItems = (operationSets[viewId] || []).map(([operation, operationLabel]) => {
      const icon = operation === "logs" ? "logs" : operation === "exec" ? "terminal" : operation === "monitor" ? "inspect" : operation === "drain" ? "delete" : operation === "proxy" ? "open" : "edit";
      const tone = operation === "drain" ? "danger" : operation === "cordon" ? "warning" : "";
      return `<button class="${tone}" type="button" role="menuitem" data-member-action="${operation}" ${attrs}>${actionIcon(icon)}<span>${operationLabel}</span></button>`;
    }).join("");
    const contextualBlock = contextualItems ? `<div class="policy-menu-separator"></div>${contextualItems}` : "";
    openTableActionMenu(trigger, `<button type="button" role="menuitem" data-member-action="inspect" ${attrs}>${actionIcon("inspect")}<span>Details</span></button>${editItem}${contextualBlock}`);
  }

  function closePolicyMenu() {
    closeTableActionMenu();
  }

  function editPolicyYaml(policy) {
    if (!window.KD_SHADCN?.openYamlDialog) return;
    window.KD_SHADCN.openYamlDialog({
      eyebrow: `Policies / ${policyScope(policy)}`,
      title: `Edit ${policy.name}`,
      description: "Update the policy manifest. Kind and scope remain fixed for this resource.",
      yaml: policy.yamlDraft || policyYaml(policy),
      applyLabel: "Apply policy",
      onApply: (value) => {
        const name = value.match(/^\s*name:\s*([^\s#]+)/m)?.[1];
        const namespace = value.match(/^\s*namespace:\s*([^\s#]+)/m)?.[1];
        const kind = value.match(/^kind:\s*([^\s#]+)/m)?.[1];
        if (!name || kind !== policy.type) return toast("Policy was not applied", `Manifest must keep kind ${policy.type} and include metadata.name.`);
        const duplicate = D.policies.some((candidate) => candidate !== policy && candidate.name === name && candidate.namespace === (namespace || policy.namespace));
        if (duplicate) return toast("Policy name already exists", `${name} already exists in ${namespace || policy.namespace || "cluster scope"}.`);
        policy.name = name;
        if (policyScope(policy) === "Namespaced" && namespace) policy.namespace = namespace;
        policy.yamlDraft = value;
        policy.updated = "Just now";
        refreshPoliciesView();
        toast("Policy updated", `${policy.type}/${policy.name} passed the client-side manifest check.`);
      }
    });
  }

  function deletePolicy(policy) {
    const removePolicy = () => {
      const index = D.policies.findIndex((candidate) => candidate === policy);
      if (index < 0) return false;
      D.policies.splice(index, 1);
      refreshPoliciesView();
      toast("Policy deleted", `${policy.type}/${policy.name} was removed from the current prototype session.`);
      return true;
    };
    if (!window.KD_SHADCN?.openDialog) {
      if (window.confirm(`Delete ${policy.type}/${policy.name}?`)) removePolicy();
      return;
    }
    window.KD_SHADCN.openDialog({
      eyebrow: "Destructive action",
      title: "Delete policy",
      description: `Delete ${policy.type} ${policy.name}. This policy will no longer place or override matching resources.`,
      details: [
        { label: "Kind", value: policy.type },
        { label: "Scope", value: policyScope(policy) },
        { label: "Namespace", value: policyScope(policy) === "Namespaced" ? policy.namespace : "All namespaces" },
        { label: "Status", value: policy.status }
      ],
      note: "Existing member-cluster resources may be reconciled after the policy is removed.",
      confirmLabel: "Delete policy",
      confirmationLabel: "Type",
      confirmationValue: policy.name,
      destructive: true,
      onMount: (root) => applyLanguage(root),
      onConfirm: removePolicy
    });
  }

  function handlePolicyAction(action, policy) {
    if (!policy) return;
    if (action === "inspect") return openPolicyInspector(policy);
    if (action === "edit") return editPolicyYaml(policy);
    if (action === "delete") return deletePolicy(policy);
  }

  function openPolicyInspector(policy) {
    const isOverride = policyFamily(policy) === "override";
    const targets = policyTargetClusters(policy);
    const overview = `<div class="policy-drawer-status">${statusPill(policy.status)}<span>Observed from Karmada API · ${esc(policy.updated)}</span></div><section class="policy-placement-summary"><header><span>${isOverride ? "OVERRIDE ROUTE" : "PLACEMENT ROUTE"}</span><strong>${isOverride ? "Manifest overrides" : "Resolved placement"}</strong></header><div class="policy-placement-flow"><div class="policy-placement-node source"><small>Matched ${policyMatchedCount(policy) === 1 ? "resource" : "resources"}</small><strong>${esc(policy.resources)}</strong><span>${policyMatchedCount(policy)} selected</span></div><div class="policy-placement-route" aria-hidden="true"><span>→</span><small>${isOverride ? `${policy.ruleCount || 1} ${policy.ruleCount === 1 ? "rule" : "rules"}` : "Distribute"}</small></div><div class="policy-placement-node targets"><small>${isOverride ? "Override targets" : "Eligible clusters"}</small><strong>${targets.length} ${targets.length === 1 ? "target" : "targets"}</strong><div>${targets.map((name) => `<span><i></i>${esc(name)}</span>`).join("")}</div></div></div></section><dl class="drawer-facts policy-drawer-facts"><div><dt>Kind</dt><dd>${esc(policy.type)}</dd></div><div><dt>Scope</dt><dd>${esc(policyScope(policy))}</dd></div><div><dt>Namespace</dt><dd>${esc(policyScope(policy) === "Namespaced" ? policy.namespace : "All namespaces")}</dd></div><div><dt>Conflicts</dt><dd class="${policy.conflicts !== "None" ? "text-warn" : ""}">${esc(policy.conflicts)}</dd></div></dl>`;
    const initializeInspector = (root) => {
      if (!root || root.dataset.policyInspectorMounted === "true") return;
      root.dataset.policyInspectorMounted = "true";
      applyLanguage(root);
    };
    window.KD_SHADCN?.openSheet({
      title: policy.name,
      description: `${policy.type} · ${policy.namespace || "Cluster-scoped"}`,
      contentClassName: "detail-drawer policy-detail-drawer w-[min(660px,52vw)] min-w-[540px] max-w-none gap-0 overflow-auto p-0 sm:max-w-none",
      headerHtml: `<header class="drawer-head"><div><span class="eyebrow">POLICY DETAILS</span><h2>${esc(policy.name)}</h2><p>${esc(policy.type)} · ${esc(policyScope(policy) === "Namespaced" ? policy.namespace : "Cluster-scoped")}</p></div></header>`,
      bodyHtml: `<div class="drawer-content policy-overview-content">${overview}</div>`,
      onMount: initializeInspector
    });
    const mountRenderedInspector = (attempt = 0) => {
      const root = document.querySelector(".policy-detail-drawer .shadcn-sheet-legacy-root");
      if (root) initializeInspector(root);
      else if (attempt < 5) requestAnimationFrame(() => mountRenderedInspector(attempt + 1));
    };
    requestAnimationFrame(() => mountRenderedInspector());
  }

  function openPolicyActionMenu(trigger, policy, index) {
    openTableActionMenu(trigger, `<button type="button" role="menuitem" data-policy-action="inspect" data-policy-index="${index}">${actionIcon("inspect")}<span>Details</span></button><button type="button" role="menuitem" data-policy-action="edit" data-policy-index="${index}">${actionIcon("edit")}<span>Edit</span></button><div class="policy-menu-separator"></div><button class="danger" type="button" role="menuitem" data-policy-action="delete" data-policy-index="${index}">${actionIcon("delete")}<span>Delete</span></button>`);
  }

  function initPolicies() {
    const body = document.querySelector("[data-policy-body]");
    if (!body) return;
    const search = document.querySelector("[data-policy-search]");
    const scopeFilter = document.querySelector("[data-policy-scope-filter]");
    const empty = document.querySelector("[data-policy-empty]");
    const summary = document.querySelector("[data-policy-summary]");
    const create = document.querySelector("[data-policy-create]");
    const routeParams = new URLSearchParams(location.search);
    activePolicyFamily = routeParams.get("family") === "override" ? "override" : "propagation";
    const routeScope = routeParams.get("scope") === "cluster" ? "Cluster-scoped" : "All scopes";
    scopeFilter.closest("[data-shadcn-select]")?._shadcnSelect?.setValue(routeScope, false);
    scopeFilter.value = routeScope;
    const syncPolicyRoute = () => {
      const nextUrl = new URL(location.href);
      if (activePolicyFamily === "override") nextUrl.searchParams.set("family", "override");
      else nextUrl.searchParams.delete("family");
      if (scopeFilter.value === "Cluster-scoped") nextUrl.searchParams.set("scope", "cluster");
      else nextUrl.searchParams.delete("scope");
      history.replaceState(null, "", nextUrl);
    };
    const render = () => {
      const query = search.value.trim().toLowerCase();
      const scope = scopeFilter.value;
      const filtered = D.policies.map((policy, index) => ({ policy, index })).filter(({ policy }) => policyFamily(policy) === activePolicyFamily && (scope === "All scopes" || policyScope(policy) === scope) && (!query || [policy.name, policy.namespace, policy.type, policy.resources, policy.placement, policy.status, policyScope(policy)].join(" ").toLowerCase().includes(query)));
      summary.innerHTML = policySummaryMarkup();
      body.innerHTML = filtered.map(({ policy, index }) => policyRowMarkup(policy, index)).join("");
      empty.hidden = filtered.length > 0;
      create.textContent = `Create ${activePolicyFamily === "override" ? "Override" : "Propagation"} Policy`;
      document.querySelectorAll("[data-policy-tab]").forEach((tab) => {
        const active = tab.dataset.policyTab === activePolicyFamily;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      closePolicyMenu();
      applyLanguage(summary);
      applyLanguage(body);
    };
    refreshPoliciesView = render;
    search.addEventListener("input", render);
    scopeFilter.addEventListener("change", () => {
      syncPolicyRoute();
      render();
    });
    document.querySelectorAll("[data-policy-tab]").forEach((tab) => tab.addEventListener("click", () => {
      activePolicyFamily = tab.dataset.policyTab;
      syncPolicyRoute();
      render();
    }));
    create.addEventListener("click", () => {
      const clusterScoped = scopeFilter.value === "Cluster-scoped";
      const kind = activePolicyFamily === "override" ? (clusterScoped ? "ClusterOverridePolicy" : "OverridePolicy") : (clusterScoped ? "ClusterPropagationPolicy" : "PropagationPolicy");
      location.href = `create-resource.html?kind=${kind}`;
    });
    document.querySelector("[data-policy-refresh]")?.addEventListener("click", (event) => {
      const button = event.currentTarget;
      window.KD_REFRESH.run(button, () => {
        D.policies.forEach((policy) => { if (policy.updated !== "Just now") policy.updated = "Moments ago"; });
        render();
        toast("Policies refreshed", `${D.policies.length} policies reconciled from the control plane.`);
      });
    });
    document.addEventListener("click", (event) => {
      const inspect = event.target.closest("[data-policy-inspect]");
      if (inspect) return openPolicyInspector(D.policies[Number(inspect.dataset.policyInspect)]);
      const menuTrigger = event.target.closest("[data-policy-menu]");
      if (menuTrigger) {
        event.stopPropagation();
        return openPolicyActionMenu(menuTrigger, D.policies[Number(menuTrigger.dataset.policyMenu)], Number(menuTrigger.dataset.policyMenu));
      }
      const action = event.target.closest("[data-policy-action]");
      if (action) {
        const policy = D.policies[Number(action.dataset.policyIndex)];
        const actionId = action.dataset.policyAction;
        closePolicyMenu();
        return handlePolicyAction(actionId, policy);
      }
      if (!event.target.closest("[data-table-action-menu]")) closePolicyMenu();
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePolicyMenu(); });
    render();
  }

  function initMetrics() {
    const componentInput = document.querySelector("[data-metrics-component]");
    if (!componentInput) return;
    const componentSelect = componentInput.closest("[data-shadcn-select]")._shadcnSelect;
    const podInput = document.querySelector("[data-metrics-pod]");
    const podSelect = podInput.closest("[data-shadcn-select]")._shadcnSelect;
    const resolutionInput = document.querySelector("[data-metrics-resolution]");
    const metricsDashboardRoot = document.querySelector("[data-metrics-dashboard-root]");
    const profiles = {
      "karmada-scheduler": { short: "Scheduler", pod: "scheduler-0", pods: ["karmada-scheduler-7f67c89b-5lrkg", "All replicas"], count: "2", sample: "9s", values: ["18.4", "17.9", "84", "31", "12", "8.6", "0.2", "0.84"] },
      "karmada-apiserver": { short: "API server", pod: "apiserver-0", pods: ["karmada-apiserver-6c788d9b9f-p6j2n", "All replicas"], count: "3", sample: "7s", values: ["126", "98", "42", "18", "6.4", "3.1", "0.0", "0.36"] },
      "karmada-controller-manager": { short: "Controller", pod: "controller-manager-0", pods: ["karmada-controller-manager-684f6f4878-z2vdb", "All replicas"], count: "2", sample: "11s", values: ["32.6", "28.1", "116", "44", "19", "10.2", "0.6", "1.12"] }
    };
    let currentRange = "60m";
    const metricsDashboard = metricsDashboardRoot && window.mountMetricsDashboard ? window.mountMetricsDashboard(metricsDashboardRoot, {
      component: componentSelect.value,
      range: currentRange,
      resolution: resolutionInput.value,
      values: profiles[componentSelect.value].values
    }) : null;
    const updateComponent = () => {
      const name = componentSelect.value;
      const profile = profiles[name];
      podSelect.setOptions(profile.pods, profile.pods[0]);
      document.querySelector("[data-metrics-component-label]").textContent = name;
      document.querySelector("[data-metrics-context]").textContent = `karmada-system · ${profile.pod} · sample interval ${profile.sample}`;
      document.querySelector("[data-metrics-signal]").textContent = `${profile.short} · 4 metric types`;
      document.querySelector("[data-metrics-pod-count]").textContent = profile.count;
      document.querySelector("[data-metrics-sample-rate]").textContent = profile.sample;
      metricsDashboard?.update({ component: name, values: profile.values });
    };
    componentInput.addEventListener("change", updateComponent);
    podInput.addEventListener("change", () => {
      const profile = profiles[componentSelect.value];
      const pod = podSelect.value === "All replicas" ? "all ready replicas" : profile.pod;
      document.querySelector("[data-metrics-context]").textContent = `karmada-system · ${pod} · sample interval ${profile.sample}`;
    });
    resolutionInput.addEventListener("change", () => {
      document.querySelector("[data-metrics-window-detail]").textContent = `${resolutionInput.value.replace(" seconds", "s").replace(" minute", "m").replace(" minutes", "m")} resolution`;
      metricsDashboard?.update({ resolution: resolutionInput.value });
    });
    document.querySelectorAll("[data-metrics-range]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-metrics-range]").forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      document.querySelector("[data-metrics-window]").textContent = button.dataset.metricsRange;
      currentRange = button.dataset.metricsRange;
      metricsDashboard?.update({ range: currentRange });
    }));
    const refresh = document.querySelector('[data-action="refresh"]');
    refresh?.addEventListener("click", () => {
      window.KD_REFRESH.run(refresh, () => {
        document.querySelector("[data-metrics-sample]").textContent = "Last sample just now";
        toast("Metrics refreshed", "Control-plane component samples are current.");
      });
    });
  }

  function initSettings() {
    const root = document.querySelector("[data-settings-root]");
    if (!root) return;
    const controls = [...root.querySelectorAll("[data-settings-control]")];
    const switches = [...root.querySelectorAll("[data-settings-switch]")];
    const save = document.querySelector("[data-settings-save]");
    const discard = document.querySelector("[data-settings-discard]");
    const state = document.querySelector("[data-settings-dirty]");
    const snapshot = () => ({
      controls: controls.map((control) => control.type === "checkbox" ? control.checked : control.value),
      switches: switches.map((control) => control.classList.contains("on"))
    });
    let baseline = snapshot();
    const dirty = () => JSON.stringify(snapshot()) !== JSON.stringify(baseline);
    const syncDirty = () => {
      const changed = dirty();
      save.disabled = !changed;
      discard.disabled = !changed;
      state.textContent = changed ? "Unsaved changes" : "All changes saved";
      state.classList.toggle("changed", changed);
      document.querySelector("[data-settings-header]")?.classList.toggle("is-dirty", changed);
    };
    controls.forEach((control) => {
      control.addEventListener("input", syncDirty);
      control.addEventListener("change", syncDirty);
    });
    switches.forEach((control) => control.addEventListener("click", () => {
      const enabled = !control.classList.contains("on");
      control.classList.toggle("on", enabled);
      control.setAttribute("aria-checked", String(enabled));
      syncDirty();
    }));
    const registryList = root.querySelector("[data-registry-list]");
    const registryState = root.querySelector("[data-registry-state]");
    const registryCount = document.querySelector("[data-registry-count]");
    const registryAdd = root.querySelector("[data-registry-add]");
    let registrySequence = registryList?.children.length || 0;
    const registryRows = () => [...(registryList?.querySelectorAll("[data-registry-row]") || [])];
    const readRegistries = () => registryRows().map((row) => {
      const value = (field) => row.querySelector(`[data-registry-field="${field}"]`)?.value || "";
      return {
        id: row.dataset.registryId,
        endpoint: value("endpoint").trim(),
        mirror: value("mirror").trim(),
        credential: value("credential"),
        pullPolicy: value("pullPolicy"),
        insecure: row.querySelector("[data-registry-insecure]")?.classList.contains("on") || false
      };
    });
    const syncRegistryCount = () => {
      const count = registryRows().length;
      if (registryCount) registryCount.textContent = `${count} ${count === 1 ? "registry" : "registries"}`;
      const sectionLabel = document.querySelector("[data-settings-section-label]");
      if (sectionLabel && activeSettingsSection() === "registry") sectionLabel.textContent = `${count} configured`;
    };
    const syncRegistryState = () => {
      if (!registryState) return;
      registryState.value = JSON.stringify(readRegistries());
      registryState.dispatchEvent(new Event("input", { bubbles: true }));
      syncRegistryCount();
    };
    const renderRegistries = (registries) => {
      if (!registryList) return;
      registryList.innerHTML = registries.map((entry, index) => registryEditorRow(entry, index, registries.length)).join("");
      initShadcnSelects(registryList);
      syncRegistryCount();
    };
    registryAdd?.addEventListener("click", () => {
      const registries = readRegistries();
      registrySequence += 1;
      registries.push({ id: `registry-custom-${registrySequence}`, endpoint: "", mirror: "", credential: "No credentials", pullPolicy: "IfNotPresent", insecure: false });
      renderRegistries(registries);
      syncRegistryState();
      registryList?.querySelector("[data-registry-row]:last-child [data-registry-field='endpoint']")?.focus();
    });
    registryList?.addEventListener("input", (event) => {
      const field = event.target.closest?.("[data-registry-field]");
      if (!field) return;
      if (field.dataset.registryField === "endpoint") field.closest("[data-registry-row]")?.querySelector(".registry-editor-row-header small")?.replaceChildren(field.value || "New registry");
      syncRegistryState();
    });
    registryList?.addEventListener("change", (event) => {
      if (event.target.closest?.("[data-registry-field]")) syncRegistryState();
    });
    registryList?.addEventListener("click", (event) => {
      const row = event.target.closest?.("[data-registry-row]");
      if (!row) return;
      if (event.target.closest("[data-registry-remove]")) {
        const registries = readRegistries();
        const index = registryRows().indexOf(row);
        if (registries.length <= 1 || index < 0) return;
        const registry = registries[index];
        const endpoint = registry.endpoint || `Registry ${index + 1}`;
        const removeRegistry = () => {
          const current = readRegistries();
          const currentIndex = current.findIndex((entry) => entry.id === registry.id);
          if (current.length <= 1 || currentIndex < 0) return;
          current.splice(currentIndex, 1);
          renderRegistries(current);
          syncRegistryState();
          toast("Registry removed", `${endpoint} was removed from the configuration draft.`);
        };
        if (window.KD_SHADCN?.openDialog) {
          window.KD_SHADCN.openDialog({
            eyebrow: "Destructive action",
            title: "Remove image registry?",
            description: `Remove ${endpoint} and its registry-specific image pull settings from this configuration.`,
            details: [
              { label: "Endpoint", value: endpoint },
              { label: "Credentials", value: registry.credential || "No credentials" },
              { label: "Pull policy", value: registry.pullPolicy || "IfNotPresent" }
            ],
            note: "Workloads that reference this registry will no longer use its mirror, credentials, or insecure connection rule after the configuration is saved.",
            cancelLabel: "Keep registry",
            confirmLabel: "Remove registry",
            destructive: true,
            onConfirm: removeRegistry
          });
        } else if (window.confirm(`Remove image registry ${endpoint}?`)) {
          removeRegistry();
        }
        return;
      }
      const insecure = event.target.closest("[data-registry-insecure]");
      if (insecure) {
        const enabled = !insecure.classList.contains("on");
        insecure.classList.toggle("on", enabled);
        insecure.setAttribute("aria-checked", String(enabled));
        syncRegistryState();
        return;
      }
      if (event.target.closest("[data-registry-test]")) {
        const endpoint = row.querySelector('[data-registry-field="endpoint"]')?.value.trim();
        const result = row.querySelector("[data-registry-test-result]");
        if (!endpoint) {
          result.textContent = "Endpoint required";
          result.classList.remove("success");
          return;
        }
        result.textContent = "Connected · 184 ms";
        result.classList.add("success");
        toast("Registry reachable", `${endpoint} passed its connection and credentials checks.`);
      }
    });
    root.addEventListener("settings:discard", () => {
      if (!registryState || !registryList) return;
      try { renderRegistries(JSON.parse(registryState.value)); } catch (_error) { /* Keep the current editor when the stored draft is invalid. */ }
    });
    const helmRepositoryList = root.querySelector("[data-helm-repository-list]");
    const helmRepositoryState = root.querySelector("[data-helm-repository-state]");
    const helmRepositoryCount = document.querySelector("[data-helm-repository-count]");
    const helmRepositoryAdd = root.querySelector("[data-helm-repository-add]");
    let helmRepositorySequence = helmRepositoryList?.children.length || 0;
    const helmRepositoryRows = () => [...(helmRepositoryList?.querySelectorAll("[data-helm-repository-row]") || [])];
    const readHelmRepositories = () => helmRepositoryRows().map((row) => {
      const value = (field) => row.querySelector(`[data-helm-repository-field="${field}"]`)?.value || "";
      return {
        id: row.dataset.helmRepositoryId,
        name: value("name").trim(),
        url: value("url").trim(),
        type: value("type"),
        credential: value("credential"),
        skipTlsVerify: row.querySelector("[data-helm-repository-insecure]")?.classList.contains("on") || false
      };
    });
    const syncHelmRepositoryCount = () => {
      if (!helmRepositoryCount) return;
      const count = helmRepositoryRows().length;
      helmRepositoryCount.textContent = `${count} ${count === 1 ? "repository" : "repositories"}`;
    };
    const syncHelmRepositoryState = () => {
      if (!helmRepositoryState) return;
      helmRepositoryState.value = JSON.stringify(readHelmRepositories());
      helmRepositoryState.dispatchEvent(new Event("input", { bubbles: true }));
      syncHelmRepositoryCount();
    };
    const renderHelmRepositories = (repositories) => {
      if (!helmRepositoryList) return;
      helmRepositoryList.innerHTML = repositories.map((entry, index) => helmRepositoryRow(entry, index, repositories.length)).join("");
      initShadcnSelects(helmRepositoryList);
      syncHelmRepositoryCount();
    };
    helmRepositoryAdd?.addEventListener("click", () => {
      const repositories = readHelmRepositories();
      helmRepositorySequence += 1;
      repositories.push({ id: `helm-custom-${helmRepositorySequence}`, name: "", url: "", type: "Helm repository", credential: "No credentials", skipTlsVerify: false });
      renderHelmRepositories(repositories);
      syncHelmRepositoryState();
      helmRepositoryList?.querySelector("[data-helm-repository-row]:last-child [data-helm-repository-field='name']")?.focus();
    });
    helmRepositoryList?.addEventListener("input", (event) => {
      const field = event.target.closest?.("[data-helm-repository-field]");
      if (!field) return;
      const row = field.closest("[data-helm-repository-row]");
      if (field.dataset.helmRepositoryField === "name") row?.querySelector(".registry-editor-row-header strong")?.replaceChildren(field.value || "New repository");
      if (field.dataset.helmRepositoryField === "url") row?.querySelector(".registry-editor-row-header small")?.replaceChildren(field.value || "New chart repository");
      syncHelmRepositoryState();
    });
    helmRepositoryList?.addEventListener("change", (event) => {
      if (event.target.closest?.("[data-helm-repository-field]")) syncHelmRepositoryState();
    });
    helmRepositoryList?.addEventListener("click", (event) => {
      const row = event.target.closest?.("[data-helm-repository-row]");
      if (!row) return;
      const repositories = readHelmRepositories();
      const index = helmRepositoryRows().indexOf(row);
      if (event.target.closest("[data-helm-repository-remove]")) {
        if (repositories.length <= 1 || index < 0) return;
        const repository = repositories[index];
        const label = repository.name || repository.url || `Repository ${index + 1}`;
        const removeRepository = () => {
          const current = readHelmRepositories();
          const currentIndex = current.findIndex((entry) => entry.id === repository.id);
          if (current.length <= 1 || currentIndex < 0) return;
          current.splice(currentIndex, 1);
          renderHelmRepositories(current);
          syncHelmRepositoryState();
          toast("Helm repository removed", `${label} was removed from the configuration draft.`);
        };
        if (window.KD_SHADCN?.openDialog) {
          window.KD_SHADCN.openDialog({
            eyebrow: "Destructive action",
            title: "Remove Helm repository?",
            description: `Remove ${label} from the chart sources available to lifecycle operations.`,
            details: [
              { label: "Repository", value: repository.name || "Unnamed" },
              { label: "URL", value: repository.url || "Not configured" },
              { label: "Type", value: repository.type || "Helm repository" }
            ],
            note: "Existing releases are not removed, but future installs and upgrades cannot resolve charts from this source after saving.",
            cancelLabel: "Keep repository",
            confirmLabel: "Remove repository",
            destructive: true,
            onConfirm: removeRepository
          });
        } else if (window.confirm(`Remove Helm repository ${label}?`)) {
          removeRepository();
        }
        return;
      }
      const insecure = event.target.closest("[data-helm-repository-insecure]");
      if (insecure) {
        const enabled = !insecure.classList.contains("on");
        insecure.classList.toggle("on", enabled);
        insecure.setAttribute("aria-checked", String(enabled));
        syncHelmRepositoryState();
        return;
      }
      if (event.target.closest("[data-helm-repository-test]")) {
        const result = row.querySelector("[data-helm-repository-test-result]");
        const repository = repositories[index];
        if (!repository?.name || !repository?.url) {
          result.textContent = "Name and URL required";
          result.classList.remove("success");
          return;
        }
        result.textContent = "Index loaded · 126 ms";
        result.classList.add("success");
        toast("Helm repository reachable", `${repository.name} returned a valid chart index.`);
      }
    });
    root.addEventListener("settings:discard", () => {
      if (!helmRepositoryState || !helmRepositoryList) return;
      try { renderHelmRepositories(JSON.parse(helmRepositoryState.value)); } catch (_error) { /* Keep the current editor when the stored draft is invalid. */ }
    });
    const syncSection = () => {
      const activeSection = activeSettingsSection();
      const presentation = settingsHeaderPresentation(activeSection);
      const isActionSection = ["addons", "upgrade", "reschedule", "permissions"].includes(activeSection);
      document.querySelectorAll("[data-settings-panel]").forEach((panel) => { panel.hidden = panel.dataset.settingsPanel !== activeSection; });
      document.querySelectorAll("[data-settings-nav-section]").forEach((link) => {
        const active = link.dataset.settingsNavSection === activeSection;
        link.classList.toggle("active", active);
        link.setAttribute("aria-current", active ? "page" : "false");
      });
      const headerActions = document.querySelector("[data-settings-header-actions]");
      const saveState = document.querySelector("[data-settings-save-state]");
      const sectionLabel = document.querySelector("[data-settings-section-label]");
      const header = document.querySelector("[data-settings-header]");
      const breadcrumb = document.querySelector(".breadcrumb");
      const headerIcon = document.querySelector("[data-settings-header-icon]");
      const headerEyebrow = document.querySelector("[data-settings-header-eyebrow]");
      const headerTitle = document.querySelector("[data-settings-header-title]");
      const headerDescription = document.querySelector("[data-settings-header-description]");
      const contextLabel = document.querySelector("[data-settings-context-label]");
      header?.classList.toggle("is-addon-section", isActionSection);
      if (headerActions) headerActions.hidden = isActionSection;
      if (saveState) saveState.hidden = isActionSection;
      if (breadcrumb) breadcrumb.textContent = presentation.breadcrumb;
      if (headerIcon) headerIcon.innerHTML = navigationIcon(presentation.icon);
      if (headerEyebrow) headerEyebrow.textContent = presentation.eyebrow;
      if (headerTitle) headerTitle.textContent = presentation.title;
      if (headerDescription) headerDescription.textContent = presentation.description;
      if (contextLabel) contextLabel.textContent = presentation.contextLabel;
      if (sectionLabel) sectionLabel.textContent = presentation.contextValue;
    };
    window.addEventListener("hashchange", syncSection);
    syncSection();
    save.addEventListener("click", () => {
      if (!dirty()) return;
      baseline = snapshot();
      root.dispatchEvent(new CustomEvent("settings:save"));
      syncDirty();
      const section = activeSettingsSection();
      toast("Configuration saved", section === "failover" ? "The PropagationPolicy failover template is now current." : "All mock control-plane settings are now current.");
    });
    discard.addEventListener("click", () => {
      controls.forEach((control, index) => {
        const value = baseline.controls[index];
        if (control.type === "checkbox") control.checked = value;
        else if (control.type === "hidden" && control.closest("[data-shadcn-select]")?._shadcnSelect) control.closest("[data-shadcn-select]")._shadcnSelect.setValue(value, false);
        else control.value = value;
      });
      switches.forEach((control, index) => {
        control.classList.toggle("on", baseline.switches[index]);
        control.setAttribute("aria-checked", String(baseline.switches[index]));
      });
      root.dispatchEvent(new CustomEvent("settings:discard"));
      syncDirty();
      toast("Changes discarded", "The last saved mock configuration was restored.");
    });
    document.querySelectorAll("[data-settings-test]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.settingsTest;
      if (action === "registry") {
        const result = document.querySelector('[data-settings-test-result="registry"]');
        result.textContent = "Connected · 184 ms";
        result.classList.add("success");
        return toast("Registry reachable", "TLS and credentials checks succeeded in 184 ms.");
      }
      if (action === "upgrade") {
        const result = document.querySelector('[data-settings-test-result="upgrade"]');
        result.textContent = "6 / 6 checks passed";
        result.classList.add("success");
        return modal("Upgrade preflight passed", "CRDs, API compatibility, image availability, member-cluster skew, backup state, and maintenance window are ready.", "Done");
      }
      if (action === "permission") return modal("Add group mapping", "Choose an identity-provider group, role, and namespace or federation scope. The final form is represented by this interaction in the static prototype.", "Add mapping");
    }));
    syncDirty();
  }

  function statesPage() {
    return `${pageHeader('<button class="btn primary" data-action="simulate">Simulate state</button>', '')}
      <section class="state-grid">
        <article class="state-card"><span class="state-code">01 · Loading</span><h2>Loading workloads</h2><p>The surrounding context remains available while the table resolves.</p><div class="skeleton line"></div><div class="skeleton line short"></div><div class="skeleton line"></div></article>
        <article class="state-card"><span class="state-code">02 · Empty</span><h2>No workloads in this namespace</h2><p>Namespace <strong>preview</strong> is reachable and returned no workload objects.</p><button class="btn">Choose another namespace</button> <button class="btn primary">Create workload</button></article>
        <article class="state-card warning"><span class="state-code">03 · Partial failure</span><h2>Metrics are incomplete</h2><p>Resource state is current. CPU and memory series from member3 could not be fetched.</p><div class="state-detail">GET /apis/metrics.k8s.io · timeout after 10s</div><button class="btn" data-action="retry">Retry failed source</button></article>
        <article class="state-card error"><span class="state-code">04 · Fatal error</span><h2>Control plane is unavailable</h2><p>Navigation is preserved so operators can copy diagnostics or return after recovery.</p><div class="state-detail">karmada-apiserver · connection refused · trace 7f9a1c</div><button class="btn" data-action="copy">Copy diagnostics</button> <button class="btn primary" data-action="retry">Retry connection</button></article>
        <article class="state-card error"><span class="state-code">05 · Forbidden / RBAC</span><h2>You cannot list Secrets</h2><p>This is a permission failure, not an empty namespace. Request the required role from a member cluster administrator.</p><div class="state-detail">Required: secrets.list · scope: member2 / platform</div><button class="btn">View required role</button></article>
        <article class="state-card warning"><span class="state-code">06 · Stale / disconnected</span><h2>Showing last known state</h2><p>member3 disconnected 8 minutes ago. Values below are frozen and no longer represent live state.</p><div class="state-detail">LAST SUCCESSFUL SYNC · 10:25:04 CST</div><button class="btn" data-action="retry">Test connection</button></article>
        <article class="state-card error"><span class="state-code">07 · Destructive confirmation</span><h2>Delete member3?</h2><p>This removes the member cluster registration. Existing workloads on the member cluster will keep running but leave Karmada management.</p><div class="state-detail">Affected: 13 workloads · 4 policies · pull-mode agent</div><button class="btn">Cancel</button> <button class="btn danger" data-action="delete-confirm">Type name to delete</button></article>
        <article class="state-card success"><span class="state-code">08 · Normal / success</span><h2>Policy propagated</h2><p>demo-policy resolved successfully across all three member clusters. No placement conflicts were found.</p><div class="state-detail">3 / 3 MEMBER CLUSTERS · REVISION 12 · 6s AGO</div><button class="btn">View policy</button></article>
      </section>`;
  }

  function loginPage() {
    return `<main class="login-page"><section class="login-story"><div class="login-brand"><img src="${logoUrl}" alt=""><strong>Karmada</strong></div><div class="login-copy"><h1>One Control Plane.<br>Every Member Cluster.</h1><p>Operate resources, policies, and member clusters from a single, verifiable control plane.</p></div></section><section class="login-form-wrap"><form class="login-form" data-login-form><div class="login-utilities">${languageSwitch()}${themeSwitch()}</div><h2>Sign in to Dashboard</h2><p>Use a service account token authorized for this Karmada control plane.</p><div class="field"><label for="token">Bearer token</label><textarea id="token" placeholder="Paste token here" required></textarea><small>The token stays in this browser session for the static prototype.</small></div><button class="btn primary" type="submit">Continue to Control Plane overview</button><div class="login-note">OIDC is configured by the administrator. <button class="btn quiet small" type="button" data-action="oidc">Sign in with OIDC</button></div></form></section></main>`;
  }

  const renderers = { overview: overviewPage, topology: globalTopologyPage, resources: resourcesPage, policies: policiesPage, clusters: clustersPage, member: memberPage, metrics: metricsPage, settings: settingsPage, states: statesPage, create: createPage };

  function shell(content) {
    const railCollapsed = localStorage.getItem("karmada-rail-collapsed") === "1";
    const workbenchClass = page === "topology" ? "workbench topology-workbench" : page === "settings" ? "workbench settings-workbench" : "workbench";
    return `<div class="app-shell ${railCollapsed ? "rail-collapsed" : ""}">${globalTopbar()}${sideRail()}<main class="${workbenchClass}">${topbar()}${content}</main></div>`;
  }

  function modal(title, body, confirmLabel = "Continue", destructive = false) {
    if (window.KD_SHADCN) {
      window.KD_SHADCN.openDialog({
        title,
        description: body,
        confirmLabel,
        destructive,
        onConfirm: () => toast("Prototype action completed", "No backend state was changed.")
      });
      return;
    }
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><p>${body}</p><div class="modal-actions"><button class="btn" data-modal-close>Cancel</button><button class="btn ${destructive ? "danger" : "primary"}" data-modal-confirm>${confirmLabel}</button></div></section>`;
    document.body.appendChild(backdrop);
    applyLanguage(backdrop);
    backdrop.querySelector("[data-modal-close]").addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
    backdrop.querySelector("[data-modal-confirm]").addEventListener("click", () => { backdrop.remove(); toast("Prototype action completed", "No backend state was changed."); });
  }

  function toast(title, detail = "") {
    if (window.KD_SHADCN) {
      window.KD_SHADCN.toast(title, detail);
      return;
    }
    document.querySelector(".toast")?.remove();
    const element = document.createElement("div");
    element.className = "toast";
    element.innerHTML = `<b>${title}</b>${detail ? `<br><span>${detail}</span>` : ""}`;
    document.body.appendChild(element);
    applyLanguage(element);
    window.setTimeout(() => element.remove(), 3200);
  }

  function closePopovers(except = "") {
    document.querySelectorAll("[data-popover]").forEach((panel) => {
      if (panel.dataset.popover !== except) panel.hidden = true;
    });
    document.querySelectorAll('[data-action="scope-menu"], [data-action="user-menu"]').forEach((button) => {
      const owns = button.dataset.action.replace("-menu", "");
      if (owns !== except) button.setAttribute("aria-expanded", "false");
    });
  }

  function togglePopover(name, trigger) {
    const panel = document.querySelector(`[data-popover="${name}"]`);
    if (!panel) return;
    const willOpen = panel.hidden;
    closePopovers(willOpen ? name : "");
    panel.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", String(willOpen));
  }

  function controlPlaneTerminalManager() {
    const existing = document.querySelector(".terminal-backdrop");
    if (existing) {
      existing.querySelector("[data-terminal-dismiss]")?.click();
      return;
    }
    const launcher = document.querySelector('[data-action="control-plane-terminal"]');
    const backdrop = document.createElement("div");
    backdrop.className = "terminal-backdrop";
    backdrop.innerHTML = `<section class="terminal-manager" role="dialog" aria-modal="true" aria-labelledby="terminal-title">
      <div class="terminal-resize-handle" data-terminal-resize role="separator" aria-orientation="horizontal" aria-label="Resize terminal"><span></span></div>
      <header class="terminal-manager-head"><div><span class="session-led"></span><span><h2 id="terminal-title">Control Plane terminal</h2><p>Audited shell access · read-only prototype</p></span></div><div class="terminal-window-actions"><button class="terminal-window-button" type="button" data-terminal-maximize data-tooltip="Maximize terminal" aria-label="Maximize terminal" aria-pressed="false"><svg class="terminal-maximize-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><svg class="terminal-restore-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="7" y="4" width="13" height="13" rx="2"></rect><path d="M17 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"></path></svg></button><button class="terminal-window-button" type="button" data-terminal-dismiss data-tooltip="Close terminal" aria-label="Close terminal">${closeIcon()}</button></div></header>
      <div class="terminal-manager-body">
        <section class="terminal-console-wrap" data-terminal-console>
          <div class="terminal-console-bar"><div><span class="session-led"></span><b>platform-admin@karmada-control-plane</b><small>karmada-system</small></div><span>Interactive · connected</span></div>
          <pre class="terminal-output" data-terminal-output>Last login: Sun Jul 27 10:42:18 on karmada-dashboard\nConnected to Karmada control plane v1.17.0\nRead-only mock shell · type "help" for available commands.</pre>
          <form class="terminal-command terminal-live-prompt" data-terminal-form><label for="terminal-live-input">platform-admin@karmada-control-plane:~$</label><input id="terminal-live-input" aria-label="Terminal command" autocomplete="off" autocapitalize="off" spellcheck="false"></form>
        </section>
      </div>
    </section>`;
    document.body.appendChild(backdrop);
    launcher?.setAttribute("aria-expanded", "true");
    applyLanguage(backdrop);

    const output = backdrop.querySelector("[data-terminal-output]");
    const consoleElement = backdrop.querySelector("[data-terminal-console]");
    const terminalForm = backdrop.querySelector("[data-terminal-form]");
    const terminalInput = terminalForm.querySelector("input");
    const manager = backdrop.querySelector(".terminal-manager");
    const maximize = backdrop.querySelector("[data-terminal-maximize]");
    const resizeHandle = backdrop.querySelector("[data-terminal-resize]");
    let resizeStartY = 0;
    let resizeStartHeight = 0;
    const commandHistory = [];
    const commandCatalog = ["help", "clear", "whoami", "pwd", "date", "kubectl get clusters", "kubectl get pods -n karmada-system", "karmadactl version"];
    let historyIndex = 0;

    const onResizeMove = (event) => {
      if (!manager.classList.contains("resizing")) return;
      const nextHeight = Math.min(window.innerHeight - 10, Math.max(320, resizeStartHeight + resizeStartY - event.clientY));
      manager.style.height = `${nextHeight}px`;
    };
    const stopResize = () => manager.classList.remove("resizing");

    const dismiss = () => {
      window.removeEventListener("pointermove", onResizeMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      launcher?.setAttribute("aria-expanded", "false");
      backdrop.remove();
      launcher?.focus();
    };

    const setMaximized = (maximized) => {
      manager.classList.toggle("maximized", maximized);
      maximize.setAttribute("aria-pressed", String(maximized));
      maximize.setAttribute("aria-label", maximized ? "Restore terminal" : "Maximize terminal");
      maximize.dataset.tooltip = maximized ? "Restore terminal" : "Maximize terminal";
      resizeHandle.setAttribute("aria-disabled", String(maximized));
      if (maximized) manager.style.removeProperty("height");
    };

    resizeHandle.addEventListener("pointerdown", (event) => {
      if (manager.classList.contains("maximized")) return;
      event.preventDefault();
      resizeStartY = event.clientY;
      resizeStartHeight = manager.getBoundingClientRect().height;
      manager.classList.add("resizing");
    });
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    resizeHandle.addEventListener("dblclick", () => setMaximized(!manager.classList.contains("maximized")));
    maximize.addEventListener("click", () => setMaximized(!manager.classList.contains("maximized")));

    const commandResponse = (command) => {
      if (command === "help") return "Available commands:\n  kubectl get clusters\n  kubectl get pods -n karmada-system\n  karmadactl version\n  whoami · pwd · date · clear";
      if (command === "whoami") return "platform-admin";
      if (command === "pwd") return "/home/platform-admin";
      if (command === "date") return new Date().toString();
      if (/^(kubectl\s+)?get\s+clusters$/i.test(command)) return "NAME      STATUS   VERSION\nmember1   Ready    v1.35.0\nmember2   Ready    v1.35.0\nmember3   Stale    v1.35.0";
      if (/^(kubectl\s+)?get\s+pods(?:\s+-n\s+karmada-system)?$/i.test(command)) return "NAME                               READY   STATUS    AGE\nkarmada-apiserver-0                1/1     Running   14d\nkarmada-scheduler-0                1/1     Running   14d\nkarmada-controller-manager-0       1/1     Running   14d";
      if (/^(karmadactl\s+)?version$/i.test(command)) return "karmadactl version: v1.17.0\nkarmada-apiserver version: v1.17.0\nkubernetes version: v1.35.0";
      return `bash: ${command.split(/\s+/)[0]}: command not found`;
    };

    const executeCommand = () => {
      const command = terminalInput.value.trim();
      if (!command) return;
      commandHistory.push(command);
      historyIndex = commandHistory.length;
      terminalInput.value = "";
      if (command === "clear") {
        output.textContent = "";
        return;
      }
      output.textContent += `${output.textContent ? "\n" : ""}platform-admin@karmada-control-plane:~$ ${command}\n${commandResponse(command)}`;
      output.scrollTop = output.scrollHeight;
    };
    terminalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      executeCommand();
    });

    terminalInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        executeCommand();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        if (!commandHistory.length) return;
        historyIndex = event.key === "ArrowUp" ? Math.max(0, historyIndex - 1) : Math.min(commandHistory.length, historyIndex + 1);
        terminalInput.value = historyIndex === commandHistory.length ? "" : commandHistory[historyIndex];
        terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        const value = terminalInput.value.trim().toLowerCase();
        const matches = commandCatalog.filter((command) => command.startsWith(value));
        if (matches.length === 1) terminalInput.value = matches[0];
        else if (matches.length > 1) {
          output.textContent += `${output.textContent ? "\n" : ""}${matches.join("    ")}`;
          output.scrollTop = output.scrollHeight;
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        output.textContent = "";
      }
    });
    consoleElement.addEventListener("click", (event) => { if (!event.target.closest("button")) terminalInput.focus(); });

    backdrop.querySelectorAll("[data-terminal-dismiss]").forEach((button) => button.addEventListener("click", dismiss));
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) dismiss(); });
    terminalInput.focus();
  }

  function memberYaml(row) {
    const namespace = row.namespace ? `\n  namespace: ${row.namespace}` : "";
    return `apiVersion: v1\nkind: ${row.kind || "KubernetesObject"}\nmetadata:\n  name: ${row.name || "unnamed"}${namespace}\n  labels:\n    app.kubernetes.io/managed-by: karmada-dashboard\nspec:\n  # Static design prototype — inspect the production manifest before saving.\n  revision: review-required`;
  }

  function openMemberDrawer(row, viewId, initialTab = "overview") {
    if (window.KD_MEMBER_DETAIL) {
      window.KD_MEMBER_DETAIL.open({ row, viewId, initialTab, config: memberTableConfigs[viewId] || { title: row.kind || "Resource" }, member: D.member, memberYaml, statusPill, toast, onApplied: renderMemberRoute });
      return;
    }
    document.querySelector(".drawer-backdrop")?.remove();
    const config = memberTableConfigs[viewId] || { title: row.kind || "Resource" };
    const quickActions = memberQuickActions(row, viewId);
    const backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop";
    const facts = Object.entries(row).filter(([key]) => !["name", "kind", "message", "sensitive"].includes(key)).slice(0, 9);
    const overview = resourceDetailOverview(row, facts, D.member.name, D.member.lastSync);
    const eventBody = row.message ? `<div class="event-callout ${row.status === "Review" ? "warning" : ""}"><span>${row.reason || "Event"}</span><strong>${row.message}</strong><small>${row.source || "kubernetes"} · ${row.lastSeen || "current"}</small></div>` : `<div class="event-callout"><span>Normal</span><strong>No warning events for this object</strong><small>Latest member sync ${D.member.lastSync}</small></div>`;
    backdrop.innerHTML = `<aside class="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><header class="drawer-head"><div><span class="eyebrow">Resource details</span><h2 id="drawer-title">${row.name || row.object || config.title}</h2><p>${row.namespace ? `${row.namespace} · ` : ""}${D.member.name}</p></div><button class="drawer-close" type="button" aria-label="Close details">×</button></header>${quickActions ? `<div class="drawer-quick-actions">${quickActions}</div>` : ""}<div class="drawer-tabs"><button type="button" data-drawer-tab="overview">Overview</button><button type="button" data-drawer-tab="events">Events</button><button type="button" data-drawer-tab="yaml">YAML</button></div><div class="drawer-content"><section data-drawer-panel="overview">${overview}</section><section data-drawer-panel="events">${eventBody}</section><section data-drawer-panel="yaml"><textarea class="yaml-editor" spellcheck="false" aria-label="YAML manifest" aria-readonly="true" readonly>${memberYaml(row)}</textarea><div class="yaml-actions yaml-readonly-note"><span>Manifest snapshot · read only</span><small>Edit YAML is available from the row Actions menu.</small></div></section></div></aside>`;
    document.body.appendChild(backdrop);
    applyLanguage(backdrop);

    const setTab = (tabId) => {
      backdrop.querySelectorAll("[data-drawer-tab]").forEach((button) => button.classList.toggle("active", button.dataset.drawerTab === tabId));
      backdrop.querySelectorAll("[data-drawer-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.drawerPanel === tabId));
    };
    setTab(initialTab);
    backdrop.querySelector(".drawer-close").addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", (event) => { if (event.target === backdrop) backdrop.remove(); });
    backdrop.querySelectorAll("[data-drawer-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.drawerTab)));
    backdrop.querySelectorAll("[data-resource-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.resourceAction;
      if (action === "logs") return modal(`Logs · ${row.name}`, "Streaming pod logs would open with container and time-range controls.", "Open log viewer");
      if (action === "exec") return modal(`Terminal · ${row.name}`, "An audited shell session would open in the selected container.", "Open terminal");
      if (action === "scale") return modal(`Scale · ${row.name}`, "Choose the desired replica count and review availability impact before applying.", "Review scale");
      if (action === "restart") return modal(`Restart rollout · ${row.name}`, "A rolling restart would preserve the configured availability budget.", "Review restart");
      if (action === "drain") return modal(`Drain · ${row.name}`, "Pods, disruption budgets, and daemon workloads would be reviewed before eviction.", "Review drain", true);
      if (action === "run") return modal(`Run · ${row.name}`, "A one-off Job would be created from the current CronJob template.", "Create Job");
      if (action === "forward") return modal(`Port forward · ${row.name}`, "Choose a service port and a local port for this browser session.", "Configure forward");
    }));
  }

  function memberQuickActions(row, viewId) {
    const actionSets = {
      pods: [["logs", "View logs"], ["exec", "Open terminal"]],
      deployments: [["scale", "Scale"], ["restart", "Restart rollout"]],
      statefulsets: [["scale", "Scale"], ["restart", "Restart rollout"]],
      nodes: [["exec", "Open shell"], ["drain", "Drain node"]],
      cronjobs: [["run", "Run now"]],
      services: [["forward", "Port forward"]]
    };
    return (actionSets[viewId] || []).map(([action, label]) => `<button type="button" data-resource-action="${action}">${label}</button>`).join("");
  }

  function bindMemberFilters() {
    const search = document.querySelector("[data-member-search]");
    const namespace = document.querySelector("[data-member-namespace]");
    const rows = [...document.querySelectorAll("[data-member-filter-body] tr")];
    const result = document.querySelector("[data-member-result]");
    const showing = document.querySelector("[data-member-showing]");
    if (!rows.length) return;
    const apply = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const selectedNamespace = namespace?.value || "";
      let shown = 0;
      rows.forEach((row) => {
        const matchesQuery = !query || row.dataset.search.includes(query);
        const matchesNamespace = !selectedNamespace || row.dataset.namespace === selectedNamespace;
        const visible = matchesQuery && matchesNamespace;
        row.classList.toggle("hidden", !visible);
        if (visible) shown += 1;
      });
      if (result) result.textContent = `${shown} result${shown === 1 ? "" : "s"}`;
      if (showing) showing.textContent = `Showing ${shown} of ${rows.length}`;
    };
    search?.addEventListener("input", apply);
    namespace?.addEventListener("change", apply);
  }

  function renderMemberRoute() {
    closeTableActionMenu();
    const requested = location.hash.replace(/^#/, "") || "overview";
    const viewId = ["overview", "metrics"].includes(requested) || memberTableConfigs[requested] ? requested : "overview";
    const nav = document.querySelector("[data-rail-navigation]");
    const root = document.querySelector("[data-member-workspace-root]");
    if (!nav || !root) return;
    nav.innerHTML = memberSideNav(viewId);
    root.innerHTML = viewId === "overview" ? memberOverviewView() : viewId === "metrics" ? window.KD_MEMBER_METRICS.render(D.member, D.memberResources, statusPill) : memberTableView(viewId);
    applyLanguage(nav);
    applyLanguage(root);
    bindMemberFilters();
    if (viewId === "metrics") window.KD_MEMBER_METRICS.bind(root, toast);
  }

  function initMemberWorkspace() {
    renderMemberRoute();
    window.addEventListener("hashchange", renderMemberRoute);
    document.addEventListener("click", (event) => {
      const route = event.target.closest("[data-member-view]");
      if (route) {
        const next = route.dataset.memberView;
        if (location.hash === `#${next}`) renderMemberRoute();
        else location.hash = next;
        return;
      }
      const groupToggle = event.target.closest("[data-member-group-toggle]");
      if (groupToggle) {
        const group = groupToggle.closest("[data-resource-nav-group]");
        const content = group.querySelector(".resource-group-links");
        if (expandRailToGroup(group, groupToggle, content)) return;
        const open = group.classList.toggle("open");
        group.dataset.state = open ? "open" : "closed";
        groupToggle.setAttribute("aria-expanded", String(open));
        content?.setAttribute("aria-hidden", String(!open));
        if (content) content.inert = !open;
        return;
      }
      const menuTrigger = event.target.closest("[data-member-menu]");
      if (menuTrigger) {
        event.stopPropagation();
        const source = menuTrigger.dataset.memberSource;
        const index = Number(menuTrigger.dataset.memberMenu || 0);
        const config = memberTableConfigs[source];
        const row = D.memberResources[config?.dataKey]?.[index];
        if (row) openMemberActionMenu(menuTrigger, row, index, source);
        return;
      }
      const action = event.target.closest("[data-member-action]");
      if (!action) {
        if (!event.target.closest("[data-table-action-menu]")) closeTableActionMenu();
        return;
      }
      closeTableActionMenu();
      const actionId = action.dataset.memberAction;
      if (actionId === "refresh") {
        return window.KD_REFRESH.run(action, () => {
          toast(`${D.member.name} refreshed`, "Kubernetes objects and metrics are current.");
        });
      }
      if (actionId === "columns") return modal("Visible columns", "Choose which resource fields remain pinned in this table. The prototype keeps the current recommended set.", "Keep columns");
      if (actionId === "create") {
        const viewId = location.hash.replace(/^#/, "") || "deployments";
        location.href = `create-resource.html?cluster=${encodeURIComponent(D.member.name)}&kind=${encodeURIComponent(viewId)}`;
        return;
      }
      const detailTabActions = { logs: "logs", exec: "terminal", monitor: "monitor", proxy: "proxy" };
      if (detailTabActions[actionId]) {
        const source = action.dataset.memberSource;
        const index = Number(action.dataset.memberIndex || 0);
        const config = memberTableConfigs[source];
        const row = D.memberResources[config?.dataKey]?.[index];
        if (row) openMemberDrawer(row, source, detailTabActions[actionId]);
        return;
      }
      if (["scale", "restart", "run", "forward", "cordon", "uncordon", "taint", "drain", "expand", "rollback"].includes(actionId)) {
        const source = action.dataset.memberSource;
        const index = Number(action.dataset.memberIndex || 0);
        const config = memberTableConfigs[source];
        const row = D.memberResources[config?.dataKey]?.[index];
        if (row && window.KD_MEMBER_DETAIL?.runAction) window.KD_MEMBER_DETAIL.runAction({ row, viewId: source, member: D.member, toast, action: actionId, onApplied: renderMemberRoute });
        return;
      }
      if (["inspect", "edit"].includes(actionId)) {
        const source = action.dataset.memberSource;
        const index = Number(action.dataset.memberIndex || 0);
        const config = memberTableConfigs[source];
        const row = D.memberResources[config?.dataKey]?.[index];
        if (row) openMemberDrawer(row, source, actionId === "edit" ? "yaml" : "overview");
      }
    });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeTableActionMenu(); });
  }

  function commandPalette() {
    document.querySelector(".command-backdrop")?.remove();
    const element = document.createElement("div");
    element.className = "command-backdrop";
    const createHref = isMemberScope ? `create-resource.html?cluster=${D.member.name}` : "create-resource.html";
    element.innerHTML = `<section class="command-palette" role="dialog" aria-modal="true" aria-label="Search resources and commands">${searchField("Search resources, member clusters, policies…", "data-command-search autofocus", "Command search", "command-search")}<div class="command-group-label">Suggestions</div><div class="command-results"><button class="command-item" data-go="${createHref}"><span>Create resource in current workspace</span><small>CREATE</small></button><button class="command-item" data-go="topology.html"><span>Trace global resource delivery</span><small>GLOBAL TOPOLOGY</small></button><button class="command-item" data-go="clusters.html#topology"><span>Inspect cluster connections</span><small>CLUSTER MANAGEMENT</small></button><button class="command-item" data-go="clusters.html"><span>Manage member clusters</span><small>CLUSTERS</small></button><button class="command-item" data-go="metrics.html"><span>Open metrics visualization</span><small>METRICS</small></button><button class="command-item" data-go="resources.html"><span>Open resource workspace</span><small>RESOURCES</small></button><button class="command-item" data-go="policies.html"><span>Review policy conflicts</span><small>POLICIES</small></button><div class="command-empty" data-command-empty hidden>No matching commands.</div></div></section>`;
    document.body.appendChild(element);
    applyLanguage(element);
    const input = element.querySelector("[data-command-search]");
    const items = [...element.querySelectorAll("[data-go]")];
    const empty = element.querySelector("[data-command-empty]");
    input.focus();
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      let matches = 0;
      items.forEach((item) => {
        const visible = !query || item.textContent.toLowerCase().includes(query);
        item.hidden = !visible;
        if (visible) matches += 1;
      });
      empty.hidden = matches > 0;
    });
    element.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
      const visibleItems = items.filter((item) => !item.hidden);
      if (!visibleItems.length) return;
      event.preventDefault();
      const current = visibleItems.indexOf(document.activeElement);
      const next = event.key === "ArrowDown" ? (current + 1) % visibleItems.length : (current <= 0 ? visibleItems.length - 1 : current - 1);
      visibleItems[next].focus();
    });
    element.addEventListener("click", (e) => { if (e.target === element) element.remove(); const target = e.target.closest("[data-go]"); if (target) location.href = target.dataset.go; });
  }

  function initGlobalTopology() {
    const root = document.querySelector("[data-global-topology-root]");
    if (!root) return;
    const flowMount = root.querySelector("[data-global-flow-mount]");
    if (flowMount && window.mountGlobalTopologyFlow) {
      const flowInspector = root.querySelector("[data-global-inspector]");
      const flowNamespaceSelect = initShadcnSelect(document.querySelector('[data-select-name="topology-namespace"]'));
      const flowKindSelect = initShadcnSelect(document.querySelector('[data-select-name="topology-kind"]'));
      const flowResourceSelect = initShadcnSelect(document.querySelector('[data-select-name="topology-resource"]'));
      const flowResourceCatalog = {
        default: {
          Deployment: ["nginx", "checkout-api", "frontend"],
          StatefulSet: ["redis", "postgres"],
          DaemonSet: ["node-exporter", "log-agent"],
          CronJob: ["database-backup", "session-cleanup"],
          Job: ["schema-migration", "asset-indexer"]
        },
        platform: {
          Deployment: ["api-gateway", "identity-service"],
          StatefulSet: ["event-store"],
          DaemonSet: ["platform-agent"],
          CronJob: ["audit-archive"],
          Job: ["bootstrap-config"]
        },
        monitoring: {
          Deployment: ["grafana", "metrics-adapter"],
          StatefulSet: ["prometheus"],
          DaemonSet: ["otel-collector"],
          CronJob: ["metrics-retention"],
          Job: ["rules-validator"]
        }
      };
      let flowSelectedKind = flowKindSelect.value;
      const flowApi = window.mountGlobalTopologyFlow(flowMount, {
        clusters: D.clusters.map(({ name, mode, status, version }) => ({ name, mode, status, version })),
        initialTrace: { kind: flowSelectedKind, namespace: flowNamespaceSelect.value, resource: flowResourceSelect.value },
        onLayoutChange: (direction) => toast("Topology layout updated", `${direction === "tb" ? "Top to bottom" : "Left to right"} · Dagre spacing applied.`)
      });

      const populateFlowResources = () => {
        flowSelectedKind = flowKindSelect.value;
        const current = flowResourceSelect.value;
        const resources = flowResourceCatalog[flowNamespaceSelect.value]?.[flowSelectedKind] || [];
        flowResourceSelect.setOptions(resources, current);
      };
      const updateFlowTrace = () => {
        const resourceName = flowResourceSelect.value || "unnamed-resource";
        const trace = { kind: flowSelectedKind, namespace: flowNamespaceSelect.value, resource: resourceName };
        document.querySelector("[data-global-trace-label]").textContent = `${trace.kind} / ${trace.namespace} / ${trace.resource}`;
        flowApi.updateTrace(trace);
      };
      flowKindSelect.onValueChange = () => { populateFlowResources(); updateFlowTrace(); };
      flowResourceSelect.onValueChange = updateFlowTrace;
      flowNamespaceSelect.onValueChange = () => { populateFlowResources(); updateFlowTrace(); };
      document.querySelector("[data-global-query]")?.addEventListener("click", () => {
        updateFlowTrace();
        flowApi.fitView();
        toast("Global topology refreshed", `${flowSelectedKind}/${flowNamespaceSelect.value}/${flowResourceSelect.value || "unnamed-resource"} resolved end to end; member3 telemetry remains stale.`);
      });

      window.addEventListener("global-topology-node-selected", (event) => {
        const node = event.detail;
        flowInspector.querySelector("[data-global-inspector-stage]").textContent = node.stage;
        flowInspector.querySelector("[data-global-inspector-title]").textContent = node.label;
        flowInspector.querySelector("[data-global-inspector-status]").textContent = node.status;
        flowInspector.querySelector("[data-global-inspector-detail]").textContent = node.detail;
        const health = flowInspector.querySelector(".node-health");
        const warning = /stale|review/i.test(node.status);
        health.classList.toggle("good", !warning);
        health.classList.toggle("warn", warning);
        flowInspector.querySelector("[data-global-inspector-link]").href = node.link || "resources.html";
        flowInspector.hidden = false;
      });
      root.querySelector("[data-global-inspector-close]")?.addEventListener("click", () => {
        flowInspector.hidden = true;
        flowApi.clearSelection();
      });
      populateFlowResources();
      updateFlowTrace();
      return;
    }
    const inspector = root.querySelector("[data-global-inspector]");
    const namespaceSelect = initShadcnSelect(document.querySelector('[data-select-name="topology-namespace"]'));
    const kindSelect = initShadcnSelect(document.querySelector('[data-select-name="topology-kind"]'));
    const resourceSelect = initShadcnSelect(document.querySelector('[data-select-name="topology-resource"]'));
    const resourceCatalog = {
      default: {
        Deployment: ["nginx", "checkout-api", "frontend"],
        StatefulSet: ["redis", "postgres"],
        DaemonSet: ["node-exporter", "log-agent"],
        CronJob: ["database-backup", "session-cleanup"],
        Job: ["schema-migration", "asset-indexer"]
      },
      platform: {
        Deployment: ["api-gateway", "identity-service"],
        StatefulSet: ["event-store"],
        DaemonSet: ["platform-agent"],
        CronJob: ["audit-archive"],
        Job: ["bootstrap-config"]
      },
      monitoring: {
        Deployment: ["grafana", "metrics-adapter"],
        StatefulSet: ["prometheus"],
        DaemonSet: ["otel-collector"],
        CronJob: ["metrics-retention"],
        Job: ["rules-validator"]
      }
    };
    let selectedKind = kindSelect.value;
    const edgeLayer = root.querySelector("[data-global-edge-layer]");
    const graphNodes = new Map([...root.querySelectorAll("[data-global-node]")].map((node) => [node.dataset.nodeId, node]));
    const clusterNames = D.clusters.map((cluster) => cluster.name);
    const graphEdges = [
      ["template", "binding", "template"],
      ...clusterNames.flatMap((cluster) => [
        ["binding", `work-${cluster}`, "override"],
        [`work-${cluster}`, `cluster-${cluster}`, "work"],
        [`cluster-${cluster}`, `resource-${cluster}`, "cluster"],
        [`resource-${cluster}`, `pod-${cluster}-1`, "resource"],
        [`resource-${cluster}`, `pod-${cluster}-2`, "resource"]
      ])
    ];
    let graphDirection = "tb";

    const graphPositions = (direction) => {
      const positions = new Map();
      if (direction === "lr") {
        positions.set("template", { x: 150, y: 460 });
        positions.set("binding", { x: 320, y: 460 });
        clusterNames.forEach((cluster, index) => {
          const y = [190, 460, 730][index];
          positions.set(`work-${cluster}`, { x: 490, y });
          positions.set(`cluster-${cluster}`, { x: 640, y });
          positions.set(`resource-${cluster}`, { x: 790, y });
          positions.set(`pod-${cluster}-1`, { x: 930, y: y - 45 });
          positions.set(`pod-${cluster}-2`, { x: 930, y: y + 45 });
        });
        return positions;
      }
      positions.set("template", { x: 500, y: 70 });
      positions.set("binding", { x: 500, y: 235 });
      clusterNames.forEach((cluster, index) => {
        const x = [170, 500, 830][index];
        positions.set(`work-${cluster}`, { x, y: 415 });
        positions.set(`cluster-${cluster}`, { x, y: 535 });
        positions.set(`resource-${cluster}`, { x, y: 655 });
        positions.set(`pod-${cluster}-1`, { x: x - 65, y: 790 });
        positions.set(`pod-${cluster}-2`, { x: x + 65, y: 790 });
      });
      return positions;
    };

    const graphNodeSize = (id, direction) => {
      if (direction === "lr") {
        if (["template", "binding"].includes(id)) return { width: 180, height: 72 };
        if (id.startsWith("pod-")) return { width: 116, height: 64 };
        return { width: 150, height: 72 };
      }
      if (["template", "binding"].includes(id)) return { width: 276, height: 86 };
      if (id.startsWith("pod-")) return { width: 150, height: 76 };
      return { width: 230, height: 86 };
    };

    const graphPath = (sourceId, targetId, direction, positions) => {
      const source = positions.get(sourceId);
      const target = positions.get(targetId);
      const sourceSize = graphNodeSize(sourceId, direction);
      const targetSize = graphNodeSize(targetId, direction);
      if (direction === "lr") {
        const startX = source.x + sourceSize.width / 2;
        const endX = target.x - targetSize.width / 2;
        const middleX = (startX + endX) / 2;
        return `M${startX} ${source.y} C${middleX} ${source.y} ${middleX} ${target.y} ${endX} ${target.y}`;
      }
      const startY = source.y + sourceSize.height / 2;
      const endY = target.y - targetSize.height / 2;
      const middleY = (startY + endY) / 2;
      return `M${source.x} ${startY} C${source.x} ${middleY} ${target.x} ${middleY} ${target.x} ${endY}`;
    };

    const renderGraphEdges = (direction, positions) => {
      const paths = graphEdges.map(([source, target, kind]) => {
        const warning = target.includes("member3") ? " warning" : "";
        return `<path class="edge-${kind}${warning}" data-edge-source="${source}" data-edge-target="${target}" d="${graphPath(source, target, direction, positions)}"></path>`;
      }).join("");
      const warningPosition = positions.get("cluster-member3");
      const warningText = direction === "lr"
        ? `<text x="${warningPosition.x - 70}" y="${warningPosition.y - 50}" class="warning">PULL · TELEMETRY 2m</text>`
        : `<text x="${warningPosition.x + 12}" y="${warningPosition.y - 55}" class="warning">PULL · TELEMETRY 2m</text>`;
      edgeLayer.innerHTML = `<defs><marker id="global-flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z"></path></marker></defs>${paths}${warningText}`;
    };

    const positionPolicyLabels = (direction, positions) => {
      const template = positions.get("template");
      const binding = positions.get("binding");
      const centerWork = positions.get("work-member2");
      const pp = root.querySelector(".global-edge-pp");
      const op = root.querySelector(".global-edge-op");
      if (direction === "lr") {
        pp.style.left = `${(template.x + binding.x) / 20}%`;
        pp.style.top = `${template.y - 53}px`;
        op.style.left = `${(binding.x + centerWork.x) / 20}%`;
        op.style.top = `${binding.y - 53}px`;
        return;
      }
      pp.style.left = `${template.x / 10 + 1.8}%`;
      pp.style.top = `${(template.y + binding.y) / 2}px`;
      op.style.left = `${binding.x / 10 + 1.8}%`;
      op.style.top = `${(binding.y + centerWork.y) / 2}px`;
    };

    const applyGraphLayout = (direction, announce = false) => {
      graphDirection = direction;
      root.dataset.layout = direction;
      root.classList.add("is-layouting");
      const positions = graphPositions(direction);
      graphNodes.forEach((node, id) => {
        const position = positions.get(id);
        node.style.left = `${position.x / 10}%`;
        node.style.top = `${position.y}px`;
      });
      renderGraphEdges(direction, positions);
      positionPolicyLabels(direction, positions);
      root.querySelectorAll("[data-global-direction]").forEach((button) => {
        const active = button.dataset.globalDirection === direction;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      window.setTimeout(() => root.classList.remove("is-layouting"), 330);
      if (announce) toast("Topology layout updated", `${direction === "tb" ? "Top to bottom" : "Left to right"} · Dagre spacing applied.`);
    };

    root.querySelectorAll("[data-global-direction]").forEach((button) => button.addEventListener("click", () => applyGraphLayout(button.dataset.globalDirection, true)));
    root.querySelector("[data-global-auto-layout]")?.addEventListener("click", () => applyGraphLayout(graphDirection, true));

    const populateResources = () => {
      selectedKind = kindSelect.value;
      const current = resourceSelect.value;
      const resources = resourceCatalog[namespaceSelect.value]?.[selectedKind] || [];
      resourceSelect.setOptions(resources, current);
    };

    const updateTrace = () => {
      const resourceName = resourceSelect.value || "unnamed-resource";
      document.querySelector("[data-global-trace-label]").textContent = `${selectedKind} / ${namespaceSelect.value} / ${resourceName}`;
      const resourceLabel = root.querySelector("[data-global-resource-label]");
      const bindingLabel = root.querySelector("[data-global-binding-label]");
      resourceLabel.textContent = resourceName;
      bindingLabel.textContent = `${resourceName}-${selectedKind.toLowerCase()}`;
      resourceLabel.closest("[data-global-node]").dataset.nodeTitle = `${selectedKind}/${resourceName}`;
      bindingLabel.closest("[data-global-node]").dataset.nodeTitle = `${resourceName}-${selectedKind.toLowerCase()}`;
      root.querySelectorAll("[data-global-kind-label]").forEach((label) => { label.textContent = selectedKind; });
      root.querySelectorAll("[data-global-namespace-label]").forEach((label) => { label.textContent = namespaceSelect.value; });
      root.querySelectorAll("[data-global-work-label]").forEach((label) => {
        label.textContent = `${resourceName}-${label.dataset.cluster}`;
        label.closest("[data-global-node]").dataset.nodeTitle = `${resourceName}-${label.dataset.cluster}`;
      });
      root.querySelectorAll("[data-global-member-resource-label]").forEach((label) => {
        label.textContent = resourceName;
        label.closest("[data-global-node]").dataset.nodeTitle = `${selectedKind}/${resourceName} · ${label.dataset.cluster}`;
      });
      root.querySelectorAll("[data-global-pod-label]").forEach((label) => {
        label.textContent = `${resourceName}-${label.dataset.cluster}-${label.dataset.ordinal}`;
        label.closest("[data-global-node]").dataset.nodeTitle = label.textContent;
      });
    };

    kindSelect.onValueChange = () => {
      populateResources();
      updateTrace();
    };
    resourceSelect.onValueChange = updateTrace;
    namespaceSelect.onValueChange = () => {
      populateResources();
      updateTrace();
    };
    document.querySelector("[data-global-query]")?.addEventListener("click", () => {
      updateTrace();
      toast("Global topology refreshed", `${selectedKind}/${namespaceSelect.value}/${resourceSelect.value || "unnamed-resource"} resolved end to end; member3 telemetry remains stale.`);
    });

    root.querySelectorAll("[data-global-node]").forEach((node) => node.addEventListener("click", () => {
      root.querySelectorAll("[data-global-node]").forEach((candidate) => candidate.classList.toggle("selected", candidate === node));
      inspector.querySelector("[data-global-inspector-stage]").textContent = node.dataset.nodeStage;
      inspector.querySelector("[data-global-inspector-title]").textContent = node.dataset.nodeTitle;
      inspector.querySelector("[data-global-inspector-status]").textContent = node.dataset.nodeStatus;
      inspector.querySelector("[data-global-inspector-detail]").textContent = node.dataset.nodeDetail;
      const health = inspector.querySelector(".node-health");
      const warning = /stale|review/i.test(node.dataset.nodeStatus);
      health.classList.toggle("good", !warning);
      health.classList.toggle("warn", warning);
      inspector.querySelector("[data-global-inspector-link]").href = node.dataset.nodeLink || "resources.html";
      inspector.hidden = false;
    }));
    root.querySelector("[data-global-inspector-close]")?.addEventListener("click", () => {
      inspector.hidden = true;
      root.querySelectorAll("[data-global-node]").forEach((node) => node.classList.remove("selected"));
    });
    applyGraphLayout("tb");
    populateResources();
    updateTrace();
  }

  function bindInteractions() {
    document.addEventListener("click", (event) => {
      const clear = event.target.closest("[data-search-clear]");
      if (!clear) return;
      const input = clear.closest("[data-search-root]")?.querySelector("input[type='search']");
      if (!input) return;
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });

    document.addEventListener("click", (event) => {
      const groupToggle = event.target.closest("[data-control-group-toggle]");
      if (!groupToggle) return;
      const group = groupToggle.closest("[data-control-nav-group]");
      const content = group?.querySelector(".resource-group-links");
      if (!group || !content) return;
      if (expandRailToGroup(group, groupToggle, content)) return;
      const open = group.classList.toggle("open");
      group.dataset.state = open ? "open" : "closed";
      groupToggle.setAttribute("aria-expanded", String(open));
      content.setAttribute("aria-hidden", String(!open));
      content.inert = !open;
    });

    document.querySelectorAll("[data-theme-choice]").forEach((button) => button.addEventListener("click", () => {
      localStorage.setItem("karmada-theme", button.dataset.themeChoice);
      applyTheme(button.dataset.themeChoice, true);
    }));

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => button.addEventListener("click", () => {
      const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem("karmada-theme", theme);
      applyTheme(theme, true);
    }));

    document.querySelectorAll("[data-language-choice]").forEach((button) => button.addEventListener("click", () => {
      localStorage.setItem("karmada-language", button.dataset.languageChoice);
      location.reload();
    }));

    document.querySelectorAll("[data-language-toggle]").forEach((button) => button.addEventListener("click", () => {
      localStorage.setItem("karmada-language", getLanguage() === "zh" ? "en" : "zh");
      location.reload();
    }));

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); commandPalette(); }
      if (event.key === "Escape") {
        if (document.querySelector("[data-table-action-menu]")) {
          closeTableActionMenu(true);
          return;
        }
        const attentionDrawer = document.querySelector(".attention-drawer-backdrop");
        if (attentionDrawer) {
          attentionDrawer.remove();
          document.querySelector('[data-action="notifications"]')?.setAttribute("aria-expanded", "false");
        }
        if (document.querySelector(".terminal-backdrop")) document.querySelector('[data-action="control-plane-terminal"]')?.setAttribute("aria-expanded", "false");
        document.querySelector(".modal-backdrop, .command-backdrop, .terminal-backdrop")?.remove();
        closePopovers();
      }
    });

    document.querySelectorAll("[data-table-search]").forEach((input) => input.addEventListener("input", () => {
      const rows = [...document.querySelectorAll("[data-filter-body] tr")];
      const query = input.value.toLowerCase().trim();
      let shown = 0;
      rows.forEach((row) => { const match = !query || (row.dataset.search || row.textContent.toLowerCase()).includes(query); row.classList.toggle("hidden", !match); if (match) shown += 1; });
      const result = document.querySelector("[data-result-count]");
      if (result) result.textContent = result.hasAttribute("data-cluster-result-count") ? `${shown} member cluster${shown === 1 ? "" : "s"}` : `${shown} result${shown === 1 ? "" : "s"}`;
    }));

    document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", (event) => {
      const action = event.currentTarget.dataset.action;
      if (action === "command") return commandPalette();
      if (action === "notifications") return attentionQueueDrawer();
      if (action === "side-collapse") {
        const shell = document.querySelector(".app-shell");
        setRailCollapsed(!shell?.classList.contains("rail-collapsed"), event.currentTarget);
        return;
      }
      if (action === "scope-menu") return togglePopover("scope", event.currentTarget);
      if (action === "user-menu") return togglePopover("user", event.currentTarget);
      if (action === "control-plane-terminal" || action === "terminal") return controlPlaneTerminalManager();
      if (action === "create") { location.href = "create-resource.html"; return; }
      if (action === "profile") return modal("Profile & access", "platform-admin uses the cluster-admin role in this static prototype.", "Done");
      if (action === "logout") { localStorage.removeItem("karmada-session"); location.href = "login.html?signed-out=1"; return; }
      if (action === "toggle") return event.currentTarget.classList.toggle("on");
      if (["delete", "disconnect", "delete-confirm"].includes(action)) return modal("Confirm destructive action", "The affected object and its dependencies are shown before execution. This static prototype does not change real data.", "Confirm", true);
      if (action === "oidc") return modal("OIDC sign-in unavailable", "The identity provider callback is not configured for this static prototype.", "Return to token sign-in");
      if (action === "copy") { navigator.clipboard?.writeText("karmada-apiserver · connection refused · trace 7f9a1c"); return toast("Diagnostics copied"); }
      if (action === "create-policy") { location.href = "create-resource.html?kind=PropagationPolicy"; return; }
      if (action === "validate") return modal("Validate policy manifest", "Paste or upload a PropagationPolicy, ClusterPropagationPolicy, OverridePolicy, or ClusterOverridePolicy manifest to validate schema and placement conflicts.", "Choose YAML");
      if (action === "tab-message") return toast(`${event.currentTarget.textContent} view`, "This route is represented by the shared content model in the prototype.");
      if (action === "save") return toast("Configuration saved", "Static prototype confirmation only.");
      if (action === "refresh" || action === "retry") return toast("Signals refreshed", "Latest mock sample received 1s ago.");
      toast("Interaction available", "This control is wired for prototype review.");
    }));

    document.addEventListener("click", (event) => { if (!event.target.closest(".top-control")) closePopovers(); });

    document.querySelector("[data-login-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      localStorage.setItem("karmada-session", "platform-admin");
      location.href = "index.html";
    });
  }

  function installTooltips() {
    const tooltip = document.createElement("div");
    tooltip.className = "app-tooltip";
    tooltip.id = "app-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
    let activeTrigger = null;
    let showTimer = 0;

    const overflowTooltipTrigger = (target) => {
      const cell = target?.closest?.(".data-table td");
      if (!cell || cell.querySelector('[role="tooltip"]')) return null;
      const clippedElements = [cell, ...cell.querySelectorAll("*")].filter((element) => {
        const style = getComputedStyle(element);
        const clipsContent = ["hidden", "clip"].includes(style.overflowX) || style.textOverflow === "ellipsis";
        return clipsContent && element.scrollWidth > element.clientWidth + 1;
      });
      if (!clippedElements.length) {
        if (cell.dataset.overflowTooltip === "true") {
          delete cell.dataset.tooltip;
          delete cell.dataset.tooltipSide;
          delete cell.dataset.overflowTooltip;
        }
        return null;
      }
      const text = cell.innerText.replace(/\s+/g, " ").trim();
      if (!text) return null;
      cell.dataset.tooltip = text;
      cell.dataset.tooltipSide = "top";
      cell.dataset.overflowTooltip = "true";
      return cell;
    };

    const hide = () => {
      window.clearTimeout(showTimer);
      showTimer = 0;
      if (activeTrigger?.getAttribute("aria-describedby") === tooltip.id) activeTrigger.removeAttribute("aria-describedby");
      activeTrigger = null;
      tooltip.dataset.state = "closed";
      tooltip.hidden = true;
    };

    const show = (trigger, immediate = false) => {
      window.clearTimeout(showTimer);
      if (!trigger?.dataset.tooltip) return;
      if (trigger.hasAttribute("data-rail-tooltip") && !document.querySelector(".app-shell")?.classList.contains("rail-collapsed")) return;
      const reveal = () => {
        activeTrigger = trigger;
        tooltip.textContent = trigger.dataset.tooltip;
        tooltip.hidden = false;
        tooltip.dataset.state = "open";
        trigger.setAttribute("aria-describedby", tooltip.id);
        const rect = trigger.getBoundingClientRect();
        const tipRect = tooltip.getBoundingClientRect();
        const side = trigger.dataset.tooltipSide || "bottom";
        const gap = 9;
        let left = rect.left + rect.width / 2 - tipRect.width / 2;
        let top = rect.bottom + gap;
        if (side === "right") {
          left = rect.right + gap;
          top = rect.top + rect.height / 2 - tipRect.height / 2;
        }
        left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - tipRect.height - 8));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.dataset.side = side;
      };
      if (immediate) reveal();
      else showTimer = window.setTimeout(reveal, 180);
    };

    document.addEventListener("pointerover", (event) => {
      const trigger = event.target.closest("[data-tooltip]") || overflowTooltipTrigger(event.target);
      if (trigger && !trigger.contains(event.relatedTarget)) show(trigger);
    });
    document.addEventListener("pointerout", (event) => {
      const trigger = event.target.closest("[data-tooltip]");
      if (trigger && !trigger.contains(event.relatedTarget)) hide();
    });
    document.addEventListener("focusin", (event) => show(event.target.closest("[data-tooltip]"), true));
    document.addEventListener("focusout", (event) => { if (event.target.closest("[data-tooltip]")) hide(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") hide(); });
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide, { passive: true });
  }

  function installResizableTables(root = document) {
    const storagePrefix = "karmada-table-widths:";
    const visibilityPrefix = "karmada-table-columns:";
    let activeColumnMenu = null;
    const readWidths = (key, count) => {
      try {
        const widths = JSON.parse(localStorage.getItem(`${storagePrefix}${key}`) || "null");
        return Array.isArray(widths) && widths.length === count && widths.every((width) => Number.isFinite(width) && width > 0) ? widths : null;
      } catch {
        return null;
      }
    };
    const writeWidths = (key, widths) => {
      try { localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(widths)); } catch { /* Local storage can be unavailable in embedded previews. */ }
    };
    const readHiddenColumns = (key) => {
      try {
        const hidden = JSON.parse(localStorage.getItem(`${visibilityPrefix}${key}`) || "[]");
        return Array.isArray(hidden) ? hidden.filter(Number.isInteger) : [];
      } catch {
        return [];
      }
    };
    const writeHiddenColumns = (key, hidden) => {
      try { localStorage.setItem(`${visibilityPrefix}${key}`, JSON.stringify([...hidden])); } catch { /* Ignore unavailable storage. */ }
    };
    const closeColumnMenu = () => {
      if (!activeColumnMenu) return;
      activeColumnMenu.trigger.setAttribute("aria-expanded", "false");
      activeColumnMenu.menu.remove();
      activeColumnMenu = null;
    };
    document.addEventListener("pointerdown", (event) => {
      if (activeColumnMenu && !activeColumnMenu.menu.contains(event.target) && !activeColumnMenu.trigger.contains(event.target)) closeColumnMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activeColumnMenu) {
        const trigger = activeColumnMenu.trigger;
        closeColumnMenu();
        trigger.focus();
      }
    });
    window.addEventListener("resize", closeColumnMenu, { passive: true });
    window.addEventListener("scroll", closeColumnMenu, true);
    const enhance = (table) => {
      if (!(table instanceof HTMLTableElement) || table.dataset.resizableTable === "true") return;
      const headers = [...table.querySelectorAll("thead > tr:first-child > th")];
      if (headers.length < 2) return;

      const initialMeasuredWidths = headers.map((header) => header.getBoundingClientRect().width);
      table.dataset.resizableTable = "true";
      const rawHeaderNames = headers.map((header) => header.textContent.trim());
      const headerNames = rawHeaderNames.map((name, index) => name || `Column ${index + 1}`);
      const storageKey = `${location.pathname}:${page}:${headerNames.join("|").toLowerCase()}`;
      const lockedIndices = new Set(rawHeaderNames.map((name, index) => /^(actions?|操作)$/i.test(name) || (!name && index === headers.length - 1) ? index : -1).filter((index) => index >= 0));
      const configurableIndices = headers.map((_header, index) => index).filter((index) => !lockedIndices.has(index));
      const managesVisibility = table.dataset.columnVisibility !== "fixed" && !table.closest("[data-control-view-root]")?.querySelector("[data-control-columns-root]");
      const hiddenIndices = new Set(readHiddenColumns(storageKey).filter((index) => configurableIndices.includes(index)));
      if (hiddenIndices.size >= configurableIndices.length) hiddenIndices.delete(configurableIndices[0]);
      const colgroup = document.createElement("colgroup");
      const columns = headers.map(() => {
        const column = document.createElement("col");
        colgroup.appendChild(column);
        return column;
      });
      table.prepend(colgroup);

      let defaultWidths = null;
      let currentWidths = readWidths(storageKey, headers.length);
      const applyWidths = (widths) => widths.forEach((width, index) => { columns[index].style.width = `${width}%`; });
      const normalizeLockedWidths = (widths) => {
        const tableWidth = table.getBoundingClientRect().width;
        if (!tableWidth) return widths;
        const normalized = widths.slice();
        lockedIndices.forEach((lockedIndex) => {
          const minimumPixels = headers[lockedIndex].classList.contains("table-actions-header") ? 64 : 44;
          const minimumPercent = minimumPixels / tableWidth * 100;
          let needed = Math.max(0, minimumPercent - normalized[lockedIndex]);
          if (!needed) return;
          const donors = configurableIndices.slice().sort((left, right) => normalized[right] - normalized[left]);
          donors.forEach((donorIndex) => {
            if (needed <= 0) return;
            const donorMinimum = 72 / tableWidth * 100;
            const available = Math.max(0, normalized[donorIndex] - donorMinimum);
            const transfer = Math.min(available, needed);
            normalized[donorIndex] -= transfer;
            normalized[lockedIndex] += transfer;
            needed -= transfer;
          });
        });
        return normalized;
      };
      const measureWidths = () => {
        let measured = initialMeasuredWidths;
        if (!measured.some((width) => width > 0)) {
          table.dataset.resizableTable = "measuring";
          columns.forEach((column) => column.style.removeProperty("width"));
          measured = headers.map((header) => header.getBoundingClientRect().width);
          table.dataset.resizableTable = "true";
        }
        const measuredTotal = measured.reduce((total, width) => total + width, 0);
        if (measuredTotal <= 0) return false;
        defaultWidths = measured.map((width) => width / measuredTotal * 100);
        currentWidths = currentWidths || defaultWidths.slice();
        currentWidths = normalizeLockedWidths(currentWidths);
        applyWidths(currentWidths);
        return true;
      };
      if (!measureWidths()) {
        const resizeObserver = new ResizeObserver(() => {
          if (measureWidths()) resizeObserver.disconnect();
        });
        resizeObserver.observe(table);
      }

      const handles = [];
      let visibilityTrigger = null;
      const syncHandleValue = (handle, index) => {
        if (!handle || !currentWidths) return;
        const rounded = Math.round(currentWidths[index] * 10) / 10;
        handle.setAttribute("aria-valuemin", "0");
        handle.setAttribute("aria-valuemax", "100");
        handle.setAttribute("aria-valuenow", String(rounded));
        handle.setAttribute("aria-valuetext", `${rounded}%`);
      };
      const resizePair = (index, rightIndex, startingWidths, deltaPixels) => {
        const tableWidth = table.getBoundingClientRect().width;
        if (!tableWidth || rightIndex <= index) return;
        const minimumLeft = Math.min(28, 72 / tableWidth * 100);
        const minimumRightPixels = headers[rightIndex].classList.contains("table-actions-header") ? 64 : (rightIndex === headers.length - 1 ? 44 : 72);
        const minimumRight = Math.min(28, minimumRightPixels / tableWidth * 100);
        const pairTotal = startingWidths[index] + startingWidths[rightIndex];
        const requestedLeft = startingWidths[index] + deltaPixels / tableWidth * 100;
        const nextLeft = Math.max(minimumLeft, Math.min(pairTotal - minimumRight, requestedLeft));
        currentWidths = startingWidths.slice();
        currentWidths[index] = nextLeft;
        currentWidths[rightIndex] = pairTotal - nextLeft;
        applyWidths(currentWidths);
        syncHandleValue(handles[index], index);
        syncHandleValue(handles[rightIndex], rightIndex);
      };

      const syncVisibility = () => {
        headers.forEach((header, index) => {
          const hidden = managesVisibility && hiddenIndices.has(index);
          header.hidden = hidden;
          columns[index].hidden = hidden;
          table.querySelectorAll("tbody > tr").forEach((row) => {
            if (row.cells[index]) row.cells[index].hidden = hidden;
          });
        });
        handles.forEach((handle, index) => {
          const nextVisible = headers.findIndex((_header, candidate) => candidate > index && (!managesVisibility || !hiddenIndices.has(candidate)));
          handle.dataset.resizeNext = String(nextVisible);
          handle.hidden = (managesVisibility && hiddenIndices.has(index)) || nextVisible < 0;
        });
        if (visibilityTrigger) {
          const hiddenCount = hiddenIndices.size;
          visibilityTrigger.classList.toggle("active", hiddenCount > 0);
          visibilityTrigger.querySelector("[data-table-hidden-count]").textContent = hiddenCount ? String(hiddenCount) : "";
          visibilityTrigger.querySelector("[data-table-hidden-count]").hidden = hiddenCount === 0;
        }
      };

      headers.slice(0, -1).forEach((header, index) => {
        const handle = document.createElement("span");
        handle.className = "table-resize-handle";
        handle.tabIndex = 0;
        handle.setAttribute("role", "separator");
        handle.setAttribute("aria-orientation", "vertical");
        handle.setAttribute("aria-label", `Resize ${headerNames[index]} column`);
        handle.dataset.tooltip = "Drag to resize column · double-click to reset";
        header.appendChild(handle);

        handle.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          const startX = event.clientX;
          const startingWidths = currentWidths?.slice() || defaultWidths?.slice();
          if (!startingWidths) return;
          document.body.classList.add("table-column-resizing");
          handle.setPointerCapture?.(event.pointerId);
          const rightIndex = Number(handle.dataset.resizeNext);
          if (rightIndex < 0) return;
          const move = (moveEvent) => resizePair(index, rightIndex, startingWidths, moveEvent.clientX - startX);
          const finish = () => {
            document.body.classList.remove("table-column-resizing");
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", finish);
            window.removeEventListener("pointercancel", finish);
            if (currentWidths) writeWidths(storageKey, currentWidths);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", finish, { once: true });
          window.addEventListener("pointercancel", finish, { once: true });
        });
        handle.addEventListener("keydown", (event) => {
          if (!currentWidths || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          const rightIndex = Number(handle.dataset.resizeNext);
          resizePair(index, rightIndex, currentWidths.slice(), event.key === "ArrowLeft" ? -12 : 12);
          writeWidths(storageKey, currentWidths);
        });
        handle.addEventListener("dblclick", () => {
          if (!defaultWidths) return;
          currentWidths = defaultWidths.slice();
          applyWidths(currentWidths);
          handles.forEach(syncHandleValue);
          try { localStorage.removeItem(`${storagePrefix}${storageKey}`); } catch { /* Ignore unavailable storage. */ }
        });
        handles.push(handle);
        syncHandleValue(handle, index);
      });

      const mountVisibilityControl = () => {
        if (!managesVisibility || !configurableIndices.length) return;
        const panel = table.parentElement;
        const adjacentSibling = panel?.previousElementSibling;
        const adjacentToolbar = adjacentSibling?.matches?.(".toolbar, .cluster-workspace-toolbar")
          ? adjacentSibling
          : panel?.parentElement?.querySelector(":scope > .cluster-workspace-toolbar");
        const scope = table.closest(".member-view, .control-resource-view, [role='dialog'], article, section");
        visibilityTrigger = adjacentToolbar?.querySelector('[data-member-action="columns"]') || scope?.querySelector('[data-member-action="columns"]');
        if (!visibilityTrigger) {
          visibilityTrigger = document.createElement("button");
          visibilityTrigger.type = "button";
          if (adjacentToolbar) {
            let controls = adjacentToolbar.querySelector(".table-column-controls");
            if (!controls) {
              controls = document.createElement("div");
              controls.className = "table-column-controls";
              adjacentToolbar.appendChild(controls);
            }
            controls.appendChild(visibilityTrigger);
          } else if (panel) {
            let controls = panel.querySelector(":scope > .table-column-control-bar");
            if (!controls) {
              controls = document.createElement("div");
              controls.className = "table-column-control-bar";
              panel.insertBefore(controls, table);
            }
            controls.appendChild(visibilityTrigger);
          }
        }
        if (!visibilityTrigger || visibilityTrigger.dataset.tableColumnsBound === "true") return;
        visibilityTrigger.dataset.tableColumnsBound = "true";
        visibilityTrigger.className = "shadcn-button shadcn-button-outline shadcn-button-sm table-columns-trigger";
        visibilityTrigger.setAttribute("aria-haspopup", "menu");
        visibilityTrigger.setAttribute("aria-expanded", "false");
        visibilityTrigger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M9 5v14M15 5v14"></path></svg><span>Columns</span><small data-table-hidden-count hidden></small>`;

        const renderMenu = (menu) => {
          const visibleConfigurable = configurableIndices.filter((index) => !hiddenIndices.has(index));
          menu.innerHTML = `<header><strong>Display columns</strong><span>${visibleConfigurable.length} of ${configurableIndices.length}</span></header><div class="table-column-menu-items">${headers.map((_header, index) => {
            const locked = lockedIndices.has(index);
            const checked = locked || !hiddenIndices.has(index);
            const disabled = locked || (checked && visibleConfigurable.length === 1);
            return `<button type="button" role="menuitemcheckbox" aria-checked="${checked}" ${disabled ? "disabled" : ""} data-table-column-index="${index}"><span class="table-column-check">${checked ? "✓" : ""}</span><span>${esc(headerNames[index])}</span>${locked ? "<small>Always visible</small>" : ""}</button>`;
          }).join("")}</div><footer><button type="button" data-table-columns-reset ${hiddenIndices.size ? "" : "disabled"}>Reset columns</button><span>Drag headers to resize</span></footer>`;
        };
        visibilityTrigger.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (activeColumnMenu?.trigger === visibilityTrigger) return closeColumnMenu();
          closeColumnMenu();
          const menu = document.createElement("div");
          menu.className = "table-column-menu";
          menu.setAttribute("role", "menu");
          menu.setAttribute("aria-label", "Display columns");
          renderMenu(menu);
          applyLanguage(menu);
          document.body.appendChild(menu);
          const rect = visibilityTrigger.getBoundingClientRect();
          const menuRect = menu.getBoundingClientRect();
          menu.style.left = `${Math.max(10, Math.min(window.innerWidth - menuRect.width - 10, rect.right - menuRect.width))}px`;
          menu.style.top = `${Math.max(10, Math.min(window.innerHeight - menuRect.height - 10, rect.bottom + 6))}px`;
          visibilityTrigger.setAttribute("aria-expanded", "true");
          activeColumnMenu = { menu, trigger: visibilityTrigger };
          const focusableItems = () => [...menu.querySelectorAll('[role="menuitemcheckbox"]:not(:disabled)')];
          menu.addEventListener("keydown", (menuEvent) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(menuEvent.key)) return;
            const items = focusableItems();
            if (!items.length) return;
            menuEvent.preventDefault();
            const currentIndex = items.indexOf(document.activeElement);
            const nextIndex = menuEvent.key === "Home" ? 0
              : menuEvent.key === "End" ? items.length - 1
                : menuEvent.key === "ArrowDown" ? (currentIndex + 1 + items.length) % items.length
                  : (currentIndex - 1 + items.length) % items.length;
            items[nextIndex].focus();
          });
          menu.addEventListener("click", (menuEvent) => {
            menuEvent.stopPropagation();
            const item = menuEvent.target.closest("[data-table-column-index]");
            if (item && !item.disabled) {
              const index = Number(item.dataset.tableColumnIndex);
              if (hiddenIndices.has(index)) hiddenIndices.delete(index);
              else hiddenIndices.add(index);
              writeHiddenColumns(storageKey, hiddenIndices);
              syncVisibility();
              renderMenu(menu);
              applyLanguage(menu);
              menu.querySelector(`[data-table-column-index="${index}"]`)?.focus();
              return;
            }
            if (menuEvent.target.closest("[data-table-columns-reset]")) {
              hiddenIndices.clear();
              writeHiddenColumns(storageKey, hiddenIndices);
              syncVisibility();
              renderMenu(menu);
              applyLanguage(menu);
              focusableItems()[0]?.focus();
            }
          });
          focusableItems()[0]?.focus();
        });
      };

      mountVisibilityControl();
      syncVisibility();
      const rowObserver = new MutationObserver(syncVisibility);
      table.querySelectorAll("tbody").forEach((body) => rowObserver.observe(body, { childList: true, subtree: true }));
    };

    const enhanceWithin = (scope) => {
      if (scope instanceof HTMLTableElement) enhance(scope);
      scope.querySelectorAll?.("table").forEach(enhance);
    };
    enhanceWithin(root);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) enhanceWithin(node);
    })));
    observer.observe(root === document ? document.documentElement : root, { childList: true, subtree: true });
  }

  applyTheme(getTheme());
  if (page === "login") pageRoot.innerHTML = loginPage();
  else pageRoot.innerHTML = shell(renderers[page]());
  initShadcnSelects(pageRoot);
  if (page === "resources") initControlResourceWorkspace();
  if (page === "member") initMemberWorkspace();
  if (page === "create") bindCreateWorkspace();
  if (page === "topology") initGlobalTopology();
  if (page === "policies") initPolicies();
  if (page === "metrics") initMetrics();
  if (page === "settings") initSettings();
  if (page === "clusters") {
    const clusterRoot = document.querySelector("[data-shadcn-cluster-management-root]");
    window.mountShadcnClusterManagement?.(clusterRoot, {
      clusters: D.clusters,
      initialView: location.hash === "#topology" ? "topology" : "clusters",
      topologyHtml: clusterTopologyView()
    });
  }
  applyTheme(getTheme());
  applyLanguage(pageRoot);
  installLanguageObserver();
  bindInteractions();
  installResizableTables(document);
  installTooltips();
})();

export {};
