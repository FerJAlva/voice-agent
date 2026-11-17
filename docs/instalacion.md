# Guía de instalación y uso · versión todo en uno

Esta guía explica cómo poner en marcha el agente de voz (Nora) con **un solo workflow de n8n**: `n8n/fluxa-all-in-one.json`. Se tarda unos **45 minutos** y no hace falta programar.

> ¿Prefieres la versión modular (un workflow por función, más cómoda para mantener varios clientes)? Está en [setup.md](setup.md). Las dos versiones hacen lo mismo y salen del mismo código.

Para entender cómo encajan las piezas, mira los diagramas de [arquitectura.md](arquitectura.md).

---

## 0. Qué necesitas

| Servicio | Para qué | Coste |
|---|---|---|
| **n8n** (cloud o propio, versión 1.x reciente) | Ejecuta la lógica: disponibilidad, reservas, puntuación, avisos | n8n Cloud desde ~20 €/mes, o gratis si lo alojas tú |
| **ElevenLabs** (Agents) | La voz, la conversación y el análisis de cada llamada | Plan gratuito: ~15 min/mes. Planes de pago según minutos |
| **Cuenta de Google** | Google Sheets (registro), Gmail (email al lead) y, opcional, Google Calendar + Meet | Gratis |
| **Telegram** | Avisos al equipo de ventas | Gratis |

Ten a mano también:
- La información de tu empresa para la base de conocimiento del agente (qué vendéis, a quién, preguntas frecuentes).
- Tu horario para demos (días, horas y duración).

---

## 1. Prepara la hoja de Google Sheets

1. Crea una hoja nueva, por ejemplo "Agente de voz".
2. Crea dos pestañas con estos nombres exactos y estas cabeceras en la fila 1:
   - **Demos:** `id, slot_iso, when_madrid, name, email, company, role, team_size, use_case, language, created_at, meet_url, event_id`
   - **Leads:** `conversation_id, date, duration_s, language, name, company, role, team_size, use_case, timeline, demo_booked, score, tier, summary, turns, month_minutes, score_reasons`
3. Copia el **ID de la hoja**: es la parte de la URL entre `/d/` y `/edit`.

## 2. Crea el bot de Telegram

1. En Telegram, abre **@BotFather**, envía `/newbot` y sigue los pasos. Guarda el **token**.
2. Crea un grupo para los avisos (o usa un chat privado) y añade el bot.
3. Consigue el **chat ID** del grupo, por ejemplo añadiendo temporalmente **@RawDataBot** al grupo. Los grupos empiezan por `-`.

## 3. Importa el workflow en n8n

1. En n8n: **Workflows → Add workflow → ⋯ → Import from file** y elige `fluxa-all-in-one.json`.
2. Verás una nota verde **Léeme** arriba y cinco bloques de arriba abajo:
   ① Tools (disponibilidad y reserva) · ② Post-call · ③ Error Alert · ④ Self-test · ⑤ Conectores.
3. Guarda el workflow (Ctrl/Cmd + S). **No lo publiques todavía.**

## 4. Conecta las credenciales

Crea cada credencial en n8n (**Credentials → Create**) y elígela en los nodos indicados:

| Credencial en n8n | Nodos donde elegirla | Cómo se crea |
|---|---|---|
| **Google Sheets OAuth2 API** | `Agenda · Read Demos (Sheets)`, `Store · Append (Sheets)` | Sign in with Google con la cuenta dueña de la hoja |
| **Gmail OAuth2** | `Email · Send (Gmail)` | Sign in with Google con la cuenta que enviará los emails |
| **Telegram API** | `Notify · Send (Telegram)`, `Alert on Telegram` | Pega el token de @BotFather |
| **Google Calendar OAuth2 API** *(opcional)* | `Agenda · List Events (Google Calendar)`, `Agenda · Create Event (Google Calendar)` | Ver el paso 6 |

