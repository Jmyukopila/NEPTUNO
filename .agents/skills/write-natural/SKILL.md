---
name: write-natural
description: Reescribe cualquier texto para que suene a persona y no a modelo — elimina los tics delatores de IA (tricolon, "no solo X sino Y", hedging, entusiasmo de folleto, listas donde tocaba prosa) y ajusta registro, ritmo y voz al lector real. Úsalo en READMEs, mensajes de commit, PRs, correos, posts y cualquier texto que vaya a leer un humano.
argument-hint: <texto a escribir/reescribir> [para <lector>]
---

# Write Natural — prosa que no delata al modelo

El texto y su destinatario vienen en los argumentos. Si no se dice quién lee, pregúntalo o decláralo asumido: el registro depende del lector y equivocarlo arruina el texto entero.

## Los 12 tics que delatan a una IA (elimínalos siempre)

1. **El tricolon compulsivo.** Tres adjetivos o tres cláusulas en cada frase ("claro, conciso y eficaz"). La prosa humana varía: a veces uno, a veces cuatro, a veces ninguno.
2. **"No solo X, sino también Y."** Y su familia: "más que X, es Y", "no se trata de X, se trata de Y". Una vez en un texto largo pasa. Dos veces es una firma.
3. **Apertura de resumen.** "En el mundo actual…", "En el panorama de…", "A medida que la tecnología avanza…". Empieza por lo que tienes que decir.
4. **Cierre de resumen.** "En resumen…", "En definitiva, se trata de…", un párrafo final que repite el texto. Si el texto ya lo dijo, termina.
5. **Vocabulario de modelo**: *delve, aprovechar (leverage), robusto, fluido/seamless, potenciar, desbloquear, elevar, navegar el panorama, testamento/testimonio de, crucial, fundamental, vibrante, meticuloso, en el ámbito de*.
6. **Hedging apilado.** "Puede que sea posible que en algunos casos…". Decide y afirma; si hay incertidumbre real, nómbrala una vez y sigue.
7. **Simetría perfecta.** Todos los párrafos de 4 líneas, todos los bullets con la misma estructura y longitud. Los humanos son irregulares.
8. **Listas donde tocaba prosa.** Convertir un argumento con causalidad en 5 bullets destruye la conexión entre ideas. Bullet = ítems paralelos e independientes. Todo lo demás es prosa.
9. **Negritas de subrayador.** Resaltar cinco cosas por párrafo equivale a no resaltar ninguna.
10. **Emojis decorativos** en encabezados y bullets, salvo que el canal lo pida (Slack informal, redes).
11. **Entusiasmo de folleto.** "¡Increíble!", "revolucionario", "game-changer", "potentísimo". Una afirmación fuerte necesita un dato, no un adjetivo.
12. **El guion largo como muletilla.** Un — por texto medio es estilo; tres por párrafo es tic. Alterna con punto, coma y paréntesis.

## Lo que sí hace la prosa humana

- **Ritmo desigual.** Frases cortas. Y después una más larga que desarrolla la idea, la matiza y la deja donde tiene que quedar. La monotonía silábica es lo que suena a máquina.
- **Concreto antes que abstracto.** "Tarda 40 s en arrancar" en vez de "el rendimiento de arranque es subóptimo".
- **Verbos con carga.** *Rompe, tarda, bloquea, borra*. No *impacta, facilita, optimiza*.
- **Voz activa y sujeto explícito.** "El worker reintenta 3 veces", no "se realizan reintentos".
- **Permitirse una opinión.** "Esto me parece frágil" es más útil y más humano que "podría considerarse mejorable".
- **Decir "no sé".** El texto que nunca duda no lo escribió alguien que hizo el trabajo.

## Proceso

1. **Fija lector y objetivo** en una frase para ti. ¿Qué tiene que hacer o entender esa persona al terminar de leer?
2. **Escribe el borrador diciendo lo importante primero.** Nada de calentamiento.
3. **Pasada de tics**: recorre los 12 de arriba y elimina lo que encuentres. Es una lista de comprobación, no una sugerencia.
4. **Pasada de ritmo**: lee en voz alta (mentalmente). Donde te quedes sin aire, corta. Donde suene entrecortado, une.
5. **Pasada de tijera**: quita el 15% del texto. Casi siempre sobra, y casi siempre lo que sobra es adjetivo y transición.

## Ajuste por canal

| Canal | Registro | Longitud |
|---|---|---|
| Mensaje de commit | imperativo, seco, sin adjetivos | 1 línea + cuerpo con el *por qué* |
| Descripción de PR | qué cambia, por qué, cómo se verificó | 5–15 líneas |
| README | segunda persona, instructivo | lo mínimo que desbloquea al lector |
| Correo/Slack a una persona | conversacional, contracciones, directo | lo que quepa sin scroll |
| Post técnico | primera persona, con opinión y ejemplos reales | tan largo como el argumento pida |
| Texto de UI | imperativo, sin jerga, sin disculpas | lo más corto posible |

## Si el texto es en español

- Elige variante y mantenla: **es-ES** (vosotros, ordenador, vale) frente a **es-419** (ustedes, computadora, listo). Mezclarlas suena a traducción automática.
- No calques del inglés: *"soporta"* → admite/permite; *"librería"* → biblioteca (salvo jerga dev, donde librería ya es estándar); *"remover"* → eliminar; *"aplicar para"* → solicitar; *"eventualmente"* → con el tiempo (no *finalmente*).
- El gerundio inglés de resultado no existe en español: *"El servidor falló, causando pérdida de datos"* → *"…y eso provocó pérdida de datos"*.
- Cuida los conectores: en español la subordinación es más larga que en inglés. Traducir frase corta por frase corta suena telegráfico.

## Reglas

- No sustituyas una palabra prohibida por otra igual de vacía. Si quitas "robusto", di **qué** lo hace fiable.
- Cuando reescribas texto ajeno, conserva su voz: tu trabajo es quitar ruido, no imponer tu estilo.
- Si el original ya está bien, dilo y no lo toques. Reescribir por reescribir empeora.
