---
name: motion-design
description: Reglas estrictas de animación y microinteracciones para Framer Motion, GSAP o CSS nativo — curvas de easing naturales, transiciones fluidas, scroll efectos escalonados (staggered) y hover que responde con elegancia. Úsalo al animar cualquier UI para que se sienta viva sin ser ruidosa ni costosa en rendimiento.
argument-hint: <qué se anima (página, componente, transición)>
---

# Motion Design — movimiento con intención, no decoración

Animar todo con la misma curva/duración es tan genérico como no animar nada. El movimiento comunica jerarquía y causalidad: qué apareció por qué, qué reaccionó a qué.

## Escala de duración (declara y reutiliza, no inventes por componente)

- **Microinteracción** (hover, focus, toggle): 100-150ms.
- **Transición de estado** (aparición de elemento, dropdown, tooltip): 200-300ms.
- **Transición de página/vista**: 300-500ms.
- **Efecto ambiental** (scroll parallax sutil, fondo generativo): puede ser continuo, pero SIEMPRE con `prefers-reduced-motion` respetado.

Regla dura: más de 500ms para algo que el usuario espera activamente (abrir un menú) se siente lento, no elegante.

## Curvas de easing

- Entradas (algo aparece): `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out fuerte) — empieza rápido, llega suave.
- Salidas (algo desaparece): `cubic-bezier(0.4, 0, 1, 1)` (ease-in) — más rápido al final, se siente responsivo.
- Movimiento continuo/loop: `cubic-bezier(0.45, 0, 0.55, 1)` (ease-in-out simétrico).
- Nunca `linear` para movimiento perceptible por el usuario (solo válido para barras de progreso deterministas o rotaciones infinitas constantes).

## Reglas de implementación

1. **Anima solo `transform` y `opacity`** cuando sea posible — son las únicas propiedades que el navegador puede animar en la capa de composición sin recalcular layout/paint. Animar `width`, `height`, `top/left` o `box-shadow` en bucles causa jank.
2. **Stagger con intención**: al animar una lista, el delay entre elementos es proporcional a cuántos hay (menos delay cuantos más elementos: `delay = index * min(50ms, 400ms / count)`), nunca un valor fijo que hace la lista lenta si crece.
3. **Scroll-linked con moderación**: reserva scroll-driven animation para 1-2 momentos clave de la página (hero, transición de sección), no en cada bloque — si todo se mueve al hacer scroll, nada se siente especial.
4. **Hover con retorno simétrico**: la transición de vuelta al estado normal usa la misma duración/curva que la de entrada, o el elemento se siente "pegajoso".
5. **`prefers-reduced-motion: reduce`** desactiva o reduce drásticamente cualquier animación no esencial (mantén solo cambios de opacidad instantáneos para feedback de estado).

## Checklist
- [ ] Las duraciones usadas pertenecen a la escala declarada, no valores sueltos (237ms, 180ms conviviendo sin motivo).
- [ ] Ninguna animación anima propiedades de layout en bucle (perf).
- [ ] Existe un fallback para `prefers-reduced-motion`.
- [ ] El movimiento tiene una razón semántica (jerarquía, causalidad, feedback) — no está ahí "porque se ve bien".
