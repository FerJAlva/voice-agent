// ============================================================
// FLUXA · SELF-TEST CONFIG — edit these two values, then "Execute workflow".
// Calls the three production webhooks with sample data. No local tools needed.
// ============================================================
return [{ json: {
  baseUrl: 'https://REPLACE_WITH_YOUR_N8N_DOMAIN/webhook',   // e.g. https://my-n8n.example.com/webhook
  secret: 'CHANGE_ME_IN_N8N'                                  // same value as SECRET in Availability / Book (leave as is if unchanged)
} }];
