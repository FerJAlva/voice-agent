# Genera n8n/*.json a partir de src/*.js. Ejecutar desde la raíz del repo: python3 scripts/build_workflows.py
import json, uuid
r = lambda f: open('src/' + f, encoding='utf-8').read()
SHEET = 'REPLACE_WITH_FLUXA_SHEET_ID'   # only used by legacy helpers; real ids live in the Config sub-workflow
CHAT = 'REPLACE_WITH_TELEGRAM_CHAT_ID'
# Sub-workflow ids: after importing the sub-workflows, pick them in each "Call …" / Execute Workflow node
# (or set them here and rebuild). scripts/deploy (not in the repo) replaces them with the real ids.
SUB = {k: f'REPLACE_WITH_{k.upper()}_WORKFLOW_ID' for k in ('config', 'agenda', 'store', 'notify', 'email')}

def node(name, typ, ver, params, pos, **extra):
    n = {"parameters": params, "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, 'fluxa-' + name)), "name": name,
         "type": typ, "typeVersion": ver, "position": pos}
    n.update(extra); return n
code = lambda name, js, pos, **e: node(name, "n8n-nodes-base.code", 2, {"jsCode": js}, pos, **e)
def webhook(name, path, pos, respond_node=True):
    return node(name, "n8n-nodes-base.webhook", 2, {"httpMethod": "POST", "path": path,
                "responseMode": "responseNode" if respond_node else "onReceived", "options": {}}, pos,
                webhookId=str(uuid.uuid5(uuid.NAMESPACE_DNS, 'fluxa-hook-' + path)))
def respond(name, expr, pos):
    return node(name, "n8n-nodes-base.respondToWebhook", 1.1, {"respondWith": "json", "responseBody": expr, "options": {}}, pos)
def sheet_read(name, tab, pos):
    return node(name, "n8n-nodes-base.googleSheets", 4.5, {"operation": "read",
        "documentId": {"__rl": True, "value": SHEET, "mode": "id"}, "sheetName": {"__rl": True, "value": tab, "mode": "name"},
        "filtersUI": {}, "options": {}}, pos, alwaysOutputData=True, executeOnce=True, onError="continueRegularOutput")
def sheet_append(name, tab, pos):
    return node(name, "n8n-nodes-base.googleSheets", 4.5, {"operation": "append",
        "documentId": {"__rl": True, "value": SHEET, "mode": "id"}, "sheetName": {"__rl": True, "value": tab, "mode": "name"},
        "columns": {"mappingMode": "autoMapInputData", "value": {}, "matchingColumns": [], "schema": []}, "options": {}}, pos,
        retryOnFail=True, maxTries=3, waitBetweenTries=5000)
        # no onError: if saving fails the run stops and the Error workflow alerts you (a lost booking must never be silent)
def tg(name, text, pos):
    return node(name, "n8n-nodes-base.telegram", 1.2, {"chatId": CHAT, "text": text,
        "additionalFields": {"appendAttribution": False, "disable_web_page_preview": True, "parse_mode": "HTML"}}, pos,
        onError="continueRegularOutput")
def ifok(name, left, pos):
    return node(name, "n8n-nodes-base.if", 2.2, {"conditions": {"options": {"caseSensitive": True, "leftValue": "", "typeValidation": "loose", "version": 2},
        "conditions": [{"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, name)), "leftValue": left, "rightValue": "yes",
                        "operator": {"type": "string", "operation": "equals"}}], "combinator": "and"}, "looseTypeValidation": True, "options": {}}, pos)
def gmail(name, pos):
    return node(name, "n8n-nodes-base.gmail", 2.1, {"resource": "message", "operation": "send", "sendTo": "={{ $json.to }}",
        "subject": "={{ $json.subject }}", "emailType": "html", "message": "={{ $json.html }}",
        "options": {"appendAttribution": False, "senderName": "Nora · Fluxa"}}, pos,
        retryOnFail=True, maxTries=2, waitBetweenTries=3000, onError="continueErrorOutput")
# Sticky notes that explain each stage. pos = top-left; nodes inside sit ~140 px below the top.
COLORS = {"yellow": 1, "orange": 2, "red": 3, "green": 4, "blue": 5, "purple": 6, "grey": 7}
def note(name, content, pos, w, h, color="grey"):
    return node(name, "n8n-nodes-base.stickyNote", 1, {"content": content, "width": w, "height": h, "color": COLORS[color]}, pos)
