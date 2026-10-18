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
