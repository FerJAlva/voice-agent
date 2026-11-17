# Arquitectura y flujo de Nora (Fluxa voice agent)

Este documento explica el sistema completo con tres diagramas. GitHub los dibuja solo, porque son bloques Mermaid.

1. **Vista general:** qué piezas hay y cómo se conectan.
2. **Una llamada paso a paso:** qué ocurre desde que el visitante pulsa "Hablar" hasta que ventas recibe el aviso.
3. **Dentro de n8n:** cómo están organizados los workflows y los conectores intercambiables.

> Fluxa es una empresa ficticia. Los IDs, claves y chats reales viven solo en n8n y ElevenLabs, nunca en este repo.

---

## 1. Vista general

```mermaid
flowchart LR
    V(["🧑 Visitante<br/>web del portfolio"])

    subgraph EL["ElevenLabs Agents"]
        direction TB
        N["🎙️ Nora<br/>voz · LLM · base de conocimiento<br/>ES / EN"]
        AN["📊 Análisis post-llamada<br/>resumen + datos extraídos"]
    end

    subgraph N8N["n8n (VPS)"]
        direction TB
        T["⚙️ Tools<br/>/fluxa-availability<br/>/fluxa-book"]
        P["⚙️ Post-call<br/>/fluxa-post-call"]
        C["🧩 Config + conectores<br/>Agenda · Store · Notify · Email"]
    end

    GC[("📅 Google Calendar<br/>+ Google Meet")]
    GS[("📗 Google Sheets<br/>Demos · Leads")]
    GM["✉️ Gmail<br/>email de confirmación"]
    TG["💬 Telegram<br/>avisos a ventas"]

    V <-->|"voz en tiempo real<br/>(widget web)"| N
    N -->|"herramientas<br/>(webhooks + x-demo-key)"| T
    AN -->|"webhook al colgar"| P
    T --> C
    P --> C
    C --> GC
    C --> GS
    C --> GM
    C --> TG
```

**En una frase:** Nora habla con el visitante y, cuando necesita hacer algo (ver huecos o reservar), llama a n8n. Al colgar, ElevenLabs manda el análisis de la llamada a n8n, que puntúa el lead, lo guarda y avisa a ventas.

| Pieza | Qué hace |
|---|---|
| **ElevenLabs** | Voz (STT/TTS), el LLM que conversa, la base de conocimiento de Fluxa y el análisis post-llamada. |
| **n8n · Tools** | Responde en tiempo real a las dos herramientas de Nora: `get_availability` y `book_demo`. |
| **n8n · Post-call** | Recibe el análisis al terminar la llamada, calcula la puntuación del lead y genera el brief para ventas. |
| **n8n · Config** | El único sitio que se edita por cliente: marca, horario, puntuación y qué herramienta hace cada función. |
| **Conectores** | Sub-workflows con entrada y salida fijas: **Agenda** (Google Calendar o Sheets), **Store** (Sheets), **Notify** (Telegram) y **Email** (Gmail). |

---

## 2. Una llamada, paso a paso

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitante
    participant N as Nora (ElevenLabs)
    participant T as n8n · Tools
    participant A as Agenda (Google Calendar)
    participant S as Sheets
    participant G as Gmail
    participant TG as Telegram
    participant P as n8n · Post-call

    V->>N: Pulsa "Hablar" en la web
    N->>V: Saluda, pregunta qué necesita
    Note over N,V: Cualifica: equipo, cargo, caso de uso, plazo

    rect rgb(232, 245, 240)
    Note over N,A: Disponibilidad
    N->>T: get_availability (día preferido, idioma)
    T->>A: ¿Qué está ocupado en los próximos 14 días?
    A-->>T: Huecos ocupados
    T-->>N: Hasta 4 huecos libres (L–V 10–17 h Madrid)
    N->>V: Ofrece 2 opciones
    end

    V->>N: Elige hueco y da nombre, email y empresa

    rect rgb(232, 245, 240)
    Note over N,TG: Reserva
    N->>T: book_demo (datos + slot_iso)
    T->>A: ¿Sigue libre? → crea el evento con Meet e invita al lead
    A-->>T: event_id + enlace de Meet
    T->>S: Guarda la fila en Demos
    T-->>N: "Listo, tu demo queda reservada…"
    N->>V: Confirma la reserva
    T-)TG: Aviso de demo reservada
    T-)G: Email de marca con botón de Meet y "Añadir al calendario"
    end

    V->>N: Cuelga

    rect rgb(240, 240, 250)
    Note over N,P: Después de la llamada
    N-)P: Resumen + datos extraídos (análisis post-llamada)
    P->>P: Puntuación del lead (0–100) con motivos
    P->>S: Guarda la fila en Leads
    P-)TG: Brief para el AE: Caliente / Templado / Frío
    end
