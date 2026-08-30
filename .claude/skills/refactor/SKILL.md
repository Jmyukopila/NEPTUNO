---
name: refactor
description: Refactoriza código preservando el comportamiento observable, con red de tests previa, pasos pequeños siempre en verde y verificación de equivalencia. Úsalo para reestructurar código, eliminar duplicación o pagar deuda técnica sin romper nada.
argument-hint: <qué refactorizar y con qué objetivo>
---

# Refactor — cambiar la forma sin cambiar el fondo

El objetivo viene en los argumentos. Definición estricta: un refactor cambia la estructura SIN cambiar el comportamiento observable. Si el comportamiento cambia, aunque sea "para mejor", ya no es un refactor y hay que declararlo.

## Fase 1 — Red de seguridad (antes de tocar nada)

1. **Delimita el comportamiento a preservar**: interfaz pública del código afectado, quién lo usa (grep por cada símbolo exportado — cada uso es un punto de rotura) y qué efectos observables tiene (retornos, escrituras, errores lanzados, logs con contrato).
2. **Verifica la red de tests**: ejecuta los tests del área y confirma que pasan ANTES de empezar. Si el código a refactorizar no tiene tests que cubran sus comportamientos clave, **escribe primero tests de caracterización** (usa `/write-tests`): tests que capturan lo que el código HACE hoy — incluso lo raro — sin juzgar si es correcto.
3. Anota el estado base: suite en verde + (si hay dudas de rendimiento) una medición del caso caliente.

## Fase 2 — Refactor en pasos pequeños

- **Un movimiento a la vez** (extraer función, renombrar, mover, invertir dependencia, inline) y la suite en verde entre paso y paso. Nunca acumules 5 movimientos sin verificar: cuando algo rompa no sabrás cuál fue.
- **Renombres/movimientos**: grep por el símbolo viejo tras cada uno — imports, tests, config, strings de reflexión/serialización y docs también son usos.
- **Cero cambios funcionales colados**: si a mitad de refactor encuentras un bug, NO lo arregles en el mismo cambio — anótalo y repórtalo aparte (el fix mezclado con el refactor hace ambos irrevisables). Lo mismo con mejoras de comportamiento "ya que estoy".
- Respeta el presupuesto del encargo: refactoriza lo pedido, no todo lo que te ofende por el camino. Lo demás, a la lista de propuestas.

## Fase 3 — Verificación de equivalencia

1. Suite completa del área en verde (la misma que en la fase 1, sin tests borrados ni debilitados por el camino — debilitar un assert para que pase es ocultar una rotura).
2. **Ejercita el flujo real** igual que antes del refactor (CLI/petición/script consumidor) y compara el resultado observable con el estado base.
3. Relee el diff completo preguntando solo una cosa: ¿algún hunk cambia comportamiento? Todo "sí" se revierte o se declara.
4. Si había medición de rendimiento, repite y compara (un refactor que degrada 10× el camino caliente no es neutro).

## Entrega
- Qué se reestructuró y por qué (movimientos aplicados, en líneas).
- Evidencia de equivalencia: tests antes → después, flujo real antes → después.
- Bugs/mejoras detectados y NO aplicados (lista para decisión aparte).
- Cambios de interfaz pública, si el encargo los autorizó (con la lista de call-sites actualizados).
