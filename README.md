# Nora · AI voice agent for B2B lead qualification

Portfolio project by [Fernando Alvarez](https://www.linkedin.com/in/ferjalvarez). **Fluxa is a fictional company.**

Nora answers website visitors by voice, in Spanish or English, understands their needs, qualifies them and books a 30-minute demo in real time. After the call, the lead is scored and saved, and the sales team gets a Telegram alert.

**Try it:** `https://ferjalva.github.io/fluxa/` (short calls, limited monthly minutes) · **Video:** _coming soon_

## How it works
```
Visitor ──voice──► ElevenLabs agent (STT · LLM · TTS · knowledge base)
                      │ tools (webhooks)
                      ├─► n8n /fluxa-availability → free slots (Mon–Fri 10–17 Madrid, minus booked)
                      └─► n8n /fluxa-book        → validates & saves the booking (Google Sheets) → Telegram
                   post-call webhook
                      └─► n8n /fluxa-post-call   → summary + collected data → lead score (BANT-lite) → Sheets + Telegram
```

## What it shows
- Conversation design for sales: one question per turn, qualification before pitching, guardrails against hallucinations.
- Real-time tool use from a voice agent (availability and booking) with validation and error handling.
- Post-call analytics: structured data extraction, lead scoring and instant hand-off to sales.
- Bilingual (ES/EN) with language detection.

## Stack
ElevenLabs Agents · n8n · Google Sheets · Telegram · plain HTML (GitHub Pages)

## Product docs
[PRD](docs/specs/01-prd.md) · [TRD](docs/specs/02-trd.md) · [Flows](docs/specs/03-flows.md) · [Design brief](docs/specs/04-design-brief.md) · [Data schema](docs/specs/05-data-schema.md) · [Implementation plan](docs/specs/06-implementation-plan.md) · [Market research](docs/market-research.md) · [Client delivery](docs/client-delivery.md)

## Costs
Runs at **0 €/month** on free tiers. See [COSTS.md](COSTS.md).

## Repo
`agent/` agent configuration · `src/` n8n code nodes · `n8n/` importable workflows · `web/` demo page · `docs/` setup and test scenarios · `tests/` offline tests.
