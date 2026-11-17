# Genera n8n/fluxa-all-in-one.json: TODO el agente en UN solo workflow, para vender o compartir (se importa en un paso).
# Parte de los workflows modulares ya generados (n8n/fluxa-*.json), así las dos versiones salen del mismo código.
# Ejecutar desde la raíz del repo (build_workflows.py lo llama al final).
#
# Cómo funciona: los conectores (Config, Agenda, Store, Notify, Email) viven en el mismo workflow, detrás de un único
# "Execute Workflow Trigger". Cada llamada a un conector pasa antes por un nodo "→ <conector>" que añade `_sub`, y el
# Execute Workflow se llama a sí mismo (`$workflow.id`). El Switch "Which connector" envía cada llamada a su conector.
import json, re, uuid

L = lambda f: json.load(open('n8n/' + f, encoding='utf-8'))
SUBS = [('config', 'Config'), ('agenda', 'Agenda'), ('store', 'Store'), ('notify', 'Notify'), ('email', 'Email')]
SUB_OF = {f'REPLACE_WITH_{k.upper()}_WORKFLOW_ID': k for k, _ in SUBS}
uid = lambda s: str(uuid.uuid5(uuid.NAMESPACE_DNS, 'fluxa-aio-' + s))
REF = re.compile(r"\$\('([^']+)'\)")

nodes, con = [], {}
def link(a, b, out=0, idx=0):
    m = con.setdefault(a, {"main": []})["main"]
    while len(m) <= out: m.append([])
    m[out].append({"node": b, "type": "main", "index": idx})
def bbox(ns):
    xs = [n['position'][0] for n in ns]; ys = [n['position'][1] for n in ns]
    for n in ns:
        if n['type'].endswith('stickyNote'):
            xs.append(n['position'][0] + n['parameters'].get('width', 0)); ys.append(n['position'][1] + n['parameters'].get('height', 0))
    return min(xs), min(ys), max(xs), max(ys)
def rename_refs(obj, mapping):
    s = json.dumps(obj, ensure_ascii=False)
    s = REF.sub(lambda m: "$('" + mapping.get(m.group(1), m.group(1)) + "')", s)
    return json.loads(s)
def setsub(name, sub, pos):
    return {"parameters": {"mode": "manual", "assignments": {"assignments": [{"id": uid(name), "name": "_sub", "value": sub, "type": "string"}]},
                           "includeOtherFields": True, "options": {}},
            "id": uid(name), "name": name, "type": "n8n-nodes-base.set", "typeVersion": 3.4, "position": pos}

def add_main(wf, rename, dy, label):
    """Add a top-level workflow (Tools, Post-call, Error, Self-test). rename: old name -> new name."""
    ns = [dict(n) for n in wf['nodes']]
    x0, y0, _, y1 = bbox(ns)
    calls = {}
    for n in ns:
        new = rename.get(n['name'], n['name'])
        if n['type'].endswith('stickyNote'): new = f'{label} · {n["name"]}'
        n['parameters'] = rename_refs(n['parameters'], rename)
        n['name'] = new; n['id'] = uid(label + new)
        n['position'] = [n['position'][0] - x0, n['position'][1] - y0 + dy]
        if n['type'].endswith('executeWorkflow'):
            sub = SUB_OF[n['parameters']['workflowId']['value']]
            n['parameters']['workflowId'] = {"__rl": True, "value": "={{ $workflow.id }}", "mode": "id"}
            calls[new] = sub
        nodes.append(n)
    # connections, inserting "→ sub" before each connector call
    for a, outs in wf['connections'].items():
        for oi, targets in enumerate(outs['main']):
            for t in targets:
                link(rename.get(a, a), rename.get(t['node'], t['node']), oi, t['index'])
    for call, sub in calls.items():
        pre = f'→ {sub} ({call})'
        cn = next(n for n in nodes if n['name'] == call)
        nodes.append(setsub(pre, sub, [cn['position'][0], cn['position'][1] + 120]))
        for a, outs in con.items():
            for targets in outs['main']:
                for t in targets:
                    if t['node'] == call and a != pre: t['node'] = pre
        link(pre, call)
    return dy + (y1 - y0) + 260

def add_sub(wf, key, title, dy, x_off):
    ns = [dict(n) for n in wf['nodes']]
    x0, y0, _, y1 = bbox(ns)
    mapping = {n['name']: f'{title} · {n["name"]}' for n in ns}
    for n in ns:
        n['parameters'] = rename_refs(n['parameters'], mapping)
        n['name'] = mapping[n['name']]; n['id'] = uid(n['name'])
        n['position'] = [n['position'][0] - x0 + x_off, n['position'][1] - y0 + dy]
        if n['type'].endswith('executeWorkflowTrigger'):   # the shared trigger replaces it: keep a pass-through node with the same role
            n['type'] = 'n8n-nodes-base.noOp'; n['typeVersion'] = 1; n['parameters'] = {}
        nodes.append(n)
    for a, outs in wf['connections'].items():
        for oi, targets in enumerate(outs['main']):
            for t in targets: link(mapping[a], mapping[t['node']], oi, t['index'])
    return mapping['Start'], dy + (y1 - y0) + 200

