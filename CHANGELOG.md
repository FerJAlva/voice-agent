# Changelog

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
