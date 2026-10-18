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
| summary | string | resumen de ElevenLabs |
| turns | number | mensajes en la transcripción |
| month_minutes | number | minutos de voz acumulados en el mes (control del plan gratuito) |

**Relación:** `Leads.email` (v0.4, si se recoge) ↔ `Demos.email`; `Leads.conversation_id` ↔ transcripción en ElevenLabs.

## Reglas de lead score (BANT-lite)
- Tamaño de equipo: ≥ 20 → +25; ≥ 5 → +15
- Rol con capacidad de decisión (director, head, VP, manager, founder…) → +25
- Plazo este mes/trimestre o próximo → +25
- Caso de uso descrito (> 15 caracteres) → +15
- Demo reservada → +10

## Si se productiza (v2)
Supabase/Postgres: `accounts`, `agents`, `calls`, `leads`, `bookings`, `evaluations` con `account_id` en todas las tablas y autenticación por cuenta.
