# 仓库指南

本仓库是一个 Agent Skills 集合。目录结构如下：

```text
.
├── skills/
│   ├── archify/          # 生成可校验、可交互并支持导出的技术图表
│   ├── bloom-tutor/      # 提供中文苏格拉底式系统学习与学习日志管理
│   ├── brainstorming/    # 在编码前澄清需求、比较方案并形成设计
│   ├── ce-doc-review/    # 多角色审查需求、计划和规格文档
│   ├── checkpoint/       # 将会话关键信息压缩为结构化检查点
│   ├── context-trim/     # 清理对话中的过时和重复上下文
│   ├── diff-only/        # 仅以 unified diff 形式展示代码变更
│   ├── drawio-skill/     # 生成 Draw.io 图表并可选导出 SVG
│   ├── grill-with-docs/  # 通过持续追问打磨计划并创建相关文档
│   ├── need-a-hug/       # 为焦虑、疲惫或沮丧的用户提供情绪支持
│   ├── plan-eng-review/  # 从工程经理视角审查实施计划
│   ├── smart-read/       # 先搜索再读取文件，降低上下文消耗
│   └── tdd/              # 使用 RED-GREEN-REFACTOR 进行测试驱动开发
└── script/
    ├── pull-to-repo.sh  # 从远程仓库拉取技能并收纳到 skills/
    └── sync-skills.sh   # 在两个技能目录之间执行增量同步
```

每个技能目录的入口说明是 `SKILL.md`，其余 `references/`、`scripts/`、`schemas/`、`examples/` 和 `test/` 等目录按技能需要提供支持文件。

## 脚本使用方式

### `script/pull-to-repo.sh`

从远程技能源拉取技能并复制到本仓库的 `skills/` 目录。需要设置 `GLO_AGENT_CONFIG_PATH` 指向本仓库，并确保可使用 `npx`：

```sh
GLO_AGENT_CONFIG_PATH=/path/to/cu1-agent-configs \
  bash script/pull-to-repo.sh <owner/repository>
```

例如：

```sh
GLO_AGENT_CONFIG_PATH=/path/to/cu1-agent-configs \
  bash script/pull-to-repo.sh Agents365-ai/drawio-skill
```

使用 `-x`、`-d` 或 `--debug`，或设置 `DEBUG=1`，可以输出调试信息。脚本会调用 `npx skills@latest add`，将 `.agents/skills/` 内容复制到 `skills/`，随后清理 `.agents/`。

### `script/sync-skills.sh`

使用 `rsync` 将本地技能目录增量同步到目标目录：

```sh
bash script/sync-skills.sh \
  -s /path/to/source/skills \
  -t /path/to/target/skills
```

参数 `-s` 指定源目录，`-t` 指定目标目录；使用 `-h` 或 `--help` 查看帮助。目标目录不存在时会自动创建，脚本会报告发生变化的技能。运行前请确认源目录、目标目录和 `rsync` 均可用。
