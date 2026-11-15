# Genera n8n/*.json a partir de src/*.js. Ejecutar desde la raíz del repo: python3 scripts/build_workflows.py
import json, uuid
r = lambda f: open('src/' + f, encoding='utf-8').read()
SHEET = 'REPLACE_WITH_FLUXA_SHEET_ID'
CHAT = 'REPLACE_WITH_TELEGRAM_CHAT_ID'

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

# ---------- Tools workflow ----------
B = 460   # y of the booking row
nodes = [
    note("Read me", "## Fluxa · Tools (herramientas de Nora)\nDos webhooks que llama el agente de ElevenLabs durante la llamada:\n"
         "- **POST /webhook/fluxa-availability** → huecos libres para la demo\n- **POST /webhook/fluxa-book** → reserva, avisa al equipo y manda el email al lead\n\n"
         "**Configurar:** ID de la hoja en los 3 nodos de Sheets · chat ID en los nodos de Telegram · credenciales de Google Sheets, Telegram y Gmail · Publish.\n"
         "Reglas de agenda (horario, días, antelación) en el nodo **Availability**; textos y diseño del email en **Confirmation Email**.",
         [-60, -520], 900, 320, "yellow"),
    note("Stage 1", "### ① Consultar disponibilidad\nRecibe la petición de Nora, lee las demos ya reservadas en la hoja y calcula los huecos libres "
         "(lun–vie, 10:00–17:00 Madrid, 30 min, 2 h de antelación). Responde con hasta 4 huecos.", [-60, -140], 900, 300, "blue"),
    webhook("Availability Webhook", "fluxa-availability", [0, 20]),
    sheet_read("Read Demos", "Demos", [220, 20]),
    code("Availability", r('availability.js'), [440, 20]),
    respond("Respond Availability", "={{ JSON.stringify($json) }}", [660, 20]),

    note("Stage 2", "### ② Recibir y validar la reserva\nDatos del lead + hueco elegido. **Book** comprueba campos, email y que el hueco siga libre. "
         "Si algo falla, va directo a ④ con un mensaje para que Nora lo diga.", [-60, B - 160], 900, 320, "blue"),
    webhook("Book Webhook", "fluxa-book", [0, B]),
    sheet_read("Read Demos (book)", "Demos", [220, B]),
    code("Book", r('book.js').replace("$('Read Demos')", "$('Read Demos (book)')"), [440, B]),
    ifok("Booked?", "={{ $json.ok ? 'yes' : 'no' }}", [660, B]),

    note("Stage 3", "### ③ Guardar y avisar al equipo\nAñade la fila a la pestaña **Demos** (3 reintentos; si falla salta el aviso de error) "
         "y manda el aviso de Telegram al equipo comercial.", [860, B - 160], 680, 320, "green"),
    code("Demo Row", "return [{ json: $('Book').first().json.row }];", [920, B]),
    sheet_append("Save Demo", "Demos", [1140, B]),
    tg("Notify Demo", "={{ '📅 <b>Demo reservada</b>\\n' + $('Book').first().json.row.name + ' · ' + $('Book').first().json.row.company + '\\n' + $('Book').first().json.row.when_madrid + ' (Madrid) · ' + $('Book').first().json.row.email }}", [1360, B]),

    note("Stage 4", "### ④ Responder a Nora\nDevuelve `ok` y la frase `say` que Nora lee al lead.", [1560, B - 160], 260, 320, "purple"),
    respond("Respond Book", "={{ JSON.stringify({ ok: $('Book').first().json.ok, say: $('Book').first().json.say, error: $('Book').first().json.error || null }) }}", [1620, B]),

    note("Stage 5", "### ⑤ Email de confirmación al lead\nSe ejecuta **después** de responder a Nora, así no retrasa la llamada. "
         "Diseño Fluxa (ES/EN) con botones de Google Calendar y Outlook. No se envía si la reserva falló o el email es de prueba (@example.com). "
         "Si Gmail falla, avisa por Telegram.", [1840, B - 160], 700, 480, "orange"),
    code("Confirmation Email", r('confirm_email.js'), [1900, B]),
    gmail("Send Confirmation", [2120, B]),
    tg("Email Failed", "={{ '⚠️ <b>No se pudo enviar el email de confirmación</b>\\n' + $('Confirmation Email').first().json.to + '\\nRevisa la credencial de Gmail en n8n.' }}", [2340, B + 160]),
]
con = {}
link(con, "Availability Webhook", "Read Demos"); link(con, "Read Demos", "Availability"); link(con, "Availability", "Respond Availability")
link(con, "Book Webhook", "Read Demos (book)"); link(con, "Read Demos (book)", "Book"); link(con, "Book", "Booked?")
link(con, "Booked?", "Demo Row", 0); link(con, "Booked?", "Respond Book", 1)
link(con, "Demo Row", "Save Demo"); link(con, "Save Demo", "Notify Demo"); link(con, "Notify Demo", "Respond Book")
link(con, "Respond Book", "Confirmation Email"); link(con, "Confirmation Email", "Send Confirmation")
link(con, "Send Confirmation", "Email Failed", 1)
json.dump({"name": "Fluxa Voice Agent · Tools", "nodes": nodes, "connections": con, "pinData": {},
           "settings": {"executionOrder": "v1", "timezone": "Europe/Madrid"}, "active": False, "tags": []},
          open('n8n/fluxa-tools.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# ---------- Post-call workflow ----------
nodes = [
    note("Read me", "## Fluxa · Post-call (después de cada llamada)\nElevenLabs envía aquí la transcripción y el análisis al terminar cada conversación "
         "(webhook de workspace, firmado con HMAC).\n**Configurar:** ID de la hoja en **Save Lead** · chat ID en **Notify Lead** · credenciales · Publish.\n"
         "La puntuación del lead (BANT simplificado) y el contador de minutos están en el nodo **Post-call**.", [-60, -460], 900, 260, "yellow"),
    note("Stage 1", "### ① Recibir y puntuar\nLee el resumen y los 8 datos extraídos por ElevenLabs, puntúa el lead (0–100 → Caliente / Templado / Frío) "
         "y suma los minutos de voz del mes (los chats de texto y las autopruebas no cuentan).", [-60, -180], 460, 400, "blue"),
    webhook("Post-call Webhook", "fluxa-post-call", [0, 40], respond_node=False),
    code("Post-call", r('post_call.js'), [220, 40]),
    note("Stage 2", "### ② Guardar y avisar\nArriba: guarda la fila en la pestaña **Leads**. Abajo: brief para el comercial por Telegram "
         "(perfil, puntuación, resumen y minutos usados).", [420, -180], 480, 400, "green"),
    code("Lead Row", "return [{ json: $input.first().json.row }];", [480, -60]),
    sheet_append("Save Lead", "Leads", [700, -60]),
    tg("Notify Lead", "={{ $('Post-call').first().json.text }}", [480, 120]),
]
con = {}
link(con, "Post-call Webhook", "Post-call"); link(con, "Post-call", "Lead Row"); link(con, "Post-call", "Notify Lead"); link(con, "Lead Row", "Save Lead")
json.dump({"name": "Fluxa Voice Agent · Post-call", "nodes": nodes, "connections": con, "pinData": {},
           "settings": {"executionOrder": "v1", "timezone": "Europe/Madrid"}, "active": False, "tags": []},
          open('n8n/fluxa-post-call.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok')

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
