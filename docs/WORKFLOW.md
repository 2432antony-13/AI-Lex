# AI-Lex 工作与交付流程

章程：[PROJECT.md](PROJECT.md)。开始任务时固定用户问题、验收、依赖、Owner 和版本；本轮管理实施授权来自用户 2026-10-27 指令。

## 任务

依次为 Backlog → Ready → Doing → Review → Verified → Delivered。任务状态统一在[私有管理看板](https://github.com/users/2432antony-13/projects/1)的 Status 字段维护，阻塞使用 Blocked / Blocker 字段；Issue 正文保留验收与解除条件。旧 status/blocked 标签停止作为状态源。只有实际开始的任务进入 Doing。取消、重复和延期单独说明，不能记为交付。项目阶段见章程，不能用任务状态代替。

## 变更与检查

沿用 `main` 和短任务分支；PR 说明具体行为/文档变化、关联 Issue、验证对象与未覆盖项。自查记录真实实施者，独立批准人数不虚构。CI 使用 Node 20：`npm ci`、`npm run build`，并设置 FEATURE_AUTH、FEATURE_PERSIST、FEATURE_LLM 为 false。根 package 未提供 test/lint；`src/lib/agents/__test__.ts` 是打印示例，不能记为断言评测。数据库 push/migrate 具有数据影响，不能当通用检查运行。

平台状态与运行见 [基线](governance/BASELINE.md)，产品用例见 [质量矩阵](governance/QUALITY.md)。必要检查应采用实际成功的 job 名，先运行再设置；通过 PR 的约定和平台阻断分别核验。DataTrace 等自动写入主分支的流程须先设计衔接再开启全面 PR 限制。

## 发布与恢复

现有 Next.js 应用；实际生产域名和部署版本尚待核对，治理文档通过本仓库默认分支交付。 每次交付记录实际源码 SHA、依赖/数据版本、制品路径及 SHA-256、CI/渠道运行链接、关键使用结果、上一可用版本与数据恢复限制。没有可用部署或恢复演练证据时写未验证。

代码回退和数据恢复分别处理；保留当前数据后才考虑迁移恢复。合并文档不证明站点、模型、邮件或可执行文件已交付。发布权限不足时继续完成可评审制品并记录具体阻塞。

## 维护与复用

[资产台账](governance/ASSETS.md) 保存来源、输入输出、消费者和验证范围。共享前先在现有第二个仓库验证，不新增公共库仓库。每轮复盘记录继续、调整或暂缓的依据；未测量时不填写效率提升。

## 新任务进入看板

[私有管理看板](https://github.com/users/2432antony-13/projects/1)是当前状态源。网页任务表单设置了项目关联和默认 Owner；创建者有看板写权限时可自动加入。CLI/API 或外部贡献者创建的 Issue 由 Owner 显式加入看板，并核对 Status、Blocked、Assignees；新任务通常为 Backlog，期限未知保持空。参考 [GitHub 表单规则](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)。
