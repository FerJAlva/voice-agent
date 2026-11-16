// node tests/run_tests.js — tests the n8n code nodes with synthetic data (no credentials)
const fs = require('fs'); const path = require('path');
const S = path.join(__dirname, '..', 'src') + '/';
const SD = {};
const run = (file, nodes) => new Function('$', '$getWorkflowStaticData', fs.readFileSync(S + file, 'utf8'))((n) => ({ first: () => ({ json: nodes[n][0] }), all: () => (nodes[n] || []).map(j => ({ json: j })) }), () => SD)[0].json;
const ok = (c, m) => { console.log((c ? 'ok  - ' : 'FAIL- ') + m); if (!c) process.exitCode = 1; };
const CFG = run('config.js', {});
const cfgWith = (patch) => JSON.parse(JSON.stringify({ ...CFG, ...patch }));
// Availability / Book now read Config + "Agenda Request" + busy times from the agenda connector ("Get Busy")
const busyOf = (isos, min = 30) => ({ ok: true, busy: isos.map(s => ({ start: s, end: new Date(new Date(s).getTime() + min * 60000).toISOString() })) });
const avail = (body, busy = [], cfg = CFG, authorized = true) => run('availability.js', { 'Config': [cfg], 'Agenda Request': [{ authorized }], 'Availability Webhook': [{ body }], 'Get Busy': [busyOf(busy)] });
const book = (body, busy = [], cfg = CFG, authorized = true) => run('book.js', { 'Config': [cfg], 'Agenda Request': [{ authorized }], 'Book Webhook': [{ body }], 'Get Busy': [busyOf(busy)] });

const av = avail({ language: 'es' });
ok(av.ok && av.slots.length > 0, 'availability returns slots (' + av.slots.map(s => s.label).join(' | ') + ')');
const h = new Date(av.slots[0].slot_iso).toLocaleString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', weekday: 'short' });
ok(/^(Mon|Tue|Wed|Thu|Fri)/.test(h) && +h.slice(-5, -3) >= 10 && +h.slice(-5, -3) < 17, 'first slot is a weekday between 10:00 and 17:00 Madrid (' + h + ')');
const taken = avail({ language: 'en' }, [av.slots[0].slot_iso]);
ok(!taken.slots.some(s => s.slot_iso === av.slots[0].slot_iso), 'booked slot is excluded');
const fri = avail({ preferred_day: 'viernes' });
ok(fri.slots.every(s => new Date(s.slot_iso).toLocaleString('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short' }).startsWith('Fri')), 'preferred day filter (viernes)');

const bad = book({ name: 'Ana', email: 'ana@', company: 'Acme', slot_iso: av.slots[0].slot_iso });
ok(!bad.ok && bad.error === 'invalid_email', 'booking rejects invalid email');
const good = book({ name: 'Ana López', email: 'ana@acme.io', company: 'Acme', team_size: '40', slot_iso: av.slots[0].slot_iso, language: 'es' });
ok(good.ok && good.row.id && /Listo/.test(good.say), 'booking succeeds: ' + good.say);
const dup = book({ name: 'B', email: 'b@b.io', company: 'B', slot_iso: av.slots[0].slot_iso }, [av.slots[0].slot_iso]);
ok(!dup.ok && dup.error === 'slot_taken', 'double booking blocked');

const pc = run('post_call.js', { 'Config': [CFG], 'Post-call Webhook': [{ body: { type: 'post_call_transcription', data: { conversation_id: 'c1', metadata: { call_duration_secs: 142 },
  transcript: [{ role: 'agent', message: 'Hola' }, { role: 'user', message: 'Hola' }],
  analysis: { transcript_summary: 'Lead interesado en automatizar reporting.', data_collection_results: {
    name: { value: 'Ana López' }, company: { value: 'Acme' }, role: { value: 'Head of Operations' }, team_size: { value: '40' },
    use_case: { value: 'Automatizar el reporting semanal de operaciones' }, timeline: { value: 'este trimestre' }, demo_booked: { value: true } } } } } }] });
