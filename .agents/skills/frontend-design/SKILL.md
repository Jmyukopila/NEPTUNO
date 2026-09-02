---
name: frontend-design
description: Dirección de arte obligatoria antes de escribir código de UI — fuerza una decisión estética deliberada y prohíbe explícitamente los defaults genéricos de IA (degradado morado-azul, tarjetas con sombra difusa idéntica, combo Inter+Poppins, iconos sin curar, border-radius uniforme en todo). Úsalo como PRIMER paso de cualquier tarea de frontend/UI nueva, antes de tocar tipografía, color o layout.
argument-hint: <qué se está construyendo (página, app, componente)>
---

# Frontend Design — dirección de arte antes que código

El error más común al generar UI con IA no es técnico: es la ausencia de una decisión estética. Sin dirección, el modelo cae en el "look de IA" reconocible al instante. Esta skill es el paso 0, obligatorio, antes de `editorial-layout`, `theme-factory`, `motion-design`, `responsive-grid`, `generative-art` o `a11y-review`.

## Proceso

1. **Una frase de carácter**: ¿qué es este producto si fuera una persona/lugar/objeto? ("una revista de arquitectura suiza", "un terminal de trading nocturno", "una tienda de vinilos de los 70"). Sin esta frase, cualquier elección posterior es arbitraria.
2. **Elige UNA dirección de diseño concreta** (no "moderno y limpio" — eso no es una dirección):
   - Editorial minimalista (monocromo, tipografía como protagonista) → usa `editorial-layout`.
   - Brutalista/técnico (bordes duros, monoespaciada, sin decoración).
   - Corporativo premium (paleta contenida, mucho aire, foto/ilustración curada).
   - Retro-futurista (grid neón, escaneo CRT, contraste alto).
   - Orgánico/generativo (formas fluidas, fondo algorítmico) → usa `generative-art`.
3. **Referencias reales, no adjetivos**: nombra 1-2 sitios/productos reales que comparten la dirección elegida (Stripe, Linear, un fanzine, una revista impresa) para anclar decisiones de espaciado y jerarquía.
4. **Declara la dirección antes de escribir CSS/JSX**, en una línea: `Dirección: <nombre> — inspirado en <referencia>. Evitar: <qué NO hacer>`.

## Prohibido por defecto (si no está justificado por la dirección elegida)

- Degradados morado→azul o rosa→naranja como fondo decorativo.
- Sombra difusa idéntica (`box-shadow: 0 4px 20px rgba(0,0,0,.1)`) en cada tarjeta sin razón.
- Combo tipográfico Inter + Poppins/Montserrat, o cualquier par que no se eligió deliberadamente (usa `theme-factory`).
- Iconos genéricos de la primera librería que aparece (Heroicons/Lucide sin curar) mezclados con estilos visuales distintos.
- `border-radius` idéntico (ej. 12px) aplicado a botones, tarjetas, inputs y modales por igual sin decisión de sistema.
- Centrar todo el contenido en contenedores de ancho fijo (`max-w-md mx-auto`) como layout por defecto, ignorando la retícula real de la página.
- Paletas con más de 2 tonos de "acento" sin jerarquía clara entre ellos.

## Checklist antes de entregar

- [ ] La frase de carácter existe y el layout/color/tipografía la reflejan, no la contradicen.
- [ ] Cada decisión de color/tipo/espaciado se puede justificar contra la dirección elegida (no "porque sí").
- [ ] Si hay tarjetas/sombras/gradientes, hay una razón de sistema, no "porque se ve bien".
- [ ] Se consultó `theme-factory` para la pareja tipografía+color y `a11y-review` para contraste antes de fijar la paleta final.

## Regla
Si el usuario no da dirección estética y el proyecto no tiene una ya establecida (design system, capturas previas, CSS existente), decide UNA dirección tú mismo siguiendo este proceso y decláralo — no preguntes por gusto genérico ("¿qué colores prefieres?"); pregunta solo si hay ambigüedad real de producto (B2B serio vs. consumer lúdico cambia la dirección entera).
