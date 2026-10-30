<p>
  <img align="right" src="../assets/tony.gif" width="12%" alt="Tony 24 · AI-Lex" />
  <img src="../assets/hero.png" width="85%" alt="AI-Lex · A clear review path from product facts to regulatory references and practical changes." />
</p>

<br clear="all" />

[简体中文](../../README.md) · [繁體中文](README.zh-TW.md) · **English**

# AI-Lex

**A clear review path from product facts to regulatory references and practical changes.**

AI-Lex is a compliance workflow prototype for AI product teams. Starting with a product description and guided questions, it brings product capabilities, data practices, rule matching, findings and document drafts into one workspace. Product managers, developers and reviewers can use the same facts to discuss launch readiness. The current focus is research and demonstrations of Chinese regulatory scenarios, with traceable rules and human review.

## Who it is for

- Product managers who need to organise product facts and unresolved questions during planning.
- Developers and technical leads who need to relate models, data and deployment choices to review tasks.
- Compliance and legal reviewers who need to check references, applicability and proposed changes.

## 7 core capabilities

### 1. Guided risk screening

Answer 10 questions about the product, AI, personal information, user content and cross-border scenarios, followed by questions triggered by the answers. Receive a preliminary brief across policy, industry, product and data risks, with issues to investigate next.

**Status：** Runnable rule-based prototype; preliminary screening only.

### 2. Structured compliance review

Describe the industry, technical approach, audience, data practices and deployment region to see matching rules, triggers and risk levels. Turn product facts into review items, proposed remediation and draft filing assessments.

**Status：** Implemented; missing deployment regions remain unknown.

### 3. Analysis from a product description

Describe a requirement in plain language. A decomposition, matching and gap-analysis pipeline structures the report; an optional model-assisted route uses a server-side key. Inspect relevant activities, obligations and gaps, and trace findings to the description and matched rules.

**Status：** Rule pipeline available; external models require configuration.

### 4. Regulatory references and search API

The analysis page displays matched regulations, articles and reference relationships. Developers can query the bundled regulations and articles by keyword, category or severity through the search API. Navigate from a finding to its supporting reference for a reviewer to check wording, applicability and version.

**Status：** Reference displays and the search API are implemented; there is no dedicated regulatory search page. Source data needs ongoing verification.

### 5. Document drafts and mock filing materials

Fill templates for user terms, a privacy policy and an AI service disclosure with product information; generate mock filing materials through a separate entry point. Obtain editable starting drafts and a preparation checklist, with unresolved fields left for a person to complete.

**Status：** Template generation works; mock materials are not a formal submission.

### 6. Example product workspaces

Switch among three preset examples covering AI marketing, content generation and companionship to explore the same workflow in different contexts. Learn how the pages connect and identify the additional facts needed for your own product.

**Status：** Demonstration workspaces, not multi-tenant collaboration.

### 7. Calendar and history previews

The calendar illustrates tasks, filing dates and regulatory events. History shows example screening, review and document records for each preset workspace. Preview how ongoing work and review outputs could be organised and revisited.

**Status：** Preset demonstration data; not live reminders or an audit log.

## From start to outcome

1. Choose an example or describe your own product, including its audience, data practices and deployment context.
2. Complete screening or a structured review. Resolve missing facts before deciding whether a rule applies.
3. Inspect findings and references, then list the product changes and materials that require attention.
4. Generate drafts and have the relevant reviewers verify, revise and approve them before use.

## Current status

- Research and demonstration stage: screening, rule review, analysis reports and template generation have working implementations.
- Workspaces, calendar and history are examples. Authentication, persistence and external models are disabled in the example configuration.
- The interface supports Simplified Chinese, Traditional Chinese and English and remembers the selected language. Source material and existing generated documents retain their original language.

## Quick start

Node.js 20. Copy .env.example to .env.local and initially keep the example feature flags false. Without a configured model, select “Rule engine” on the requirement analysis page. Model-assisted analysis requires a server-side key and FEATURE_LLM=true. Database migration is not a normal startup step.

```bash
npm ci
# Copy .env.example to .env.local
npm run dev
# http://localhost:3000
npm test
npm run build
```

## Scope and limits

- A rule match does not demonstrate compliance, and a risk score is not a legal conclusion. Check jurisdiction, current sources and actual product facts.
- Bundled record counts, demonstration timings and generated output are not coverage, accuracy or efficiency guarantees.
- Verified team permissions, a durable audit trail and formal regulatory submission workflows are not established by the current prototype.

## Documentation and project management

[Product and developer docs](../README.md) · [Language coverage](../LOCALIZATION.md) · [Project tasks](https://github.com/2432antony-13/AI-Lex/issues) · [Checks](https://github.com/2432antony-13/AI-Lex/actions) · [Source](../../src/)
