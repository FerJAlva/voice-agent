// ============================================================
// FLUXA DEMO · CONFIRMATION EMAIL  (runs after the booking is saved)
// Builds a branded HTML email (ES/EN) with "Add to Google Calendar" and Outlook links.
// Output: { to, subject, html } for the Gmail node. Returns no items (= no email) when the
// booking failed or the address is a test one (self-test), so nothing is sent by mistake.
// ============================================================
const CONFIG = {
  brand: 'Fluxa',
  tagline: { es: 'Automatización de flujos con IA para equipos de operaciones', en: 'AI workflow automation for operations teams' },
  durationMin: 30,
  timezone: 'Europe/Madrid',
  meetingUrl: '',                 // video-call link; empty = the email says the link arrives before the demo
  demoDisclaimer: true,           // portfolio demo: says Fluxa is fictional. Set false for a real client.
  skipDomains: ['example.com', 'example.org', 'test.com'],
  colors: { brand: '#0E5C4E', accent: '#8EDCC4', bg: '#EEF3F1', ink: '#15302B', muted: '#4F6862', line: '#CFDDD8' }
};

const book = $('Book').first().json;
if (!book.ok || !book.row) return [];
const r = book.row;
const to = String(r.email || '').trim().toLowerCase();
if (!to || CONFIG.skipDomains.some(d => to.endsWith('@' + d))) return [];

const lang = r.language === 'en' ? 'en' : 'es';
const start = new Date(r.slot_iso);
const end = new Date(start.getTime() + CONFIG.durationMin * 60000);
const fmt = (opts) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-ES', { timeZone: CONFIG.timezone, ...opts });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const dateLine = cap(fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(start));
const timeLine = `${fmt({ hour: '2-digit', minute: '2-digit' }).format(start)} – ${fmt({ hour: '2-digit', minute: '2-digit' }).format(end)}`;
const firstName = String(r.name || '').trim().split(/\s+/)[0] || '';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const T = {
  es: {
    subject: `Tu demo de ${CONFIG.brand} está confirmada · ${dateLine}, ${fmt({ hour: '2-digit', minute: '2-digit' }).format(start)}`,
    preheader: `${dateLine} · ${timeLine} (hora de Madrid). Añádela a tu calendario con un clic.`,
    hello: firstName ? `¡Hola, ${firstName}!` : '¡Hola!',
    title: 'Tu demo está confirmada',
    intro: `Gracias por hablar con Nora. Hemos reservado ${CONFIG.durationMin} minutos con un especialista de ${CONFIG.brand} para ver tu caso en directo.`,
    when: 'Cuándo', tz: 'hora de Madrid', format: `Online · ${CONFIG.durationMin} min · con un especialista`,
    gcal: 'Añadir a Google Calendar', outlook: 'Outlook / otro calendario', join: 'Unirse a la videollamada',
    linkLater: 'Te enviaremos el enlace de la videollamada antes de la demo.',
    agenda: 'Qué veremos', yourCase: 'Tu caso', company: 'Empresa',
    items: ['Tu flujo de trabajo actual y dónde se pierde tiempo.', 'Un ejemplo en vivo de Fluxa resolviendo un caso parecido.', 'Próximos pasos y cómo sería la puesta en marcha.'],
    change: '¿Necesitas cambiar la hora? Responde a este email y lo movemos.',
    disclaimer: `${CONFIG.brand} es una empresa ficticia: este email forma parte de una demo de portfolio de un agente de voz con IA. No habrá una reunión real.`,
    calDetails: `Demo de ${CONFIG.brand} (${CONFIG.durationMin} min) con un especialista.`
  },
  en: {
    subject: `Your ${CONFIG.brand} demo is confirmed · ${dateLine}, ${fmt({ hour: '2-digit', minute: '2-digit' }).format(start)}`,
    preheader: `${dateLine} · ${timeLine} (Madrid time). Add it to your calendar in one click.`,
    hello: firstName ? `Hi ${firstName},` : 'Hi,',
    title: 'Your demo is confirmed',
    intro: `Thanks for talking to Nora. We have booked ${CONFIG.durationMin} minutes with a ${CONFIG.brand} specialist to walk through your use case live.`,
    when: 'When', tz: 'Madrid time', format: `Online · ${CONFIG.durationMin} min · with a specialist`,
    gcal: 'Add to Google Calendar', outlook: 'Outlook / other calendar', join: 'Join the video call',
    linkLater: 'We will send you the video-call link before the demo.',
    agenda: 'What we will cover', yourCase: 'Your use case', company: 'Company',
    items: ['Your current workflow and where time gets lost.', 'A live example of Fluxa solving a similar case.', 'Next steps and what a rollout would look like.'],
    change: 'Need a different time? Reply to this email and we will move it.',
    disclaimer: `${CONFIG.brand} is a fictional company: this email is part of a portfolio demo of an AI voice agent. There will be no real meeting.`,
    calDetails: `${CONFIG.brand} demo (${CONFIG.durationMin} min) with a specialist.`
  }
}[lang];

