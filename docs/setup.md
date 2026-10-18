# Puesta en marcha (≈ 45–60 min)

Todo con tu cuenta **personal** y datos ficticios. Nada del empleador actual.

## 1. Google Sheets
Crea una hoja "Fluxa demo" con dos pestañas y estas cabeceras en la fila 1:
- **Demos:** `id, slot_iso, when_madrid, name, email, company, role, team_size, use_case, language, created_at`
- **Leads:** `conversation_id, date, duration_s, language, name, company, role, team_size, use_case, timeline, demo_booked, score, tier, summary, turns, month_minutes`

## 2. n8n
1. Importa `n8n/fluxa-tools.json` y `n8n/fluxa-post-call.json`.
2. En los nodos de Google Sheets: credencial "Google Sheets account" y reemplaza `REPLACE_WITH_FLUXA_SHEET_ID` por el ID de la hoja.
3. En los nodos de Telegram: credencial (puede ser la de HR Advisor) y reemplaza `REPLACE_WITH_TELEGRAM_CHAT_ID`.
4. (Opcional, recomendado) En los nodos **Availability** y **Book**, cambia `SECRET` por una clave tuya; la usarás como cabecera `x-demo-key` en ElevenLabs.
5. Settings → zona horaria **Europe/Madrid**. **Publica** los dos workflows.
6. Copia las URLs de producción de los webhooks (`…/webhook/fluxa-availability`, `…/webhook/fluxa-book`, `…/webhook/fluxa-post-call`).
7. **Autoprueba:** importa `n8n/fluxa-selftest.json`, pon tu URL base (`https://<tu-dominio-n8n>/webhook`) en el nodo **Config** y pulsa *Execute workflow*. El nodo **Report** debe mostrar tres OK. Después borra las filas de prueba de la hoja.

## 3. ElevenLabs (cuenta personal, plan gratuito)
1. Agents → **Create agent** (en blanco). Nombre: "Nora · Fluxa".
2. **First message** y **System prompt**: copia de `agent/system-prompt.md`. Ajustes de voz, idioma (inglés + español) y duración máxima (240 s) según ese archivo.
3. **Knowledge base**: sube `agent/knowledge-base.md`.
4. **Tools**: crea `get_availability` y `book_demo` como herramientas webhook siguiendo `agent/tools-and-analysis.md` (URL, método POST, parámetros y cabecera opcional).
5. **Analysis**: crea los campos de *data collection* y los *evaluation criteria* del mismo archivo.
6. **Post-call webhook**: apunta a `…/webhook/fluxa-post-call`.
7. Prueba en el propio panel de ElevenLabs con los guiones de `docs/test-scenarios.md`.

## 4. Página de demo
1. En el agente, pestaña **Widget**: copia el código de inserción.
2. En `web/index.html`, reemplaza las dos últimas líneas (el widget) por ese código.
3. Publica la página en tu GitHub Pages: copia `web/index.html` a tu repo `ferjalva.github.io` como `fluxa/index.html` → quedará en `https://ferjalva.github.io/fluxa/`.
4. En ElevenLabs, si existe la opción de dominios permitidos para el widget, limita a `ferjalva.github.io`.

## 5. Proteger los minutos gratuitos
- Duración máxima de 240 s y fin por silencio corto.
- En el portfolio, pon también un **vídeo** de una llamada (60–90 s) para que no todo el mundo tenga que llamar.
