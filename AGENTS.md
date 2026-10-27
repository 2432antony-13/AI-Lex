# AI-Lex 协作约定

先读 [项目章程](PROJECT.md)、[工作流](docs/WORKFLOW.md) 与任务正文。保留用户和其他任务的未提交工作，核对远端、分支、基线 SHA；使用短期任务分支，目标默认分支为 `main`。

- 用户已经授权的常规实现和管理操作持续有效；不得从模板推导无关外发、费用或破坏性操作权限。
- 本轮仅涉及现有 GitHub 仓库；不创建新仓库，不引入 JEV 等本地项目依赖。
- CI 使用 Node 20：`npm ci`、`npm run build`，并设置 FEATURE_AUTH、FEATURE_PERSIST、FEATURE_LLM 为 false。根 package 未提供 test/lint；`src/lib/agents/__test__.ts` 是打印示例，不能记为断言评测。数据库 push/migrate 具有数据影响，不能当通用检查运行。
- 行为改变覆盖原失败条件；文档改动检查事实、链接和差异。未知结果不得填“通过”。
- 缺失事实应显式保留；模型生成与规则匹配均需可查依据；中国规则与 DataTrace HK/SG 数据不得直接混用。
- 任务状态统一在[私有管理看板](https://github.com/users/2432antony-13/projects/1)的 Status 字段维护，阻塞使用 Blocked / Blocker 字段；Issue 正文保留验收与解除条件。旧 status/blocked 标签停止作为状态源。 PR 引用任务。合并、部署、用户验收分别记录，不自动关闭尚未满足交付验收的任务。
- 交接保留来源 SHA、命令/运行、输入输出范围、限制和下一动作。自查不称独立批准。
