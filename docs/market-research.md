# Análisis de mercado: voice agents (octubre 2026)

## 1. El mercado en una frase
Los agentes de voz pasaron de demo a producción en unos 18 meses. Se estima un mercado de ~3.500 M$ en 2026 con proyección a ~35.000 M$ en 2033, y los casos más maduros son **agendar citas, cualificar leads, soporte de primer nivel y llamadas salientes** (recordatorios, encuestas).

## 2. Plataformas (dónde se construyen)
| Plataforma | Posicionamiento | Precio orientativo | Cuándo elegirla |
|---|---|---|---|
| **ElevenLabs Agents** | Calidad de voz y multilingüe; widget web, base de conocimiento, herramientas webhook, análisis post-llamada | Plan gratis ~15 min/mes; ~0,08 $/min + LLM | Voz como producto, idiomas, demos web. **Elegida.** |
| **Vapi** | Infraestructura para desarrolladores, máximo control | ~0,05 $/min de orquestación + proveedores | Productos a medida con equipo técnico |
| **Retell AI** | Producción, buena gestión de turnos | ~0,07–0,31 $/min | Call centers, soporte y ventas a escala |
| **Bland AI** | Saliente a gran volumen, stack propio | ~0,09–0,14 $/min | Campañas outbound masivas |
| **Synthflow** | No-code para pymes, plantillas | Planes mensuales | Agencias y pymes sin desarrolladores |
| **11x (Julian), PolyAI, Sierra, Parloa** | Producto cerrado "AI SDR" o enterprise | Miles de $/mes | Empresas grandes que compran solución |

## 3. Open source (cómo se construye por dentro)
- **Pipecat** (Daily, ~14k ⭐): pipeline en Python para voz y multimodal; muy activo.
- **LiveKit Agents** (~11k ⭐): agentes sobre WebRTC; fuerte en escala y telefonía.
- **TEN Framework**, **Bolna**, **Jambonz** (telefonía), **OpenAI Agents SDK** (extensión de voz).
Útiles si algún día quieres control total o reducir coste por minuto; para un portfolio, una plataforma gestionada es más rápida.

## 4. Lo que ya existe del patrón "ElevenLabs + n8n"
El patrón exacto de este proyecto (agente de ElevenLabs + herramientas webhook en n8n para disponibilidad y reserva + Sheets/Calendar + análisis post-llamada) **ya circula como plantilla**: plantillas gratuitas de n8n, packs de pago en Gumroad y servicios en Fiverr. Variantes habituales:
- Recepcionista de voz: comprobar disponibilidad, reservar, mover, cancelar, buscar cliente.
- Cualificación de leads de formularios (p. ej. Facebook Lead Ads): llamada saliente inmediata y resultado a CRM + Slack/email.
- Soporte con base de conocimiento y escalado.

**Conclusión:** un "bot que agenda" no te diferencia; lo hacen plantillas y freelancers.

## 5. Qué valora el mercado (y dónde puedes destacar)
1. **Speed-to-lead:** el tiempo medio de respuesta B2B a un lead entrante ronda las 42 h; los agentes responden en segundos. Es *la* métrica de negocio del caso.
2. **Velocidad con contexto:** el problema de "velocidad vacía" (demo reservada pero el comercial no sabe nada del lead) es una crítica frecuente. → **Brief previo a la demo para el comercial.**
3. **Calidad y control:** evaluaciones automáticas (¿cualificó antes de ofrecer demo? ¿inventó algo?) y métricas de conversación.
4. **Métricas de embudo:** llamadas → cualificados → demos → (show rate). Es lenguaje de RevOps, tu terreno.
5. **Multilingüe ES/EN** para mercado europeo y latino.

## 6. Posicionamiento recomendado para tu proyecto
No "un voice agent que agenda", sino **"un AI SDR de inbound con analítica de ventas"**:
- MVP: cualificación bilingüe + reserva en tiempo real + lead scoring + aviso.
- Diferencial 1: **brief del lead para el comercial** antes de la demo (contexto, dolor, encaje, preguntas sugeridas).
- Diferencial 2: **panel de embudo y calidad** (llamadas, % cualificados, % reservas, duración, resultados de evaluación).
- Diferencial 3: **suite de pruebas** de conversación (guiones y criterios de evaluación) documentada en el repo.
Esto conecta con roles de AI Enablement / AI Ops (diseño, medición y adopción) y con RevOps.

## 7. Potencial de ingresos
- El mercado de implementación para pymes es competitivo y con precios bajos en marketplaces.
- Mejor ángulo: **paquete de "AI SDR para SaaS B2B en España/LatAm"** (bilingüe, con métricas y brief comercial) o usarlo como pieza de portfolio para roles. Decidir después de tener demo y vídeo.

Fuentes consultadas: comparativas de plataformas 2026 (morphllm, tooljunction, aiagentrank, dupple), páginas de precios de ElevenLabs Agents, repos de Pipecat y LiveKit Agents, análisis de frameworks open source (forasoft, techsy), guías de speed-to-lead (11x, revenuehero) y plantillas n8n públicas.
