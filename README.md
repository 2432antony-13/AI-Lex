<p><img src="docs/assets/tony.gif" width="112" height="112" alt="Tony 24 · AI-Lex"></p>

**简体中文** · [繁體中文](docs/i18n/README.zh-TW.md) · [English](docs/i18n/README.en.md)

# AI-Lex

**从产品事实，到有依据的合规审查。**

面向 AI 产品团队的可审计合规工作流原型：录入事实、匹配规则、分析风险、生成草案，再由人复核。

[任务](https://github.com/2432antony-13/AI-Lex/issues) · [文档](docs/README.md)

## 当前状态

研究与演示阶段。默认关闭外部模型、认证和持久化；构建通过不等于规则正确性或法律验收。

## 快速开始

Node.js 20；环境配置见 .env.example。不要将数据库迁移当作日常检查。

```bash
npm ci
# Copy .env.example to .env.local
npm run dev
# http://localhost:3000
npm run build
```

## 能力与范围

结构化产品事实；规则与风险依据；合规日历；审查记录与文档草案。

部署区域缺失必须保留为未知。法律来源、适用条件和生成内容需要独立复核。

[源码](src/) · [文档](docs/README.md)

仓库首页与产品界面提供 **简体中文 / 繁體中文 / English**。采用 Q 版 **Tony 24** 标识，GitHub 显示 GIF，产品使用 SVG/CSS 动画。

[语言覆盖与原文边界](docs/LOCALIZATION.md)
