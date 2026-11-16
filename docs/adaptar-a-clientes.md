# Nora para clientes: puntuación, descubrimiento y conectores

## 1. Cómo puntúa hoy el lead

Al terminar la llamada, el nodo **Post-call** suma puntos (máximo 100) con los datos que extrae ElevenLabs:

| Señal | Puntos | Cómo lo detecta |
|---|---|---|
| Tamaño del equipo ≥ 20 | +25 (≥ 5: +15) | número en `team_size` |
| Cargo con poder de decisión | +25 | palabras como director, head, manager, CEO, responsable, jefe |
| Plazo cercano | +25 | "este mes/trimestre", "próximo mes", "asap", "cuanto antes" |
| Caso de uso claro | +15 | el texto de `use_case` tiene más de 15 caracteres |
| Reservó demo | +10 | `demo_booked` = true |

**Caliente** con 70 o más, **Templado** entre 40 y 69, **Frío** por debajo de 40.

**Puntos débiles:**
- Se basa en palabras clave. "Coordinadora" o "VP" escrito de otra forma no puntúa, y un plazo dicho como "en enero" tampoco.
- Que el caso de uso sea largo no significa que sea bueno.
- No mira el presupuesto, las herramientas que ya usa el lead ni si encaja con el cliente ideal.
- El comercial ve el número, pero no sabe por qué salió ese número.

**Mejoras propuestas:**
1. **Pesos configurables por cliente.** Cada empresa define qué le importa (tamaño, sector, país, presupuesto) en un bloque de configuración, sin tocar el código.
2. **Puntuación explicada.** El aviso de Telegram dice el porqué, por ejemplo "+25 por cargo (Head of Ops), +25 por plazo (este trimestre), 0 por presupuesto (no lo dijo)".
3. **Que el LLM ayude.** Añadir un criterio de evaluación en ElevenLabs que devuelva el "encaje con el cliente ideal" (alto, medio o bajo) con una frase de motivo. Se combina con las reglas, que siguen siendo fijas y auditables.
4. **Más señales.** Herramientas actuales (ya se preguntan, pero no puntúan), dolor (cuánto tiempo pierden), rango de presupuesto y si es quien decide o quien influye.

## 2. Qué busca un cliente

Si yo fuera el cliente, compraría esto para:
- **No perder leads fuera de horario.** Responder al minuto, también por la noche y en fin de semana.
- **Que mi equipo solo hable con leads cualificados.** El resto recibe una respuesta útil (prueba gratis, guía) sin gastar tiempo comercial.
- **Que la reunión aparezca sola** en mi calendario y en mi CRM, sin copiar datos a mano.
- **Llegar a la reunión sabiendo de qué va:** resumen, necesidades y objeciones.
- **Menos ausencias:** confirmación, recordatorios y un enlace fácil para cambiar la hora.
- **Ver números:** llamadas, cualificados, demos, ausencias y coste por lead.
- **Que suene a mi marca:** voz, tono, idiomas y respuestas basadas en mi información.
- **Tranquilidad legal:** aviso de grabación, RGPD y datos guardados donde yo diga.
- **Poder pasar a una persona** si el lead lo pide o es un cliente grande.

## 3. Cuestionario para un cliente nuevo (30 min)

**Negocio y cualificación**
- ¿Qué vendes y a quién? ¿Cómo es tu cliente ideal (sector, tamaño, país, cargo)?
- ¿Qué tiene que cumplir un lead para merecer una reunión? ¿Qué lo descarta?
- ¿Qué preguntas hace hoy tu comercial en la primera llamada?
- ¿Qué hacemos con los no cualificados (prueba, contenido, dejarlo en el CRM)?

**Canal y volumen**
- ¿Por dónde llegan: web, teléfono entrante, WhatsApp, llamadas salientes a formularios?
- ¿Cuántas conversaciones al mes esperas? Con esto se elige el plan de ElevenLabs y se calcula el coste.
- ¿En qué idiomas, horarios y zonas horarias?

**Agenda**
- ¿Qué calendario usáis: Google, Outlook, Calendly, Cal.com, HubSpot Meetings?
- ¿Quién recibe las reuniones (una persona, rotación, según zona o idioma)? ¿Cuánto duran y cuánto margen entre una y otra?
- ¿Videollamada con Meet, Teams o Zoom?

