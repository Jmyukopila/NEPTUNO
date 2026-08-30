---
description: Principios de diseño editorial moderno — paletas monocromáticas, alto contraste tipográfico, espacio en blanco generoso y retículas estrictas, en vez de llenar la pantalla de contenedores/tarjetas innecesarios. Úsalo cuando la dirección elegida en `frontend-design` sea editorial/minimalista, o cuando el layout se sienta "lleno de cajas" sin necesidad.
---

Argumentos recibidos (formato esperado: <página o sección a maquetar>): $ARGUMENTS

# Editorial Layout — retícula y tipografía como estructura

El instinto por defecto de un modelo es meter cada bloque de contenido en una tarjeta con borde y sombra. El diseño editorial usa la retícula y la tipografía para crear jerarquía — los contenedores decorativos son la excepción, no la regla.

## Proceso

1. **Define la retícula antes del contenido**: columnas (12 es el estándar; 4-6 para layouts densos de texto), gutter consistente, márgenes exteriores que escalan con el viewport (ver `responsive-grid`). El contenido se alinea a la retícula, no al revés.
2. **Escala tipográfica estricta**: elige una razón (1.25, 1.333 o 1.5) y deriva TODOS los tamaños de un valor base — nunca tamaños sueltos (`14px`, `15px`, `17px` conviviendo sin motivo). Ejemplo con base 16px y razón 1.333: 12 / 16 / 21 / 28 / 38 / 51px.
3. **Contraste tipográfico como jerarquía**, no color: un titular grande + peso alto junto a cuerpo pequeño + peso normal comunica jerarquía sin necesitar fondos ni bordes distintos.
4. **Paleta contenida**: 1 color de texto principal + 1 de fondo + 1 acento (máximo 2) es suficiente en la mayoría de layouts editoriales. Los grises intermedios se generan variando luminosidad del mismo tono, no añadiendo grises neutros sueltos.
5. **Espacio en blanco es contenido**: antes de envolver un bloque en una tarjeta, prueba separarlo solo con espacio + una regla tipográfica (línea fina, cambio de tamaño). Reserva tarjetas/bordes para cuando de verdad hay que agrupar visualmente elementos heterogéneos (ej. un feed de items distintos entre sí).
6. **Ritmo vertical**: el espaciado entre bloques sigue la misma escala sistemática que la tipografía (múltiplos de 4/8, ver `responsive-grid`), no valores arbitrarios por bloque.

## Anti-patrones a evitar

- Envolver cada sección en `<div class="card shadow rounded-lg p-6">` por costumbre.
- Centrar texto largo (>60-75 caracteres por línea rompe la legibilidad; limita el ancho de columna de texto, no lo centres en toda la pantalla).
- Mezclar más de 2-3 tamaños de fuente sin relación matemática entre ellos.
- Bordes y separadores de color aleatorio en vez de reglas finas del mismo tono que el texto a baja opacidad.

## Checklist
- [ ] Existe una escala tipográfica declarada (base + razón) y todo tamaño de texto pertenece a ella.
- [ ] El espaciado vertical sigue una escala, no valores sueltos por componente.
- [ ] Ningún bloque tiene tarjeta/sombra/borde sin una razón de agrupación real.
- [ ] La retícula de columnas es consistente en toda la página, no reinventada por sección.
