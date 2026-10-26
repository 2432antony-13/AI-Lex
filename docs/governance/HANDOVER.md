# AI-Lex 治理交接

2026-10-27；当前授权：用户要求按既定规范更新五个已有 GitHub 项目。工作分支 governance/project-baseline-20261027，基线 `751db410e52e6d70ba72521de71e2b46b2865836`。

已准备章程、协作规则、质量矩阵、资产来源与模板；实际 Issue、PR、平台约束和检查结果由本轮完成记录补充。当前尚未以本文件宣告合并、部署或业务验收。

下一执行动作：读取本仓 Issues 的唯一状态与阻塞，核对当前分支和最新检查，按具体用例推进。CI 使用 Node 20：`npm ci`、`npm run build`，并设置 FEATURE_AUTH、FEATURE_PERSIST、FEATURE_LLM 为 false。根 package 未提供 test/lint；`src/lib/agents/__test__.ts` 是打印示例，不能记为断言评测。数据库 push/migrate 具有数据影响，不能当通用检查运行。

具体产品待办：建立缺失事实与规则依据的断言式验收样例；核对 AI-Lex 实际部署与一条用户工作流。业务期限/预算尚未承诺；新外部费用、真实发信或数据恢复按任务补齐范围。

当前已知限制：现有 CI 为演示模式构建；规则与 Agent 管道主要是确定性模板和关键词处理。未知部署区域被默认 cn 的行为需要修正与回归，尚无真实业务质量结论。 Projects/新工作流待权限；独立人工批准和用户验收尚未取得。本轮不新建仓库，不引入 JEV 等本地对象。

## 实际任务入口

[本轮里程碑](https://github.com/2432antony-13/AI-Lex/milestone/1)

- [governance #1](https://github.com/2432antony-13/AI-Lex/issues/1)
- [quality #2](https://github.com/2432antony-13/AI-Lex/issues/2)
- [release #3](https://github.com/2432antony-13/AI-Lex/issues/3)

任务当前状态以 Issue 标签为准；最终 PR、合并来源与运行结果在治理任务正文登记。这里不复制会随进度变化的第二套任务状态。
