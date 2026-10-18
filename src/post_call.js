// ============================================================
// FLUXA DEMO · POST-CALL  (ElevenLabs post-call webhook)
// Extracts summary and collected data, scores the lead (BANT-lite) and prepares
// a row for the "Leads" tab plus a Telegram message.
// ============================================================
const req = $('Post-call Webhook').first().json;
const p = req.body || {};
const d = p.data || p;
const a = d.analysis || {};
const dc = a.data_collection_results || {};
const val = (k) => { const x = dc[k]; return x == null ? '' : (typeof x === 'object' ? (x.value ?? '') : x); };
const transcript = Array.isArray(d.transcript) ? d.transcript : [];
const meta = d.metadata || {};

let score = 0;
const size = parseInt(String(val('team_size')).replace(/\D/g, '')) || 0;
if (size >= 20) score += 25; else if (size >= 5) score += 15;
if (/director|head|vp|lead|manager|founder|ceo|coo|cto|responsable|jefe/i.test(String(val('role')))) score += 25;
if (/(this|next) (month|quarter)|este (mes|trimestre)|pr[oó]ximo (mes|trimestre)|asap|cuanto antes/i.test(String(val('timeline')))) score += 25;
if (String(val('use_case')).length > 15) score += 15;
if (String(val('demo_booked')).toLowerCase() === 'true') score += 10;
const tier = score >= 70 ? 'Caliente' : score >= 40 ? 'Templado' : 'Frío';

const row = {
  conversation_id: d.conversation_id || '', date: new Date().toISOString(), duration_s: meta.call_duration_secs || '',
  language: val('language'), name: val('name'), company: val('company'), role: val('role'), team_size: val('team_size'),
  use_case: val('use_case'), timeline: val('timeline'), demo_booked: String(val('demo_booked') || ''),
  score, tier, summary: String(a.transcript_summary || '').slice(0, 1500), turns: transcript.filter(t => t && t.message).length
};
// Monthly usage counter (ElevenLabs free plan = 15 min/month). Persists in workflow static data (production runs).
const FREE_MIN = 15;
const sd = (typeof $getWorkflowStaticData === 'function') ? $getWorkflowStaticData('global') : {};
const month = new Date().toISOString().slice(0, 7);
if (sd.month !== month) { sd.month = month; sd.seconds = 0; sd.calls = 0; }
sd.seconds = (sd.seconds || 0) + (Number(meta.call_duration_secs) || 0);
sd.calls = (sd.calls || 0) + 1;
const usedMin = Math.round(sd.seconds / 6) / 10;
row.month_minutes = usedMin;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = `📞 <b>Nueva llamada · ${tier} (${score})</b>\n` +
  `${esc(row.name || 'Sin nombre')} · ${esc(row.role || '?')} · ${esc(row.company || '?')}\n` +
  `Equipo: ${esc(row.team_size || '?')} · Plazo: ${esc(row.timeline || '?')} · Demo: ${row.demo_booked === 'true' ? 'sí' : 'no'}` +
  (row.summary ? `\n\n${esc(row.summary.slice(0, 600))}` : '') +
  `\n\n⏱️ Minutos de voz este mes: ~${usedMin} / ${FREE_MIN} (plan gratuito) · llamadas: ${sd.calls}` +
  (usedMin >= FREE_MIN * 0.8 ? '\n⚠️ Quedan pocos minutos: la demo dejará de responder al llegar a 15.' : '');
return [{ json: { row, text } }];
