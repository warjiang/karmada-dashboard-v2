# Karmada Dashboard v2 · Static Redesign

## Final direction

用户选择：**A · Night Ops + 亮色、暗色切换**。选型记录见 `direction-approved.md`。

完整页面组位于 `static-pages/`，使用共享 `styles.css`、`app.js`、`mock-data.js`，可直接修改 mock 数据做二次设计。原生产 Dashboard 未被改动。

## Preview

从 `ui/apps/dashboard/` 启动静态服务，确保官方 Logo 的相对路径可以正常解析：

```bash
cd ui/apps/dashboard
python3 -m http.server 4175 --bind 127.0.0.1
```

打开 `http://127.0.0.1:4175/design-redesign/static-pages/index.html`。

## Page set

| File | Coverage |
|---|---|
| `index.html` | 全局健康、容量、联邦航线、注意队列 |
| `topology.html` | control plane → member cluster 拓扑 |
| `resources.html` | Workload / Service / Config / Namespace 统一资源模型 |
| `resource-detail.html` | 联邦资源详情、成员实现、元数据 |
| `policies.html` | Propagation / Override policy 与冲突状态 |
| `clusters.html` | 成员集群连接、版本、容量、新鲜度 |
| `member-cluster.html` | 单成员集群下钻与 stale metrics 状态 |
| `metrics.html` | 控制面指标、信号健康、时间范围 |
| `settings.html` | Config / Registry / Upgrade / Failover / RBAC / Add-ons |
| `states.html` | loading、empty、partial/fatal error、forbidden、stale、delete、success |
| `login.html` | Token 登录与 OIDC 不可用反馈 |

所有页面支持系统主题初始值、亮/暗手动切换与 `localStorage` 持久化。交互包括资源搜索、命令面板、主题切换、设置开关、危险操作确认、登录跳转与原型反馈 Toast。

## Verification

- 11 个页面在 `1440×900` 逐页截图，控制台 error/warning 为 0。
- `1280×720` 检查无横向溢出。
- 已验证主题跨页保持、资源搜索、命令面板、危险操作取消、Token 登录跳转。
- 页面截图：`static-pages/screenshots/`。
- 最终总览：`static-pages-contact-sheet.jpg`。

## Research artifacts

- `audit-contact-sheet.jpg`：41 个现有页面 / 状态的截图总览。
- `audit-screenshots/`：逐页原始截图。
- `audit.md`：现状问题与保留项。
- `product-facts.md`：从源码与运行环境确认的产品事实。
- `brand-spec.md`：Karmada 标识、色彩、字体与禁区。
- `design-spec.md`：三个方向的共同设计输入和状态矩阵。
- `directions/`：A / B / C 三方向真实初稿。