// Calendar links (UTC times, so they land at the right local time for anyone)
const utc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const title = `${CONFIG.brand} · Demo${r.company ? ' · ' + r.company : ''}`;
const details = [T.calDetails, r.use_case ? `${T.yourCase}: ${r.use_case}` : '', CONFIG.meetingUrl].filter(Boolean).join('\n');
// n8n's Code sandbox has no URLSearchParams, so build query strings by hand
const qs = (o) => Object.entries(o).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
const gcalUrl = 'https://calendar.google.com/calendar/render?' + qs({
  action: 'TEMPLATE', text: title, dates: `${utc(start)}/${utc(end)}`, details, location: CONFIG.meetingUrl || 'Online', ctz: CONFIG.timezone
});
const outlookUrl = 'https://outlook.live.com/calendar/0/deeplink/compose?' + qs({
  path: '/calendar/action/compose', rru: 'addevent', subject: title, startdt: start.toISOString(), enddt: end.toISOString(),
  body: details, location: CONFIG.meetingUrl || 'Online'
});

const C = CONFIG.colors;
const font = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const button = (href, label, primary) => `
  <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:14px 22px;border-radius:10px;font:600 15px ${font};text-decoration:none;${primary
    ? `background:${C.brand};color:#ffffff;` : `background:#ffffff;color:${C.brand};border:1px solid ${C.line};`}">${esc(label)}</a>`;
const row = (label, value) => value ? `
  <tr><td style="padding:6px 0;font:13px ${font};color:${C.muted};width:110px;vertical-align:top;">${esc(label)}</td>
      <td style="padding:6px 0;font:14px ${font};color:${C.ink};">${esc(value)}</td></tr>` : '';

const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(T.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(T.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
    <!-- header -->
    <tr><td style="background:${C.brand};border-radius:16px 16px 0 0;padding:28px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font:700 24px ${font};color:#ffffff;letter-spacing:-0.5px;">${esc(CONFIG.brand)}<span style="color:${C.accent};">.</span></td>
        <td align="right" style="font:12px ${font};color:${C.accent};">${esc(CONFIG.tagline[lang])}</td>
      </tr></table>
    </td></tr>
    <!-- hero -->
    <tr><td style="background:#ffffff;padding:32px 32px 8px;">
      <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:${C.accent};font:600 12px ${font};color:${C.ink};">✓ ${esc(T.title)}</div>
      <h1 style="margin:16px 0 8px;font:700 26px/1.25 ${font};color:${C.ink};">${esc(T.hello)}</h1>
      <p style="margin:0;font:15px/1.6 ${font};color:${C.muted};">${esc(T.intro)}</p>
    </td></tr>
    <!-- date card -->
    <tr><td style="background:#ffffff;padding:24px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-left:4px solid ${C.brand};border-radius:12px;">
        <tr><td style="padding:20px 22px;">
          <div style="font:600 12px ${font};color:${C.muted};text-transform:uppercase;letter-spacing:1px;">${esc(T.when)}</div>
          <div style="margin-top:6px;font:700 20px ${font};color:${C.ink};">${esc(dateLine)}</div>
          <div style="margin-top:4px;font:16px ${font};color:${C.ink};">${esc(timeLine)} <span style="color:${C.muted};">(${esc(T.tz)})</span></div>
          <div style="margin-top:10px;font:13px ${font};color:${C.muted};">${esc(T.format)}</div>
        </td></tr>
      </table>
    </td></tr>
    <!-- buttons -->
    <tr><td style="background:#ffffff;padding:0 32px 8px;">
      ${CONFIG.meetingUrl ? button(CONFIG.meetingUrl, T.join, true) + '&nbsp;' : ''}${button(gcalUrl, T.gcal, !CONFIG.meetingUrl)}&nbsp;
      ${button(outlookUrl, T.outlook, false)}
      ${CONFIG.meetingUrl || CONFIG.demoDisclaimer ? '' : `<p style="margin:14px 0 0;font:13px ${font};color:${C.muted};">${esc(T.linkLater)}</p>`}
    </td></tr>
    <!-- agenda -->
    <tr><td style="background:#ffffff;padding:24px 32px 8px;">
      <h2 style="margin:0 0 10px;font:700 16px ${font};color:${C.ink};">${esc(T.agenda)}</h2>
      ${T.items.map((it, i) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr>
        <td style="width:26px;vertical-align:top;"><div style="width:20px;height:20px;border-radius:999px;background:${C.bg};color:${C.brand};font:700 12px/20px ${font};text-align:center;">${i + 1}</div></td>
        <td style="font:14px/1.5 ${font};color:${C.ink};">${esc(it)}</td></tr></table>`).join('')}
    </td></tr>
    <!-- summary -->
    <tr><td style="background:#ffffff;padding:8px 32px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};border-radius:12px;"><tr><td style="padding:14px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row(T.company, r.company)}${row(T.yourCase, r.use_case)}
        </table>
      </td></tr></table>
      <p style="margin:18px 0 0;font:14px ${font};color:${C.ink};">${esc(T.change)}</p>
      <p style="margin:18px 0 0;font:14px ${font};color:${C.ink};">— Nora · ${esc(CONFIG.brand)}</p>
    </td></tr>
    <!-- footer -->
    <tr><td style="background:${C.ink};border-radius:0 0 16px 16px;padding:18px 32px;">
      <p style="margin:0;font:12px/1.5 ${font};color:${C.accent};">${esc(CONFIG.brand)} · ${esc(CONFIG.tagline[lang])}</p>
      ${CONFIG.demoDisclaimer ? `<p style="margin:6px 0 0;font:11px/1.5 ${font};color:#B9CCC6;">${esc(T.disclaimer)}</p>` : ''}
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

return [{ json: { to, subject: T.subject, html, gcal_url: gcalUrl, outlook_url: outlookUrl } }];
