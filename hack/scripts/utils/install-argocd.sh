
#!/bin/bash
# ArgoCD 安装脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &amp;&amp; pwd)"

echo "========================================="
echo "       开始安装 ArgoCD"
echo "========================================="

# 检查 ArgoCD 是否已安装
if kubectl get namespace argocd &amp;&gt; /dev/null; then
    echo "⚠️  ArgoCD 已存在，跳过安装"
    exit 0
fi

# 创建命名空间
echo "📦 创建 ArgoCD 命名空间..."
kubectl create namespace argocd

# 安装 ArgoCD
echo "🚀 安装 ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 等待 Pod 就绪
echo "⏳ 等待 ArgoCD Pod 就绪..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# 获取初始密码
echo "🔑 获取初始密码..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo ""
echo "✅ ArgoCD 安装完成！"
echo ""
echo "📋 访问信息："
echo "  ArgoCD UI: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  URL: https://localhost:8080"
echo "  Username: admin"
echo "  Password: $ARGOCD_PASSWORD"
echo ""
echo "💡 使用 argocd CLI 登录："
echo "  argocd login localhost:8080 --username admin --password $ARGOCD_PASSWORD --insecure"
