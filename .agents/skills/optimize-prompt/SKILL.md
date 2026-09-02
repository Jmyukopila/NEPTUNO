---
name: optimize-prompt
description: Reescribe un prompt para obtener la máxima calidad de respuesta de cualquier modelo Claude. Úsalo cuando el usuario pida optimizar, mejorar o reescribir un prompt, o cuando entregue una instrucción vaga para una tarea importante.
argument-hint: <prompt a optimizar>
---

# Optimizador de prompts

Toma el prompt del usuario (pasado como argumento, o pídelo si falta) y produce una versión optimizada. No ejecutes la tarea del prompt: tu entregable es el prompt mejorado.

## Proceso

1. **Diagnostica** el prompt original: ¿qué falta? (objetivo medible, contexto, restricciones, formato de salida, criterios de éxito, ejemplos). ¿Qué sobra? (relleno, cortesías, ambigüedad).

2. **Reescribe** aplicando esta estructura (omite secciones que no apliquen — un prompt óptimo es tan corto como sea posible, pero no más):

   - **Rol/contexto**: quién debe ser el modelo y qué sabe del entorno. Solo si cambia el resultado.
   - **Objetivo**: una frase imperativa, verificable. "Haz X de modo que Y sea cierto."
   - **Contexto necesario**: datos, archivos, restricciones del dominio. Todo lo que el modelo no puede adivinar y sí necesita.
   - **Restricciones**: qué NO hacer, límites de alcance, tecnologías obligadas/prohibidas.
   - **Proceso** (solo tareas complejas): "primero analiza X, luego propón, luego implementa". Pedir razonamiento antes de la respuesta mejora la calidad en modelos pequeños.
   - **Formato de salida**: estructura exacta esperada (tabla, JSON con schema, diff, lista).
   - **Criterio de éxito**: cómo se sabrá que la respuesta es correcta.
   - **Ejemplos** (few-shot): 1–3 pares entrada→salida si el formato es inusual o la tarea es de clasificación/extracción.

3. **Técnicas a aplicar según el caso**:
   - Instrucciones ambiguas → convertir a criterios binarios verificables.
   - Tareas largas → dividir en pasos numerados con entregable por paso.
   - Tareas con riesgo de alucinación → añadir "si no lo sabes o no está en el contexto, dilo explícitamente".
   - Tareas de análisis → pedir que cite evidencia (archivo:línea, fuente) por cada afirmación.
   - Datos largos + instrucciones → poner los datos ARRIBA y las instrucciones ABAJO (mejora la atención del modelo).
   - Etiquetas XML (`<contexto>`, `<datos>`, `<instrucciones>`) cuando el prompt mezcla varios tipos de contenido.
   - Salida estructurada → dar el schema exacto y un ejemplo relleno.

4. **Entrega** en este formato:

   ```
   ## Prompt optimizado
   <el prompt listo para copiar/pegar>

   ## Qué cambié y por qué
   <3-6 viñetas concretas>
   ```

## Reglas

- El prompt optimizado debe ser autosuficiente: alguien sin esta conversación debe poder usarlo.
- No añadas secciones vacías ni relleno ceremonial ("por favor", "eres un experto de clase mundial" sin contenido).
- Mantén el idioma del prompt original salvo que el usuario pida otro.
- Si el prompt original es para código, incluye siempre: versión/stack, criterio de verificación (tests, comando a ejecutar) y qué hacer con los casos borde.
