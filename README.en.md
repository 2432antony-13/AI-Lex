<p align="right"><a href="./README.md">简体中文</a> | <strong>English</strong></p>

# AI-Lex

An auditable compliance workflow prototype for AI product teams.

AI-Lex organizes product facts, applicable rules, risk findings, and draft deliverables into a traceable review chain. It supports structured compliance work during product design, development, and launch. The project is a research prototype and does not replace legal advice or regulatory decisions.

## Core workflow

`Product facts -> Rule matching -> Risk analysis -> Draft documents -> Human review`

## Current capabilities

- Structured intake for data, model, user, and deployment information
- Risk findings linked to an embedded rule library
- Compliance calendar, review history, and document draft views
- Optional model and database integrations; local demo mode works by default

## Quick start

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All feature flags are disabled by default, so the prototype can be viewed without an external API or database.

## Research notes

- [System architecture](./docs/architecture.en.md)
- [Auditable compliance methodology](./docs/methodology.en.md)

## Scope

This repository explores how legal knowledge engineering can be combined with model-assisted analysis. Rule matches, model outputs, and document drafts require review by professionals with relevant jurisdictional expertise.
