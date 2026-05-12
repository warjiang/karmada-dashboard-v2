
# 模块一：基础环境安装

本模块用于快速安装 Kind 集群、Karmada 和可选的 ArgoCD。

## 使用说明

### 前置条件

- Docker 已安装并运行
- kubectl 已安装
- kind 已安装
- 至少 8GB 可用内存

### 快速开始

#### 方式一：完整安装（推荐）

```bash
# 安装 Kind + Karmada + ArgoCD
./hack/scripts/setup-environment.sh --with-argocd=true
```

#### 方式二：最小化安装

```bash
# 只安装 Kind + Karmada
./hack/scripts/setup-environment.sh

# 后续需要时再安装 ArgoCD
./hack/scripts/utils/install-argocd.sh
```

#### 方式三：已有 Karmada 集群

```bash
# 跳过 Karmada 安装，只安装 ArgoCD
./hack/scripts/setup-environment.sh --skip-karmada --with-argocd=true
```

### 命令行选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--with-argocd=true/false` | 是否同时安装 ArgoCD | false |
| `--skip-karmada` | 跳过 Karmada 安装 | false |
| `--cleanup` | 清理环境 | false |

### 清理环境

```bash
./hack/scripts/setup-environment.sh --cleanup
```

### 验证安装

```bash
# 检查 Kind 集群
kind get clusters

# 检查 Karmada
kubectl get pods -n karmada-system

# 检查 ArgoCD（如已安装）
kubectl get pods -n argocd
```

### 下一步

安装完成后，运行模块二来配置 GitOps：

```bash
./hack/scripts/setup-gitops.sh
```

## 架构

```
setup-environment.sh
    ├─ 检查依赖
    ├─ 创建 Kind 集群
    ├─ 调用 install-karmada.sh 安装 Karmada
    └─ [可选] 调用 install-argocd.sh 安装 ArgoCD
```
