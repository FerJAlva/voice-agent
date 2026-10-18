# 02 · TRD — Requisitos técnicos

## Stack y decisiones
| Capa | Elección | Por qué | Alternativas descartadas |
|---|---|---|---|
| Voz + conversación | **ElevenLabs Agents** (widget web) | Mejor voz multilingüe, widget listo, herramientas webhook, análisis post-llamada, plan gratuito | Vapi/Retell (más control, más configuración, coste por minuto), Pipecat/LiveKit (requiere servidor de voz propio) |
| LLM | El rápido que ofrezca ElevenLabs | En voz manda la latencia | Modelo grande: más lento |
| Orquestación | **n8n** (VPS propio) | Ya en uso; webhooks y Sheets sin código extra | Servidor Node propio |
| Datos | **Google Sheets** (pestañas Demos, Leads) | Gratis, visible, suficiente para demo | Supabase (v2 si se productiza) |
| Avisos | **Telegram** | Ya en uso | Slack/email (opcional) |
| Web | HTML estático en **GitHub Pages** | Gratis, ya existe `ferjalva.github.io` | Framework (innecesario) |
| Panel (v0.5) | Página estática que lee un JSON publicado por n8n | Sin backend nuevo | Looker Studio |

## Integraciones (contratos)
- `POST /webhook/fluxa-availability` → `{ preferred_day?, language }` ⇒ `{ ok, timezone, slots:[{slot_iso,label}], note }`
- `POST /webhook/fluxa-book` → `{ name, email, company, role?, team_size?, use_case?, slot_iso, language }` ⇒ `{ ok, say, error }`
- `POST /webhook/fluxa-post-call` ← payload post-llamada de ElevenLabs (transcripción, `analysis.transcript_summary`, `analysis.data_collection_results`).
- Seguridad: cabecera opcional `x-demo-key` en las herramientas; validación de entrada en n8n; sin datos sensibles.

## Requisitos no funcionales
- Respuesta de las herramientas < 1,5 s (lecturas pequeñas de Sheets).
- Idempotencia en reservas: no permitir dos reservas en el mismo hueco.
- Zona horaria Europe/Madrid; horarios lunes–viernes 10–17, huecos de 30 min, 2 h de antelación mínima.
- Límite de coste: duración máxima 240 s, fin por silencio.
- Repo público sin secretos (placeholders).

## Riesgos
| Riesgo | Mitigación |
|---|---|
| Se agotan los minutos gratis | Vídeo en el portfolio, llamadas cortas, pruebas planificadas; plan Starter solo si hace falta |
| Payload post-llamada distinto al esperado | Parser defensivo + prueba con una llamada real y ajuste |
| Abuso del widget | Duración máxima, dominios permitidos si la plataforma lo permite |
| Alucinaciones | Guardrails en el prompt + criterio de evaluación `no_hallucination` |
