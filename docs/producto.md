# Nora · AI SDR de voz para leads de entrada

**Responde a cada lead en segundos, lo cualifica por voz y le agenda la reunión con tu equipo, de día o de noche.**
Tu comercial recibe un brief con el porqué de la puntuación y el lead recibe una confirmación con tu marca y un botón para guardarla en su calendario.

> Demo en vivo (empresa ficticia "Fluxa"): `ferjalva.github.io/fluxa/` · Código: este repositorio.

---

## El problema
- Un lead que pide información se enfría en minutos. Responder después de una hora baja mucho la probabilidad de cerrar la reunión.
- Los formularios no cualifican, y el equipo comercial pierde tiempo en llamadas que no van a ningún sitio.
- Pasar los datos al calendario y al CRM a mano es lento y se olvidan cosas.

## Qué hace Nora
1. **Atiende al instante** desde un widget de voz en tu web (también puede ser por teléfono), en español o en inglés.
2. **Cualifica como un buen SDR:** pregunta el cargo, el tamaño del equipo, el problema, las herramientas que usa y el plazo, una pregunta cada vez. Responde dudas solo con tu información.
3. **Agenda la reunión** en un hueco libre real y la confirma en la misma llamada.
4. **Confirma por email** con tu marca, la fecha, la hora y los botones "Añadir a Google Calendar" y Outlook.
5. **Avisa a tu equipo** con un brief: perfil, resumen de la llamada, puntuación de 0 a 100 y por qué (por ejemplo "cargo con decisión (+25) · plazo cercano (+25) · equipo pequeño (0)").
6. **Guarda todo** (reservas y leads con su puntuación) donde tú trabajas.
7. **Te avisa si algo falla**, con el paso que falló y cómo arreglarlo.

## Qué ves tú

| Momento | Qué recibes |
|---|---|
| Durante la llamada | Reunión reservada y aviso al equipo |
| Al terminar | Lead guardado, con su puntuación, el motivo y el resumen |
| Cada mes | Llamadas, cualificados, reuniones y coste (opcional, con panel) |

## Se conecta con lo que ya usas

| Para | Incluido de serie | También disponible |
|---|---|---|
| Voz e IA | ElevenLabs Agents | Otros proveedores de voz bajo pedido |
| Agenda | Hoja de reservas | Google Calendar con Meet, Outlook con Teams, Cal.com |
| Guardar leads | Google Sheets | HubSpot, Pipedrive, Salesforce, Zoho, Airtable, Notion |
| Avisos al equipo | Telegram | Slack, Microsoft Teams, email |
| Email al lead | Gmail | Outlook / Microsoft 365, SMTP, SendGrid, Mailgun |

La lógica (cualificar, reservar, puntuar) es la misma para todos. Lo que cambia según el cliente son los **conectores**, así que adaptarlo a tus herramientas no implica rehacerlo.

## Se adapta a tu negocio
- **Tus preguntas y tus criterios de cualificación.**
- **Tu puntuación:** qué pesa más (tamaño, cargo, plazo, sector) y a partir de qué número un lead es "caliente".
- **Tu agenda:** días, horario, duración de la reunión, antelación mínima y zona horaria.
- **Tu marca:** voz, tono, idiomas, colores y textos del email.
- **Tu conocimiento:** productos, precios y preguntas frecuentes. Nora no inventa lo que no está ahí.

## Seguridad y datos
- Los webhooks están protegidos con una clave, así que nadie de fuera puede crear reservas ni enviar emails.
- Los datos se quedan en tus cuentas (CRM, hoja, calendario).
- Se pueden añadir el aviso de grabación, la política de privacidad y un plazo para borrar los datos (RGPD).

## Cómo se pone en marcha
1. **Llamada de descubrimiento (30 min):** tus herramientas, tus criterios y tu agenda.
2. **Configuración (de 3 a 7 días):** agente, conectores, email y pruebas con conversaciones de ejemplo.
3. **Piloto (2 semanas):** se revisan las conversaciones reales y se ajusta.
4. **En producción**, con mantenimiento opcional.

## Preguntas frecuentes
- **¿Suena a robot?** Usa voces naturales de ElevenLabs y frases cortas. Si le preguntan si es una IA, lo dice.
- **¿Y si el lead pregunta algo que no sabe?** Dice que el especialista lo responderá en la reunión y no se inventa nada.
- **¿Cuánto cuesta usarlo?** Tú pagas el consumo de voz en tu cuenta de ElevenLabs (los planes van de gratis a pago por minuto). La automatización corre en n8n (en la nube o en tu servidor).
- **¿Puede pasar la llamada a una persona?** Sí, a un número o a un agente humano cuando se cumpla la condición que elijas.
