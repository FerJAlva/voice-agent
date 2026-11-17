# Puesta en marcha (≈ 45–60 min)

> Esta es la **versión modular** (un workflow por función). Para instalarlo en un solo paso usa la **versión todo en uno** con la guía [instalacion.md](instalacion.md).

Todo con tu cuenta **personal** y datos ficticios. Nada del empleador actual.

## 1. Google Sheets
Crea una hoja "Fluxa demo" con dos pestañas y estas cabeceras en la fila 1:
- **Demos:** `id, slot_iso, when_madrid, name, email, company, role, team_size, use_case, language, created_at, meet_url, event_id`
- **Leads:** `conversation_id, date, duration_s, language, name, company, role, team_size, use_case, timeline, demo_booked, score, tier, summary, turns, month_minutes, score_reasons`

## 2. n8n
El backend son **2 workflows principales** (Tools y Post-call) que no llevan herramientas dentro, **1 Config** y **4 conectores** intercambiables. Para un cliente nuevo solo se toca Config y, si usa otras herramientas, el conector correspondiente.

| Workflow | Qué hace |
|---|---|
| `fluxa-config.json` · **Config** | Único sitio a editar: marca, horario, puntuación, clave `x-demo-key` y qué herramienta hace cada función |
| `fluxa-agenda.json` · **Agenda** | Huecos ocupados y crear la reunión: `sheets` (por defecto) o `google_calendar` (con Google Meet) |
| `fluxa-store.json` · **Store** | Guarda reservas y leads: `sheets` |
| `fluxa-notify.json` · **Notify** | Avisos al equipo: `telegram` o `none` |
| `fluxa-email.json` · **Email** | Email de confirmación al lead: `gmail` o `none` |
| `fluxa-tools.json` · **Tools** | Webhooks de Nora: disponibilidad y reserva |
| `fluxa-post-call.json` · **Post-call** | Puntúa el lead y lo guarda y avisa tras cada llamada |

1. **Importa primero los 5 sub-workflows** (Config, Agenda, Store, Notify, Email) y luego Tools y Post-call.
2. **Credenciales de los conectores:** Google Sheets en *Read Demos (Sheets)* (Agenda) y *Append (Sheets)* (Store); Telegram "Fluxa bot" en *Send (Telegram)* (Notify); Gmail OAuth2 en *Send (Gmail)* (Email; Credentials → New → Gmail OAuth2 → Sign in with Google con la cuenta que enviará los emails). Si Gmail falla, la reserva funciona igual y llega un aviso "No se pudo enviar el email".
3. **Config:** en el nodo **Config** pon el ID de la hoja (`REPLACE_WITH_FLUXA_SHEET_ID`), el chat de Telegram (`REPLACE_WITH_TELEGRAM_CHAT_ID`) y la **clave de los webhooks** en `security.demo_key` (una clave larga aleatoria; muy recomendado con el email activo). En ElevenLabs guárdala como secreto del workspace y añádela como cabecera `x-demo-key` (tipo Secret) en `get_availability` y `book_demo`. Pon la misma clave en el nodo **Config** de la autoprueba. Ahí también están el horario, la marca y colores del email y la puntuación.
4. **Publica los 5 sub-workflows.** En Agenda los 2 nodos de Google Calendar vienen **desactivados** para poder publicar sin esa credencial (ver "Usar Google Calendar" abajo).
5. En **Tools** y **Post-call**, en cada nodo Execute Workflow (Config, Get Busy, Create Event, Save Demo, Notify Demo, Send Email…) elige el sub-workflow correspondiente de la lista (en el JSON vienen como `REPLACE_WITH_…_WORKFLOW_ID`).
6. **Avisos de error:** importa `n8n/fluxa-error-alert.json`, credencial de Telegram del bot de Fluxa en **Alert on Telegram**, chat ID, y **publícalo** (n8n exige que el error workflow esté publicado para poder elegirlo).
7. En Tools y Post-call: Settings → zona horaria **Europe/Madrid** y **Error workflow → "Fluxa Voice Agent · Error Alert"**. **Publica** los dos workflows.
8. Copia las URLs de producción de los webhooks (`…/webhook/fluxa-availability`, `…/webhook/fluxa-book`, `…/webhook/fluxa-post-call`).
9. **Autoprueba:** importa `n8n/fluxa-selftest.json`, pon tu URL base (`https://<tu-dominio-n8n>/webhook`) y la clave en su nodo **Config** y pulsa *Execute workflow*. El nodo **Report** debe mostrar tres OK. Después borra las filas de prueba de la hoja.

### Usar Google Calendar con Google Meet (opcional)
1. Crea una credencial *Google Calendar OAuth2* en n8n con la cuenta del calendario donde caerán las demos.
2. En el sub-workflow **Agenda**, activa *List Events (Google Calendar)* y *Create Event (Google Calendar)* y elige esa credencial. Publica.
3. En **Config** cambia `connectors.agenda.provider` a `'google_calendar'` y pon en `calendar_id` el email del calendario (el de la cuenta con la que conectaste la credencial; n8n no acepta `primary`).
Desde ese momento los huecos ocupados salen del calendario real (cualquier evento bloquea el hueco, salvo los marcados como "disponible"), cada reserva crea un evento con el lead como invitado y enlace de **Google Meet**, Google le envía la invitación y el email de confirmación muestra el botón **Unirse a la videollamada**. La hoja sigue guardando el registro (con `meet_url` y `event_id`). Si el calendario falla al crear el evento, la reserva se guarda igual y el aviso al equipo lo indica.

### Añadir otro conector (Outlook, HubSpot, Slack…)
En el sub-workflow de esa función, añade una salida en **Route** con el nombre del proveedor, los nodos de la herramienta y termina con la misma salida que las demás (lo explica la nota amarilla de cada sub-workflow). Luego elige el proveedor en Config. Tools y Post-call no se tocan.

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
