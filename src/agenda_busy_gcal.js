// FLUXA · AGENDA · Google Calendar → busy times. Every event that blocks time counts
// (events marked "free"/transparent and cancelled ones do not). All-day events block the whole day.
// If the Google Calendar node is disabled (no credential yet) n8n passes the request through: fail loudly.
if ($input.first().json.action) throw new Error('Google Calendar no está conectado: activa los nodos de Google Calendar en el sub-workflow Agenda y elige la credencial.');
const busy = [];
for (const { json: e } of $input.all()) {
  if (!e || !e.start || e.status === 'cancelled' || e.transparency === 'transparent') continue;
  const start = new Date(e.start.dateTime || e.start.date), end = new Date((e.end || {}).dateTime || (e.end || {}).date || start);
  if (!isNaN(start) && !isNaN(end) && end > start) busy.push({ start: start.toISOString(), end: end.toISOString() });
}
return [{ json: { ok: true, provider: 'google_calendar', busy } }];
