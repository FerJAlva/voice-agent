# 05 · Esquema de datos

Almacenamiento: Google Sheets "Fluxa demo". Sin autenticación de usuarios (demo pública); la escritura solo ocurre desde n8n con la credencial de Google del propietario.

## Pestaña `Demos` (1 fila por reserva)
| columna | tipo | ejemplo | notas |
|---|---|---|---|
| id | string | demo_m2x8k1 | único |
| slot_iso | ISO 8601 UTC | 2026-10-20T08:00:00.000Z | clave para evitar duplicados |
| when_madrid | string | martes, 20 de octubre, 10:00 | legible |
| name | string | Ana López | |
| email | string | ana@acme.io | validado |
| company | string | Acme | |
| role | string | Head of Operations | opcional |
| team_size | string | 40 | opcional |
| use_case | string | automatizar reporting semanal | opcional |
| language | es/en | es | |
| created_at | ISO | | |

## Pestaña `Leads` (1 fila por llamada)
| columna | tipo | notas |
|---|---|---|
| conversation_id | string | de ElevenLabs; relaciona con la transcripción |
| date | ISO | |
| duration_s | number | |
| language | es/en | |
| name, company, role, team_size, use_case, timeline | string | de *data collection* |
| demo_booked | true/false | |
| score | 0–100 | BANT-lite |
| tier | Caliente/Templado/Frío | ≥70 / ≥40 / <40 |
| score_reasons | string | motivo de cada punto, p. ej. "cargo con decisión: Head of Ops (+25) · equipo pequeño: 3 (0)" |
| summary | string | resumen de ElevenLabs |
| turns | number | mensajes en la transcripción |
| month_minutes | number | minutos de voz acumulados en el mes (control del plan gratuito) |

**Relación:** `Leads.email` (v0.4, si se recoge) ↔ `Demos.email`; `Leads.conversation_id` ↔ transcripción en ElevenLabs.

## Reglas de lead score (BANT-lite)
Configurables en el objeto `SCORING` del nodo **Post-call** (`src/post_call.js`). Cada regla deja su motivo en `score_reasons` y en el aviso de Telegram.
- Tamaño de equipo: ≥ 20 → +25; ≥ 5 → +15
- Cargo con decisión (CEO, founder, dueño/a, socio, VP, director/a, head, manager, gerente, responsable, jefe/a…) → +25
- Plazo cercano: esta/próxima semana, mes o trimestre, "cuanto antes", "en 2 meses", o un mes nombrado a 3 meses o menos → +25
- Caso de uso claro (4 palabras o más) → +15
- Demo reservada → +10
- Opcional: campo `icp_fit` de ElevenLabs (high/medium) → +10 / +5
- Máximo 100. Caliente ≥ 70, Templado ≥ 40.

## Si se productiza (v2)
Supabase/Postgres: `accounts`, `agents`, `calls`, `leads`, `bookings`, `evaluations` con `account_id` en todas las tablas y autenticación por cuenta.
