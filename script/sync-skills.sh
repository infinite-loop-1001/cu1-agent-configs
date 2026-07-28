#!/usr/bin/env bash

# 开启严格错误模式
set -eo pipefail

show_help() {
    echo "Vercel Labs npx skills 本地纯增量同步工具"
    echo ""
    echo "用法:"
    echo "  $0 -s <源目录> -t <目标同步目录>"
    echo "  $0 -h | --help"
    echo ""
    echo "示例:"
    echo "  $0 -s .claude/skills -t ~/workspace/my-skills-repo/skills"
    exit 0
}

for arg in "$@"; do
    if [[ "$arg" == "--help" ]]; then show_help; fi
done

SRC_PATH=""
REPO_PATH=""

while getopts "s:t:h" opt; do
    case "$opt" in
        s) SRC_PATH="$OPTARG" ;;
        t) REPO_PATH="$OPTARG" ;;
        h) show_help ;;
        *) show_help ;;
    esac
done

if [[ -z "$SRC_PATH" || -z "$REPO_PATH" ]]; then
    echo "❌ 错误: 缺少必要参数 -s 或 -t。"
    show_help
fi

# 1. 校验源目录
if [[ ! -d "$SRC_PATH" ]]; then
    echo "❌ 错误: 源目录不存在 -> $SRC_PATH"
    exit 1
fi
ABS_SRC_PATH=$(cd "$SRC_PATH" && pwd)

# 2. 校验并准备目标目录
mkdir -p "$REPO_PATH"
ABS_TARGET_DIR=$(cd "$REPO_PATH" && pwd)

# 3. 执行纯粹的 rsync 增量同步
echo "🔄 正在从 [$ABS_SRC_PATH] 增量同步至 [$ABS_TARGET_DIR]..."
CHANGED_FILES=$(rsync -ac --out-format="%n" "$ABS_SRC_PATH/" "$ABS_TARGET_DIR/" | sed '/^\s*$/d')

# 2. 判断是否有变动
if [[ -z "$CHANGED_FILES" ]]; then
    echo "✨ 技能大本营内容已是最新的，无需更新。"
else
    # 🌟 核心改进：
    # cut -d'/' -f1 : 以斜杠/为分隔符，只取第一段（即一级文件夹名称，如 tdd）
    # grep -v '^\.$' : 🔥 新增，强行过滤掉纯粹的单点 '.'
    # sort -u       : 对文件夹名称进行全局排序并完美去重
    CHANGED_SKILLS=$(echo "$CHANGED_FILES" | cut -d'/' -f1 | grep -v '^\.$' | sort -u)
    
    # 计算有变动的核心技能个数
    SKILL_COUNT=$(echo "$CHANGED_SKILLS" | wc -l | tr -d ' ')
    
    # 将多个技能文件夹名合并为一行，用逗号隔开
    SKILLS_IN_ONE_LINE=$(echo "$CHANGED_SKILLS" | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')
    
    # 3. 优雅的极简单行输出
    echo "🔄 成功增量同步了 $SKILL_COUNT 个技能! ➔ [$SKILLS_IN_ONE_LINE]"
fi

echo "✅ 本地增量同步完成！请自行在目标仓库下进行 Git 提交与推送。"

