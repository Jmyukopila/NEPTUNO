---
name: pr-merge
description: Mergea un Pull Request de GitHub de forma segura - verifica checks, reviews y conflictos, elige la estrategia correcta y limpia las ramas. Úsalo para "mergea el PR", "está verde ya?", o para aterrizar trabajo aprobado.
argument-hint: <número o URL del PR> (opcional: el PR de la rama actual)
---

# Merge seguro de un PR

Aterriza un PR con las tres luces en verde — checks, reviews, sin conflictos — con la estrategia de merge que el repo usa. Corre con el `gh` del usuario: el merge queda a su nombre, sin bots ni colaboradores extra.

## Proceso

1. **Estado real del PR** (un solo comando, output filtrado):
   ```powershell
   gh pr view <n> --json state,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,baseRefName,headRefName,isDraft -q '{state,mergeable,mergeStateStatus,reviewDecision,base:.baseRefName,head:.headRefName,draft:.isDraft, checks:[.statusCheckRollup[]? | {name,status,conclusion}]}'
   ```
2. **Semáforo** — no mergees si alguna está en rojo; reporta cuál y por qué:
   - `checks`: todos `SUCCESS`/`NEUTRAL`/`SKIPPED`. Alguno en curso → `gh pr checks <n> --watch` solo si el usuario quiere esperar. Alguno en rojo → mira el log del check fallido (`gh run view <id> --log-failed`, filtrado) y reporta la causa; NO mergees "porque el fallo no parece relacionado".
   - `reviewDecision`: `APPROVED` o vacío si el repo no exige reviews. `CHANGES_REQUESTED` → para; reporta qué pidió el revisor (`gh pr view <n> --json reviews`).
   - `mergeable`: `CONFLICTING` → resuelve primero (paso 3). `isDraft: true` → `gh pr ready <n>` solo si el trabajo realmente está listo.
3. **Conflictos** (solo si los hay): actualiza la rama del PR con la base — `git fetch origin && git rebase origin/<base>` en la rama head, resuelve leyendo AMBOS lados (jamás "aceptar todo lo mío"), re-ejecuta los tests del área, push. Si el rebase reescribe historia compartida, `--force-with-lease` (nunca `--force`).
4. **Estrategia**: respeta la del repo — mira qué permite (`gh repo view --json squashMergeAllowed,rebaseMergeAllowed,mergeCommitAllowed`) y qué se usó en los últimos merges. Por defecto **squash** para ramas de trabajo con commits de proceso; **merge commit** solo si el repo lo usa; **rebase** si el historial lineal es la convención.
5. **Merge y limpieza**:
   ```powershell
   gh pr merge <n> --squash --delete-branch
   git checkout <base>; git pull; git branch -d <head>   # sincroniza y limpia el local
   ```
6. **Post-merge**: confirma `state: MERGED`, y si este PR era la base de otros (stack), avisa: los siguientes necesitan `/pr-stack restack`.

## Reglas
- Tres luces en verde o no hay merge — sin excepciones "porque tenemos prisa" salvo orden explícita del usuario (y entonces déjalo escrito en el reporte).
- `--admin` (saltarse protecciones) jamás por iniciativa propia.
- **Regla de tokens**: `--json ... -q` siempre; logs de CI solo `--log-failed` y filtrado.
