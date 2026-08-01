# Karmada Dashboard v2 · Redesign Prototype

这是独立、可运行的 Karmada Dashboard 设计草稿，不修改生产 Dashboard。

原型采用紧凑的应用壳、可折叠资源导航、资源表格工作面、宽详情抽屉和亮暗主题。完整页面位于 `static-pages/`，复杂交互由 `src/` 中的 React、shadcn/ui 和 Tailwind CSS 组件提供。

## Stack

- **Vite**：Mock 页面统一开发、HMR 和多页面构建入口。
- **Tailwind CSS v4**：由 `@tailwindcss/vite` 驱动；主题 token 位于 `src/styles/globals.css`。
- **shadcn/ui**：使用 `components.json`、`@/*` 别名与源码组件目录；底层交互由 Radix UI 提供。
- **React islands**：为静态页面提供列设置、YAML 编辑器、拓扑、指标等复杂交互。

## Terminology

- 平台级视角统一使用 **Control Plane**。
- 被 Karmada 纳管的 Kubernetes 集群统一使用 **Member Cluster**。
- 不在用户界面中使用 Fleet、Global fleet 等作为上述两个对象的替代名称；Federation 只用于 Karmada API 资源分组，不替代 Control Plane 或 Member Cluster。
- Kubernetes 原生资源名与字段名保持不变，例如 ClusterRole、ClusterRoleBinding、ClusterIP、cluster-scoped。

## Preview

安装依赖后，从 `design-redesign/` 启动 Vite：

```bash
cd ui
pnpm install
pnpm design:dev
```

打开 `http://127.0.0.1:4173/design-redesign/static-pages/index.html`。

构建与预览：

```bash
pnpm design:build
pnpm design:preview
```

构建产物位于 `design-redesign/dist/`，保留 `/design-redesign/static-pages/*.html` 路径。

## Add shadcn components

组件必须通过 shadcn CLI 加入源码仓库：

```bash
cd ui/apps/dashboard/design-redesign
pnpm shadcn:add dialog
pnpm shadcn:add select tabs dropdown-menu
```

生成位置为 `src/components/ui/`。业务组合组件放在 `src/components/`，不要在 `static-pages/app.js` 中重新手写一套相似组件。新增页面入口统一引用 `src/main.tsx`，即可同时获得 Tailwind、主题 token 和 shadcn 能力。

## Project structure

```text
design-redesign/
├── components.json              # shadcn 配置
├── package.json                 # 独立 Vite 工作台命令与依赖
├── vite.config.ts               # 多页面入口与 /design-redesign/ base
├── src/
│   ├── components/ui/           # shadcn CLI 管理的基础组件
│   ├── components/              # 页面级组合组件
│   ├── entries/                 # React island 入口
│   ├── lib/utils.ts             # shadcn cn() helper
│   ├── styles/globals.css       # Tailwind v4 + 主题 token + 旧样式桥接
│   └── main.tsx                 # 所有 Mock 页面的统一入口
└── static-pages/                # 页面、Mock 数据与静态交互
```

## Page set

| File | Coverage |
|---|---|
| `index.html` | Control Plane 健康、容量、传播路径、注意队列 |
| `topology.html` | control plane → member cluster 拓扑 |
| `resources.html` | Workload / Service / Config / Namespace 统一资源模型 |
| `policies.html` | Propagation / Override policy 与冲突状态 |
| `clusters.html` | 成员集群连接、版本、容量、新鲜度 |
| `member-cluster.html` | 完整成员集群工作台：Overview + 25 个资源视图，按 Workloads、Network、Configuration、Storage、Cluster Resources、Access Control 分区 |
| `metrics.html` | 控制面指标、信号健康、时间范围 |
| `settings.html` | Config / Registry / Upgrade / Failover / RBAC / Add-ons |
| `states.html` | loading、empty、partial/fatal error、forbidden、stale、delete、success |
| `login.html` | Token 登录与 OIDC 不可用反馈 |

所有页面通过顶栏 workspace 选择器切换 Control Plane 与 member1/2/3；侧栏只展示当前范围的资源树，避免重复的范围按钮。顶栏还提供控制面 Terminal 管理、语言切换、亮/暗主题、账户菜单与退出登录。

成员集群页面支持 26 个 URL hash 路由（Overview + 25 个资源视图）、资源树搜索、当前分组自动展开、表格搜索、Namespace 筛选、Watch 状态、列设置、Inspect / Edit YAML、详情抽屉、Events / YAML 切换与 YAML 草稿反馈。上下文动作包括 Pod Logs / Terminal、Deployment 与 StatefulSet Scale / Restart、Node Shell / Drain、CronJob Run now、Service Port forward。

## Verification

```bash
cd ui
pnpm --filter @karmada/design-redesign build
```

构建会先执行 TypeScript 类型检查，再生成全部静态页面入口。
