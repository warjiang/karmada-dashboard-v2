# Karmada Dashboard · Brand Spec

> 采集日期：2026-07-24
> 资产来源：项目自带 SVG 与真实运行截图
> 资产完整度：完整（用于静态原型）

## 核心资产

### Logo

- 主版本：`../../public/logo.svg`
- 页面内版本：`../../src/assets/karmada-logo.svg`
- 使用场景：全局导航、登录页、方向初稿；保持原始比例，不重画、不描边、不改变内部蓝色层次。

### UI 截图

- 总览：`audit-screenshots/01-overview.png`
- 拓扑：`audit-screenshots/02-topology.png`
- 资源表：`audit-screenshots/03-namespaces.png`
- 指标：`audit-screenshots/20-metrics.png`
- 成员集群：`audit-screenshots/21-member-overview.png`
- 登录错误：`audit-screenshots/40-login-callback.png`

截图仅用于审计与对照；新静态原型用真实字段和 mock 数据重构，不把旧页面截图当成新 UI。

## 辅助资产

### 色板

- Sail Blue / Primary：`#1781FF`，来自官方 SVG 主帆。
- Sky / Secondary：`#51ADFF`，来自官方 SVG 浅色帆。
- Cobalt / Strong：`#2765FF`，来自官方 SVG 中央主帆。
- Ink：`#111827`，用于高对比信息文本。
- Surface：`#F6F8FB`，仅作为工作台底色，不与品牌标识竞争。
- Success：`#16A36A`；Warning：`#C98200`；Critical：`#D93A45`。语义色仅用于状态，不作为装饰。

色彩论证：蓝色全部从 Karmada 帆船标识采样并收敛为主蓝、浅蓝、钴蓝三档；状态色只承担健康语义，避免把控制台做成泛 SaaS 彩虹面板。

### 字型

- UI / 中文：`IBM Plex Sans`, `Noto Sans SC`, `PingFang SC`, sans-serif。
- 数据 / 标签：`IBM Plex Mono`, `JetBrains Mono`, monospace。
- 数字使用 `font-variant-numeric: tabular-nums`。

### 签名细节

- “联邦航线”是内容母题：把多集群的连接、健康与调度流表达成细线、节点与方向，而不是装饰性插画。
- 所有风险信息直接贴近受影响资源，禁止只在全局 toast 中短暂出现。

### 禁区

- 不使用通用紫色渐变、过度玻璃拟态、emoji 图标、每块数据都圆角卡片化。
- 不用蓝色表达所有状态；健康、告警、失败必须通过语义色与文本双重编码。
- 不把只读观测与高风险写操作混在同一视觉层级。

### 气质关键词

- 可信、精确、联邦化、冷静、快速定位。

