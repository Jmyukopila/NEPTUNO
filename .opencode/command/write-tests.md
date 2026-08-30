---
description: Escribe tests que detectan bugs de verdad (comportamiento, no implementación; cada test debe fallar si el código se rompe). Úsalo para testear código nuevo, cubrir código legado antes de tocarlo, o cuando una suite existente no inspire confianza.
---

Argumentos recibidos (formato esperado: <archivo/módulo/comportamiento a testear>): $ARGUMENTS

# Write Tests — tests que fallan cuando deben

El objetivo a testear viene en los argumentos. Un test que no puede fallar no es un test, es peso muerto: el estándar de esta skill es que cada test nuevo detecte la rotura del comportamiento que dice cubrir, y lo demuestres.

## Proceso

1. **Reconocimiento**: framework y patrones de tests del repo (runner, estructura de carpetas, fixtures/factories existentes, convención de nombres). Los tests nuevos deben parecer escritos por el mismo equipo. Si ya hay tests del área, léelos: no dupliques casos ya cubiertos.

2. **Inventario de comportamientos** (antes de escribir el primer test): lista qué hace el código por su interfaz pública — el contrato observable, no las líneas. Por cada comportamiento: el caso típico, los bordes de datos (vacío, null, 0, negativo, unicode, duplicados, el límite exacto de cada rango) y los caminos de error (¿qué promete el código cuando el input es inválido o la dependencia falla?).

3. **Escribe cada test** con estas reglas:
   - **Comportamiento, no implementación**: testea por la interfaz pública. Un test que se rompe al refactorizar sin cambiar comportamiento es un test mal escrito.
   - Estructura Arrange-Act-Assert; un comportamiento por test; nombre que describe el caso ("rechaza_email_sin_arroba", no "test_2").
   - **Asserts con sustancia**: sobre el resultado/efecto observable. Prohibido como assert único "no lanzó excepción" o "se llamó al mock".
   - **Prohibido re-implementar la lógica en el test** para calcular el esperado: los valores esperados van literales, calculados a mano o desde un caso conocido.
   - **Determinismo**: reloj y aleatoriedad inyectados o fijados (seed, fecha congelada); nada de sleeps para "esperar" — espera condiciones. Un test flaky es peor que no tener test.
   - Mocks solo en la frontera (red, DB, reloj, filesystem) y solo si el repo no tiene ya un patrón mejor (DB de test, fakes). Mockear lo que estás testeando invalida el test.

4. **Prueba de mutación manual** (la verificación que casi nadie hace): elige los 2-3 tests más importantes, sabotea el código que cubren (invierte el condicional, devuelve el valor equivocado), confirma que fallan **por la razón correcta**, y restaura. Un test que sobrevive al sabotaje no cubre nada — reescríbelo.

5. **Ejecuta la suite completa del área** y entrega: comportamientos cubiertos, casos borde incluidos, resultado del sabotaje (qué test mató a qué mutación), y qué quedó sin cubrir con su motivo (para que sea una decisión visible, no un olvido).

## Reglas
- Cobertura es un subproducto, no el objetivo: 5 tests que muerden valen más que 30 decorativos escritos para inflar el porcentaje.
- Código difícil de testear es información de diseño: repórtalo (¿necesita inyección de dependencias? ¿separar I/O de lógica?) en vez de escribir un test contorsionado con 6 mocks.
- Tests legibles sin ir a mirar helpers: el que lee un test fallido a las 3am debe entender el caso sin abrir otros archivos.
