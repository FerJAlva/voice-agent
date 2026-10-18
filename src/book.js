// ============================================================
// FLUXA DEMO · BOOK DEMO  (tool called by the voice agent)
// Input: { name, email, company, role?, team_size?, use_case?, slot_iso, language? }
// Validates the slot and returns { ok, row, say }. The row is appended to the "Demos" tab.
// ============================================================
const SECRET = 'CHANGE_ME_IN_N8N';
const req = $('Book Webhook').first().json;
if (SECRET !== 'CHANGE_ME_IN_N8N' && (req.headers || {})['x-demo-key'] !== SECRET) return [{ json: { ok: false, error: 'unauthorized' } }];
const b = req.body || {};
const lang = String(b.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
const fail = (error, es, en, extra = {}) => [{ json: { ok: false, error, say: lang === 'en' ? en : es, ...extra } }];
const missing = ['name', 'email', 'company', 'slot_iso'].filter(k => !String(b[k] || '').trim());
if (missing.length) return fail('missing_fields', `Me falta: ${missing.join(', ')}.`, `I still need: ${missing.join(', ')}.`, { missing });
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(b.email).trim())) return fail('invalid_email', 'Ese email no parece válido. ¿Me lo deletreas de nuevo?', 'That email does not look valid. Can you spell it again?');
const slot = new Date(b.slot_iso);
if (isNaN(slot) || slot.getTime() < Date.now()) return fail('invalid_slot', 'Ese horario no está disponible. Déjame ver otras opciones.', 'That time is not available. Let me check other options.');
let booked = [];
try { booked = $('Read Demos').all().map(i => String(i.json.slot_iso || '')); } catch (e) { booked = []; }
if (booked.includes(slot.toISOString())) return fail('slot_taken', 'Ese hueco se acaba de ocupar. Te ofrezco otro.', 'That slot was just taken. Let me offer another one.');
const id = 'demo_' + Date.now().toString(36);
const when = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(slot);
return [{ json: {
  ok: true,
  row: { id, slot_iso: slot.toISOString(), when_madrid: when, name: String(b.name).trim(), email: String(b.email).trim().toLowerCase(),
         company: String(b.company).trim(), role: String(b.role || ''), team_size: String(b.team_size || ''), use_case: String(b.use_case || ''),
         language: lang, created_at: new Date().toISOString() },
  say: lang === 'en' ? `Done. Your demo is booked for ${when} (Madrid time). You will get a confirmation by email.`
                     : `Listo. Tu demo queda reservada para el ${when} (hora de Madrid). Recibirás la confirmación por email.`
} }];
