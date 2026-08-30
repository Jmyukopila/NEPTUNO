# Doctrina de Diseño y Frontend — originalidad con sistema

Reglas que las 8 skills de diseño (`frontend-design`, `editorial-layout`, `theme-factory`, `motion-design`, `generative-art`, `responsive-grid`, `figma-to-code`, `a11y-review`) llevan incorporadas; esta guía es la referencia común y explica cómo encajan entre sí.

## El principio rector: dirección antes que ejecución

El "look de IA" (degradados morado-azul, tarjetas con sombra idéntica, Inter+Poppins, iconos sin curar) no es un problema de habilidad técnica: es la ausencia de una decisión estética deliberada antes de escribir código. `frontend-design` es siempre el paso 0 — declara una dirección de diseño concreta y con referencias reales antes de tocar color, tipografía o layout.

## Orden de trabajo recomendado

```
frontend-design (dirección)
  → theme-factory (paleta + tipografía)
  → editorial-layout | responsive-grid (estructura y retícula)
  → motion-design | generative-art (movimiento y elementos visuales, opcional)
  → a11y-review (verificación final, siempre)
```

`figma-to-code` entra en paralelo cuando ya existe un diseño o design system dado (Figma, capturas, sistema previo) — en ese caso sustituye a `frontend-design`/`theme-factory` como fuente de la dirección, pero `a11y-review` sigue siendo obligatorio al final.

## Reglas transversales

- **Sistema, no valores sueltos**: tipografía, espaciado y color salen de una escala/token declarado, nunca de un valor improvisado por componente. Esto aplica en las 8 skills — es el hilo común.
- **Cada elección se justifica contra la dirección elegida**, no contra "se ve bien". Si no se puede justificar, no pertenece al diseño.
- **La accesibilidad no es una fase aparte**: `a11y-review` se ejecuta como pase final sobre cualquier UI antes de darla por terminada, igual que `/verify-work` se ejecuta sobre cualquier cambio de código.
- **Rendimiento del movimiento**: cualquier animación (`motion-design`, `generative-art`) anima `transform`/`opacity`, respeta `prefers-reduced-motion`, y se pausa fuera de viewport — nunca decoración a costa de jank.

## Cuándo NO aplican estas skills

Si el proyecto ya tiene un design system o CSS establecido y la tarea es extender un patrón existente, sigue el patrón del repo (regla general de `docs/FULLSTACK.md`: "Patrones del repo primero") en vez de reabrir la dirección estética desde cero. Estas skills son para UI nueva, sin dirección previa, o cuando el resultado actual se siente genérico y el usuario pide una vuelta de diseño.
