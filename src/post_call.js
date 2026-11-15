// ============================================================
// FLUXA DEMO · POST-CALL  (ElevenLabs post-call webhook)
// Extracts summary and collected data, scores the lead (BANT-lite) and prepares
// a row for the "Leads" tab plus a Telegram message.
// ============================================================
const req = $('Post-call Webhook').first().json;
const p = req.body || {};
const d = p.data || p;
const a = d.analysis || {};
// ElevenLabs keys each result by an internal id (aitem_…) and puts the identifier in x.name.
// Older payloads keyed them by identifier. Index by identifier (lower case) so both work.
const dc = {};
for (const [k, x] of Object.entries(a.data_collection_results || {})) {
  dc[String((x && typeof x === 'object' && x.name) || k).trim().toLowerCase()] = x;
}
const val = (k) => { const x = dc[k]; return x == null ? '' : (typeof x === 'object' ? (x.value ?? '') : x); };
const transcript = Array.isArray(d.transcript) ? d.transcript : [];
const meta = d.metadata || {};

// ---------- LEAD SCORING (edit SCORING to adapt it to each client) ----------
// Each rule adds points and leaves a reason, so the sales team sees WHY a lead is hot.
const SCORING = {
  hot: 70, warm: 40,                                   // tier thresholds (0–100)
  teamLarge: 20, teamMid: 5,                           // team-size thresholds
  weights: { teamLarge: 25, teamMid: 15, decisionRole: 25, nearTimeline: 25, clearUseCase: 15, demoBooked: 10, fitHigh: 10, fitMedium: 5 },
  // Roles that can decide or strongly influence the purchase (ES/EN)
  decisionRoles: /\b(ceo|coo|cto|cfo|cmo|cro|cio|chief|founder|co-?founder|fundador[a]?|owner|dueñ[oa]|socio|partner|vp|vice ?president|president[ea]?|director[a]?|head|lead|manager|gerente|responsable|jef[ea])\b/i,
  // Timelines within ~3 months
  nearTimeline: /(this|next) (week|month|quarter)|asap|right away|urgent|immediately|in (a|one|two|three|1|2|3) (weeks?|months?)|est[ea] (semana|mes|trimestre)|pr[oó]xim[oa] (semana|mes|trimestre)|cuanto antes|ya mismo|urgente|inmediat|en (una|dos|tres|1|2|3) (semanas?|mes|meses)/i,
  nearMonths: 3,                                       // a month named by the caller ("en enero") counts if it is at most this many months ahead
  minUseCaseWords: 4                                   // a use case with at least this many words counts as clear
};
const W = SCORING.weights;
const reasons = [];                                    // [points, text]
const size = parseInt(String(val('team_size')).replace(/\D/g, '')) || 0;
if (size >= SCORING.teamLarge) reasons.push([W.teamLarge, `equipo de ${size}`]);
else if (size >= SCORING.teamMid) reasons.push([W.teamMid, `equipo de ${size}`]);
else reasons.push([0, size ? `equipo pequeño: ${size}` : 'tamaño de equipo desconocido']);
const role = String(val('role')).trim();
reasons.push(SCORING.decisionRoles.test(role) ? [W.decisionRole, `cargo con decisión: ${role}`] : [0, role ? `cargo sin decisión clara: ${role}` : 'cargo desconocido']);
const timeline = String(val('timeline')).trim();
const MONTHS = ['enero|january|jan', 'febrero|february|feb', 'marzo|march|mar', 'abril|april|apr', 'mayo', 'junio|june|jun', 'julio|july|jul', 'agosto|august|aug', 'septiembre|setiembre|september|sept?', 'octubre|october|oct', 'noviembre|november|nov', 'diciembre|december|dec'];
const mi = MONTHS.findIndex(m => new RegExp(`\\b(${m})\\b`, 'i').test(timeline));
const monthsAhead = mi < 0 ? 99 : (mi - new Date().getMonth() + 12) % 12;
reasons.push(SCORING.nearTimeline.test(timeline) || monthsAhead <= SCORING.nearMonths ? [W.nearTimeline, `plazo cercano: ${timeline}`] : [0, timeline ? `plazo lejano o vago: ${timeline}` : 'sin plazo']);
const useCase = String(val('use_case')).trim();
reasons.push(useCase.split(/\s+/).filter(Boolean).length >= SCORING.minUseCaseWords ? [W.clearUseCase, 'caso de uso claro'] : [0, 'caso de uso poco claro']);
if (String(val('demo_booked')).toLowerCase() === 'true') reasons.push([W.demoBooked, 'reservó demo']);
// Optional: LLM judgement from an ElevenLabs data-collection field "icp_fit" (high / medium / low)
const fit = String(val('icp_fit')).toLowerCase();
if (/high|alto/.test(fit)) reasons.push([W.fitHigh, 'encaje alto con el cliente ideal']);
else if (/medium|medio/.test(fit)) reasons.push([W.fitMedium, 'encaje medio con el cliente ideal']);
const score = Math.min(100, reasons.reduce((t, [p]) => t + p, 0));
const tier = score >= SCORING.hot ? 'Caliente' : score >= SCORING.warm ? 'Templado' : 'Frío';
// Text first, points after: a cell starting with "+" would be read as a formula by Google Sheets
const scoreReasons = reasons.map(([p, t]) => `${t} (${p ? '+' + p : '0'})`).join(' · ');

