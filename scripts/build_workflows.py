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
        onError="continueRegularOutput")
def tg(name, text, pos):
    return node(name, "n8n-nodes-base.telegram", 1.2, {"chatId": CHAT, "text": text,
        "additionalFields": {"appendAttribution": False, "disable_web_page_preview": True, "parse_mode": "HTML"}}, pos,
        onError="continueRegularOutput")
def ifok(name, left, pos):
    return node(name, "n8n-nodes-base.if", 2.2, {"conditions": {"options": {"caseSensitive": True, "leftValue": "", "typeValidation": "loose", "version": 2},
        "conditions": [{"id": str(uuid.uuid5(uuid.NAMESPACE_DNS, name)), "leftValue": left, "rightValue": "yes",
                        "operator": {"type": "string", "operation": "equals"}}], "combinator": "and"}, "looseTypeValidation": True, "options": {}}, pos)
def link(con, a, b, out=0):
    con.setdefault(a, {"main": []}); m = con[a]["main"]
    while len(m) <= out: m.append([])
    m[out].append({"node": b, "type": "main", "index": 0})

# ---------- Tools workflow ----------
nodes = [
    webhook("Availability Webhook", "fluxa-availability", [0, 0]),
    sheet_read("Read Demos", "Demos", [220, 0]),
    code("Availability", r('availability.js'), [440, 0]),
    respond("Respond Availability", "={{ JSON.stringify($json) }}", [660, 0]),
    webhook("Book Webhook", "fluxa-book", [0, 300]),
    sheet_read("Read Demos (book)", "Demos", [220, 300]),
    code("Book", r('book.js').replace("$('Read Demos')", "$('Read Demos (book)')"), [440, 300]),
    ifok("Booked?", "={{ $json.ok ? 'yes' : 'no' }}", [660, 300]),
    code("Demo Row", "return [{ json: $('Book').first().json.row }];", [880, 200]),
    sheet_append("Save Demo", "Demos", [1100, 200]),
    tg("Notify Demo", "={{ '📅 <b>Demo reservada</b>\\n' + $('Book').first().json.row.name + ' · ' + $('Book').first().json.row.company + '\\n' + $('Book').first().json.row.when_madrid + ' (Madrid) · ' + $('Book').first().json.row.email }}", [1320, 200]),
    respond("Respond Book", "={{ JSON.stringify({ ok: $('Book').first().json.ok, say: $('Book').first().json.say, error: $('Book').first().json.error || null }) }}", [1540, 300]),
    node("Read me", "n8n-nodes-base.stickyNote", 1, {"content": "## Fluxa voice agent · Tools\nTwo webhooks called by the ElevenLabs agent:\n- POST /webhook/fluxa-availability → free demo slots\n- POST /webhook/fluxa-book → books a slot in the **Demos** tab\nSet the Sheet ID in the 3 Sheets nodes, the Telegram chat ID and credentials. Publish.", "height": 220, "width": 460}, [0, -300]),
]
con = {}
link(con, "Availability Webhook", "Read Demos"); link(con, "Read Demos", "Availability"); link(con, "Availability", "Respond Availability")
link(con, "Book Webhook", "Read Demos (book)"); link(con, "Read Demos (book)", "Book"); link(con, "Book", "Booked?")
link(con, "Booked?", "Demo Row", 0); link(con, "Booked?", "Respond Book", 1)
link(con, "Demo Row", "Save Demo"); link(con, "Save Demo", "Notify Demo"); link(con, "Notify Demo", "Respond Book")
json.dump({"name": "Fluxa Voice Agent · Tools", "nodes": nodes, "connections": con, "pinData": {},
           "settings": {"executionOrder": "v1", "timezone": "Europe/Madrid"}, "active": False, "tags": []},
          open('n8n/fluxa-tools.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# ---------- Post-call workflow ----------
nodes = [
    webhook("Post-call Webhook", "fluxa-post-call", [0, 0], respond_node=False),
    code("Post-call", r('post_call.js'), [220, 0]),
    code("Lead Row", "return [{ json: $input.first().json.row }];", [440, -100]),
    sheet_append("Save Lead", "Leads", [660, -100]),
    tg("Notify Lead", "={{ $('Post-call').first().json.text }}", [440, 100]),
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
    "data_collection_results: { name: { value: 'Lead de Prueba' }, company: { value: 'Empresa Demo' }, role: { value: 'Head of Operations' }, "
    "team_size: { value: '40' }, use_case: { value: 'Automatizar el reporting semanal de operaciones' }, timeline: { value: 'este trimestre' }, "
    "demo_booked: { value: true }, language: { value: 'es' } } } } }) }}")
nodes = [
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
