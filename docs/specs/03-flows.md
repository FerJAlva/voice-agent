# 03 · Flujos

## A. Flujo de conversación (voz)
```
Saludo bilingüe ─► idioma detectado
   │
   ▼
Descubrimiento (una pregunta por turno, salta lo ya dicho)
 rol/empresa → tamaño equipo → caso de uso → herramientas → plazo
   │
   ├─ preguntas de producto ─► base de conocimiento ─► (si no está: "lo vemos en la demo")
   ▼
¿Cualificado? (equipo ≥ 5 · caso claro · plazo ≤ 6 meses)
   ├─ NO ─► prueba gratuita + guía por email (opcional) ─► cierre
   └─ SÍ ─► get_availability ─► ofrece 2 horarios
              │ el lead elige
              ▼
           pide nombre, email, empresa ─► deletrea email ─► book_demo
              ├─ ok ─► lee "say" ─► cierre
              └─ error ─► (slot_taken → nuevas opciones · invalid_email → repetir · fallo → email del equipo)
```

## B. Flujo de sistema
```
Widget (web) ⇄ ElevenLabs Agent
                 ├─ tool get_availability ─► n8n: Read Demos → calcular huecos → responder
                 ├─ tool book_demo ────────► n8n: Read Demos → validar → Save Demo → Telegram → responder
                 └─ fin de llamada ────────► post-call webhook ─► n8n: extraer datos → score → Save Lead → Telegram
                                                                      └─(v0.4) brief para el AE
```

## C. Recorrido del visitante en la web
1. Llega a `ferjalva.github.io/fluxa/` desde el portfolio o LinkedIn.
2. Lee en 10 s qué es y qué decir ("dirijo operaciones, quiero automatizar el reporting").
3. Pulsa el botón del widget → permiso de micrófono → conversación.
4. Ve el vídeo si no quiere hablar.
5. Debajo: cómo funciona y el stack (para reclutadores).

## D. Estados y errores
| Situación | Comportamiento |
|---|---|
| Silencio > 15 s | Fin de llamada |
| Duración 240 s | Cierre educado |
| Herramienta caída | Disculpa breve + "el equipo te enviará horarios por email" |
| Hueco ocupado entre consulta y reserva | Ofrece otro hueco |
| Pregunta fuera de alcance | No inventa; deriva a la demo |
