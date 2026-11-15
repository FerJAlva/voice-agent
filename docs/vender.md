# Cómo publicar y vender Nora

Para uso interno (Fer). La página para clientes está en `docs/producto.md`, y cómo entregar a cada cliente en `docs/client-delivery.md`.

## 1. La conclusión
En la comunidad de n8n la experiencia es clara: **la plantilla sola se vende poco y la instalación se vende bien.** Los compradores se atascan con las credenciales, OAuth y los webhooks, y pagan por que funcione con sus herramientas. Lo que más funciona:
- Una **versión gratis** publicada como escaparate, que te trae contactos.
- Una **versión de pago** con un vídeo, datos de prueba y una guía, para quien quiere hacerlo solo.
- **Instalación y mantenimiento** como producto principal.

## 2. Dónde publicar

| Sitio | Qué es | Para qué usarlo |
|---|---|---|
| **n8n Creator Hub** (biblioteca oficial de plantillas) | Plantillas gratis. Las de pago solo para *creadores verificados*, que necesitan 3 plantillas aprobadas. El vendedor gestiona el cobro y la entrega. | Visibilidad y credibilidad. Empezar aquí con la versión gratis. |
| **Neura Market**, **N8N Central**, **n8nmarkets** y otros marketplaces de terceros | Tiendas de plantillas n8n (Neura dice que el creador se queda con el 90 %). | Vender la versión de pago. Probar uno o dos, no todos. |
| **Gumroad / Lemon Squeezy / Payhip** | Tienda propia: subes el JSON, la guía y el vídeo y cobras. | Controlar el precio y quedarte con los datos del comprador. |
| **GitHub + tu portfolio** | Este repo y la demo en vivo. | Demostrar que funciona: es lo que convence a clientes de servicios. |
| **Upwork, Malt, Contra, Fiverr** | Marketplaces de freelance. | Vender instalación y personalización con la demo como prueba. |
| **LinkedIn y comunidad de n8n** | Publicaciones con un vídeo de 60–90 s de una llamada real. | Traer clientes directos, sin comisión. |

**Requisitos de la biblioteca oficial de n8n:** nombres de nodo claros, sticky notes que expliquen el flujo y la configuración (ya los tiene), sin secretos ni datos personales en el JSON, probado de punta a punta, y comprobado que se importa en un workflow nuevo siguiendo tus propias instrucciones. Al principio se envía una plantilla cada vez.

## 3. Qué publicar en cada sitio

| Paquete | Contenido | Precio orientativo |
|---|---|---|
| **Gratis** (Creator Hub, GitHub) | Workflows con Sheets + Telegram, prompt de ejemplo y guía corta | 0 € |
| **Plantilla Pro** (marketplace o Gumroad) | Todo lo anterior + email con marca y calendario, puntuación explicada, autoprueba, avisos de error, vídeo de instalación de 15 min y cuestionario de descubrimiento | 49–149 € |
| **Instalación** (servicio) | Lo montas en las cuentas del cliente con sus conectores (CRM, calendario, Slack), su prompt y su conocimiento, con pruebas y 30 días de garantía | 900–2.500 € según conectores |
| **Mantenimiento** (cuota mensual) | Revisión de conversaciones, ajustes del prompt y la base de conocimiento, vigilancia de errores, informe mensual y X horas de cambios | 150–400 €/mes |

Los precios son una referencia para empezar. Ajústalos tras los 2 o 3 primeros clientes. El consumo de voz y de LLM lo paga siempre el cliente en su cuenta.

## 4. Qué incluye el mantenimiento
- **Vigilancia:** los avisos de error llegan a tu canal de operaciones. Respondes en el plazo acordado (por ejemplo, 1 día laborable).
- **Calidad:** cada semana o cada mes revisas las conversaciones con peor evaluación y ajustas el prompt, la base de conocimiento o la puntuación.
- **Cambios de plataforma:** reconectar credenciales que caducan y adaptar el workflow si cambian las APIs de ElevenLabs, n8n o el CRM.
- **Informe mensual:** llamadas, % de cualificados, reuniones, ausencias, coste y mejoras hechas.
- **Bolsa de horas** para cambios nuevos (otro conector, otro idioma, otro guion).
- **Fuera de la cuota:** proyectos nuevos, como un segundo agente o llamadas salientes, que se presupuestan aparte.

**Acuerdo por escrito:** qué incluye la cuota, el tiempo de respuesta, quién paga el consumo, el tratamiento de datos (contrato de encargado de tratamiento, RGPD) y cómo se cancela.

## 5. Plan de lanzamiento
1. **Semana 1:** grabar un vídeo de 90 s de una llamada con Nora (reserva + email + aviso) y publicarlo en LinkedIn con enlace a la demo.
2. **Semana 1–2:** subir la versión gratis al Creator Hub, en inglés: sticky notes y guía traducidas, cero IDs reales.
3. **Semana 2–3:** preparar la Plantilla Pro (vídeo de instalación + guía) y publicarla en un marketplace y en Gumroad.
4. **En paralelo:** un perfil de servicio en Malt o Upwork ("AI voice SDR con n8n + ElevenLabs") con la demo como prueba.
5. **Primer cliente:** precio de piloto a cambio de un caso de éxito con números.

## Fuentes
- [n8n Docs · Crear plantillas (requisitos y plantillas de pago)](https://docs.n8n.io/contribute/create-templates)
- [Comunidad n8n · ¿Se paga por las plantillas o por instalarlas?](https://community.n8n.io/t/do-people-actually-pay-for-n8n-templates-or-only-for-someone-to-set-them-up/326627)
- [Comunidad n8n · Dónde vender workflows fuera del Creator Hub](https://community.n8n.io/t/where-can-i-sell-my-n8n-workflow-i-am-looking-for-marketplaces-not-the-creator-hub/212963)
- [Neura Market · Vender workflows de n8n](https://neura.market/sell-n8n-workflows)
- [N8N Central en Product Hunt](https://www.producthunt.com/p/n8n-central/n8n-central)
