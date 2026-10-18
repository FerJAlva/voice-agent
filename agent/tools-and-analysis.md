# Tools, data collection and evaluation (ElevenLabs agent)

Base URL = your n8n production webhook URL, e.g. `https://<your-n8n-domain>/webhook`.

## Tool 1 · `get_availability` (Webhook, POST)
- **Description:** Returns the next free 30-minute demo slots (Mon–Fri, 10:00–17:00 Madrid). Call it before offering times. Read only the `label` of at most two slots to the caller.
- **URL:** `{BASE}/fluxa-availability`
- **Body parameters:**
  | name | type | required | description |
  |---|---|---|---|
  | `preferred_day` | string | no | Day the caller prefers: a weekday name in English or Spanish ("tuesday", "martes") or a date `YYYY-MM-DD`. Empty if none. |
  | `language` | string | yes | Conversation language: `es` or `en`. |
- **Optional header:** `x-demo-key` = the same secret you set in the n8n code nodes (`SECRET`).

## Tool 2 · `book_demo` (Webhook, POST)
- **Description:** Books the demo in the chosen slot. Call it only after the caller confirmed the slot and you have name, work email and company. Then read the `say` field of the response.
- **URL:** `{BASE}/fluxa-book`
- **Body parameters:**
  | name | type | required | description |
  |---|---|---|---|
  | `name` | string | yes | Caller full name. |
  | `email` | string | yes | Work email, confirmed by spelling it back. |
  | `company` | string | yes | Company name. |
  | `role` | string | no | Caller role. |
  | `team_size` | string | no | People who would use Fluxa. |
  | `use_case` | string | no | Main problem to solve, in a short sentence. |
  | `slot_iso` | string | yes | Exact `slot_iso` value of the chosen slot from `get_availability`. |
  | `language` | string | yes | `es` or `en`. |

## Data collection (Analysis → Data collection)
| identifier | type | description |
|---|---|---|
| `name` | string | Caller full name, if given. |
| `company` | string | Caller company. |
| `role` | string | Caller role or title. |
| `team_size` | string | Number of people who would use the product. |
| `use_case` | string | Main problem or workflow they want to automate, one sentence. |
| `timeline` | string | When they want a solution, as said by the caller. |
| `demo_booked` | boolean | True if `book_demo` succeeded. |
| `language` | string | `es` or `en`. |

## Evaluation criteria (Analysis → Evaluation)
- `qualified_correctly`: The agent asked about team size, use case and timeline before offering a demo.
- `one_question_at_a_time`: The agent asked one question per turn.
- `no_hallucination`: The agent did not state prices, features or integrations outside the knowledge base.

## Post-call webhook
Agent / workspace settings → **Post-call webhook** → `{BASE}/fluxa-post-call` (transcription event). The n8n workflow scores the lead, saves it in the **Leads** tab and sends a Telegram notification.
