---
description: Stacked PRs estilo Graphite con git y gh puros - divide trabajo grande en una cadena de PRs pequeños y revisables, cada uno basado en el anterior, con restack automático tras cambios y aterrizaje en orden. Úsalo para features grandes, para "divide esto en PRs" o para gestionar/actualizar un stack existente.
---

Argumentos recibidos (formato esperado: <crear <tarea> | restack | status | land> (por defecto: status del stack actual)): $ARGUMENTS

# Stacked PRs (estilo Graphite, sin Graphite)

Un stack = cadena de ramas `main ← parte-1 ← parte-2 ← parte-3`, cada una con su PR **cuya base es la rama anterior**. GitHub muestra así solo el diff incremental de cada parte: PRs de 200 líneas revisables en minutos, en vez de uno de 2.000. Todo con git + `gh` del usuario — sin herramientas ni permisos extra.

## Subcomandos

### `crear <tarea>` — diseñar y montar el stack
1. Parte la tarea en 2-4 capas donde **cada una deja el repo funcionando** (p. ej. `schema → api → ui`, o `refactor-preparatorio → feature`). Si las partes no tienen frontera limpia, di que no compensa y hazlo como PR único (`/pr`).
2. Por cada capa, en orden: rama desde la anterior (`git checkout -b feat/x-2-api feat/x-1-schema`), commits de esa capa, push, y PR **encadenando la base**:
   ```powershell
   gh pr create --base feat/x-1-schema --title "[2/3] API de x" --body "..."
   ```
   La primera capa lleva `--base main`. Título con `[i/n]` y cada body enlaza el PR anterior y el siguiente.
3. Cierra con la tabla del stack (ver `status`).

### `status` — ver el stack
Reconstruye la cadena con `gh pr list --author "@me" --json number,title,baseRefName,headRefName,state -q ...` y muestra:
```
main ← #12 [1/3] schema (MERGED) ← #13 [2/3] api (OPEN, checks ✓) ← #14 [3/3] ui (OPEN, checks ✗)
```

### `restack` — propagar cambios hacia arriba
Cuando una capa inferior cambia (review, fix), TODAS las de encima deben rebasarse. Con git moderno es un solo comando desde la rama superior:
```powershell
git rebase origin/main --update-refs        # rebasa la cadena entera moviendo cada rama intermedia
git push --force-with-lease origin parte-1 parte-2 parte-3
```
(`--update-refs` requiere git ≥2.38 — verifícalo; si no, rebase capa a capa: `git rebase parte-1 parte-2`, etc.). Tras el push, confirma que cada PR sigue mostrando solo su diff incremental (`gh pr diff <n> --name-only`).

### `land` — aterrizar en orden
1. Mergea el PR de abajo (`/pr-merge` con squash).
2. **Retarget inmediato**: el siguiente PR apuntaba a la rama recién borrada → `gh pr edit <n> --base main`. (GitHub a veces retargetea solo; verifica, no asumas.)
3. Restack del resto sobre el nuevo main, repite hasta vaciar el stack.

## Reglas
- Un PR del stack = una idea revisable que compila y pasa tests por sí sola. Si una capa no se sostiene sola, fusiónala con su vecina.
- Fuerza el push solo con `--force-with-lease`, y solo sobre tus ramas del stack.
- No mezcles trabajo nuevo en capas ya en review: capa nueva encima.
- **Regla de tokens**: opera el stack con `--json`/`-q` y `--name-only`; nunca vuelques diffs completos para "ver cómo va".
