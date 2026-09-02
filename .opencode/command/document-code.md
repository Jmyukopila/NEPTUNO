---
description: Escribe documentación técnica que alguien leería de verdad — README, ADR, docstrings, runbooks y guías de onboarding — derivada del código real y con criterio explícito de qué NO documentar. Úsalo al cerrar una feature, al publicar un proyecto o cuando el usuario pida documentar algo.
---

Argumentos recibidos (formato esperado: <qué documentar y para quién>): $ARGUMENTS

# Document Code — documentación derivada del código, no del deseo

Lo que hay que documentar viene en los argumentos. Antes de escribir una línea, responde estas dos:

- **¿Quién lee esto y qué está intentando hacer?** (alguien que va a usar la API / alguien que va a modificar el código / alguien a las 3 AM con producción caída / tú dentro de 6 meses)
- **¿Qué se rompe si esto no existe?** Si la respuesta es "nada", no lo escribas.

Documentación que nadie necesita es deuda: envejece, miente y hace desconfiar del resto.

## Los 5 formatos y cuándo usar cada uno

| Formato | Lector | Responde | Regla dura |
|---|---|---|---|
| **README** | quien llega nuevo | ¿qué es, cómo lo arranco, cómo verifico que funciona? | Todo comando del README debe haberse ejecutado |
| **ADR** | quien va a cambiar la decisión | ¿por qué así y no de la otra forma? | Se escribe una vez y se marca `Superseded by`, nunca se edita el histórico |
| **Docstring / JSDoc** | quien llama a la función | contrato: entradas, salidas, errores, efectos | Solo en API pública o lógica no evidente |
| **Runbook** | quien está de guardia | ¿cómo detecto, diagnostico y arreglo este fallo? | Cada paso es un comando copiable, no una descripción |
| **Guía de arquitectura** | quien va a implementar dentro | ¿dónde vive cada cosa y por qué? | Acompañada de un diagrama (usa `diagram-mermaid`) |

## Plantillas

**README** (secciones en este orden, sin más):
```
# <nombre> — <una frase de qué hace y para quién>
## Requisitos      <versiones exactas verificadas>
## Instalación     <comandos ejecutados>
## Uso mínimo      <el ejemplo más corto que produce salida real>
## Configuración   <tabla: variable | obligatoria | default | qué hace>
## Desarrollo      <cómo correr tests y lint>
## Arquitectura    <3-6 frases + diagrama si hay >3 componentes>
```

**ADR** (`docs/adr/NNNN-titulo-en-kebab.md`):
```
# NNNN — <decisión en imperativo>
Estado: Propuesta | Aceptada | Sustituida por [NNNN]
Fecha: YYYY-MM-DD

## Contexto      <las fuerzas reales: restricción técnica, plazo, equipo, coste>
## Decisión      <qué se hace, en presente: "Usamos X">
## Alternativas  <las que compitieron de verdad, con el motivo de 1 línea del descarte>
## Consecuencias <lo que gana Y lo que cuesta; si no hay coste, no analizaste bien>
```

**Docstring** — contrato, no paráfrasis del nombre:
```
Mal:  """Obtiene el usuario."""                     (el nombre ya lo dice)
Bien: """Devuelve el usuario activo por email.
      Lanza UserNotFound si no existe o está dado de baja.
      No cachea: cada llamada golpea la DB."""      (contrato + trampa)
```

**Runbook**:
```
## Síntoma        <lo que ve el que está de guardia: alerta, error, métrica>
## Diagnóstico    1. <comando> → si ves X, ve a A; si ves Y, ve a B
## Mitigación     <lo que para la sangría YA, aunque sea sucio>
## Causa raíz     <cómo se arregla de verdad, o link al issue>
## Escalar a      <quién/dónde, si nada de lo anterior funciona>
```

## Proceso

1. **Lee el código antes de describirlo.** Cada afirmación de la documentación debe apuntar a código que leíste en esta sesión. Documentar de memoria produce documentación falsa, que es peor que ninguna.
2. **Ejecuta lo que escribes.** Todo comando de instalación, arranque o test va al terminal antes de entrar al documento. Si no puedes ejecutarlo, márcalo explícitamente como *sin verificar*.
3. **Escribe con `write-natural`.** La documentación técnica es prosa: aplica esa skill para que no suene a plantilla generada.
4. **Diagrama si hay estructura.** >3 componentes o cualquier flujo con ramas → `diagram-mermaid`.
5. **Autocrítica**: ¿alguna frase es cierta solo hoy? ¿alguna sección la escribí porque "toca tenerla"? Bórrala.

## Qué NO documentar

- Lo que el código ya dice con claridad. Un comentario que repite la línea de abajo es ruido.
- Detalles de implementación interna en documentación de usuario: se quedan obsoletos primero.
- Listas exhaustivas de funciones/endpoints generables desde el código: genera, no transcribas.
- Historial de cambios a mano si hay git. Usa `/release` y el changelog generado.

## Reglas

- Nada de "simplemente", "fácilmente", "solo tienes que". Si fuera fácil no harían falta las instrucciones.
- Prohibido documentar comportamiento aspiracional. Documenta lo que hace hoy la rama en la que estás.
- Toda documentación que crees o toques debe quedar enlazada desde algún índice existente (README, `docs/`), o nadie la encontrará.