# ---------- Read me ----------
nodes.append({"parameters": {"color": 4, "width": 1100, "height": 360, "content":
    "## Fluxa voice agent · versión todo en uno\nTodo el backend de Nora en **un solo workflow**. Guía paso a paso: `docs/instalacion.md` del repo.\n\n"
    "**Bloques (de arriba abajo):** ① Tools (disponibilidad y reserva) · ② Post-call (puntuación, Leads y aviso) · "
    "③ Error Alert · ④ Self-test · ⑤ Conectores (Config, Agenda, Store, Notify, Email).\n\n"
    "**Para ponerlo en marcha:**\n1. Edita **Config · Config** (marca, horario, clave, ID de la hoja, chat de Telegram, proveedores).\n"
    "2. Elige tus credenciales en los nodos de Google Sheets, Google Calendar, Gmail y Telegram.\n"
    "3. Publica el workflow y copia las URLs de los webhooks en ElevenLabs.\n\n"
    "Los nodos **→ …** solo indican a qué conector va cada llamada: no hay que tocarlos."},
    "id": uid('readme'), "name": "Léeme", "type": "n8n-nodes-base.stickyNote", "typeVersion": 1, "position": [0, -460]})

dy = 0
dy = add_main(L('fluxa-tools.json'), {}, dy, 'Tools')
dy = add_main(L('fluxa-post-call.json'), {'Config': 'Config (post-call)'}, dy, 'Post-call')

# Error alert: same workflow (an Error Trigger inside the workflow fires on its own failures). Chat id comes from Config.
err = L('fluxa-error-alert.json')
for n in err['nodes']:
    if n['name'] == 'Alert on Telegram':
        n['parameters']['chatId'] = "={{ $json.connectors.notify.chat_id }}"
        n['parameters']['text'] = "={{ $('Explain Error').first().json.text }}"
err['connections'] = {"Error Trigger": {"main": [[{"node": "Explain Error", "type": "main", "index": 0}]]},
                      "Explain Error": {"main": [[{"node": "Config (errors)", "type": "main", "index": 0}]]},
                      "Config (errors)": {"main": [[{"node": "Alert on Telegram", "type": "main", "index": 0}]]}}
ex = next(n for n in err['nodes'] if n['name'] == 'Explain Error')
# A failing connector fails twice: its own run (mode "integrated") and the caller. Alert once, for the caller
# (its message already carries the connector's error). Tested in n8n 2026-11-17.
ex['parameters']['jsCode'] = ("// All-in-one: skip the connector's own failure; the calling run reports it with the same message.\n"
                              "if ((($input.first().json || {}).execution || {}).mode === 'integrated') return [];\n" + ex['parameters']['jsCode'])
err['nodes'].append({"parameters": {"mode": "once", "workflowId": {"__rl": True, "value": "REPLACE_WITH_CONFIG_WORKFLOW_ID", "mode": "id"},
                     "options": {"waitForSubWorkflow": True}}, "id": "x", "name": "Config (errors)", "type": "n8n-nodes-base.executeWorkflow",
                     "typeVersion": 1.2, "position": [ex['position'][0] + 220, ex['position'][1]]})
for n in err['nodes']:
    if n['name'] == 'Alert on Telegram': n['position'] = [n['position'][0] + 220, n['position'][1]]
dy = add_main(err, {}, dy, 'Error Alert')
dy = add_main(L('fluxa-selftest.json'), {'Config': 'Self-test Settings'}, dy, 'Self-test')

# ---------- Connectors behind one trigger ----------
trig, sw = "Connector Call", "Which connector"
nodes.append({"parameters": {"inputSource": "passthrough"}, "id": uid(trig), "name": trig,
              "type": "n8n-nodes-base.executeWorkflowTrigger", "typeVersion": 1.1, "position": [0, dy + 200]})
rules = [{"conditions": {"options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 2},
          "conditions": [{"id": uid('sw' + k), "leftValue": "={{ $json._sub }}", "rightValue": k,
                          "operator": {"type": "string", "operation": "equals"}}], "combinator": "and"},
          "renameOutput": True, "outputKey": k} for k, _ in SUBS]
nodes.append({"parameters": {"rules": {"values": rules}, "options": {}}, "id": uid(sw), "name": sw,
              "type": "n8n-nodes-base.switch", "typeVersion": 3.2, "position": [220, dy + 200]})
link(trig, sw)
for i, (k, title) in enumerate(SUBS):
    start, dy = add_sub(L(f'fluxa-{k}.json'), k, title, dy, 520)
    link(sw, start, i)

# Every connector call must reach a node that exists
names = {n['name'] for n in nodes}
for n in nodes:
    for ref in REF.findall(json.dumps(n['parameters'], ensure_ascii=False)):
        assert ref in names, f'{n["name"]} references missing node {ref}'
for a, outs in con.items():
    assert a in names, a
    for targets in outs['main']:
        for t in targets: assert t['node'] in names, t['node']

json.dump({"name": "Fluxa Voice Agent · All-in-one", "nodes": nodes, "connections": con, "pinData": {},
           "settings": {"executionOrder": "v1", "timezone": "Europe/Madrid", "callerPolicy": "workflowsFromSameOwner"},
           "active": False, "tags": []}, open('n8n/fluxa-all-in-one.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok all-in-one', len(nodes), 'nodes')
