# 06 · Plan de implementación

Cada fase termina con criterios de aceptación verificables. Orden pensado para no gastar minutos de voz hasta que todo lo demás funciona.

## Fase 0 · Repo y preparación (15 min)
- [ ] Repo público `voice-agent` con este contenido (subido desde la web de GitHub).
- [ ] Hoja "Fluxa demo" con pestañas `Demos` y `Leads` (cabeceras de `05-data-schema.md`).
**Aceptación:** repo visible; hoja creada.

## Fase 1 · Backend n8n (20 min)
- [ ] Importar `n8n/fluxa-tools.json` y `n8n/fluxa-post-call.json`; credenciales; ID de hoja; chat de Telegram; `SECRET` (opcional).
- [ ] Importar y publicar `n8n/fluxa-error-alert.json`; asignarlo como Error workflow en Tools y Post-call.
- [ ] Publicar los dos workflows.
- [ ] Importar `n8n/fluxa-selftest.json`, poner la URL base de webhooks en su nodo **Config** y ejecutarlo:
  - Test Availability → huecos.
  - Test Book → fila en `Demos` + Telegram.
  - Test Post-call → fila en `Leads` + Telegram (con el contador de minutos).
- [ ] Borrar las filas de prueba de la hoja.
**Aceptación:** el nodo **Report** muestra los tres OK sin tocar ElevenLabs.

## Fase 2 · Agente en ElevenLabs (25 min)
- [ ] Crear agente con `agent/system-prompt.md`, idioma EN + ES, duración 240 s.
- [ ] Subir `agent/knowledge-base.md`.
- [ ] Herramientas `get_availability` y `book_demo` (`agent/tools-and-analysis.md`).
- [ ] Data collection + evaluation criteria + post-call webhook.
- [ ] Probar en el panel de ElevenLabs (texto primero, voz después).
**Aceptación:** guiones 1, 3 y 4 de `docs/test-scenarios.md` superados.

## Fase 3 · Web y vídeo (30 min)
- [ ] Pegar el código del widget en `web/index.html`; publicar en `ferjalva.github.io/fluxa/`.
- [ ] Grabar una llamada de 60–90 s (pantalla + audio) y enlazarla en la página y el README.
**Aceptación:** demo accesible desde móvil y escritorio; vídeo visible.

## Fase 4 · Brief para el AE (v0.4, 30 min)
- [ ] En el post-call: generar con LLM un brief (contexto, dolor, encaje, objeciones, 3 preguntas) si `demo_booked = true`; enviarlo por Telegram (y email opcional).
**Aceptación:** tras una reserva llega el brief con los 5 apartados.

## Fase 5 · Panel de embudo y calidad (v0.5, 45 min)
- [ ] Workflow n8n que agrega `Leads` y publica un JSON (webhook GET); página `web/dashboard.html` que lo pinta.
- [ ] Añadir resultados de los *evaluation criteria* a `Leads`.
**Aceptación:** KPIs y embudo correctos con datos de prueba.

## Fase 6 · Pulido de portfolio
- [ ] README con arquitectura, vídeo, métricas de las pruebas y aprendizajes.
- [ ] Tarjeta en la página de portfolio y en LinkedIn (Destacado).

## Plan de pruebas (resumen)
- Offline: `tests/run_tests.js` (herramientas y post-call).
- Conversación: 9 guiones de `docs/test-scenarios.md`, registrando aprobado/fallo y ajustes del prompt.
- Regresión: repetir los guiones 1–4 tras cada cambio de prompt.