ok(pc.row.score === 100 && pc.row.tier === 'Caliente', 'post-call lead score ' + pc.row.score + ' (' + pc.row.tier + ')');
ok(/Nueva llamada/.test(pc.text), 'Telegram text built');
ok(/Minutos de voz este mes: ~2.4 \/ 15/.test(pc.text), 'monthly minutes counter (' + pc.row.month_minutes + ' min)');
const st = run('post_call.js', { 'Config': [CFG], 'Post-call Webhook': [{ body: { data: { conversation_id: 'selftest-1', metadata: { call_duration_secs: 95 }, analysis: { data_collection_results: {} } } } }] });
ok(st.row.month_minutes === 2.4 && /AUTOPRUEBA/.test(st.text), 'self-test does not count towards the monthly minutes');

// Post-call: current ElevenLabs format (results keyed by aitem_ id, identifier in .name, mixed case)
const pc2 = run('post_call.js', { 'Config': [CFG], 'Post-call Webhook': [{ body: { data: { conversation_id: 'c2', metadata: { call_duration_secs: 60, text_only: true },
  analysis: { data_collection_results: { aitem_a: { name: 'Name', value: 'Luis Gil' }, aitem_b: { name: 'company', value: 'Gil SL' },
    aitem_c: { name: 'team_size', value: '25 personas' }, aitem_d: { name: 'demo_booked', value: false } } } } } }] });
ok(pc2.row.name === 'Luis Gil' && pc2.row.company === 'Gil SL' && pc2.row.team_size === '25 personas', 'post-call reads aitem_ format (case-insensitive)');
ok(pc2.row.month_minutes === 2.4 && /chat de texto/.test(pc2.text), 'text-only chats do not count towards the monthly minutes');

// Confirmation email
const runAll = (file, nodes) => new Function("$", "URLSearchParams", fs.readFileSync(S + file, 'utf8'))((n) => { if (!nodes[n]) throw new Error('node not executed: ' + n); return { first: () => ({ json: nodes[n][0] }) }; });
const mail = (b, extra = {}) => runAll('confirm_email.js', { 'Config': [CFG], 'Book': [b], ...extra });
const em = mail(good)[0].json;
const gd = decodeURIComponent((em.gcal_url.match(/dates=([^&]+)/) || [])[1] || '');
const startUtc = new Date(good.row.slot_iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
ok(em.to === 'ana@acme.io' && /confirmada/.test(em.subject), 'email built for the lead: ' + em.subject);
ok(gd.startsWith(startUtc + '/') && /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/.test(em.gcal_url), 'Google Calendar link has the right start time (' + gd + ')');
const xss = mail({ ...good, row: { ...good.row, company: '<script>x</script>' } })[0].json;
ok(!/<script>x/.test(xss.html) && /&lt;script&gt;/.test(xss.html), 'email escapes HTML in lead data');
ok(mail({ ...good, row: { ...good.row, email: 'prueba@example.com' } }).length === 0, 'no email for test addresses (@example.com)');
ok(mail(bad).length === 0, 'no email when the booking failed');

// Explained scoring
const pcR = (dc) => run('post_call.js', { 'Config': [CFG], 'Post-call Webhook': [{ body: { data: { conversation_id: 'r' + Math.random(), metadata: { text_only: true },
  analysis: { data_collection_results: Object.fromEntries(Object.entries(dc).map(([k, v], i) => ['aitem_' + i, { name: k, value: v }])) } } } }] });
const r1 = pcR({ team_size: '40', role: 'Head of Operations', timeline: 'este trimestre', use_case: 'Automatizar el reporting semanal', demo_booked: true });
ok(r1.row.score === 100 && /cargo con decisión: Head of Operations \(\+25\)/.test(r1.row.score_reasons) && /Por qué:/.test(r1.text), 'score reasons explained: ' + r1.row.score_reasons);
const r2 = pcR({ team_size: '3', role: 'analista', timeline: 'el año que viene', use_case: 'reportes' });
ok(!/^[+=-]/.test(r1.row.score_reasons) && r2.row.score === 0 && r2.row.tier === 'Frío' && /plazo lejano/.test(r2.row.score_reasons), 'cold lead scores 0 with reasons');
const nextMonth = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][(new Date().getMonth() + 1) % 12];
const farMonth = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][(new Date().getMonth() + 6) % 12];
ok(/plazo cercano.*\(\+25\)/.test(pcR({ timeline: 'en ' + nextMonth }).row.score_reasons) && /plazo lejano/.test(pcR({ timeline: 'en ' + farMonth }).row.score_reasons), `month timelines: ${nextMonth} counts, ${farMonth} does not`);
ok(/cargo con decisión/.test(pcR({ role: 'Dueña' }).row.score_reasons) && /cargo con decisión/.test(pcR({ role: 'VP Sales' }).row.score_reasons), 'decision roles: Dueña, VP');
ok(pcR({ team_size: '40', role: 'CEO', timeline: 'asap', use_case: 'automatizar todas las aprobaciones de compras', demo_booked: true, icp_fit: 'high' }).row.score === 100, 'score capped at 100 with icp_fit');

