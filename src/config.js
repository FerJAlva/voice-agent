// ============================================================
// FLUXA · CONFIG  (sub-workflow "Fluxa Voice Agent · Config")
// The ONLY place to edit per client: brand, schedule, scoring and which tool does each job.
// Tools and Post-call call this sub-workflow first and read everything from here.
// Values marked REPLACE/CHANGE_ME are set in n8n only (never commit real ids or keys).
// ============================================================
const CONFIG = {
  brand: {
    name: 'Fluxa', agent: 'Nora', sender_name: 'Nora · Fluxa',
    tagline: { es: 'Automatización de flujos con IA para equipos de operaciones', en: 'AI workflow automation for operations teams' },
    colors: { brand: '#0E5C4E', accent: '#8EDCC4', bg: '#EEF3F1', ink: '#15302B', muted: '#4F6862', line: '#CFDDD8' },
    demo_disclaimer: true          // portfolio demo: the email says Fluxa is fictional. false for a real client.
  },
  security: {
    demo_key: 'CHANGE_ME_IN_N8N'   // must match the x-demo-key header of the ElevenLabs tools. Left as is = no check.
  },
  schedule: {
    timezone: 'Europe/Madrid',
    weekdays: [1, 2, 3, 4, 5],     // 0 = Sunday … 6 = Saturday
    start_hour: 10, end_hour: 17,  // first slot starts at start_hour, last one ends at end_hour
    slot_minutes: 30,              // meeting length
    min_notice_hours: 2,           // no slots sooner than this
    horizon_days: 14,              // how far ahead to look
    max_offers: 4,                 // slots offered to the lead
    spread_hours: 3                // minimum gap between offered slots, so they are spread out
  },
  scoring: {                       // see docs/adaptar-a-clientes.md · patterns are regex strings (case-insensitive)
    hot: 70, warm: 40, team_large: 20, team_mid: 5,
    weights: { teamLarge: 25, teamMid: 15, decisionRole: 25, nearTimeline: 25, clearUseCase: 15, demoBooked: 10, fitHigh: 10, fitMedium: 5 },
    near_months: 3, min_use_case_words: 4
    // decision_roles: '\\b(ceo|founder|director|head)\\b',   // optional: replaces the built-in list
    // near_timeline: 'this month|este mes',                    // optional: replaces the built-in list
  },
  connectors: {
    // Which tool does each job. Every option is a branch in the matching sub-workflow.
    agenda: { provider: 'sheets', calendar_id: 'REPLACE_WITH_CALENDAR_EMAIL' },     // 'sheets' (booked slots in the Demos tab) | 'google_calendar' (free/busy + event with Meet). calendar_id = the calendar's email ('primary' is not accepted by n8n)
    store:  { provider: 'sheets', sheet_id: 'REPLACE_WITH_FLUXA_SHEET_ID', demos_tab: 'Demos', leads_tab: 'Leads' },   // 'sheets'
    notify: { provider: 'telegram', chat_id: 'REPLACE_WITH_TELEGRAM_CHAT_ID' },                                        // 'telegram' | 'none'
    email:  { provider: 'gmail', skip_domains: ['example.com', 'example.org', 'test.com'] }                            // 'gmail' | 'none'
  },
  usage: { free_minutes: 15 }      // ElevenLabs minutes per month shown in the post-call brief (0 = hide)
};
return [{ json: CONFIG }];
