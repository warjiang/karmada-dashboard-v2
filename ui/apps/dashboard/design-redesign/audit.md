# Current UI Audit

## Coverage

- 已截图：41 个页面 / 状态，目录见 `audit-screenshots/`。
- 快速总览：`audit-contact-sheet.jpg`。
- 主控制面：Overview、Topology、4 类 Resources、2 类 Policies、Member Clusters、5 个 Settings、3 个 Advanced Config、2 个 Addon、Metrics。
- 成员集群：Overview、4 个 Workload、2 个 Service、3 个 Config & Storage、9 个 Cluster / RBAC 页面。
- 认证：Token 登录、OIDC callback 失败状态。

## 关键观察

1. 顶层与成员集群使用两套侧栏结构，但缺少连续的作用域感，用户下钻后容易误以为进入另一套产品。
2. 多数资源页是相同表格框架换字段，信息架构按 Kubernetes Kind 分组，而不是按“发现问题—判断影响—采取动作”的任务路径分组。
3. Overview 的全局信息和资源计数分散，缺少一个明确的健康结论、风险优先级与最近变化。
4. Topology 在空数据或加载时留下大片空白，缺少解释、关系图例和下一步动作。
5. 多个 Settings / Advanced / Addon 页面仍显示 `this is ...Page`，应在静态设计中用一致的“未配置 / 即将可用 / 权限不足”状态替代裸占位。
6. Loading 主要依赖整块 Spin 或 Table loading；Empty 多依赖 Ant Empty；网络错误在部分列表测试中表现为“空表”，会把失败误导为空数据。
7. 成员集群的表格字段很完整，但横向列多、动作密集，缺少列优先级、详情抽屉与批量动作层级。
8. Metrics 已开始形成独立视觉语言，但与其他页面的导航、卡片和状态表达不统一。
9. 当前页截图宽度为 `1280×720`，内容区被宽侧栏与固定布局显著压缩；重设计应控制主导航宽度并允许上下文面板按需出现。

## 重设计必须保留

- Karmada 品牌标识和多集群语义。
- 资源表的专业字段、Namespace / Cluster 过滤、YAML/详情/终端能力。
- 顶层多云与成员集群下钻两种视角。
- Metrics、Topology、AI Assistant 与终端入口。
