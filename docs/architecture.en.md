<p align="right"><a href="./architecture.md">简体中文</a> | <strong>English</strong></p>

# System Architecture

AI-Lex follows a layered design: deterministic rules first, generative models as assistance, and humans as final reviewers.

## Processing chain

1. **Fact layer** records product functionality, data processing, model provenance, users, and deployment regions as structured fields.
2. **Rule layer** retrieves candidate obligations, applicability conditions, and review materials from fact tags.
3. **Analysis layer** creates risk findings while preserving links among inputs, authorities, and review status.
4. **Generation layer** assists with explanations and drafting when a model is enabled. It does not establish legal facts or make final determinations.
5. **Review layer** requires a professional to verify factual completeness, source currency, jurisdiction, and conclusions.

## Code layout

- `src/app`: pages and server endpoints
- `src/components`: interactive components
- `src/lib`: rule library, compliance analysis, model, and data access
- `prisma`: optional persistence model

## Runtime modes

Authentication, persistence, and model calls are disabled in the default demo mode. External capabilities can be enabled individually through `.env.local`; secrets are not committed.

## Current limitations

Embedded rules and sample data support product research. They are not a complete or continuously updated legal database. Production use requires rule versioning, source validation, access control, audit logs, and qualified professional review.
