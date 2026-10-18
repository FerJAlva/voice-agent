// ============================================================
// FLUXA DEMO · CHECK AVAILABILITY  (tool called by the voice agent)
// Demo rules: Mon–Fri, 10:00–17:00 Europe/Madrid, 30-min slots, next business days,
// minus slots already booked in the Google Sheets tab "Demos".
// Input (POST body from ElevenLabs): { preferred_day?: "2026-10-20" | "monday" | "lunes", language?: "es"|"en" }
// ============================================================
const SECRET = 'CHANGE_ME_IN_N8N';           // optional: must match the header x-demo-key set in the ElevenLabs tool
const req = $('Availability Webhook').first().json;
if (SECRET !== 'CHANGE_ME_IN_N8N' && (req.headers || {})['x-demo-key'] !== SECRET) return [{ json: { ok: false, error: 'unauthorized' } }];
const body = req.body || {};
const lang = String(body.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
const TZ = 'Europe/Madrid';
let booked = [];
try { booked = $('Read Demos').all().map(i => String(i.json.slot_iso || '')).filter(Boolean); } catch (e) { booked = []; }
const bookedSet = new Set(booked);

// offset (minutes) of TZ at a given UTC instant
const tzOffset = (d) => {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return Math.round((asUTC - d.getTime()) / 60000);
};
// UTC Date for a Madrid wall-clock time
const madrid = (y, m, d, hh, mm) => { const guess = new Date(Date.UTC(y, m - 1, d, hh, mm)); return new Date(guess.getTime() - tzOffset(guess) * 60000); };
const localParts = (d) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
  .formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
const label = (d) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(d);

const DAYS = { monday: 1, lunes: 1, tuesday: 2, martes: 2, wednesday: 3, miercoles: 3, 'miércoles': 3, thursday: 4, jueves: 4, friday: 5, viernes: 5 };
const pref = String(body.preferred_day || '').toLowerCase().trim();
const now = new Date();
const minStart = now.getTime() + 2 * 3600 * 1000;   // at least 2 h notice
const slots = [];
for (let i = 0; i < 14 && slots.length < 40; i++) {
  const p = localParts(new Date(now.getTime() + i * 86400000));
  const wd = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }[p.weekday];
  if (wd === 0 || wd === 6) continue;
  if (pref && /^\d{4}-\d{2}-\d{2}$/.test(pref) && `${p.year}-${p.month}-${p.day}` !== pref) continue;
  if (pref && DAYS[pref] && DAYS[pref] !== wd) continue;
  for (let h = 10; h < 17; h++) for (const mm of [0, 30]) {
    const s = madrid(+p.year, +p.month, +p.day, h, mm);
    if (s.getTime() < minStart) continue;
    if (!bookedSet.has(s.toISOString())) slots.push(s);
  }
}
// offer a few spread-out options, not all of them
const pick = [];
for (const s of slots) { if (!pick.length || s - pick[pick.length - 1] >= 3 * 3600 * 1000) pick.push(s); if (pick.length >= 4) break; }
return [{ json: {
  ok: true, timezone: TZ,
  slots: pick.map(s => ({ slot_iso: s.toISOString(), label: label(s) })),
  note: pick.length ? '' : (lang === 'en' ? 'No free slots for that day. Offer another day.' : 'No hay huecos ese día. Ofrece otro día.')
} }];