// ---------- Config + connectors ----------
ok(CFG.connectors && CFG.connectors.agenda.provider === 'sheets' && CFG.security.demo_key === 'CHANGE_ME_IN_N8N' && /REPLACE_WITH/.test(CFG.connectors.store.sheet_id), 'config ships with placeholders only (no real ids or keys)');
const areq = (headers, body, cfg = CFG) => run('agenda_request.js', { 'Config': [cfg], 'Availability Webhook': [{ headers, body }] });
const keyed = cfgWith({ security: { demo_key: 'k123' } });
ok(areq({}, {}).authorized && areq({}, {}).action === 'busy', 'no key configured = open (template default)');
ok(!areq({ 'x-demo-key': 'nope' }, {}, keyed).authorized && areq({ 'x-demo-key': 'nope' }, {}, keyed).action === 'skip' && areq({ 'x-demo-key': 'k123' }, {}, keyed).authorized, 'x-demo-key checked against Config');
const win = areq({}, { slot_iso: av.slots[0].slot_iso });
ok(new Date(win.from) < new Date(av.slots[0].slot_iso) && new Date(win.to) > new Date(av.slots[0].slot_iso), 'booking asks for busy times around the chosen slot');
ok(avail({}, [], CFG, false).error === 'unauthorized' && book({ name: 'A' }, [], CFG, false).error === 'unauthorized', 'unauthorized requests are rejected');
// overlap with an existing calendar event (not only exact slot matches)
const s0 = new Date(av.slots[0].slot_iso).getTime();
const runIn = (file, items, start = {}) => new Function('$', '$input', fs.readFileSync(S + file, 'utf8'))((n) => ({ first: () => ({ json: start }) }), { all: () => items.map(j => ({ json: j })), first: () => ({ json: items[0] }) })[0].json;
const ev = runIn('agenda_busy_gcal.js', [{ start: { dateTime: new Date(s0 + 10 * 60000).toISOString() }, end: { dateTime: new Date(s0 + 50 * 60000).toISOString() } },
  { start: { dateTime: new Date(s0).toISOString() }, end: { dateTime: new Date(s0 + 3600000).toISOString() }, transparency: 'transparent' }, {}]);
