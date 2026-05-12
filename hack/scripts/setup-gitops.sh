
#!/bin/bash
# 模块二：GitOps 配置脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &amp;&amp; pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." &amp;&amp; pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy/argocd"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 默认配置
REPO_URL="https://github.com/karmada-io/dashboard.git"
BRANCH="main"
AUTO_SYNC=false
ENV="dev"

# 解析命令行参数
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --repo-url) REPO_URL="$2"; shift ;;
        --repo-url=*) REPO_URL="${1#*=}" ;;
        --branch) BRANCH="$2"; shift ;;
        --branch=*) BRANCH="${1#*=}" ;;
        --auto-sync) AUTO_SYNC="$2"; shift ;;
        --auto-sync=*) AUTO_SYNC="${1#*=}" ;;
        --env) ENV="$2"; shift ;;
        --env=*) ENV="${1#*=}" ;;
        *) log_error "未知参数: $1"; exit 1 ;;
    esac
    shift
done

echo "========================================="
echo "    模块二：GitOps 配置"
echo "========================================="

# 检查 ArgoCD 是否已安装
check_argocd() {
    log_info "检查 ArgoCD..."
    
    if ! kubectl get namespace argocd &amp;&gt; /dev/null; then
        log_error "ArgoCD 未安装，请先运行："
        log_error "  ./hack/scripts/utils/install-argocd.sh"
        exit 1
    fi
    
    log_info "✅ ArgoCD 已安装"
}

# 应用 Application Project
apply_project() {
    log_info "创建 Application Project..."
    kubectl apply -f "$DEPLOY_DIR/karmada-dashboard-project.yaml"
}

# 应用 Application
apply_application() {
    log_info "创建 Application..."
    
    # 准备临时文件用于修改
    local temp_file=$(mktemp)
    cp "$DEPLOY_DIR/karmada-dashboard-app.yaml" "$temp_file"
    
    # 更新配置
    sed -i "s|repoURL:.*|repoURL: $REPO_URL|" "$temp_file"
    sed -i "s|targetRevision:.*|targetRevision: $BRANCH|" "$temp_file"
    
    # 配置同步策略
    if [ "$AUTO_SYNC" = true ]; then
        log_info "启用自动同步"
        sed -i 's|automated: null|automated:\
        prune: true\
        selfHeal: true|' "$temp_file"
    fi
    
    kubectl apply -f "$temp_file"
    rm "$temp_file"
}

# 验证配置
verify_config() {
    log_info "验证配置..."
    sleep 5
    
    if command -v argocd &amp;&gt; /dev/null; then
        log_info "ArgoCD Application 状态："
        argocd app list || true
    fi
}

main() {
    check_argocd
    apply_project
    apply_application
    verify_config
    
    echo ""
    echo "========================================="
    echo "    ✅ GitOps 配置完成！"
    echo "========================================="
    echo ""
    echo "📋 访问 ArgoCD："
    echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
    echo "  URL: https://localhost:8080"
    echo ""
    echo "🔄 手动同步："
    echo "  argocd app sync karmada-dashboard"
    echo "  或在 ArgoCD UI 中点击 SYNC 按钮"
}

main
