# Karmada Dashboard · Product Facts

> 采集日期：2026-07-24
> 事实来源：本仓库源码、`http://localhost:5173` 的真实运行界面、当前集群 API 返回。

- 产品：Karmada Dashboard，一个面向多集群、多云资源与策略管理的 Web 控制面。
- 当前前端：React 19、React Router 7、Ant Design 6、TanStack Query、Vite 8。
- 当前运行态 Karmada 版本：`v1.17.0-36-g3aaefc07a`。
- 当前演示环境：3 个成员集群（member1、member2、member3），Kubernetes `v1.35.0`；其中 member1/2 为 Push，member3 为 Pull。
- 顶层能力：总览、拓扑、跨云资源、跨云策略、成员集群、设置、插件、指标。
- 成员集群能力：工作负载、服务、配置与存储、节点、事件、命名空间、PV、RBAC 与 ServiceAccount。
- 登录方式：JWT Token；OIDC 企业登录入口存在，但当前运行环境未启用。OIDC 回调具有处理失败与返回登录页的状态。
- 现状约束：多个 Settings / Advanced Config / Addon 子页仍是占位页；大多数资源页使用表格主视图；错误态多以 message toast 或通用 Result 呈现。

