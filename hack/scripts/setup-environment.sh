
#!/bin/bash
# 模块一：基础环境安装脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &amp;&amp; pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." &amp;&amp; pwd)"
UTILS_DIR="$SCRIPT_DIR/utils"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 解析命令行参数
WITH_ARGOCD=false
SKIP_KARMADA=false
CLEANUP=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --with-argocd) WITH_ARGOCD="$2"; shift ;;
        --with-argocd=*) WITH_ARGOCD="${1#*=}" ;;
        --skip-karmada) SKIP_KARMADA=true ;;
        --cleanup) CLEANUP=true ;;
        *) log_error "未知参数: $1"; exit 1 ;;
    esac
    shift
done

# 清理模式
if [ "$CLEANUP" = true ]; then
    log_info "开始清理环境..."
    
    if kind get clusters | grep -q "karmada"; then
        log_warn "删除 Kind 集群..."
        kind delete cluster --name karmada
    fi
    
    log_info "✅ 清理完成"
    exit 0
fi

echo "========================================="
echo "    模块一：基础环境安装"
echo "========================================="

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    local missing=0
    
    if ! command -v docker &amp;&gt; /dev/null; then
        log_error "Docker 未安装"
        missing=1
    fi
    
    if ! command -v kind &amp;&gt; /dev/null; then
        log_error "kind 未安装"
        missing=1
    fi
    
    if ! command -v kubectl &amp;&gt; /dev/null; then
        log_error "kubectl 未安装"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
    
    log_info "✅ 所有依赖已安装"
}

# 创建 Kind 集群
create_kind_cluster() {
    log_info "创建 Kind 集群..."
    
    if kind get clusters | grep -q "karmada"; then
        log_warn "Kind 集群已存在，跳过创建"
        return
    fi
    
    # 使用项目已有的 Kind 配置
    cd "$REPO_ROOT"
    if [ -f "artifacts/kindClusterConfig/karmada-host.yaml" ]; then
        kind create cluster --name karmada --config artifacts/kindClusterConfig/karmada-host.yaml
    else
        kind create cluster --name karmada
    fi
    
    log_info "✅ Kind 集群创建完成"
}

# 主执行流程
main() {
    check_dependencies
    create_kind_cluster
    
    if [ "$SKIP_KARMADA" = false ]; then
        "$UTILS_DIR/install-karmada.sh"
    else
        log_warn "跳过 Karmada 安装"
    fi
    
    if [ "$WITH_ARGOCD" = true ]; then
        "$UTILS_DIR/install-argocd.sh"
    fi
    
    echo ""
    echo "========================================="
    echo "    ✅ 基础环境安装完成！"
    echo "========================================="
    echo ""
    echo "📋 下一步："
    echo "  配置 GitOps: ./hack/scripts/setup-gitops.sh"
}

main
