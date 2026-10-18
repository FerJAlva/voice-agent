# 01 · PRD — Nora, AI SDR de inbound (Fluxa, empresa ficticia)

## Problema
Las empresas B2B tardan horas (de media ~42 h) en responder a un lead entrante. Cuando por fin lo contactan, el lead se ha enfriado; y si se automatiza solo la reserva, el comercial llega a la demo sin contexto.

## Solución
Un agente de voz en la web que responde al instante, en español o inglés, cualifica al visitante, reserva la demo si encaja y entrega al comercial un **brief** del lead. Todo queda medido en un **panel de embudo**.

## Usuarios
- **Visitante (lead):** responsable de operaciones/RevOps en una empresa B2B que quiere saber si Fluxa le sirve.
- **Comercial (AE):** recibe la reserva y el brief.
- **Responsable comercial / RevOps:** mira el embudo y la calidad de las conversaciones.
- **Reclutador/visitante del portfolio:** prueba la demo o ve el vídeo.

## Alcance
**MVP (v0.1–v0.3)**
1. Conversación de voz bilingüe con detección de idioma (máx. 4 min).
2. Descubrimiento: rol, empresa, tamaño del equipo, caso de uso, herramientas, plazo.
3. Respuestas solo desde la base de conocimiento; sin inventar.
4. Cualificación: equipo ≥ 5, caso claro, plazo ≤ 6 meses.
5. Reserva en tiempo real (2 opciones de horario, confirmación de email).
6. Post-llamada: datos estructurados, lead score (Caliente/Templado/Frío), guardado y aviso por Telegram.
7. Página de demo con widget en el portfolio.

**Diferenciales (v0.4–v0.5)**
8. **Brief del lead para el AE** (Telegram/email): contexto, dolor, encaje, objeciones, 3 preguntas sugeridas para la demo.
9. **Panel de embudo y calidad:** llamadas, % cualificados, % reservas, duración media, idioma, resultados de evaluación.
10. **Suite de pruebas** de conversación con criterios de evaluación.

**Fuera de alcance:** telefonía real, llamadas salientes, CRM real, pagos, multiusuario.

## Métricas de éxito (de la demo)
- Latencia percibida natural; la llamada completa en < 4 min.
- ≥ 8/9 guiones de prueba superados.
- 0 respuestas inventadas en las pruebas.
- Reserva correcta en el 100 % de las pruebas con lead cualificado.
- Vídeo de 60–90 s publicado en el portfolio y el README.

## Restricciones
- Todo con cuenta personal y datos ficticios (regla de oro).
- Coste cero: plan gratuito de ElevenLabs (~15 min/mes), n8n propio, Google Sheets, GitHub Pages.
