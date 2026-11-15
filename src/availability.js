// ============================================================
// FLUXA · CHECK AVAILABILITY  (tool called by the voice agent)
// Free slots = schedule rules from Config minus the busy times returned by the agenda connector
// (Sheets "Demos" tab or Google Calendar). Rules: days, hours, length, notice, horizon in Config.
// Input (POST body from ElevenLabs): { preferred_day?: "2026-10-20" | "monday" | "lunes", language?: "es"|"en" }
// ============================================================
const cfg = $('Config').first().json;
if (!$('Agenda Request').first().json.authorized) return [{ json: { ok: false, error: 'unauthorized' } }];
const body = $('Availability Webhook').first().json.body || {};
const lang = String(body.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
const S = cfg.schedule, TZ = S.timezone, DUR = S.slot_minutes * 60000;
let busy = [];
try { busy = ($('Get Busy').first().json.busy || []).map(b => [new Date(b.start).getTime(), new Date(b.end).getTime()]).filter(([a, b]) => a < b); } catch (e) { busy = []; }
const isFree = (t) => !busy.some(([a, b]) => t < b && t + DUR > a);

// offset (minutes) of TZ at a given UTC instant
const tzOffset = (d) => {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return Math.round((asUTC - d.getTime()) / 60000);
};
// UTC Date for a wall-clock time in TZ
const local = (y, m, d, hh, mm) => { const guess = new Date(Date.UTC(y, m - 1, d, hh, mm)); return new Date(guess.getTime() - tzOffset(guess) * 60000); };
const localParts = (d) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
  .formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
const label = (d) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(d);

const DAYS = { sunday: 0, domingo: 0, monday: 1, lunes: 1, tuesday: 2, martes: 2, wednesday: 3, miercoles: 3, 'miércoles': 3, thursday: 4, jueves: 4, friday: 5, viernes: 5, saturday: 6, sabado: 6, 'sábado': 6 };
const pref = String(body.preferred_day || '').toLowerCase().trim();
const now = new Date();
const minStart = now.getTime() + S.min_notice_hours * 3600 * 1000;
const slots = [];
for (let i = 0; i < S.horizon_days && slots.length < 60; i++) {
  const p = localParts(new Date(now.getTime() + i * 86400000));
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  if (!S.weekdays.includes(wd)) continue;
  if (pref && /^\d{4}-\d{2}-\d{2}$/.test(pref) && `${p.year}-${p.month}-${p.day}` !== pref) continue;
  if (pref && DAYS[pref] !== undefined && DAYS[pref] !== wd) continue;
  for (let m = S.start_hour * 60; m + S.slot_minutes <= S.end_hour * 60; m += S.slot_minutes) {
    const s = local(+p.year, +p.month, +p.day, Math.floor(m / 60), m % 60);
    if (s.getTime() >= minStart && isFree(s.getTime())) slots.push(s);
  }
}
// offer a few spread-out options, not all of them
const pick = [];
for (const s of slots) { if (!pick.length || s - pick[pick.length - 1] >= S.spread_hours * 3600 * 1000) pick.push(s); if (pick.length >= S.max_offers) break; }
return [{ json: {
  ok: true, timezone: TZ,
  slots: pick.map(s => ({ slot_iso: s.toISOString(), label: label(s) })),
  note: pick.length ? '' : (lang === 'en' ? 'No free slots for that day. Offer another day.' : 'No hay huecos ese día. Ofrece otro día.')
} }];
