# 04 · Brief de diseño

## Página de demo (`web/index.html`)
- **Objetivo:** que en 10 segundos se entienda qué hace Nora y qué decirle, y que el widget sea lo más visible.
- **Paleta:** verde profundo `#0E5C4E` (panel de llamada), menta `#8EDCC4` (acentos), fondo `#EEF3F1`, tinta `#15302B`, texto secundario `#4F6862`, líneas `#CFDDD8`. Modo oscuro con variables.
- **Tipografía:** Bricolage Grotesque (titulares), Public Sans (texto).
- **Estructura:** cabecera (marca + "empresa ficticia") → hero a dos columnas (titular + instrucciones | panel de llamada con onda y diálogo de ejemplo) → "Qué pasa durante la llamada" (5 pasos) → "Cómo está construido" (4 bloques) → pie con autoría y aviso de ficción.
- **Elemento memorable:** el panel de llamada (único bloque de color fuerte).
- **Accesibilidad:** foco visible, `prefers-reduced-motion`, contraste AA, responsive.
- **(v0.3)** Vídeo de 60–90 s incrustado junto al widget.

## Mensajes de Telegram
- **Reserva:** `📅 Demo reservada` · nombre · empresa · fecha (Madrid) · email.
- **Lead:** `📞 Nueva llamada · Caliente (85)` · nombre · rol · empresa · equipo · plazo · demo sí/no · resumen (≤ 600 caracteres).
- **(v0.4) Brief AE:** contexto · dolor · encaje con Fluxa · objeciones · 3 preguntas para la demo.

## Voz y personalidad
Nora: cálida, precisa, frases cortas, una pregunta por turno; nunca vende antes de entender.

## Panel (v0.5)
Una página: 4 KPIs (llamadas, % cualificados, % reservas, duración media), embudo, tabla de últimas llamadas con tier y resultado de evaluación.
