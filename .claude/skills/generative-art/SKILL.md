---
name: generative-art
description: Patrones visuales matemáticos, fondos generativos dinámicos y layouts abstractos codificados en Canvas/SVG/WebGL — sin depender de imágenes estáticas ni de librerías de assets. Úsalo cuando la dirección de `frontend-design` pida un fondo/elemento visual original y con máxima originalidad, o cuando un fondo estático se sienta genérico.
argument-hint: <elemento a generar (fondo, hero, separador)>
---

# Algorithmic Art & Canvas Shaders — visuales de código, no de stock

Un fondo generativo bien elegido es más original y más ligero que cualquier imagen de stock o ilustración genérica de librería. Se codifica, no se descarga.

## Familias de algoritmos (elige una que case con la dirección estética)

- **Campos de ruido (Perlin/Simplex)**: fondos orgánicos, fluidos, tipo "nube de tinta" — encajan con direcciones nórdicas/orgánicas.
- **Sistemas de partículas**: puntos con física simple (atracción/repulsión al cursor, gravedad) — encajan con direcciones técnicas/retro-futuristas.
- **Flow fields**: líneas o partículas que siguen un campo vectorial derivado de ruido — buen fondo ambiental de baja distracción.
- **Teselación geométrica (Voronoi, grids triangulares, Truchet tiles)**: encaja con direcciones brutalistas/corporativas premium — orden con variación.
- **Formas paramétricas (Lissajous, superformula, ondas superpuestas)**: buenas para elementos hero grandes y estáticos-pero-vivos.

## Proceso

1. **Elige la familia por la dirección de diseño**, no por la que sea más vistosa — un flow field caótico no encaja con un tema corporativo premium.
2. **Implementa en Canvas 2D primero** (más simple, mejor soporte); solo sube a WebGL/shaders si necesitas miles de partículas o efectos de post-procesado que Canvas 2D no puede a 60fps.
3. **Semilla determinista opcional**: si el patrón debe verse igual en cada carga (para consistencia de marca), fija la semilla del RNG; si debe sentirse vivo, usa `Date.now()` o el cursor como entrada.
4. **Paleta del tema, no colores del algoritmo**: el generador produce estructura (posición, forma, densidad); el color sale de la paleta fijada en `theme-factory`, nunca de un `hsl(random, 100%, 50%)` sin control.
5. **Rendimiento**:
   - `requestAnimationFrame`, nunca `setInterval`, para loops de animación.
   - Limita el recuento de partículas/elementos según el tamaño real del canvas (menos en móvil).
   - Pausa el loop cuando el canvas no es visible (`IntersectionObserver`) o la pestaña está en background (`document.hidden`).
   - Con `prefers-reduced-motion: reduce`, renderiza UN frame estático del patrón en vez de animarlo — nunca lo elimines del todo si aporta identidad visual.
6. **Fallback de carga**: el canvas debe tener un color de fondo sólido (del tema) antes de que el primer frame se pinte, para evitar flash blanco.

## Checklist
- [ ] El algoritmo elegido tiene relación declarada con la dirección estética (no es el primero que se ocurrió).
- [ ] Usa `requestAnimationFrame` y se pausa fuera de viewport/tab.
- [ ] La paleta de color viene del tema, no de valores aleatorios sin control.
- [ ] Hay fallback estático para `prefers-reduced-motion` y para el frame antes de cargar.
