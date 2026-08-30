---
name: responsive-grid
description: Escalado proporcional de componentes con unidades relativas avanzadas (clamp, vmax, container queries) en vez de depender solo de breakpoints fijos. Úsalo al maquetar cualquier layout que deba verse bien entre 320px y pantallas 4K sin saltos bruscos entre breakpoints.
argument-hint: <componente o página a hacer responsive>
---

# Systemic Responsive Grid — escala continua, no solo breakpoints

Los breakpoints tradicionales (`sm/md/lg/xl`) producen saltos discretos: el texto es 16px hasta 768px y de golpe 20px. El escalado continuo evita el salto y reduce la cantidad de reglas por mantener.

## Herramientas y cuándo usar cada una

1. **`clamp(mín, preferido, máx)`** para cualquier valor que deba escalar suavemente con el viewport: tipografía, padding, gaps.
   - Fórmula base para tipografía fluida: `clamp(<min>rem, <min>rem + (<max>-<min>) * ((100vw - <viewport-min>px) / (<viewport-max>-<viewport-min>)) * 1rem, <max>rem)`.
   - Ejemplo práctico ya calculado (min 320px→16px, max 1440px→18px): `font-size: clamp(1rem, 0.94rem + 0.36vw, 1.125rem)`.
   - Para espaciado: `padding: clamp(1rem, 2vw, 3rem)` escala el aire del layout sin medias queries.

2. **`vmax`/`vmin`** para elementos que deben mantener proporción respecto al lado dominante del viewport (hero de pantalla completa, elementos decorativos) — más robusto que `vw` solo, que se rompe en pantallas muy anchas y bajas (ultrawide).

3. **Container queries (`@container`)** para componentes que se reutilizan en contextos de ancho distinto (una tarjeta en sidebar de 300px vs. en grid principal de 800px) — el componente responde a SU contenedor, no al viewport global. Requiere declarar `container-type: inline-size` en el padre.

4. **Breakpoints tradicionales**, reservados para cambios ESTRUCTURALES reales (de 1 columna a 3 columnas, de menú hamburguesa a barra horizontal) — no para ajustar tamaños, que es trabajo de `clamp`.

## Escala de espaciado sistemática

Todo espaciado (gap, padding, margin) sale de una escala de múltiplos de 4 u 8, nunca de valores sueltos: `4 8 12 16 24 32 48 64 96px`. Si un valor no está en la escala, o falta un escalón real (poco común) o se está improvisando.

## Proceso

1. Identifica qué valores deben escalar de forma continua (tipografía, padding, gaps grandes) vs. qué es estructural (número de columnas, dirección flex).
2. Escribe los `clamp()` de tipografía y espaciado grandes primero — resuelven el 80% del trabajo de "verse bien en todos los tamaños".
3. Usa breakpoints solo para los cambios estructurales restantes.
4. Para componentes reutilizables en distintos anchos de contenedor, usa `@container` en vez de asumir el ancho del viewport.
5. Verifica en al menos 3 anchos reales: 375px (móvil), 768px (tablet), 1440px+ (desktop) — sin saltos visuales feos entre ellos, no solo en los breakpoints exactos.

## Checklist
- [ ] Tipografía y espaciado grandes usan `clamp()`, no tamaños fijos por breakpoint.
- [ ] Todo valor de espaciado pertenece a la escala de 4/8 declarada.
- [ ] Componentes reutilizados en anchos de contenedor distintos usan container queries si el soporte del proyecto lo permite.
- [ ] Se verificó en móvil, tablet y desktop real, no solo redimensionando la ventana del navegador.