**Dónde vive la información**
- ¿Qué CRM usáis: HubSpot, Pipedrive, Salesforce, Zoho u otro, o ninguno (hoja de cálculo o Airtable)?
- ¿Qué campos queréis rellenar y en qué etapa del embudo entra el lead?

**Avisos y emails**
- ¿Dónde quiere el equipo los avisos: Slack, Teams, Telegram, email?
- ¿Desde qué cuenta salen los emails: Gmail o Microsoft 365, o un servicio con dominio propio como SendGrid, Mailgun o SMTP? ¿Con qué marca y diseño?

**Contenido y traspaso**
- Documentación, precios y preguntas frecuentes para la base de conocimiento. ¿Qué no se debe decir nunca?
- ¿Cuándo hay que pasar la llamada a una persona, y a qué número o a quién?

**Legal y accesos**
- Aviso de grabación, política de privacidad y cuánto tiempo se guardan los datos.
- ¿Quién nos da acceso a cada herramienta? Mejor una cuenta o un token de servicio que el usuario personal de alguien.

**Éxito**
- ¿Qué número tiene que mejorar para que esto valga la pena (reuniones al mes, tiempo de respuesta, ausencias)?

## 4. Cómo adaptarlo a cualquier herramienta: núcleo + conectores

La idea es separar **lo que hace Nora** (siempre igual) de **dónde lo guarda o lo avisa** (cambia según el cliente).

**Núcleo (no cambia):** el agente de ElevenLabs, los webhooks, el cálculo de huecos, la validación de la reserva, la puntuación y el email. Todo trabaja con un formato interno propio: un "lead" y una "reserva" con siempre los mismos campos.

**Conectores (uno por función, intercambiables):**

| Función | Hoy | Alternativas con nodo propio en n8n |
|---|---|---|
| Ver huecos ocupados | Google Sheets | Google Calendar, Outlook Calendar (Microsoft), Cal.com, CRM |
| Guardar reserva y lead | Google Sheets | HubSpot, Pipedrive, Salesforce, Zoho, Airtable, Notion, Postgres |
| Avisar al equipo | Telegram | Slack, Microsoft Teams, email, WhatsApp |
| Email al lead | Gmail | Outlook (Microsoft 365), SMTP, SendGrid, Mailgun |
| Crear la reunión | (solo enlace) | Google Calendar con Meet, Outlook con Teams, Zoom |

Si una herramienta no tiene nodo en n8n, casi todas tienen una API, que se conecta con un nodo **HTTP Request**.

**Cómo montarlo en n8n:**
1. Un **nodo Config** al principio con lo que cambia por cliente: marca, horario, zona horaria, pesos de la puntuación y qué conector usar en cada función.
2. Cada función es un **sub-workflow** con la misma entrada y salida, por ejemplo "Guardar reserva" recibe la reserva y devuelve ok o error. Hay una versión por herramienta: "Guardar reserva · Sheets", "· HubSpot", "· Pipedrive".
3. El workflow principal llama al sub-workflow que diga Config. Para un cliente nuevo se rellena el cuestionario, se eligen los conectores, se cambia Config y se conectan las credenciales. El núcleo no se toca.

**Cómo venderlo:**
- Precio base por el núcleo (agente, puntuación, email, panel).
- Un extra por cada conector fuera del paquete estándar.
- Mantenimiento mensual opcional (ya descrito en `docs/client-delivery.md`).

## 5. Estado (v0.7)
Hecho: puntuación configurable y explicada (v0.6), **Config + sub-workflows Agenda, Store, Notify y Email** y el conector **Google Calendar con Meet** (v0.7, apagado en la demo hasta conectar la credencial; ver `docs/setup.md`). Siguiente: HubSpot (Store) y Slack (Notify).

## 6. Por dónde empezaría

1. **Puntuación configurable y explicada** (poco trabajo, mucho valor: el comercial entiende el número).
2. **Nodo Config + sub-workflows** para Agenda, Guardar, Avisar y Email, dejando los conectores actuales como versión por defecto.
3. **Primer conector alternativo:** Google Calendar real con Meet o HubSpot, que son lo que más piden las empresas pequeñas y medianas.