ok(ev.busy.length === 1, 'Google Calendar: free/transparent events and empty items are ignored');
ok(!avail({}, []).slots.length || avail({}, []).slots[0].slot_iso === av.slots[0].slot_iso, 'same first slot without busy times');
const overl = run('availability.js', { 'Config': [CFG], 'Agenda Request': [{ authorized: true }], 'Availability Webhook': [{ body: {} }], 'Get Busy': [ev] });
ok(!overl.slots.some(x => x.slot_iso === av.slots[0].slot_iso), 'a 10:10–10:50 event blocks the 10:00 and 10:30 slots');
ok(book({ name: 'C', email: 'c@c.io', company: 'C', slot_iso: av.slots[0].slot_iso }, []).ok && !run('book.js', { 'Config': [CFG], 'Agenda Request': [{ authorized: true }], 'Book Webhook': [{ body: { name: 'C', email: 'c@c.io', company: 'C', slot_iso: av.slots[0].slot_iso } }], 'Get Busy': [ev] }).ok, 'booking re-checks overlap with calendar events');
const sh = runIn('agenda_busy_sheets.js', [{ slot_iso: av.slots[0].slot_iso }, { slot_iso: '' }, {}], { slot_minutes: 30 });
ok(sh.busy.length === 1 && new Date(sh.busy[0].end) - new Date(sh.busy[0].start) === 1800000, 'Sheets: each Demos row blocks one slot; empty rows ignored');
const evc = runIn('agenda_event.js', [{ id: 'e1', hangoutLink: 'https://meet.google.com/abc-defg-hij', htmlLink: 'https://calendar.google.com/x' }]);
ok(evc.ok && evc.meet_url === 'https://meet.google.com/abc-defg-hij' && evc.event_id === 'e1', 'Google Calendar event → Meet link');
// configurable schedule
const sat = cfgWith({ schedule: { ...CFG.schedule, weekdays: [6], start_hour: 9, end_hour: 12, slot_minutes: 60, max_offers: 2, spread_hours: 0 } });
const as = avail({}, [], sat);
ok(as.slots.length === 2 && as.slots.every(x => new Date(x.slot_iso).toLocaleString('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short' }).startsWith('Sat')), 'schedule from Config: Saturdays 9–12, 60 min, 2 offers');
// email uses the Meet link and the brand from Config
const em2 = mail(good, { 'Create Event': [evc] })[0].json;
ok(/meet\.google\.com\/abc-defg-hij/.test(em2.html) && em2.provider === 'gmail' && em2.sender_name === 'Nora · Fluxa', 'email adds the video-call button and uses Config brand');
ok(runAll('confirm_email.js', { 'Config': [cfgWith({ connectors: { ...CFG.connectors, email: { provider: 'none' } } })], 'Book': [good] }).length === 0, "email connector 'none' sends nothing");
// scoring from Config
const strict = cfgWith({ scoring: { ...CFG.scoring, hot: 95, weights: { decisionRole: 0 } } });
const pcS = run('post_call.js', { 'Config': [strict], 'Post-call Webhook': [{ body: { data: { conversation_id: 'cfg1', metadata: { text_only: true }, analysis: { data_collection_results: {
  a: { name: 'team_size', value: '40' }, b: { name: 'role', value: 'CEO' }, c: { name: 'timeline', value: 'asap' }, d: { name: 'use_case', value: 'automatizar las aprobaciones de compras' }, e: { name: 'demo_booked', value: true } } } } } }] });
ok(pcS.row.score === 75 && pcS.row.tier === 'Templado', 'scoring weights and thresholds come from Config (' + pcS.row.score + ', ' + pcS.row.tier + ')');
// Google Calendar nodes ship disabled: a passed-through request must not look like "no events"
let threw = false; try { runIn('agenda_busy_gcal.js', [{ action: 'busy', provider: 'google_calendar' }]); } catch (e) { threw = /no está conectado/.test(e.message); }
ok(threw && runIn('agenda_event.js', [{ action: 'create' }]).ok === false, 'disabled Google Calendar nodes fail loudly instead of offering every slot');
// A Google Calendar error (e.g. invalid calendar id) must not look like "no events" either
let threw2 = false; try { runIn('agenda_busy_gcal.js', [{ error: "ERROR: Calendar parameter's value is invalid" }]); } catch (e) { threw2 = /calendar_id/.test(e.message); }
ok(threw2, 'a Google Calendar read error fails loudly instead of offering every slot');