def link(con, a, b, out=0):
    con.setdefault(a, {"main": []}); m = con[a]["main"]
    while len(m) <= out: m.append([])
    m[out].append({"node": b, "type": "main", "index": 0})


# ---------- Building blocks for connectors ----------
def start(pos=[0, 0]):
    return node("Start", "n8n-nodes-base.executeWorkflowTrigger", 1.1, {"inputSource": "passthrough"}, pos)
def call(name, sub, pos, **extra):
    return node(name, "n8n-nodes-base.executeWorkflow", 1.2, {"mode": "once", "workflowId": {"__rl": True, "value": SUB[sub], "mode": "id"},
                "options": {"waitForSubWorkflow": True}}, pos, **extra)
def route(name, left, keys, pos):
    rules = [{"conditions": {"options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 2},
              "conditions": [{"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, name + k)), "leftValue": left, "rightValue": k,
                              "operator": {"type": "string", "operation": "equals"}}], "combinator": "and"},
              "renameOutput": True, "outputKey": k} for k in keys]
    return node(name, "n8n-nodes-base.switch", 3.2, {"rules": {"values": rules},
                "options": {"fallbackOutput": "extra", "renameFallbackOutput": "otro"}}, pos)
START = "$('Start').first().json"
def save_wf(fname, name, nodes, con, extra_settings=None):
    settings = {"executionOrder": "v1", "timezone": "Europe/Madrid"}; settings.update(extra_settings or {})
    json.dump({"name": name, "nodes": nodes, "connections": con, "pinData": {}, "settings": settings, "active": False, "tags": []},
              open('n8n/' + fname, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
# Book-path code reads the "(book)" copies of the shared nodes
BOOKNAMES = lambda js: (js.replace("$('Config')", "$('Config (book)')").replace("$('Agenda Request')", "$('Agenda Request (book)')")
                          .replace("$('Get Busy')", "$('Get Busy (book)')").replace("$('Availability Webhook')", "$('Book Webhook')"))

# ---------- Sub-workflow: Config ----------
nodes = [
    note("Read me", "## Fluxa · Config (único sitio a editar por cliente)\nMarca, horario, puntuación y **qué herramienta hace cada función** "
         "(agenda, guardar, avisar, email). Tools y Post-call lo llaman al empezar.\n**Configurar:** edita el nodo **Config** "
         "(clave x-demo-key, ID de la hoja, chat de Telegram, proveedor de cada conector).", [-60, -320], 640, 260, "yellow"),
    start([0, 0]),
    code("Config", r('config.js'), [220, 0]),
]
con = {}; link(con, "Start", "Config")
save_wf('fluxa-config.json', "Fluxa Voice Agent · Config", nodes, con)

# ---------- Sub-workflow: Agenda (busy times + create the meeting) ----------
nodes = [
    note("Read me", "## Fluxa · Agenda (conector de calendario)\nEntrada: `action` (busy / create), `provider` y datos. Salida siempre igual:\n"
         "- **busy** → `{ busy: [{start, end}] }` huecos ocupados\n- **create** → `{ ok, event_id, meet_url }`\n"
         "**Proveedores:** `sheets` (las reservas de la pestaña Demos bloquean el hueco) · `google_calendar` (lee el calendario y crea el evento con Google Meet; **para usarlo: activa los 2 nodos de Google Calendar, elige su credencial y pon `agenda.provider: 'google_calendar'` en Config**).\n"
         "**Añadir otro (Outlook, Cal.com…):** una salida más en **Route** con la misma salida.", [-60, -460], 1100, 300, "yellow"),
    start([0, 200]),
    route("Route", "={{ $json.action + ':' + $json.provider }}", ["busy:sheets", "busy:google_calendar", "create:sheets", "create:google_calendar"], [220, 200]),
    node("Read Demos (Sheets)", "n8n-nodes-base.googleSheets", 4.5, {"operation": "read",
        "documentId": {"__rl": True, "value": "={{ " + START + ".sheet_id }}", "mode": "id"},
        "sheetName": {"__rl": True, "value": "={{ " + START + ".tab }}", "mode": "name"}, "filtersUI": {}, "options": {}}, [500, -60],
        alwaysOutputData=True, executeOnce=True, onError="continueRegularOutput"),
    code("Busy (Sheets)", r('agenda_busy_sheets.js'), [720, -60]),
    node("List Events (Google Calendar)", "n8n-nodes-base.googleCalendar", 1.3, {"resource": "event", "operation": "getAll",
        "calendar": {"__rl": True, "value": "={{ " + START + ".calendar_id }}", "mode": "id"}, "returnAll": True,
        "timeMin": "={{ " + START + ".from }}", "timeMax": "={{ " + START + ".to }}", "options": {}}, [500, 100],
        alwaysOutputData=True, executeOnce=True, onError="continueRegularOutput", disabled=True),
    code("Busy (Google Calendar)", r('agenda_busy_gcal.js'), [720, 100]),
    code("No Event (Sheets)", "// The Demos row is the booking: nothing to create.\nreturn [{ json: { ok: true, provider: 'sheets', event_id: '', meet_url: '' } }];", [500, 260]),
    node("Create Event (Google Calendar)", "n8n-nodes-base.googleCalendar", 1.3, {"resource": "event", "operation": "create",
        "calendar": {"__rl": True, "value": "={{ " + START + ".calendar_id }}", "mode": "id"},
        "start": "={{ " + START + ".booking.start }}", "end": "={{ " + START + ".booking.end }}", "useDefaultReminders": True,
        "additionalFields": {"summary": "={{ " + START + ".booking.summary }}", "description": "={{ " + START + ".booking.description }}",
            "attendees": ["={{ " + START + ".booking.email }}"], "sendUpdates": "all",
            "conferenceDataUi": {"conferenceDataValues": {"conferenceSolution": "hangoutsMeet"}}}}, [500, 420],
        onError="continueErrorOutput", disabled=True),
    code("Event Created", r('agenda_event.js'), [720, 400]),
    code("Event Failed", "const e = $input.first().json.error;\nreturn [{ json: { ok: false, provider: 'google_calendar', event_id: '', meet_url: '', error: String((e && e.message) || e || 'error') } }];", [720, 560]),
    code("Skip", "// Unauthorized request or unknown provider: no busy times, nothing created.\nreturn [{ json: { ok: true, skipped: true, busy: [], event_id: '', meet_url: '' } }];", [500, 600]),
]
con = {}
link(con, "Start", "Route")
link(con, "Route", "Read Demos (Sheets)", 0); link(con, "Read Demos (Sheets)", "Busy (Sheets)")
link(con, "Route", "List Events (Google Calendar)", 1); link(con, "List Events (Google Calendar)", "Busy (Google Calendar)")
link(con, "Route", "No Event (Sheets)", 2)
link(con, "Route", "Create Event (Google Calendar)", 3); link(con, "Create Event (Google Calendar)", "Event Created", 0); link(con, "Create Event (Google Calendar)", "Event Failed", 1)
link(con, "Route", "Skip", 4)
save_wf('fluxa-agenda.json', "Fluxa Voice Agent · Agenda", nodes, con)

# ---------- Sub-workflow: Store (save a booking or a lead) ----------
nodes = [
    note("Read me", "## Fluxa · Guardar (conector de registro)\nEntrada: `{ provider, sheet_id, tab, row }`. Salida: `{ ok }`.\n"
         "**Proveedores:** `sheets` (añade la fila a la pestaña indicada; 3 reintentos).\n"
         "**Añadir otro (HubSpot, Pipedrive, Airtable…):** una salida más en **Route** que cree el registro con `row` y termine en `{ ok: true }`. "
         "Si falla, deja que el error suba: una reserva perdida nunca debe ser silenciosa.", [-60, -360], 900, 280, "yellow"),
    start([0, 0]),
    route("Route", "={{ $json.provider }}", ["sheets"], [220, 0]),
    code("Row", "return [{ json: $('Start').first().json.row }];", [440, -60]),
    node("Append (Sheets)", "n8n-nodes-base.googleSheets", 4.5, {"operation": "append",
        "documentId": {"__rl": True, "value": "={{ " + START + ".sheet_id }}", "mode": "id"},
        "sheetName": {"__rl": True, "value": "={{ " + START + ".tab }}", "mode": "name"},
        "columns": {"mappingMode": "autoMapInputData", "value": {}, "matchingColumns": [], "schema": []}, "options": {}}, [660, -60],
        retryOnFail=True, maxTries=3, waitBetweenTries=5000),
    code("Saved", "return [{ json: { ok: true, provider: $('Start').first().json.provider } }];", [880, -60]),
    code("Unknown Provider", "throw new Error('Conector de guardado no soportado: ' + $('Start').first().json.provider + '. Revisa connectors.store en Config.');", [440, 120]),
]
con = {}
link(con, "Start", "Route"); link(con, "Route", "Row", 0); link(con, "Row", "Append (Sheets)"); link(con, "Append (Sheets)", "Saved")
link(con, "Route", "Unknown Provider", 1)
save_wf('fluxa-store.json', "Fluxa Voice Agent · Store", nodes, con)

# ---------- Sub-workflow: Notify (message to the sales team) ----------
nodes = [
    note("Read me", "## Fluxa · Avisar (conector de avisos al equipo)\nEntrada: `{ provider, chat_id, text }` (texto con HTML simple: <b>, <i>). Salida: `{ ok }`.\n"
         "**Proveedores:** `telegram` · `none` (no avisa).\n**Añadir otro (Slack, Teams, email):** una salida más en **Route**. "
         "Un aviso que falla no para la reserva.", [-60, -340], 860, 260, "yellow"),
    start([0, 0]),
    route("Route", "={{ $json.provider }}", ["telegram"], [220, 0]),
    node("Send (Telegram)", "n8n-nodes-base.telegram", 1.2, {"chatId": "={{ " + START + ".chat_id }}", "text": "={{ " + START + ".text }}",
        "additionalFields": {"appendAttribution": False, "disable_web_page_preview": True, "parse_mode": "HTML"}}, [440, -60],
        onError="continueRegularOutput", webhookId=str(uuid.uuid5(uuid.NAMESPACE_DNS, 'fluxa-notify-telegram'))),
    code("Sent", "return [{ json: { ok: !$input.first().json.error, provider: 'telegram' } }];", [660, -60]),
    code("Skip", "return [{ json: { ok: true, skipped: true, provider: $('Start').first().json.provider } }];", [440, 120]),
]
con = {}
link(con, "Start", "Route"); link(con, "Route", "Send (Telegram)", 0); link(con, "Send (Telegram)", "Sent"); link(con, "Route", "Skip", 1)
save_wf('fluxa-notify.json', "Fluxa Voice Agent · Notify", nodes, con)

# ---------- Sub-workflow: Email (confirmation to the lead) ----------
nodes = [
    note("Read me", "## Fluxa · Email (conector de email al lead)\nEntrada: `{ provider, to, subject, html, sender_name }`. Salida: `{ ok }` o `{ ok: false, error }`.\n"
         "**Proveedores:** `gmail` (credencial de Gmail).\n**Añadir otro (Outlook / Microsoft 365, SMTP, SendGrid):** una salida más en **Route** "
         "que termine en **Sent** o **Failed**.", [-60, -340], 860, 260, "yellow"),
    start([0, 0]),
    route("Route", "={{ $json.provider }}", ["gmail"], [220, 0]),
    node("Send (Gmail)", "n8n-nodes-base.gmail", 2.1, {"resource": "message", "operation": "send", "sendTo": "={{ " + START + ".to }}",
        "subject": "={{ " + START + ".subject }}", "emailType": "html", "message": "={{ " + START + ".html }}",
        "options": {"appendAttribution": False, "senderName": "={{ " + START + ".sender_name }}"}}, [440, -60],
        retryOnFail=True, maxTries=2, waitBetweenTries=3000, onError="continueErrorOutput", webhookId=str(uuid.uuid5(uuid.NAMESPACE_DNS, 'fluxa-email-gmail'))),
    code("Sent", "return [{ json: { ok: true, provider: 'gmail', id: $input.first().json.id || '' } }];", [660, -120]),
    code("Failed", "const e = $input.first().json.error;\nreturn [{ json: { ok: false, provider: 'gmail', error: String((e && e.message) || e || 'error') } }];", [660, 40]),
    code("Skip", "return [{ json: { ok: false, skipped: true, error: 'Conector de email no soportado: ' + $('Start').first().json.provider } }];", [440, 140]),
]
con = {}
link(con, "Start", "Route"); link(con, "Route", "Send (Gmail)", 0); link(con, "Send (Gmail)", "Sent", 0); link(con, "Send (Gmail)", "Failed", 1)
link(con, "Route", "Skip", 1)
save_wf('fluxa-email.json', "Fluxa Voice Agent · Email", nodes, con)

# ---------- Tools workflow ----------
EVENT_REQUEST = """// Meeting to create in the agenda connector (Google Calendar adds the lead as guest + Meet link)
const cfg = $('Config (book)').first().json, r = $('Book').first().json.row, a = cfg.connectors.agenda, b = cfg.brand;
const end = new Date(new Date(r.slot_iso).getTime() + cfg.schedule.slot_minutes * 60000).toISOString();
return [{ json: { action: 'create', provider: a.provider, calendar_id: a.calendar_id || 'primary', booking: {
  start: r.slot_iso, end, email: r.email, summary: `${b.name} · Demo · ${r.company}`,
  description: `Lead: ${r.name}${r.role ? ' (' + r.role + ')' : ''} · ${r.company}\\nEquipo: ${r.team_size || '?'}\\nCaso: ${r.use_case || '?'}\\nReservada por ${b.agent} (agente de voz).`
} } }];"""
DEMO_ROW = """// Booking row for the store connector (+ meeting link and event id when the agenda created one)
const cfg = $('Config (book)').first().json, st = cfg.connectors.store, ev = $('Create Event').first().json || {};
return [{ json: { provider: st.provider, sheet_id: st.sheet_id, tab: st.demos_tab,
  row: { ...$('Book').first().json.row, meet_url: ev.meet_url || '', event_id: ev.event_id || '' } } }];"""
DEMO_ALERT = """// Brief for the team (only when the booking went through)
const book = $('Book').first().json;
if (!book.ok) return [];
const cfg = $('Config (book)').first().json, n = cfg.connectors.notify, r = book.row;
let ev = {}; try { ev = $('Create Event').first().json || {}; } catch (e) {}
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const city = cfg.schedule.timezone.split('/').pop().replace(/_/g, ' ');
const text = `📅 <b>Demo reservada</b>\\n${esc(r.name)} · ${esc(r.company)}\\n${esc(r.when_madrid)} (${esc(city)}) · ${esc(r.email)}` +
  (ev.meet_url ? `\\n🎥 ${esc(ev.meet_url)}` : '') + (ev.ok === false ? `\\n⚠️ No se pudo crear el evento en el calendario: ${esc(ev.error)}` : '');
return [{ json: { provider: n.provider, chat_id: n.chat_id, text } }];"""
EMAIL_FAILED = """const cfg = $('Config (book)').first().json, n = cfg.connectors.notify, res = $input.first().json;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
return [{ json: { provider: n.provider, chat_id: n.chat_id,
  text: `⚠️ <b>No se pudo enviar el email de confirmación</b>\\n${esc($('Confirmation Email').first().json.to)}\\n${esc(res.error || '')}\\nRevisa el conector de email (credencial) en n8n.` } }];"""
B = 520   # y of the booking row
nodes = [
    note("Read me", "## Fluxa · Tools (herramientas de Nora)\nDos webhooks que llama el agente de ElevenLabs durante la llamada:\n"
         "- **POST /webhook/fluxa-availability** → huecos libres para la demo\n- **POST /webhook/fluxa-book** → reserva, avisa al equipo y manda el email al lead\n\n"
         "Este workflow **no tiene herramientas dentro**: lee la configuración del sub-workflow **Config** y usa los conectores "
         "**Agenda**, **Store**, **Notify** y **Email**. Para cambiar de herramienta (p. ej. Google Calendar en vez de la hoja) se toca solo Config.\n"
         "**Configurar:** elige los 5 sub-workflows en los nodos morados (Execute Workflow) · Publish.",
         [-60, -600], 1000, 380, "yellow"),
    note("Stage 1", "### ① Consultar disponibilidad\nCarga Config, comprueba la clave `x-demo-key`, pide los huecos ocupados al conector **Agenda** "
         "y calcula los libres con las reglas de Config (días, horario, duración, antelación). Responde con hasta 4 huecos.", [-60, -200], 1340, 320, "blue"),
    webhook("Availability Webhook", "fluxa-availability", [0, -20]),
    call("Config", "config", [220, -20]),
    code("Agenda Request", r('agenda_request.js'), [440, -20]),
    call("Get Busy", "agenda", [660, -20]),
    code("Availability", r('availability.js'), [880, -20]),
    respond("Respond Availability", "={{ JSON.stringify($json) }}", [1100, -20]),

    note("Stage 2", "### ② Recibir y validar la reserva\nDatos del lead + hueco elegido. **Book** comprueba la clave, los campos, el email y que el hueco siga libre en la agenda. "
         "Si algo falla, va directo a ④ con un mensaje para que Nora lo diga.", [-60, B - 180], 1340, 340, "blue"),
    webhook("Book Webhook", "fluxa-book", [0, B]),
    call("Config (book)", "config", [220, B]),
    code("Agenda Request (book)", BOOKNAMES(r('agenda_request.js')), [440, B]),
    call("Get Busy (book)", "agenda", [660, B]),
    code("Book", BOOKNAMES(r('book.js')), [880, B]),
    ifok("Booked?", "={{ $json.ok ? 'yes' : 'no' }}", [1100, B]),

    note("Stage 3", "### ③ Crear la reunión y guardar\n**Agenda** crea el evento (con Google Calendar: invitación + Google Meet; con la hoja no hace nada) "
         "y **Store** guarda la reserva (3 reintentos; si falla salta el aviso de error).", [1300, B - 180], 900, 340, "green"),
    code("Event Request", EVENT_REQUEST, [1360, B]),
    call("Create Event", "agenda", [1580, B]),
    code("Demo Row", DEMO_ROW, [1800, B]),
    call("Save Demo", "store", [2020, B]),

    note("Stage 4", "### ④ Responder a Nora\nDevuelve `ok` y la frase `say` que Nora lee al lead. Lo demás va después para no hacer esperar a la llamada.", [2220, B - 180], 260, 340, "purple"),
    respond("Respond Book", "={{ JSON.stringify({ ok: $('Book').first().json.ok, say: $('Book').first().json.say, error: $('Book').first().json.error || null }) }}", [2280, B]),

    note("Stage 5", "### ⑤ Avisar al equipo y email al lead\nAviso por el conector **Notify** y email con diseño de marca (ES/EN, botones de calendario y de videollamada) por el conector **Email**. "
         "No se envía si la reserva falló o el email es de prueba (@example.com). Si el email falla, avisa al equipo.", [2500, B - 180], 1340, 520, "orange"),
    code("Demo Alert", DEMO_ALERT, [2560, B]),
    call("Notify Demo", "notify", [2780, B], onError="continueRegularOutput"),
    code("Confirmation Email", BOOKNAMES(r('confirm_email.js')), [3000, B]),
    call("Send Email", "email", [3220, B], onError="continueRegularOutput"),
    ifok("Email Sent?", "={{ $json.ok || $json.skipped ? 'yes' : 'no' }}", [3440, B]),
    code("Email Failed Alert", EMAIL_FAILED, [3440, B + 180]),
    call("Notify Email Failed", "notify", [3660, B + 180], onError="continueRegularOutput"),
]
con = {}
link(con, "Availability Webhook", "Config"); link(con, "Config", "Agenda Request"); link(con, "Agenda Request", "Get Busy")
link(con, "Get Busy", "Availability"); link(con, "Availability", "Respond Availability")
link(con, "Book Webhook", "Config (book)"); link(con, "Config (book)", "Agenda Request (book)"); link(con, "Agenda Request (book)", "Get Busy (book)")
link(con, "Get Busy (book)", "Book"); link(con, "Book", "Booked?")
link(con, "Booked?", "Event Request", 0); link(con, "Booked?", "Respond Book", 1)
link(con, "Event Request", "Create Event"); link(con, "Create Event", "Demo Row"); link(con, "Demo Row", "Save Demo"); link(con, "Save Demo", "Respond Book")
link(con, "Respond Book", "Demo Alert"); link(con, "Demo Alert", "Notify Demo"); link(con, "Notify Demo", "Confirmation Email")
link(con, "Confirmation Email", "Send Email"); link(con, "Send Email", "Email Sent?"); link(con, "Email Sent?", "Email Failed Alert", 1)
link(con, "Email Failed Alert", "Notify Email Failed")
save_wf('fluxa-tools.json', "Fluxa Voice Agent · Tools", nodes, con)

# ---------- Post-call workflow ----------
LEAD_ROW = """const cfg = $('Config').first().json, st = cfg.connectors.store;
return [{ json: { provider: st.provider, sheet_id: st.sheet_id, tab: st.leads_tab, row: $('Post-call').first().json.row } }];"""
LEAD_ALERT = """const n = $('Config').first().json.connectors.notify;
return [{ json: { provider: n.provider, chat_id: n.chat_id, text: $('Post-call').first().json.text } }];"""
nodes = [
    note("Read me", "## Fluxa · Post-call (después de cada llamada)\nElevenLabs envía aquí la transcripción y el análisis al terminar cada conversación "
         "(webhook de workspace, firmado con HMAC).\nLa puntuación se configura en **Config → scoring**; el guardado y el aviso usan los conectores **Store** y **Notify**.\n"
         "**Configurar:** elige los sub-workflows en los nodos Execute Workflow · Publish.", [-60, -480], 1100, 260, "yellow"),
    note("Stage 1", "### ① Recibir y puntuar\nCarga Config, lee el resumen y los datos extraídos por ElevenLabs, puntúa el lead (0–100 → Caliente / Templado / Frío, con el porqué) "
         "y suma los minutos de voz del mes (los chats de texto y las autopruebas no cuentan).", [-60, -200], 640, 420, "blue"),
    webhook("Post-call Webhook", "fluxa-post-call", [0, 40], respond_node=False),
    call("Config", "config", [220, 40]),
    code("Post-call", r('post_call.js'), [440, 40]),
    note("Stage 2", "### ② Guardar y avisar\nArriba: guarda el lead con el conector **Store** (pestaña Leads). Abajo: brief para el comercial con el conector **Notify** "
         "(perfil, puntuación y porqué, resumen y minutos usados).", [600, -200], 680, 420, "green"),
    code("Lead Row", LEAD_ROW, [660, -60]),
    call("Save Lead", "store", [880, -60]),
    code("Lead Alert", LEAD_ALERT, [660, 120]),
    call("Notify Lead", "notify", [880, 120], onError="continueRegularOutput"),
]
con = {}
link(con, "Post-call Webhook", "Config"); link(con, "Config", "Post-call"); link(con, "Post-call", "Lead Row"); link(con, "Post-call", "Lead Alert")
link(con, "Lead Row", "Save Lead"); link(con, "Lead Alert", "Notify Lead")
save_wf('fluxa-post-call.json', "Fluxa Voice Agent · Post-call", nodes, con)
print('ok tools, post-call, sub-workflows')

# ---------- Self-test workflow (run from n8n, no local tools) ----------
def post(name, url_expr, body_expr, pos):
    return node(name, "n8n-nodes-base.httpRequest", 4.2, {"method": "POST", "url": url_expr,
        "sendHeaders": True, "headerParameters": {"parameters": [{"name": "x-demo-key", "value": "={{ $('Config').first().json.secret }}"}]},
        "sendBody": True, "specifyBody": "json", "jsonBody": body_expr, "options": {"timeout": 20000}}, pos,
        onError="continueRegularOutput", executeOnce=True)
SAMPLE_POST_CALL = ("={{ JSON.stringify({ type: 'post_call_transcription', data: { conversation_id: 'selftest-' + Date.now(), "
    "metadata: { call_duration_secs: 95 }, transcript: [{ role: 'agent', message: 'Hola' }, { role: 'user', message: 'Hola' }], "
    "analysis: { transcript_summary: 'Prueba automática: lead de ejemplo interesado en automatizar el reporting semanal.', "
    "data_collection_results: { aitem_1: { name: 'name', value: 'Lead de Prueba' }, aitem_2: { name: 'company', value: 'Empresa Demo' }, "
    "aitem_3: { name: 'role', value: 'Head of Operations' }, aitem_4: { name: 'team_size', value: '40' }, "
    "aitem_5: { name: 'use_case', value: 'Automatizar el reporting semanal de operaciones' }, aitem_6: { name: 'timeline', value: 'este trimestre' }, "
    "aitem_7: { name: 'demo_booked', value: true }, aitem_8: { name: 'language', value: 'es' } } } } }) }}")
nodes = [
    note("Read me", "## Fluxa · Self-test (prueba del backend sin gastar minutos)\nPulsa **Execute workflow**. Llama a los 3 webhooks con datos de ejemplo "
         "y el nodo **Report** dice qué funciona y qué no.\nLa reserva usa prueba@example.com, así que **no se envía email**. "
         "Borra luego las filas de prueba (nombre \"Lead de Prueba\") de Demos y Leads.\n**Configurar:** URL base y clave en **Config**.", [-60, -360], 900, 220, "yellow"),
    note("Stage 1", "### ① Preparar → ② Probar los 3 webhooks → ③ Informe\nDisponibilidad → reserva del primer hueco libre → post-call de ejemplo. "
         "Si una falla, sigue con la siguiente para ver el cuadro completo.", [-60, -120], 1360, 260, "blue"),
    node("Run self-test", "n8n-nodes-base.manualTrigger", 1, {}, [0, 0]),
    code("Config", r('selftest_config.js'), [220, 0]),
    post("Test Availability", "={{ $('Config').first().json.baseUrl + '/fluxa-availability' }}", "={{ JSON.stringify({ language: 'es' }) }}", [440, 0]),
    post("Test Book", "={{ $('Config').first().json.baseUrl + '/fluxa-book' }}",
         "={{ JSON.stringify({ name: 'Lead de Prueba', email: 'prueba@example.com', company: 'Empresa Demo', role: 'Head of Operations', team_size: '40', use_case: 'Automatizar reporting', slot_iso: (($('Test Availability').first().json.slots || [])[0] || {}).slot_iso || '', language: 'es' }) }}", [660, 0]),
    post("Test Post-call", "={{ $('Config').first().json.baseUrl + '/fluxa-post-call' }}", SAMPLE_POST_CALL, [880, 0]),
    code("Report", r('selftest_report.js'), [1100, 0]),
]
con = {}
link(con, "Run self-test", "Config"); link(con, "Config", "Test Availability"); link(con, "Test Availability", "Test Book")
link(con, "Test Book", "Test Post-call"); link(con, "Test Post-call", "Report")
json.dump({"name": "Fluxa Voice Agent · Self-test", "nodes": nodes, "connections": con, "pinData": {},
           "settings": {"executionOrder": "v1", "timezone": "Europe/Madrid"}, "active": False, "tags": []},
          open('n8n/fluxa-selftest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok selftest')

# ---------- Error alert workflow ----------
nodes = [
    note("Read me", "## Fluxa · Error Alert\nSe asigna como **Error workflow** en la configuración de Tools y Post-call. "
         "Cuando algo falla, explica en lenguaje claro qué nodo falló, qué significa y cómo arreglarlo, y lo manda por Telegram.\n"
         "**Configurar:** chat ID en **Alert on Telegram** · credencial Telegram.", [-60, -340], 680, 200, "yellow"),
    note("Stage 1", "### ① Detectar → ② Traducir el error → ③ Avisar", [-60, -120], 680, 260, "red"),
    node("Error Trigger", "n8n-nodes-base.errorTrigger", 1, {}, [0, 0]),
    code("Explain Error", r('error_explain.js'), [220, 0]),
    node("Alert on Telegram", "n8n-nodes-base.telegram", 1.2, {"chatId": CHAT, "text": "={{ $json.text }}",
         "additionalFields": {"appendAttribution": False, "disable_web_page_preview": True}}, [440, 0]),
]
con = {}
link(con, "Error Trigger", "Explain Error"); link(con, "Explain Error", "Alert on Telegram")
json.dump({"name": "Fluxa Voice Agent · Error Alert", "nodes": nodes, "connections": con, "pinData": {},
           "settings": {"executionOrder": "v1", "timezone": "Europe/Madrid"}, "active": False, "tags": []},
          open('n8n/fluxa-error-alert.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok error-alert')
