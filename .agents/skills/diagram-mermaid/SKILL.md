---
name: diagram-mermaid
description: Elige el tipo de diagrama correcto y escribe Mermaid válido y legible (flowchart, sequence, ER, state, C4, gantt) verificando la sintaxis antes de entregar. Úsalo al documentar arquitectura, flujos, modelos de datos o máquinas de estado, y siempre que un diagrama explique mejor que un párrafo.
argument-hint: <qué diagramar>
---

# Diagram Mermaid — el diagrama correcto, sintaxis verificada

Lo que hay que diagramar viene en los argumentos.

## Paso 0 — ¿merece un diagrama?

Un diagrama gana a un párrafo cuando hay **topología** (quién habla con quién), **orden temporal** con ramas, o **más de 3 elementos relacionados**. Si es una lista de pasos lineal, escribe una lista: un diagrama de 3 cajas en fila es peor que una frase.

Y el diagrama debe mostrar el **mecanismo real**, no el organigrama del pensamiento. Cajas llamadas "Entrada → Procesamiento → Salida" no informan de nada.

## Elección del tipo

| Pregunta que responde | Tipo | Sintaxis |
|---|---|---|
| ¿Qué camino sigue la lógica? | Flujo con decisiones | `flowchart TD` |
| ¿En qué orden hablan los componentes? | Protocolo, llamadas, timeouts | `sequenceDiagram` |
| ¿Cómo se relacionan las tablas? | Modelo de datos | `erDiagram` |
| ¿Qué estados tiene esta entidad? | Ciclo de vida, máquina de estados | `stateDiagram-v2` |
| ¿Qué piezas componen el sistema? | Arquitectura de despliegue | `flowchart` con `subgraph` |
| ¿Qué depende de qué en el tiempo? | Plan, fases | `gantt` |
| ¿Qué clases y herencia hay? | Modelo OO | `classDiagram` |

Ante la duda entre flowchart y sequence: si el eje importante es **quién**, es `sequenceDiagram`; si es **qué decisión**, es `flowchart`.

## Reglas de legibilidad (las que separan un diagrama útil de una maraña)

1. **Máximo ~12 nodos por diagrama.** Si necesitas más, el diagrama tiene dos temas: pártelo en dos, o sube un nivel de abstracción.
2. **Una dirección.** `TD` para jerarquía y arquitectura, `LR` para procesos y pipelines. No mezcles.
3. **Etiqueta TODA arista que no sea obvia**, especialmente las que salen de un rombo: `-->|sí|` / `-->|error 5xx|`. Un rombo con dos flechas sin etiqueta es ilegible.
4. **Los nodos son sustantivos, las aristas son verbos.** `Cliente -->|POST /login| API`, no `Cliente --> Enviar login --> API`.
5. **La forma comunica**: `[rect]` proceso, `{rombo}` decisión, `([redondeado])` inicio/fin, `[(cilindro)]` almacenamiento, `[[subrutina]]` proceso externo. Úsalas con consistencia, no por decoración.
6. **`subgraph` para fronteras reales** (proceso, red, servicio, equipo), nunca para agrupar visualmente cosas sueltas.
7. **Nunca dependas del color como único portador de información** — muchos renderizadores lo ignoran y el contraste cambia entre tema claro y oscuro. El color refuerza, la etiqueta informa.
8. **IDs cortos, etiquetas legibles**: `api[API de pagos]`, no un ID de 30 caracteres.

## Trampas de sintaxis que rompen el render

- Paréntesis, comas, `:` o `-` dentro de una etiqueta → envuelve en comillas: `a["Servicio (v2)"]`.
- `end` como palabra suelta cierra un bloque: dentro de una etiqueta debe ir entrecomillado.
- En `sequenceDiagram` los participantes se declaran antes de usarse si quieres controlar el orden: `participant API as API de pagos`.
- En `erDiagram` la cardinalidad es obligatoria: `USUARIO ||--o{ PEDIDO : realiza`.
- Los `%%` son comentarios; `%%{init: ...}%%` debe ser la PRIMERA línea del bloque.
- Evita `<br>` salvo que lo necesites de verdad; parte el diagrama antes que meter párrafos en una caja.

## Verificación obligatoria

**Nunca entregues Mermaid sin renderizarlo.** Un diagrama que no compila es peor que ninguno. En orden de preferencia:

1. MCP `mermaid` si está disponible (`mcp__mermaid__generate`) — renderiza y devuelve el error real.
2. `npx -y @mermaid-js/mermaid-cli -i diagrama.mmd -o /tmp/d.svg` — falla con el número de línea.
3. Si ninguno está disponible: **dilo explícitamente** ("sintaxis no verificada, sin renderizador disponible") y revisa a mano la lista de trampas de arriba.

Si el render falla, arregla y vuelve a renderizar. No entregues con "debería funcionar".

## Dónde va el diagrama

- En Markdown (README, ADR, docs): bloque ```` ```mermaid ```` — GitHub, GitLab y Obsidian lo renderizan nativamente.
- En un Artifact: bloque ```` ```mermaid ```` en Markdown, o `<pre class="mermaid">` en HTML. **No cargues la librería**: el runtime de Artifacts ya la trae.
- Junto al código que describe, no en una carpeta lejana: la documentación que vive lejos del código muere.

## Formato de entrega

El bloque Mermaid, y debajo **2–4 frases que digan lo que el diagrama no puede decir**: qué es lo sorprendente, dónde está el cuello de botella, qué camino es el caliente. Un diagrama entregado sin lectura obliga al lector a hacer el trabajo dos veces.

## Reglas

- Si el diagrama no cabe en una pantalla sin zoom, está mal: divídelo.
- Un diagrama es código: si documenta algo que cambia, apunta en el mismo commit qué lo mantiene vivo.
- No dibujes lo que no verificaste en el código. Un diagrama de arquitectura inventado se copia y se propaga durante años.
