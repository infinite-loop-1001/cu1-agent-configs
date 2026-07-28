#!/usr/bin/env bash

# 开启严格错误模式
set -euo pipefail

# 1. 接收参数并解析 debug 模式
REMOTE_SOURCE=""
DEBUG_MODE=false

case "${DEBUG:-}" in
    1|true|TRUE|yes|YES|on|ON) DEBUG_MODE=true ;;
esac

for arg in "$@"; do
    case "$arg" in
        -x|-d|--debug)
            DEBUG_MODE=true
            ;;
        --)
            continue
            ;;
        *)
            if [[ -n "$REMOTE_SOURCE" ]]; then
                echo "❌ 错误: 只允许指定一个远程技能源。"
                exit 1
            fi
            REMOTE_SOURCE="$arg"
            ;;
    esac
done

if [[ -z "$REMOTE_SOURCE" ]]; then
    echo "❌ 错误: 请指定要拉取的远程技能源！"
    echo "用法: skills-pull [-x] <远程用户名/仓库名>"
    exit 1
fi

debug() {
    if [[ "$DEBUG_MODE" == true ]]; then
        echo "[debug] $*"
    fi
}

# 2. 校验并记住当前你写代码的业务项目路径
PROJECT_DIR=$(pwd)
CONFIG_DIR="${GLO_AGENT_CONFIG_PATH:-}"
debug "PROJECT_DIR=$PROJECT_DIR"
debug "CONFIG_DIR=$CONFIG_DIR"

if [[ -z "$CONFIG_DIR" || ! -d "$CONFIG_DIR" ]]; then
    echo "❌ 错误: GLO_AGENT_CONFIG_PATH 未设置或目录不存在。"
    exit 1
fi

# 3. 直接在大本营仓库中执行 skills add，手动选择 agent 和安装范围
cd "$CONFIG_DIR"

echo "📥 正在大本营仓库中拉取远程技能: $REMOTE_SOURCE ..."
debug "cd $CONFIG_DIR"
debug "npx skills@latest add $REMOTE_SOURCE"
npx skills@latest add "$REMOTE_SOURCE"

# 4. 把 .agents 目录里的所有 skills 搬运到大本营根目录/skills/ 里面
mkdir -p "$CONFIG_DIR/skills"
if [[ -d ".agents/skills" ]]; then
    echo "🚚 正在将拉取的技能提取并收纳至大本营 skills/ 目录..."
    # 使用 cp -R 覆盖，确保隐藏文件等资源也能完整移入
    debug "cp -R .agents/skills/. $CONFIG_DIR/skills/"
    cp -R ".agents/skills/." "$CONFIG_DIR/skills/"
else
    echo "❌ 错误: 未能在远程源中检测到标准的技能文件，请检查源是否正确。"
    exit 1
fi

# 5. 清理 skills CLI 生成的 .agents 目录
echo "🧹 正在清理临时配置目录 (.agents) ..."
debug "rm -rf .agents"
rm -rf .agents

echo "✅ 远程技能已被成功收编至大本营仓库！"

# 6. 最终自动安全切回到原先写代码的业务项目
debug "cd $PROJECT_DIR"
cd "$PROJECT_DIR"
