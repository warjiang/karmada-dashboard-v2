
# 模块二：GitOps 配置

本模块用于配置 ArgoCD 监听 GitHub 仓库并自动同步部署。

## 前置条件

- 已完成模块一（或已安装 ArgoCD）
- ArgoCD 运行正常

## 使用说明

### 快速开始

```bash
# 使用默认配置
./hack/scripts/setup-gitops.sh
```

### 自定义配置

```bash
# 指定仓库、分支、同步策略
./hack/scripts/setup-gitops.sh \
    --repo-url=https://github.com/your-name/dashboard.git \
    --branch=main \
    --auto-sync=false \
    --env=dev
```

### 命令行选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--repo-url=URL` | Git 仓库 URL | karmada-io/dashboard |
| `--branch=BRANCH` | 目标分支 | main |
| `--auto-sync=true/false` | 是否自动同步 | false |
| `--env=dev/staging/prod` | 环境 | dev |

## 同步策略

### 手动同步（推荐用于生产）

```bash
./hack/scripts/setup-gitops.sh --auto-sync=false
```

手动同步需要在 ArgoCD UI 中点击 SYNC 按钮，或使用命令：

```bash
argocd app sync karmada-dashboard
```

### 自动同步（推荐用于开发）

```bash
./hack/scripts/setup-gitops.sh --auto-sync=true
```

自动同步会在检测到 Git 仓库变化时自动部署。

## 访问 ArgoCD UI

```bash
# 端口转发
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

访问：https://localhost:8080

获取初始密码：

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## 使用 argocd CLI

```bash
# 登录
argocd login localhost:8080 --username admin --password &lt;PASSWORD&gt; --insecure

# 查看应用
argocd app list

# 同步应用
argocd app sync karmada-dashboard

# 查看状态
argocd app get karmada-dashboard
```

## 发布流程

### 1. 创建 Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. GitHub Actions 自动构建

- 构建多架构镜像
- 推送到 Docker Hub
- 更新 Helm Chart

### 3. ArgoCD 同步

- 手动同步（推荐）
- 或等待自动同步（如已启用）

## 架构

```
setup-gitops.sh
    ├─ 检查 ArgoCD 已安装
    ├─ 应用 Application Project
    ├─ 应用 Application
    └─ 验证配置
```
