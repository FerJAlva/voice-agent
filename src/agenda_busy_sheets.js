// FLUXA · AGENDA · Sheets → busy times. Each row of the Demos tab blocks [slot_iso, slot_iso + slot length).
const req = $('Start').first().json;
const dur = (Number(req.slot_minutes) || 30) * 60000;
const busy = $input.all()
  .map(i => new Date(String(i.json.slot_iso || '')))
  .filter(d => !isNaN(d))
  .map(d => ({ start: d.toISOString(), end: new Date(d.getTime() + dur).toISOString() }));
return [{ json: { ok: true, provider: 'sheets', busy } }];
