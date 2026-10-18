// Summarises the self-test results in one item (see the output of this node)
const get = (n) => { try { return $(n).first().json; } catch (e) { return { error: 'not executed' }; } };
const av = get('Test Availability'), bk = get('Test Book'), pc = get('Test Post-call');
const slots = (av && av.slots) || [];
return [{ json: {
  availability: slots.length ? `OK · ${slots.length} huecos · primero: ${slots[0].label}` : `FALLO · ${JSON.stringify(av).slice(0, 200)}`,
  booking: bk && bk.ok ? `OK · ${bk.say}` : `FALLO · ${JSON.stringify(bk).slice(0, 200)}`,
  post_call: pc && !pc.error ? 'OK · revisa la pestaña Leads y Telegram' : `FALLO · ${JSON.stringify(pc).slice(0, 200)}`,
  next: 'Si los tres están OK, el backend está listo para conectar el agente de ElevenLabs.'
} }];
