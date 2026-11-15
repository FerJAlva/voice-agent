// node tests/run_tests.js — tests the n8n code nodes with synthetic data (no credentials)
const fs = require('fs'); const path = require('path');
const S = path.join(__dirname, '..', 'src') + '/';
const SD = {};
const run = (file, nodes) => new Function('$', '$getWorkflowStaticData', fs.readFileSync(S + file, 'utf8'))((n) => ({ first: () => ({ json: nodes[n][0] }), all: () => (nodes[n] || []).map(j => ({ json: j })) }), () => SD)[0].json;
const ok = (c, m) => { console.log((c ? 'ok  - ' : 'FAIL- ') + m); if (!c) process.exitCode = 1; };

const av = run('availability.js', { 'Availability Webhook': [{ body: { language: 'es' } }], 'Read Demos': [] });
ok(av.ok && av.slots.length > 0, 'availability returns slots (' + av.slots.map(s => s.label).join(' | ') + ')');
const h = new Date(av.slots[0].slot_iso).toLocaleString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', weekday: 'short' });
ok(/^(Mon|Tue|Wed|Thu|Fri)/.test(h) && +h.slice(-5, -3) >= 10 && +h.slice(-5, -3) < 17, 'first slot is a weekday between 10:00 and 17:00 Madrid (' + h + ')');
const taken = run('availability.js', { 'Availability Webhook': [{ body: { language: 'en' } }], 'Read Demos': [{ slot_iso: av.slots[0].slot_iso }] });
ok(!taken.slots.some(s => s.slot_iso === av.slots[0].slot_iso), 'booked slot is excluded');
const fri = run('availability.js', { 'Availability Webhook': [{ body: { preferred_day: 'viernes' } }], 'Read Demos': [] });
ok(fri.slots.every(s => new Date(s.slot_iso).toLocaleString('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short' }).startsWith('Fri')), 'preferred day filter (viernes)');

const bad = run('book.js', { 'Book Webhook': [{ body: { name: 'Ana', email: 'ana@', company: 'Acme', slot_iso: av.slots[0].slot_iso } }], 'Read Demos': [] });
ok(!bad.ok && bad.error === 'invalid_email', 'booking rejects invalid email');
const good = run('book.js', { 'Book Webhook': [{ body: { name: 'Ana López', email: 'ana@acme.io', company: 'Acme', team_size: '40', slot_iso: av.slots[0].slot_iso, language: 'es' } }], 'Read Demos': [] });
ok(good.ok && good.row.id && /Listo/.test(good.say), 'booking succeeds: ' + good.say);
const dup = run('book.js', { 'Book Webhook': [{ body: { name: 'B', email: 'b@b.io', company: 'B', slot_iso: av.slots[0].slot_iso } }], 'Read Demos': [{ slot_iso: av.slots[0].slot_iso }] });
ok(!dup.ok && dup.error === 'slot_taken', 'double booking blocked');

const pc = run('post_call.js', { 'Post-call Webhook': [{ body: { type: 'post_call_transcription', data: { conversation_id: 'c1', metadata: { call_duration_secs: 142 },
  transcript: [{ role: 'agent', message: 'Hola' }, { role: 'user', message: 'Hola' }],
  analysis: { transcript_summary: 'Lead interesado en automatizar reporting.', data_collection_results: {
    name: { value: 'Ana López' }, company: { value: 'Acme' }, role: { value: 'Head of Operations' }, team_size: { value: '40' },
    use_case: { value: 'Automatizar el reporting semanal de operaciones' }, timeline: { value: 'este trimestre' }, demo_booked: { value: true } } } } } }] });
ok(pc.row.score === 100 && pc.row.tier === 'Caliente', 'post-call lead score ' + pc.row.score + ' (' + pc.row.tier + ')');
ok(/Nueva llamada/.test(pc.text), 'Telegram text built');
ok(/Minutos de voz este mes: ~2.4 \/ 15/.test(pc.text), 'monthly minutes counter (' + pc.row.month_minutes + ' min)');
const st = run('post_call.js', { 'Post-call Webhook': [{ body: { data: { conversation_id: 'selftest-1', metadata: { call_duration_secs: 95 }, analysis: { data_collection_results: {} } } } }] });
ok(st.row.month_minutes === 2.4 && /AUTOPRUEBA/.test(st.text), 'self-test does not count towards the monthly minutes');

// Post-call: current ElevenLabs format (results keyed by aitem_ id, identifier in .name, mixed case)
const pc2 = run('post_call.js', { 'Post-call Webhook': [{ body: { data: { conversation_id: 'c2', metadata: { call_duration_secs: 60, text_only: true },
  analysis: { data_collection_results: { aitem_a: { name: 'Name', value: 'Luis Gil' }, aitem_b: { name: 'company', value: 'Gil SL' },
    aitem_c: { name: 'team_size', value: '25 personas' }, aitem_d: { name: 'demo_booked', value: false } } } } } }] });
ok(pc2.row.name === 'Luis Gil' && pc2.row.company === 'Gil SL' && pc2.row.team_size === '25 personas', 'post-call reads aitem_ format (case-insensitive)');
ok(pc2.row.month_minutes === 2.4 && /chat de texto/.test(pc2.text), 'text-only chats do not count towards the monthly minutes');

// Confirmation email
const runAll = (file, nodes) => new Function("$", "URLSearchParams", fs.readFileSync(S + file, 'utf8'))((n) => ({ first: () => ({ json: nodes[n][0] }) }));
const em = runAll('confirm_email.js', { 'Book': [good] })[0].json;
const gd = decodeURIComponent((em.gcal_url.match(/dates=([^&]+)/) || [])[1] || '');
const startUtc = new Date(good.row.slot_iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
ok(em.to === 'ana@acme.io' && /confirmada/.test(em.subject), 'email built for the lead: ' + em.subject);
ok(gd.startsWith(startUtc + '/') && /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/.test(em.gcal_url), 'Google Calendar link has the right start time (' + gd + ')');
const xss = runAll('confirm_email.js', { 'Book': [{ ...good, row: { ...good.row, company: '<script>x</script>' } }] })[0].json;
ok(!/<script>x/.test(xss.html) && /&lt;script&gt;/.test(xss.html), 'email escapes HTML in lead data');
ok(runAll('confirm_email.js', { 'Book': [{ ...good, row: { ...good.row, email: 'prueba@example.com' } }] }).length === 0, 'no email for test addresses (@example.com)');
ok(runAll('confirm_email.js', { 'Book': [bad] }).length === 0, 'no email when the booking failed');