> **Si usas n8n autoalojado**, Google pide un Client ID y un Client Secret propios. Créalos una vez en [Google Cloud Console](https://console.cloud.google.com/): activa las APIs de Sheets, Gmail y Calendar, crea un *ID de cliente OAuth* de tipo "Aplicación web" y añade como URI de redirección la que muestra n8n en la credencial. Puedes usar el mismo cliente OAuth para las tres credenciales.

## 5. Rellena la configuración

Abre el nodo **Config · Config**, que está en el bloque ⑤. Es el **único nodo que hay que editar**.

| Campo | Qué poner |
|---|---|
| `brand.name`, `brand.agent`, `brand.sender_name`, `brand.tagline` | Tu empresa, el nombre del agente y la firma del email |
| `brand.colors` | Colores del email de confirmación (hex) |
| `brand.demo_disclaimer` | `false` (la versión de portfolio avisa de que la empresa es ficticia) |
| `security.demo_key` | Una clave larga aleatoria (32+ caracteres). La usarás en ElevenLabs (paso 8) |
| `schedule` | Zona horaria, días (`0` = domingo … `6` = sábado), hora de inicio y fin, duración de la demo, antelación mínima, días hacia delante y nº de huecos que se ofrecen |
| `scoring` | Umbrales y pesos de la puntuación del lead. Los valores por defecto sirven para empezar |
| `connectors.agenda` | `provider: 'sheets'` para empezar, o `'google_calendar'` (paso 6). En `calendar_id` va el email del calendario |
| `connectors.store` | `sheet_id`: el ID del paso 1. Pestañas `Demos` y `Leads` |
| `connectors.notify` | `provider: 'telegram'` y `chat_id` del paso 2, o `'none'` para no avisar |
| `connectors.email` | `provider: 'gmail'` o `'none'`. `skip_domains`: dominios a los que nunca se envía (pruebas) |
| `usage.free_minutes` | Minutos de voz de tu plan de ElevenLabs, para el contador del aviso (`0` lo oculta) |

## 6. (Opcional) Google Calendar con Google Meet

Con este conector, los huecos libres salen de tu calendario real y cada reserva crea un evento con enlace de Meet e invitación al lead.

1. Crea la credencial **Google Calendar OAuth2 API** con la cuenta del calendario donde caerán las demos.
2. En los nodos `Agenda · List Events (Google Calendar)` y `Agenda · Create Event (Google Calendar)`: clic derecho → **Activate** (vienen desactivados) y elige la credencial.
3. En **Config · Config**: `agenda: { provider: 'google_calendar', calendar_id: 'tu-email@dominio.com' }`. n8n no acepta `primary`: pon el email.

Ten en cuenta que cualquier evento de ese calendario bloquea el hueco, incluidos los de día completo, salvo que estén marcados como "Disponible".

## 7. Publica

1. **Settings** del workflow: pon la misma zona horaria que en Config. Los **avisos de error** no necesitan configuración: el bloque ③ Error Alert está dentro del mismo workflow y n8n lo activa solo cuando una ejecución real falla. Te llega un único aviso por Telegram con el nodo que falló y el motivo, aunque el fallo ocurra dentro de un conector. Las ejecuciones manuales de prueba no generan aviso.
2. Pulsa **Publish**.
3. Abre los nodos `Availability Webhook`, `Book Webhook` y `Post-call Webhook` y copia sus **URLs de producción**. Acaban en `/webhook/fluxa-availability`, `/webhook/fluxa-book` y `/webhook/fluxa-post-call`.

## 8. Crea el agente en ElevenLabs

1. **Agents → Create agent** (en blanco).
2. **System prompt y First message:** copia `agent/system-prompt.md` y cambia empresa, producto y agente por los tuyos.
3. **Knowledge base:** sube un documento como `agent/knowledge-base.md` con la información de tu empresa. El agente solo debe responder con lo que está ahí.
4. **Secreto:** en *Secrets* del workspace crea uno (por ejemplo `demo_key`) con el mismo valor que `security.demo_key`.
5. **Tools:** crea dos herramientas *Webhook* (POST) tal como se describe en `agent/tools-and-analysis.md`:
   - `get_availability` → URL de `fluxa-availability`
   - `book_demo` → URL de `fluxa-book`

   En las dos, añade la cabecera `x-demo-key` de tipo **Secret** apuntando al secreto.
6. **Analysis:** crea los campos de *Data collection* (`name`, `company`, `role`, `team_size`, `use_case`, `timeline`, `demo_booked`, `language`) y los criterios de evaluación del mismo archivo.
7. **Post-call webhook:** en los ajustes del agente o del workspace, apunta a la URL de `fluxa-post-call`.
8. **Widget:** en la pestaña *Widget* copia el código y pégalo en tu web. Si puedes, limita los dominios permitidos al tuyo.

## 9. Comprueba que todo funciona

1. En el bloque ④ **Self-test**, abre `Self-test Settings` y pon:
   - `baseUrl`: la URL de tu n8n acabada en `/webhook`
   - `secret`: la misma clave de `security.demo_key`
2. Pulsa **Execute workflow**. El nodo **Report** debe mostrar tres **OK**: disponibilidad, reserva y post-call.
3. Revisa que hay una fila nueva en **Demos** y otra en **Leads** y que han llegado los avisos de Telegram, marcados como autoprueba. Después borra esas filas.
4. Haz una llamada corta desde el panel de ElevenLabs, reserva una demo con tu email y comprueba que te llega el email de confirmación (y la invitación de Google Calendar si lo activaste).

---

## Uso diario

**Qué pasa en cada llamada:**
1. El visitante habla con el agente desde tu web. El agente cualifica (tamaño del equipo, cargo, caso de uso, plazo) y ofrece huecos libres.
2. Al elegir hueco, la demo queda reservada al momento: fila en **Demos**, aviso **"📅 Demo reservada"** en Telegram y email de confirmación al lead con botones para añadirla al calendario (y para unirse al Meet, si usas Google Calendar).
3. Al colgar llega el **brief del lead** a Telegram: puntuación 0–100, nivel **Caliente / Templado / Frío**, por qué tiene esa puntuación y un resumen de la llamada. El lead queda en la pestaña **Leads**.

**Dónde mirar:**
- **Leads** de la hoja: todas las llamadas, con puntuación y motivos. Ordénala por `score` para priorizar.
- **Demos** de la hoja (y tu calendario): las demos reservadas.
- **Executions** de n8n: el detalle de cada ejecución, si algo no cuadra.
- **Conversations** de ElevenLabs: grabación y transcripción de cada llamada.

**Cambios habituales (todo en `Config · Config`, luego guardar y volver a publicar):**
- Horario o duración de las demos → `schedule`
- Dejar de recibir avisos → `notify.provider: 'none'`
- No enviar email al lead → `email.provider: 'none'`
- Ser más o menos exigente con los leads calientes → `scoring.hot` y `scoring.warm`

Para cambiar lo que dice el agente (tono, preguntas, información de producto), edita el prompt y la base de conocimiento en ElevenLabs. No hace falta tocar n8n.

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| El agente dice que no puede consultar la agenda | Clave distinta en ElevenLabs y en Config, o el workflow no está publicado | Revisa que `x-demo-key` coincide con `security.demo_key` y que el workflow está publicado |
| Aviso "Google Calendar no está conectado" | Elegiste `google_calendar` pero los nodos siguen desactivados | Paso 6: activa los dos nodos de Google Calendar y elige la credencial |
| Aviso "Calendar parameter's value is invalid" | `calendar_id` es `primary` o está mal escrito | Pon el email del calendario |
| No se guardan filas en la hoja | ID de hoja o nombre de pestaña incorrectos, o falta la credencial | Revisa `sheet_id`, que las pestañas se llaman `Demos` y `Leads`, y la credencial de Sheets |
| Llega "No se pudo enviar el email de confirmación" | La credencial de Gmail caducó o no tiene permiso | Vuelve a conectar la credencial de Gmail. La reserva ya está guardada |
| No llegan avisos de Telegram | Chat ID incorrecto o el bot no está en el grupo | Añade el bot al grupo y revisa el `chat_id` (los grupos empiezan por `-`) |
| El agente ofrece días que no quieres | Horario de Config | Ajusta `schedule.weekdays`, `start_hour` y `end_hour` |
| El agente deja de responder a mitad de mes | Se acabaron los minutos del plan de ElevenLabs | Mira el contador en los avisos o sube de plan |

Si un error no está en esta tabla, el aviso de Telegram del bloque Error Alert indica el nodo que falló y el mensaje. Con eso y la ejecución en n8n se localiza rápido.

**Comprobar que los avisos de error funcionan:** con el workflow publicado, pon temporalmente un `sheet_id` inventado en Config y lanza la autoprueba. Debe llegar un aviso "No se encuentra la hoja…" por Telegram. Después vuelve a poner el ID bueno.
