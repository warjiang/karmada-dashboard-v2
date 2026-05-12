
#!/bin/bash
# Karmada 安装脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &amp;&amp; pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." &amp;&amp; pwd)"

echo "========================================="
echo "       开始安装 Karmada"
echo "========================================="

# 检查是否已存在 Karmada
if kubectl get namespace karmada-system &amp;&gt; /dev/null; then
    echo "⚠️  Karmada 已存在，跳过安装"
    exit 0
fi

# 检查 karmadactl
if ! command -v karmadactl &amp;&gt; /dev/null; then
    echo "📦 下载 karmadactl..."
    # 这里可以添加下载 karmadactl 的逻辑
    echo "请确保已安装 karmadactl"
    exit 1
fi

# 运行 Karmada 本地安装脚本
echo "🚀 运行 Karmada 本地安装..."
cd "$REPO_ROOT"
if [ -f "hack/local-up-karmada.sh" ]; then
    ./hack/local-up-karmada.sh
else
    echo "❌ 找不到 hack/local-up-karmada.sh"
    exit 1
fi

echo "✅ Karmada 安装完成！"
echo ""
echo "📋 验证安装状态："
echo "  kubectl get pods -n karmada-system"
echo "  karmadactl version"
