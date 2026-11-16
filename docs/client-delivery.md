# Entrega a un cliente: qué cambia y dónde

Este repo es una **demo de portfolio** (Fluxa es ficticia). Si se adapta para una empresa real, hay dos modelos de entrega. Este documento dice qué cambia en cada uno y **en qué archivo, nodo o plataforma** se hace cada cambio.

> Regla de oro: un proyecto de cliente nunca reutiliza datos, cuentas ni credenciales de otro cliente ni del empleador actual del autor.

---

## 1. Mapa de cambios (válido para los dos modelos)

| Qué cambia | Dónde se cambia | Notas |
|---|---|---|
| Nombre del agente, empresa, tono | ElevenLabs → agente → *First message* y *System prompt* (fuente: `agent/system-prompt.md`) | Sustituir "Nora" y "Fluxa" |
| Producto, precios, FAQ | ElevenLabs → *Knowledge base* (fuente: `agent/knowledge-base.md`) | Solo información aprobada por el cliente |
| Criterios de cualificación | `agent/system-prompt.md` (sección *Goal*) y reglas de score en `src/post_call.js` | Mantener los dos alineados |
| Horario de demos, zona horaria, duración | Sub-workflow **Config** → `schedule` (fuente: `src/config.js`) | Días, horas, duración, antelación y nº de huecos ofrecidos |
| Calendario real | **Config** → `connectors.agenda.provider: 'google_calendar'` (ya incluido, con Google Meet; ver `docs/setup.md`). Outlook / Cal.com: nueva salida en el sub-workflow **Agenda** | La validación de `src/book.js` no cambia |
| **Avisos al equipo comercial** | Sub-workflow **Notify**: nueva salida en *Route* con **Slack**, **Microsoft Teams** o email, y `connectors.notify.provider` en Config | Entrada siempre `{ provider, chat_id, text }`; Tools y Post-call no se tocan |
| **Registro de leads** | Sub-workflow **Store**: nueva salida en *Route* con **HubSpot**, **Salesforce**, **Pipedrive** (crear/actualizar contacto, empresa y negocio), y `connectors.store.provider` en Config | Entrada `{ provider, tab, row }`; mapear los campos de `docs/specs/05-data-schema.md` |
| Idiomas | ElevenLabs → idioma principal + idiomas adicionales; textos de `src/book.js` y `src/availability.js` | |
| Voz | ElevenLabs → voz del agente | Licencia comercial: requiere plan de pago |
| Canal de llamada | ElevenLabs → widget (web) o número de teléfono (telefonía) | El teléfono añade coste por número y minuto |
| Dominio de la web | `web/index.html` y lista de dominios permitidos del widget | |
| Costes | `COSTS.md` del proyecto del cliente | Actualizar en cada cambio |

**Separar siempre dos canales de avisos:**
| Canal | Destinatario | Contenido |
|---|---|---|
| Comercial | Equipo de ventas del cliente (Slack/Teams/email/CRM) | Demos reservadas, leads con prioridad y resumen, brief para el comercial |
| Operaciones | Quien mantiene el sistema | Errores, minutos/costes, avisos técnicos |
En n8n: conector **Notify** (desde *Notify Demo* / *Notify Lead*) → canal comercial; workflow *Error Alert* y avisos de minutos → canal de operaciones. La línea de minutos de `src/post_call.js` se mueve a un mensaje aparte para operaciones.

---

## 2. Modelo A · Servicio gestionado (tú haces el mantenimiento)

**Qué vendes:** instalación + cuota mensual (mantenimiento, mejoras, informes).

**Cuentas y propiedad**
| Elemento | Dueño recomendado | Por qué |
|---|---|---|
| ElevenLabs | **Cliente** (te invita como miembro) o tu cuenta de agencia con un *workspace* por cliente | El consumo y la licencia quedan claros |
| n8n | **Tu** instancia, un proyecto/carpeta por cliente | Tú operas y monitorizas |
| CRM / calendario / Slack | **Cliente** (te da acceso con un usuario de integración) | Sus datos siguen siendo suyos |
| Credenciales en n8n | Una credencial por cliente, con su nombre | Nunca compartidas entre clientes |

**Qué cambia respecto a la demo**
1. Duplicar los workflows con prefijo del cliente (p. ej. `ACME · Tools`) y sus propias credenciales.
2. Canal comercial del cliente (Slack/Teams/email/CRM) + **tu** canal de operaciones (Telegram o Slack propio) para errores y costes.
3. Error workflow por cliente que te avisa a ti.
4. Proteger los webhooks con la clave `security.demo_key` de Config (`x-demo-key`) y, si es posible, verificar la firma del post-call webhook.
5. Informe mensual al cliente: llamadas, % cualificados, demos, show rate, mejoras hechas (panel de la Fase 5).

**Tu checklist mensual:** revisar errores y reintentos, consumo de minutos y LLM, transcripciones con baja evaluación, ajustes del prompt y la base de conocimiento, actualizar `COSTS.md`.

**Acuerdo con el cliente:** qué incluye la cuota, tiempo de respuesta ante fallos, quién paga el consumo de voz/LLM (recomendado: el cliente, en su cuenta), tratamiento de datos personales (contrato de encargo de tratamiento, RGPD).

---

## 3. Modelo B · Entrega sin mantenimiento (el cliente lo opera)

**Qué vendes:** instalación + formación + documentación (pago único), con un periodo de garantía (p. ej. 30 días).

**Todo en cuentas del cliente desde el principio:** ElevenLabs, n8n (suyo o n8n Cloud), CRM, calendario, canales. Tú trabajas con un acceso temporal que se retira al final.

**Qué cambia respecto a la demo**
1. Workflows importados en **su** n8n con **sus** credenciales.
2. Avisos de errores a **su** responsable técnico (no a ti).
3. Documentación de entrega adaptada: este repo como base, sin datos de otros clientes, con sus nombres y sus cuentas.

**Checklist de entrega**
- [ ] Agente configurado y probado con los guiones de prueba en su cuenta.
- [ ] Workflows publicados, error workflow asignado y probado.
- [ ] Autoprueba (`n8n/fluxa-selftest.json` adaptado) superada en su instancia.
- [ ] Documento de operación: dónde mirar errores, cómo cambiar horario/precios/FAQ, cómo reconectar credenciales.
- [ ] Sesión de formación grabada (30–60 min).
- [ ] `COSTS.md` con sus planes y límites.
- [ ] Retirada de tus accesos y traspaso de contraseñas a su gestor.

**Riesgo a explicar:** sin mantenimiento, los cambios de plataformas (APIs, modelos, credenciales que caducan) pueden romper el sistema con el tiempo; ofrecer bolsa de horas opcional.

---

## 4. Qué NO se entrega nunca
- Credenciales, datos o configuraciones de otros clientes.
- Tus prompts y plantillas "pro" fuera del alcance acordado (si mantienes un repo privado `voice-agent-pro`).
- Nada del empleador actual del autor.
