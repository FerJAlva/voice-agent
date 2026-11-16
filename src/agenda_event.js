// FLUXA · AGENDA · Google Calendar event created → standard result with the Google Meet link.
const e = $input.first().json || {};
// Disabled node (no credential yet): n8n passes the request through instead of creating the event
if (e.action) return [{ json: { ok: false, provider: 'google_calendar', event_id: '', meet_url: '', error: 'Google Calendar no está conectado (nodo desactivado en el sub-workflow Agenda).' } }];
const video = (((e.conferenceData || {}).entryPoints) || []).find(p => p.entryPointType === 'video');
return [{ json: { ok: true, provider: 'google_calendar', event_id: e.id || '', meet_url: e.hangoutLink || (video && video.uri) || '', html_link: e.htmlLink || '' } }];
