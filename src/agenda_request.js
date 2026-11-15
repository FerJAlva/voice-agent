// ============================================================
// FLUXA · AGENDA REQUEST  (Tools: before "Get Busy")
// Checks the x-demo-key header and asks the agenda connector for the busy times we need:
// the whole booking horizon (availability) or a window around the chosen slot (booking).
// Unauthorized requests skip the connector; the next node answers "unauthorized".
// ============================================================
const cfg = $('Config').first().json;
const req = $('Availability Webhook').first().json;
const key = (cfg.security || {}).demo_key;
const authorized = !key || key === 'CHANGE_ME_IN_N8N' || (req.headers || {})['x-demo-key'] === key;
const s = cfg.schedule, agenda = cfg.connectors.agenda, store = cfg.connectors.store;
const slot = new Date((req.body || {}).slot_iso || '');
const now = Date.now(), H = 3600000;
const from = isNaN(slot) ? new Date(now) : new Date(slot.getTime() - 12 * H);
const to = isNaN(slot) ? new Date(now + (s.horizon_days + 1) * 24 * H) : new Date(slot.getTime() + 12 * H);
return [{ json: {
  action: authorized ? 'busy' : 'skip', authorized,
  provider: agenda.provider, calendar_id: agenda.calendar_id || 'primary',
  sheet_id: store.sheet_id, tab: store.demos_tab,
  slot_minutes: s.slot_minutes, from: from.toISOString(), to: to.toISOString()
} }];
