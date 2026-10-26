# AI-Lex 治理基线

观察日期：2026-10-27。基线：`751db410e52e6d70ba72521de71e2b46b2865836`；默认分支 `main`；仓库公开。这是冻结事实，不替代当前 PR 的检查。

现有 CI 为演示模式构建；规则与 Agent 管道主要是确定性模板和关键词处理。未知部署区域被默认 cn 的行为需要修正与回归，尚无真实业务质量结论。

## 检查入口与历史证据

CI 使用 Node 20：`npm ci`、`npm run build`，并设置 FEATURE_AUTH、FEATURE_PERSIST、FEATURE_LLM 为 false。根 package 未提供 test/lint；`src/lib/agents/__test__.ts` 是打印示例，不能记为断言评测。数据库 push/migrate 具有数据影响，不能当通用检查运行。

- [CI / 30429988575](https://github.com/2432antony-13/AI-Lex/actions/runs/30429988575)：success，来源 `751db410e52e6d70ba72521de71e2b46b2865836`。
- [CI / 30429983505](https://github.com/2432antony-13/AI-Lex/actions/runs/30429983505)：success，来源 `751db410e52e6d70ba72521de71e2b46b2865836`。

## 平台差异

公开仓库尚无 rulesets；待实际 PR 检查通过后配置并回读。 CLI 当前有 repo 权限，仍缺 project/workflow；Projects 和新工作流接入单列待办。本仓 Issues 已启用。

## 本轮采用范围

采用材料来源：用户提供的 project-governance kit/skill v1.0.0 与 2026-10-25 工作区方案；用户 2026-10-27 授权五个现有仓库实施。此前跨仓复用是建议；未发生的集成不登记为已采用。

本轮 PR 与实际管理交付见 [HANDOVER.md](HANDOVER.md)。专业质量、浏览器使用和线上渠道必须另有证据。