const row = {
  conversation_id: d.conversation_id || '', date: new Date().toISOString(), duration_s: meta.call_duration_secs || '',
  language: val('language'), name: val('name'), company: val('company'), role: val('role'), team_size: val('team_size'),
  use_case: val('use_case'), timeline: val('timeline'), demo_booked: String(val('demo_booked') || ''),
  score, tier, score_reasons: scoreReasons, summary: String(a.transcript_summary || '').slice(0, 1500), turns: transcript.filter(t => t && t.message).length
};
// Monthly usage counter (ElevenLabs free plan = 15 min/month). Persists in workflow static data (production runs).
const FREE_MIN = 15;
const sd = (typeof $getWorkflowStaticData === 'function') ? $getWorkflowStaticData('global') : {};
const month = new Date().toISOString().slice(0, 7);
if (sd.month !== month) { sd.month = month; sd.seconds = 0; sd.calls = 0; }
const isSelfTest = String(d.conversation_id || '').startsWith('selftest');   // self-tests never count towards the quota
const isText = meta.text_only === true;                                        // text chats use no voice minutes
if (!isSelfTest && !isText) {
  sd.seconds = (sd.seconds || 0) + (Number(meta.call_duration_secs) || 0);
  sd.calls = (sd.calls || 0) + 1;
}
const usedMin = Math.round(sd.seconds / 6) / 10;
row.month_minutes = usedMin;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = `${isSelfTest ? '🧪 <b>[AUTOPRUEBA]</b> ' : ''}📞 <b>Nueva llamada · ${tier} (${score})</b>\n` +
  `${esc(row.name || 'Sin nombre')} · ${esc(row.role || '?')} · ${esc(row.company || '?')}\n` +
  `Equipo: ${esc(row.team_size || '?')} · Plazo: ${esc(row.timeline || '?')} · Demo: ${row.demo_booked === 'true' ? 'sí' : 'no'}` +
  `\n<i>Por qué: ${esc(scoreReasons)}</i>` +
  (row.summary ? `\n\n${esc(row.summary.slice(0, 600))}` : '') +
  `\n\n⏱️ Minutos de voz este mes: ~${usedMin} / ${FREE_MIN} (plan gratuito) · llamadas: ${sd.calls}` + (isSelfTest ? ' · (autoprueba: no cuenta)' : '') + (isText && !isSelfTest ? ' · (chat de texto: no cuenta)' : '') +
  (usedMin >= FREE_MIN * 0.8 ? '\n⚠️ Quedan pocos minutos: la demo dejará de responder al llegar a 15.' : '');
return [{ json: { row, text } }];
