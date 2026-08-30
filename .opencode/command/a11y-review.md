---
description: Verifica contraste de color, navegación por teclado y marcado HTML semántico en cualquier interfaz — para que la originalidad visual no arruine la experiencia de usuario. Úsalo al cerrar la paleta en `theme-factory`, y como pase final sobre cualquier UI antes de darla por terminada.
---

Argumentos recibidos (formato esperado: <componente o página a auditar>): $ARGUMENTS

# Semantic Web & Accessibility — originalidad que no excluye

Una paleta o un layout llamativo que falla contraste o teclado no es un diseño terminado, es uno roto para una parte real de los usuarios. Este es un pase de verificación, no una fase creativa.

## Contraste de color (WCAG)

- Texto normal: ratio mínimo **4.5:1** (AA) contra su fondo; **7:1** para AAA.
- Texto grande (≥24px, o ≥19px bold): mínimo **3:1** (AA).
- Elementos de UI no textuales con significado (bordes de input, iconos que comunican estado, indicadores de foco): mínimo **3:1** contra el fondo adyacente.
- Verifica CADA combinación texto/fondo realmente usada, no solo el par principal — un acento vibrante que funciona sobre fondo oscuro puede fallar sobre superficie clara del mismo tema.
- Nunca comuniques información SOLO con color (error en rojo sin icono/texto también) — falla para daltonismo.

## Navegación por teclado

- Todo elemento interactivo (botón, link, input, elemento custom con `onClick`) debe ser alcanzable con `Tab` y activable con `Enter`/`Espacio`.
- Orden de foco lógico: sigue el orden visual/de lectura, no el orden accidental del DOM tras un layout con `order`/posicionamiento absoluto.
- Foco SIEMPRE visible: nunca `outline: none` sin un `:focus-visible` alternativo igual de claro. Un anillo de foco sutil que casi no se ve no cuenta.
- Modales/drawers: el foco entra al abrir, queda atrapado dentro (focus trap) mientras está abierto, y vuelve al elemento que lo abrió al cerrar. `Escape` cierra.
- Elementos decorativos (el fondo generativo de `generative-art`, iconos puramente visuales) quedan fuera del orden de tabulación (`aria-hidden="true"`, sin `tabindex`).

## HTML semántico primero, ARIA como último recurso

- Usa el elemento nativo que ya tiene la semántica correcta antes de reconstruirla con `div` + `role` + `aria-*`: `<button>` no `<div role="button">`, `<nav>`, `<main>`, `<h1>-<h6>` en orden jerárquico real (no saltar de `h1` a `h4` por tamaño visual — el tamaño se controla por CSS, la jerarquía por el nivel del heading).
- `<img>` significativas llevan `alt` descriptivo; decorativas llevan `alt=""` (no se omite el atributo, se vacía).
- Formularios: cada `<input>` con `<label>` asociado (por `for`/`id`, o envolvente) — un placeholder no sustituye a un label.
- ARIA se añade solo cuando el HTML nativo no puede expresar el patrón (ej. un combobox custom, un tab panel) — y siempre siguiendo un patrón conocido (WAI-ARIA Authoring Practices), nunca `aria-*` inventado.

## Proceso de auditoría

1. Recorre la interfaz solo con teclado (sin mouse) de principio a fin del flujo principal.
2. Calcula el ratio de contraste real de cada par texto/fondo usado (no a ojo).
3. Inspecciona el árbol de accesibilidad (DevTools → Accessibility) buscando roles/nombres faltantes en elementos interactivos.
4. Verifica jerarquía de headings de la página (debe leerse como un índice coherente si se extraen solo los `h1-h6`).

## Reporte
Lista de hallazgos con severidad (bloqueante / importante / menor), el elemento exacto, y el fix — no un veredicto genérico de "accesible/no accesible".
