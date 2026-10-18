// ============================================================
// FLUXA · EXPLAIN ERROR — which node failed, what it means and how to fix it
// ============================================================
const d = $input.first().json || {};
const ex = d.execution || {};
const err = ex.error || {};
const node = ex.lastNodeExecuted || (err.node && err.node.name) || 'desconocido';
const msg = String(err.message || err.description || 'Sin mensaje de error');
const wf = (d.workflow && d.workflow.name) || 'Fluxa Voice Agent';
const t = (node + ' ' + msg).toLowerCase();
const isSheets = /(sheet|spreadsheet|google|read demos|save demo|save lead)/.test(t);
const isTg = /(telegram|notify|alert on telegram)/.test(t);

const RULES = [
  { test: isSheets && /(not found|unable to parse range|no sheet|requested entity)/.test(t),
    what: 'No se encuentra la hoja o la pestaña (Demos / Leads).',
    fix: 'Revisa el ID de la hoja "Fluxa demo" en los nodos de Google Sheets y que las pestañas se llamen exactamente Demos y Leads.' },
  { test: (isSheets && /(401|403|invalid_grant|unauthorized|permission|forbidden|reconnect)/.test(t)) || /(invalid_grant|needs to be reconnected)/.test(t),
    what: 'La credencial de Google no tiene acceso (caducada o sin permisos).',
    fix: 'Credentials → "Google Sheets account" → Switch account / reconectar, y guarda.' },
  { test: isTg && /(chat not found|bot was blocked|forbidden)/.test(t),
    what: 'Telegram no puede entregar el aviso: chat ID incorrecto o no iniciaste el bot.',
    fix: 'Abre @fluxa_alerts_syst_bot en Telegram y pulsa Iniciar; comprueba el chat ID 7711362732 en los nodos Notify.' },
  { test: isTg && /(401|unauthorized|not found)/.test(t),
    what: 'El token del bot de Fluxa no es válido.',
    fix: 'Copia el token actual en @BotFather (/mybots → fluxa_alerts_syst_bot → API Token) y actualiza la credencial "Fluxa bot".' },
  { test: /(can't parse entities|can.t parse entities)/.test(t),
    what: 'Telegram no pudo leer el formato del mensaje (algún carácter especial).',
    fix: 'Fallo puntual de formato: pásale el error a Claude para ajustar el mensaje.' },
  { test: /(credential|credentials).*(not|missing|found|set)|no credentials/.test(t),
    what: 'Un nodo no tiene credencial asignada.',
    fix: `Abre el nodo "${node}" y elige su credencial en el desplegable.` },
  { test: /(enotfound|econnrefused|etimedout|eai_again|socket hang up|timeout|timed out|503|502|504)/.test(t),
    what: 'Fallo de conexión o servicio externo caído temporalmente.',
    fix: 'Suele resolverse solo. Si se repite, revisa el VPS y la conexión de n8n.' },
  { test: /(syntaxerror|unexpected token|is not defined|cannot read propert|is not a function)/.test(t),
    what: 'Error en el código de un nodo (probablemente tras editarlo).',
    fix: 'Revisa el último cambio en ese nodo o pásale el error a Claude.' }
];
const rule = RULES.find(r => r.test) || { what: 'Error no clasificado.', fix: 'Abre la ejecución en n8n (Executions) y pásale el mensaje a Claude.' };
const text = [
  '⚠️ Fluxa voice agent: fallo',
  `Workflow: ${wf}`,
  `Nodo: "${node}"`,
  `Qué pasa: ${rule.what}`,
  `Posible solución: ${rule.fix}`,
  `Error original: ${msg.slice(0, 300)}`,
  ex.url ? `Ver ejecución: ${ex.url}` : ''
].filter(Boolean).join('\n');
return [{ json: { text } }];
