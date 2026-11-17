# Changelog

## v0.8 — 2026-11-17
- **Versión todo en uno** (`n8n/fluxa-all-in-one.json`): todo el backend en un solo workflow, para vender o compartir. Se importa en un paso: no hay IDs de sub-workflows que rellenar porque se llama a sí mismo. La genera `scripts/build_all_in_one.py` a partir de los workflows modulares, así que ambas versiones salen del mismo código. Probada en n8n: disponibilidad, reserva con Google Calendar y Meet, email, Telegram y Leads.
- **Guía de instalación y uso para clientes:** `docs/instalacion.md` (requisitos, hoja, Telegram, credenciales, Config, Google Calendar, ElevenLabs, autoprueba, uso diario y problemas frecuentes).
- **Diagramas del flujo:** `docs/arquitectura.md` (vista general, una llamada paso a paso y el interior de n8n, en Mermaid).
- Aviso de errores de la versión todo en uno probado en n8n: el Error Trigger del propio workflow salta solo, sin configurar nada, y lee el chat de Telegram de Config. Si falla un conector, llega un único aviso en vez de dos.
- 6 pruebas nuevas sobre la versión todo en uno (46 en total).

## v0.7.1 — 2026-11-16
- **Google Calendar activado en producción** (credencial "Google Calendar account"): disponibilidad desde el calendario real y reserva con evento, invitación y enlace de Meet en el email.
- `agenda.calendar_id` debe ser el email del calendario: n8n rechaza `primary`. Placeholder nuevo `REPLACE_WITH_CALENDAR_EMAIL`.
- Si Google Calendar devuelve un error al leer el calendario, el flujo falla con un aviso claro en vez de ofrecer todos los huecos como libres.

## v0.7 — 2026-11-15
- **Conectores intercambiables.** Tools y Post-call ya no llevan herramientas dentro: leen el sub-workflow **Config** (`src/config.js`: marca, horario, puntuación, clave `x-demo-key`, IDs y qué herramienta hace cada función) y llaman a 4 sub-workflows con entrada y salida fijas: **Agenda** (huecos ocupados + crear reunión), **Store** (guardar), **Notify** (avisar) y **Email**. Cambiar de herramienta = cambiar Config o añadir una salida en el conector, sin tocar el resto.
- **Conector Google Calendar con Google Meet** en Agenda: disponibilidad desde el calendario real (cualquier evento bloquea, no solo coincidencias exactas), evento con el lead invitado y enlace de Meet, botón "Unirse a la videollamada" en el email y enlace en el aviso. Viene desactivado hasta conectar la credencial; si está apagado y se elige, falla con un aviso claro en vez de ofrecer todos los huecos.
- Horario configurable (días, horas, duración, antelación, horizonte, nº de huecos) y comprobación de solapes por intervalo.
- Demos: columnas nuevas `meet_url` y `event_id`. Textos del email y del aviso sin "Nora", "Fluxa" ni "Madrid" fijos: salen de Config.
- 16 pruebas nuevas (39 en total). Autoprueba en producción 3/3 OK y reserva real con email y aviso.

## v0.6 — 2026-11-15
- **Puntuación explicada y configurable:** objeto `SCORING` en el nodo Post-call; cada punto deja su motivo en la columna nueva `score_reasons` de Leads y en Telegram ("Por qué: …"). Detecta más cargos (dueño/a, VP, gerente…) y plazos ("en enero" si está a 3 meses o menos). Campo opcional `icp_fit`.
- Docs de venta: `docs/producto.md` (página para clientes), `docs/vender.md` (dónde publicar, paquetes, precios, mantenimiento) y `docs/adaptar-a-clientes.md` (cuestionario de descubrimiento y conectores).

## v0.5 — 2026-11-15
- **Email de confirmación al lead** (`src/confirm_email.js` + nodo Gmail): diseño Fluxa en ES/EN, fecha y hora, botones "Añadir a Google Calendar" y "Outlook / otro calendario". Se envía después de responder a Nora (no retrasa la llamada); no se envía si la reserva falla o el email es de prueba; si Gmail falla, aviso por Telegram.
- Post-call: lee el formato actual de ElevenLabs (resultados por `aitem_…` con el identificador en `name`, sin distinguir mayúsculas). Antes la fila de Leads llegaba vacía.
- Contador de minutos: los chats de texto ya no suman (no gastan minutos de voz).
- Prompt: Nora pide nombre, email y empresa de uno en uno; ya no promete una guía por email que no existe.
- Notas por etapas (sticky notes) en los 4 workflows de n8n para entenderlos sin abrir nodos.
- Autoprueba con el formato nuevo del post-call. Quitado un chat ID real de un texto de ayuda.
- Email: enlaces de calendario sin `URLSearchParams` (no existe en el sandbox de Code de n8n); la prueba lo simula.
- Webhooks protegidos con `x-demo-key` (secreto en ElevenLabs y n8n).
- `docs/review-2026-11.md`: revisión del proyecto y recomendaciones para convertirlo en plantilla vendible.

## v0.4 — 2026-10-18
- Las autopruebas no suman minutos al contador mensual y se marcan como [AUTOPRUEBA] en Telegram.
- Avisos de error probados en producción (pestaña inexistente → aviso con causa y solución).
- `docs/client-delivery.md`: modelos de entrega (servicio gestionado / sin mantenimiento), mapa de cambios por archivo/nodo/plataforma y separación de canales comercial y de operaciones.
- Reintentos automáticos (3 intentos, 5 s) en Save Demo y Save Lead antes de dar error.
- `n8n/fluxa-error-alert.json`: avisos de error por Telegram (bot de Fluxa) con el nodo que falló, la causa y la posible solución.
- Telegram de Fluxa en un bot propio (separado de otros proyectos).
- Guardar reserva o lead ya no ignora errores: si falla, se detiene y salta el aviso (una reserva perdida nunca es silenciosa). Los avisos de Telegram siguen sin bloquear.

## v0.3 — 2026-10-18
- `COSTS.md`: tabla de costes, límites y revisión mensual (regla: se actualiza en cada cambio).
- Contador de minutos de voz del mes en el aviso de Telegram tras cada llamada (y columna `month_minutes` en Leads).
- `n8n/fluxa-selftest.json`: autoprueba del backend desde n8n, sin herramientas locales.
- CLAUDE.md: forma de trabajo (GitHub como fuente de verdad) y regla de costes.

## v0.2 — 2026-10-18
- Análisis de mercado y especificaciones (PRD, TRD, flujos, diseño, datos, plan de implementación).

## v0.1 — 2026-10-18
- Kit inicial: prompt, base de conocimiento, herramientas, workflows de n8n, página de demo y pruebas.
