---
description: Interpreta estructuras de sistemas de diseño profesionales (Figma u otro) hacia código — tokens de diseño, espaciados sistemáticos (múltiplos de 4/8) y jerarquías de componentes. Úsalo cuando el usuario dé un diseño, capturas de Figma, o un design system existente que el código debe respetar fielmente.
---

Argumentos recibidos (formato esperado: <fuente del diseño (link de Figma, capturas, design system existente)>): $ARGUMENTS

# Figma-to-Agent Alignment — del diseño al código sin perder el sistema

Un diseño de Figma no es una imagen a copiar a ojo: es un sistema de tokens y jerarquías. Traducirlo pixel a pixel sin extraer el sistema produce CSS frágil y desalineado en el siguiente cambio.

## Proceso

1. **Extrae los tokens antes de maquetar ni un componente**:
   - Color: cada color usado en el diseño → variable nombrada por rol (`--color-surface`, `--color-accent`), no por valor (`--blue-1`). Si dos elementos "parecen" el mismo azul pero difieren en 1 unidad de hex, es probable error de diseño — repórtalo, no lo dupliques como dos tokens.
   - Tipografía: familia, tamaño, peso, line-height y letter-spacing de cada estilo de texto usado → un token por estilo (`heading-lg`, `body-sm`), no clases sueltas repetidas por componente.
   - Espaciado: mide los gaps/paddings del diseño y verifica que caen en una escala de 4 u 8 — si el diseño usa 13px donde el sistema espera 12 o 16, es desviación de precisión de la herramienta, no una decisión; redondea al valor de la escala.
   - Radios, sombras, breakpoints: mismo tratamiento — un token por valor distinto observado, consolidado si dos valores casi iguales son en realidad el mismo con error de redondeo.

2. **Mapea auto-layout de Figma a CSS real**:
   - Auto-layout horizontal/vertical con gap → `display: flex` + `gap` (nunca márgenes manuales entre hijos).
   - "Hug contents" → `width: fit-content` / `flex: 0 0 auto`.
   - "Fill container" → `flex: 1` o `width: 100%` según el eje.
   - Auto-layout anidado con wrap → `flex-wrap` o grid si la disposición es bidimensional, no flex forzado.

3. **Jerarquía de componentes**: identifica qué es un componente reutilizable (se repite con variantes: tamaño, estado, color) vs. qué es maquetación única de una página. Los primeros se construyen como componentes con props/variantes; lo segundo se maqueta directo, sin sobre-abstraer una sección que aparece una sola vez.

4. **Estados no siempre están en el diseño estático**: hover, focus, disabled, loading y error rara vez vienen dibujados para cada componente. Infiere el patrón del propio design system (¿cómo trata el diseño el estado disabled donde SÍ está dibujado?) y aplícalo consistentemente donde falte — no inventes un tratamiento distinto por componente.

## Checklist
- [ ] Todo color/tipografía/espaciado usado en el código sale de un token, no de un valor copiado directo del inspector de Figma.
- [ ] Los espaciados se redondearon a la escala del sistema cuando el diseño traía valores de precisión de herramienta (13px, 23px).
- [ ] El auto-layout se tradujo a flex/grid real, no a posicionamiento absoluto imitando coordenadas.
- [ ] Los estados no dibujados siguen el patrón del sistema, declarado explícitamente en el reporte de qué se infirió.
