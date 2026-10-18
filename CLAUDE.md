# CLAUDE.md — Fluxa voice agent (portfolio)

## ⚠️ REGLA DE ORO
Nada del empleador actual del usuario: ni datos, ni credenciales, ni código, ni documentación, ni su nombre. Todo con datos públicos o ficticios. Fluxa es una empresa ficticia.

## Qué es
Agente de voz de demostración ("Nora") para una SaaS B2B ficticia (Fluxa): cualifica leads en español e inglés y agenda demos de 30 min. Se prueba desde un widget web en el portfolio del usuario (`ferjalva.github.io/fluxa/`). Comunicación con el usuario en **español**, directa.

## Documentos de especificación (leer antes de construir)
`docs/specs/01-prd.md` (qué y por qué) · `02-trd.md` (stack y contratos) · `03-flows.md` (conversación y sistema) · `04-design-brief.md` · `05-data-schema.md` · `06-implementation-plan.md` (fases con criterios de aceptación: **seguir este orden**). Contexto de mercado: `docs/market-research.md`. Entrega a clientes (servicio gestionado vs. sin mantenimiento, y mapa de qué cambiar y dónde): `docs/client-delivery.md`.
Posicionamiento: no es "un bot que agenda" sino un **AI SDR de inbound con analítica de ventas** (brief para el AE + panel de embudo + suite de pruebas).

## Arquitectura
- **ElevenLabs Agents** (cuenta personal, plan gratuito: ~15 min/mes): voz, LLM, base de conocimiento, herramientas webhook, análisis post-llamada.
- **n8n** (VPS del usuario): `n8n/fluxa-tools.json` (webhooks `fluxa-availability`, `fluxa-book`) y `n8n/fluxa-post-call.json` (webhook `fluxa-post-call`).
- **Google Sheets** "Fluxa demo": pestañas `Demos` y `Leads`.
- **Telegram**: bot propio del proyecto (@fluxa_alerts_syst_bot, credencial "Fluxa bot") para reservas, leads y errores.
- **Errores**: `n8n/fluxa-error-alert.json` como Error workflow de Tools y Post-call.
- **Web**: `web/index.html` (landing ficticia + widget).

## Archivos
- `agent/` — prompt, base de conocimiento, herramientas y análisis (se copian a mano en ElevenLabs).
- `src/*.js` — código de los nodos Code (fuente de verdad). `scripts/build_workflows.py` regenera `n8n/*.json`.
- `tests/run_tests.js` — pruebas sin credenciales (`node tests/run_tests.js`).
- `docs/setup.md`, `docs/test-scenarios.md`.

## Forma de trabajo
- **GitHub es la fuente de verdad.** El usuario no trabaja en local: sube archivos por la web de GitHub, importa en n8n y configura ElevenLabs desde su panel. Cualquier cambio debe dejar el repo coherente (código, `n8n/*.json` regenerados, docs y CHANGELOG).
- El backend se prueba desde n8n con `n8n/fluxa-selftest.json` (sin curl ni herramientas locales).

## Reglas
1. Nunca secretos en el repo (este repo será **público**): IDs de hoja, chat de Telegram, claves y agent ID van como placeholders.
2. Antes de entregar: `node tests/run_tests.js` y regenerar `n8n/*.json`.
3. Minutos de ElevenLabs limitados: llamadas cortas, pruebas planificadas.
4. **Costes:** todo cambio que añada un servicio, plan o consumo actualiza `COSTS.md` en el mismo commit.

## Siguientes pasos
Ver `docs/specs/06-implementation-plan.md`. Extras fuera del plan: confirmación por email al lead, evento real en Google Calendar, verificación de firma del post-call webhook.
