# COSTS.md — Costes del proyecto (mantener siempre actualizado)

Última revisión: 2026-10-18. **Regla:** cualquier cambio que añada un servicio, un plan o un consumo nuevo actualiza esta tabla en el mismo commit.

## Costes actuales
| Servicio | Plan | Coste/mes | Límite y control | Dónde se mira |
|---|---|---|---|---|
| ElevenLabs Agents | Free | 0 € | 15 min de voz/mes; en el plan gratuito **no se pueden comprar minutos extra** (al agotarse, la demo deja de responder hasta el mes siguiente). Llamadas de prueba a mitad de coste; silencios > 10 s con 95 % de descuento. Duración máxima por llamada: 240 s. | ElevenLabs → uso de la cuenta. Telegram muestra los minutos usados tras cada llamada. |
| LLM del agente | Incluido (se descuenta de los créditos de ElevenLabs) | 0 € | Modelos rápidos cuestan céntimos por minuto | ElevenLabs → agente → Primary LLM → Detailed costs |
| n8n | VPS propio (compartido con otros proyectos) | **[completar: X €/mes]** | — | Proveedor del VPS |
| Google Sheets | Gratis | 0 € | — | — |
| Telegram | Gratis | 0 € | — | — |
| GitHub + GitHub Pages | Gratis | 0 € | Repo público | — |
| **Total nuevo de este proyecto** | | **0 €** | | |

## Costes si se amplía
| Cambio | Coste orientativo | Cuándo tiene sentido |
|---|---|---|
| ElevenLabs Starter | ~5–6 $/mes (50–75 min) | Si la demo recibe muchas visitas o para grabar varias pruebas |
| Minutos extra (planes de pago) | ~0,08 $/min + LLM | Uso real con clientes |
| Número de teléfono (telefonía) | Coste del operador por número y minuto | Solo si se pasa de widget web a teléfono |
| Dominio propio | ~10–15 €/año | Si se quiere una URL de marca |
| Licencia comercial | Requiere plan de pago de ElevenLabs | Antes de usarlo con clientes reales |

## Revisión mensual (5 minutos)
1. ElevenLabs: minutos usados del mes.
2. VPS: factura.
3. Actualizar "Última revisión" y la tabla si algo cambió.
