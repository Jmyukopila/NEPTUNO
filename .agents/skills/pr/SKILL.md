---
name: pr
description: Crea un Pull Request de calidad en GitHub desde el trabajo actual - rama, commits atómicos, push y gh pr create con descripción generada del diff real. Úsalo para "haz PR", "sube esto a GitHub" o para publicar el trabajo de la sesión.
argument-hint: [título o intención del PR] (opcional: se deduce del diff)
---

# Crear un Pull Request

Publica el trabajo actual como un PR bien formado usando el `gh` CLI **con la sesión del usuario** (`gh auth`): el PR sale con su autoría y sus permisos — no hay que añadir colaboradores, bots ni tokens extra.

## Proceso

1. **Preflight** (una sola pasada, en paralelo): `gh auth status`, `git status`, `git log --oneline -5`, rama actual y rama por defecto del repo (`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`). Sin remote GitHub o sin auth → repórtalo y para.
2. **Rama**: si estás en la rama por defecto, crea una descriptiva (`tipo/qué-hace`, p. ej. `fix/csv-encoding`). Nunca PR desde `main`.
3. **Commits**: agrupa el working tree en commits atómicos (una intención por commit, mensaje imperativo ≤72 chars en la primera línea). Añade archivos **por nombre** (`git add <archivos>`, nunca `git add -A` a ciegas — revisa `git status` antes por si hay basura: builds, .env, artefactos).
4. **Push**: `git push -u origin <rama>`.
5. **Descripción desde el diff real** — no desde tu memoria de lo que hiciste. Relee `git diff <base>...HEAD --stat` y redacta:
   ```powershell
   gh pr create --title "<título>" --body @'
   ## Qué cambia
   <2-4 frases: el problema y la solución>

   ## Cómo se probó
   <comandos ejecutados y resultado observado — de verdad, no aspiracional>

   ## Notas para el revisor
   <decisiones discutibles, qué mirar primero, qué NO incluye>
   '@
   ```
   Si el repo tiene plantilla de PR (`.github/PULL_REQUEST_TEMPLATE.md`), úsala en vez de esta.
6. **Entrega la URL** y el estado de los checks iniciales (`gh pr checks` — sin `--watch` salvo que el usuario quiera esperar).

## Reglas
- **Regla de tokens**: usa `--json <campos> -q` en todos los `gh ... view/list` — nunca el output completo.
- La sección "Cómo se probó" solo lleva cosas ejecutadas de verdad; si no verificaste, escribe "sin verificar: <motivo>". La honestidad de resultados (CLAUDE.md §4) aplica también en los PRs.
- ¿Trabajo grande que se puede trocear en PRs pequeños encadenados? → eso es `/pr-stack`.
- Draft si el trabajo está incompleto: `--draft` (y dilo en el reporte).
- No hagas merge aquí; eso es `/pr-merge` y decisión del usuario.
