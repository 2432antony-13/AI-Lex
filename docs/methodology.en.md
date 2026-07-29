<p align="right"><a href="./methodology.md">简体中文</a> | <strong>English</strong></p>

# Auditable Compliance Methodology

AI-Lex does not treat a language model's plausible prediction as an established legal fact. Facts, authorities, reasoning, and conclusions are managed separately.

## Four object types

| Object | Content | Control |
| --- | --- | --- |
| Facts | User-confirmed information or verifiable material | Record source, time, and missing fields |
| Rules | Law, regulatory material, and internal policy | Record jurisdiction, version, and applicability |
| Reasoning | Matching between facts and rules | Support review, challenge, and status changes |
| Outputs | Findings, recommendations, and drafts | State authority, limitations, and accountable reviewer |

## Core controls

1. **No silent fact completion**: insufficient information remains unknown until clarified or supported.
2. **Linked authority**: each finding should trace back to source facts and candidate rules.
3. **Model output is subordinate**: generated text remains a suggestion or draft and cannot overwrite confirmed facts.
4. **Jurisdiction isolation**: rules are maintained separately; cross-jurisdiction analysis must be explicit.
5. **Human in the loop**: high-risk findings, rule updates, and external deliverables require human confirmation.

## Relationship to MoE research

Future work may map jurisdictions, tasks, or evidence types to specialist expert modules, with a routing layer selecting which experts participate. MoE is a model capability layer, not a legal accountability mechanism. Whether the underlying model is dense or sparse, a fact ledger, source traceability, rule versioning, and human review remain the basis of auditability.
