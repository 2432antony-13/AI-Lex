<p align="right"><strong>简体中文</strong> | <a href="README.previous.en.md">English</a></p>

# AI-Lex

面向 AI 产品团队的可审计合规工作流原型。

AI-Lex 将产品事实、适用规则、风险判断和交付文档组织为一条可追溯链路，帮助团队在设计、开发与上线阶段开展结构化合规审查。项目当前用于研究与演示，不替代律师意见或监管判断。

## 核心流程

`产品事实录入 -> 规则匹配 -> 风险分析 -> 文档草案 -> 人工复核`

## 当前能力

- 结构化采集 AI 产品的数据、模型、用户与部署信息
- 基于内置规则库生成风险项与审查依据
- 展示合规日历、审查记录和文档草案
- 可选接入大模型与数据库；默认可在本地演示模式运行

## 快速开始

```bash
npm ci
cp .env.example .env.local
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。默认功能开关均为关闭状态，不需要外部 API 或数据库即可查看原型。

## 研究说明

- [系统架构](../architecture.md)
- [可审计合规方法](../methodology.md)

## 项目边界

本仓库验证的是法律知识工程与 AI 辅助分析的组合方式。规则匹配结果、模型生成内容和文档草案均应由具备相应法域经验的专业人员复核。

## 项目管理

[项目章程](../PROJECT.md) · [协作规则](../../AGENTS.md) · [工作流](../WORKFLOW.md) · [基线](../governance/BASELINE.md) · [验收](../governance/QUALITY.md) · [资产](../governance/ASSETS.md) · [交接](../governance/HANDOVER.md)

当前任务状态与阻塞统一维护在[私有管理看板](https://github.com/users/2432antony-13/projects/1)；各仓 Issue 保存问题、验收与证据。