```

**Detalles que importan:**
- **Seguridad:** cada llamada de herramienta lleva la cabecera `x-demo-key`. Si no coincide con la de Config, n8n no ofrece ni reserva nada.
- **Sin dobles reservas:** antes de reservar, n8n vuelve a leer el calendario. Si el hueco ya se ocupó, Nora ofrece otro.
- **No bloquea la llamada:** Nora responde en cuanto la reserva queda guardada. El aviso por Telegram y el email salen después.
- **Errores visibles:** si Gmail falla, llega un aviso por Telegram. Si un workflow falla, el workflow **Error Alert** avisa con el detalle.

---

## 3. Dentro de n8n

```mermaid
flowchart TB
    subgraph TOOLS["⚙️ Tools"]
        direction TB
        W1["Webhook<br/>/fluxa-availability"] --> C1["Config"] --> R1["Agenda<br/>(busy)"] --> AV["Calcula huecos libres"] --> RS1["Responde a Nora"]
        W2["Webhook<br/>/fluxa-book"] --> C2["Config"] --> R2["Agenda<br/>(busy)"] --> BK{"¿Hueco libre y<br/>datos válidos?"}
        BK -- sí --> EV["Agenda<br/>(crea evento + Meet)"] --> SD["Store<br/>(fila en Demos)"] --> RS2["Responde a Nora"]
        BK -- no --> RS2
        RS2 --> NT1["Notify<br/>(demo reservada)"] --> EM["Email<br/>(confirmación)"]
        EM -- falla --> NT2["Notify<br/>(email fallido)"]
    end

    subgraph POST["⚙️ Post-call"]
        direction TB
        W3["Webhook<br/>/fluxa-post-call"] --> C3["Config"] --> SC["Puntuación + brief"]
        SC --> SL["Store<br/>(fila en Leads)"]
        SC --> NT3["Notify<br/>(lead)"]
    end

    ERR["🚨 Error Alert<br/>aviso por Telegram si algo falla"]
    TOOLS -. error .-> ERR
    POST -. error .-> ERR

    classDef sub fill:#E8F5F0,stroke:#0E5C4E,color:#15302B
    class C1,C2,C3,R1,R2,EV,SD,SL,NT1,NT2,NT3,EM sub
```

Los recuadros verdes son **sub-workflows** (Config y los conectores Agenda, Store, Notify y Email).

**Versión todo en uno:** `n8n/fluxa-all-in-one.json` contiene todo esto en un solo workflow. Los conectores están dentro, detrás de un único disparador, y cada llamada se hace al mismo workflow pasando por un nodo `→ conector` que indica a cuál va. Se genera con el mismo script, así que las dos versiones nunca se desincronizan. Guía: [instalacion.md](instalacion.md).

**Por qué está hecho así:** Tools y Post-call no saben qué herramienta hay detrás. Llaman a un conector (por ejemplo, Agenda) que siempre recibe y devuelve lo mismo. Para cambiar de Google Calendar a Outlook o Cal.com basta con añadir una rama en ese conector y cambiar una línea en Config. El resto no se toca.

| Workflow | Disparador | Función |
|---|---|---|
| Fluxa Voice Agent · Tools | Webhooks de las herramientas de Nora | Disponibilidad y reserva en tiempo real |
| Fluxa Voice Agent · Post-call | Webhook post-llamada de ElevenLabs | Puntuación, Leads y aviso a ventas |
| Fluxa Voice Agent · Config | Llamado por los anteriores | Configuración única por cliente |
| Fluxa Voice Agent · Agenda / Store / Notify / Email | Llamados por los anteriores | Conectores intercambiables |
| Fluxa Voice Agent · Error Alert | Error en Tools o Post-call | Aviso por Telegram |
| Fluxa Voice Agent · Self-test | Manual | Prueba de extremo a extremo sin gastar minutos de voz |

Más detalle: [setup](setup.md) · [flujos de conversación](specs/03-flows.md) · [esquema de datos](specs/05-data-schema.md) · [adaptar a clientes](adaptar-a-clientes.md).
