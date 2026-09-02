---
name: translate-localize
description: Traduce y localiza texto o interfaces preservando intención, registro y variante regional — con reglas para lo intraducible, la expansión de longitud en UI, plurales, fechas y el i18n del código. Úsalo para traducir documentación, copiar UI a otro idioma, revisar una traducción existente o internacionalizar una app.
argument-hint: <texto o ruta> <idioma/variante destino>
---

# Translate & Localize — traducir la intención, no las palabras

Origen, destino y variante vienen en los argumentos. Si falta la **variante** (es-ES / es-419 / pt-BR / pt-PT / en-US / en-GB), decídela y decláralo: es la decisión que más se nota y la que más se olvida.

## Paso 0 — clasifica el texto antes de traducir

La estrategia cambia por completo según el tipo:

| Tipo | Estrategia |
|---|---|
| **Documentación técnica** | Fidelidad al contenido; los términos técnicos consolidados NO se traducen (*commit*, *pull request*, *deploy*, *endpoint*) |
| **Texto de UI** | Prioridad a la brevedad y la acción; se reescribe si hace falta, no se traduce literal |
| **Marketing / copy** | Transcreación: se conserva el efecto, no la estructura. Un juego de palabras se sustituye por otro |
| **Mensajes de error** | Claridad absoluta y voz consistente; nunca culpar al usuario |
| **Contenido legal** | Fidelidad literal; señala explícitamente que necesita revisión profesional |
| **Código / identificadores** | No se traducen. Nunca |

## Reglas duras

1. **Nunca traduzcas palabra por palabra.** Traduce la unidad de sentido. Si la frase resultante no la diría un nativo, está mal aunque cada palabra sea correcta.
2. **Coherencia terminológica.** Un término = una traducción en todo el proyecto. Mantén un glosario visible (`docs/GLOSARIO.md` o el archivo de i18n) y consúltalo antes de inventar; si hay traducciones previas en el repo, esas mandan.
3. **Lo que no se traduce**: nombres propios, marcas, identificadores de código, rutas, comandos, claves de configuración, y la jerga técnica que el gremio destino usa en inglés. Traducir *"empuje la rama"* por *push* es peor que no traducir.
4. **Registro y tratamiento.** Decide tú/usted/vos/vosotros según variante y producto, y no lo cambies a mitad. En UI, el impersonal ("Se ha guardado") esquiva el problema cuando el tratamiento no está claro.
5. **Los placeholders son sagrados.** `{count}`, `%s`, `{{name}}` se conservan exactos. Puedes reordenarlos en la frase, pero solo si el formato lo permite (`%1$s` sí, `%s` no).
6. **Plurales de verdad.** El inglés tiene 2 formas; el ruso 3, el árabe 6, el japonés 1. No hagas `if (n === 1)`: usa el mecanismo de plurales de la librería (ICU MessageFormat, `Intl.PluralRules`, `ngettext`).
7. **Nada de concatenar frases.** `"Has " + n + " mensajes nuevos"` es intraducible: el orden y la concordancia cambian por idioma. Una clave = una frase completa con placeholders.
8. **Formatos localizados, nunca a mano.** Fechas, horas, moneda, decimales y separadores de miles salen de `Intl.*` / `babel` / equivalente. `31/08/2026` es 8 de marzo en en-US.

## Localización de UI

- **Expansión de longitud**: del inglés al español o alemán el texto crece un 20–35%. Prueba cada layout con la cadena traducida más larga, no con la inglesa. Un botón que solo cabe en inglés es un bug de layout, no de traducción.
- **El contexto es obligatorio.** "Open" puede ser verbo (abrir) o adjetivo (abierto). Si el archivo de i18n no tiene comentario de contexto, añádelo; si traduces sin él, marca la cadena como dudosa en vez de adivinar.
- **RTL** (árabe, hebreo): no basta con traducir. Layout espejado, `dir="rtl"`, iconos direccionales invertidos, números no.
- **Nada de texto dentro de imágenes.** No se traduce, no se busca, no lo lee un lector de pantalla.

## Revisar una traducción existente

Busca en este orden, que es el de gravedad:
1. **Sentido invertido o perdido** — negaciones, condicionales, modales (*should* ≠ *must*).
2. **Placeholders rotos o desaparecidos** — rompe la app en ejecución.
3. **Terminología inconsistente** — el mismo botón con dos nombres.
4. **Calcos y falsos amigos** — *actually* ≠ actualmente, *eventually* ≠ eventualmente, *library* ≠ librería (fuera de dev), *support* ≠ soportar, *realize* ≠ realizar.
5. **Registro fuera de sitio** — tuteo en un producto que usa usted.
6. **Fluidez** — lo último, porque es lo menos grave.

## Proceso

1. Clasifica el tipo de texto y fija variante + tratamiento. Decláralo en una línea antes de empezar.
2. Busca traducciones y glosario previos en el repo. Reutiliza; no compitas con lo que ya existe.
3. Traduce por unidades de sentido, no por líneas.
4. Pasada de reglas duras (placeholders, plurales, no-traducibles, formatos).
5. Pasada de naturalidad con `write-natural`: una traducción correcta que suena a traducción sigue siendo mala.
6. Reporta lo que **no** pudiste resolver: ambigüedades sin contexto, juegos de palabras sacrificados, cadenas que probablemente desbordan. Esa lista vale tanto como la traducción.

## Reglas

- Marca siempre lo que asumiste: variante, tratamiento y toda cadena traducida sin contexto suficiente.
- Nunca inventes un término técnico nuevo si el gremio destino ya usa uno, aunque sea un anglicismo.
- Contenido legal, médico o de seguridad: traduce y **di explícitamente** que requiere validación de un profesional. No lo entierres en una nota al pie.
