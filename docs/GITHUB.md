# GITHUB.md — Doctrina de GitHub con `gh`

Todo GitHub (PRs, merges, checks, releases, stacks) se opera con el **`gh` CLI autenticado como el usuario** (`gh auth login`, una vez). No hay que añadir a Claude como colaborador, ni crear bots, ni tokens de máquina: cada PR, review y merge sale con la identidad y permisos del usuario. Las skills `/pr`, `/pr-merge`, `/pr-stack` y `/release` implementan esta doctrina.

## 1. Los tres mandamientos

1. **Identidad del usuario, siempre.** `gh auth status` es el preflight universal. Si algo pide permisos que el usuario no tiene (repo ajeno), la vía es fork + PR (`gh repo fork --clone`), no pedir acceso.
2. **JSON filtrado, nunca output crudo.** Cada `gh ... view/list` lleva `--json <campos> -q '<filtro>'`. El output humano de `gh` es bonito y carísimo en tokens; el JSON filtrado da exactamente los 5 campos que importan.
3. **Estado real antes de actuar.** Antes de mergear, retargetear o pushear con fuerza: leer el estado actual del PR/rama del servidor (`gh pr view`, `git fetch`), no de la memoria de la sesión.

## 2. Chuleta de comandos (los que cubren el 95%)

```powershell
# Estado
gh pr view <n> --json state,mergeable,reviewDecision,statusCheckRollup -q '...'
gh pr checks <n>                      # (--watch solo si toca esperar)
gh pr list --author "@me" --json number,title,baseRefName,headRefName
gh run view <id> --log-failed         # SOLO el log del paso fallido

# Acción
gh pr create --base <rama> --title "..." --body @'...'@   [--draft]
gh pr edit <n> --base main            # retarget (clave en stacks)
gh pr merge <n> --squash --delete-branch
gh pr ready <n>                       # draft → listo
gh release create v1.2.0 --notes @'...'@ app-release.apk
gh repo fork --clone                  # contribuir a repo ajeno
```

En PowerShell 5.1, los bodies multilínea van en here-string `@'...'@` con el cierre en columna 0.

## 3. PRs que se revisan rápido

- **Pequeño y de una idea**: <400 líneas se revisa en minutos; >1000 se aprueba sin leer (que es peor). Trabajo grande → stack (`/pr-stack`).
- **El body dice cómo se probó de verdad** — comandos y resultados observados, no "should work". La honestidad de CLAUDE.md §4 aplica en los PRs.
- **Commits atómicos** con mensaje imperativo; `git add` por nombre tras revisar `git status` (nunca `-A` a ciegas: builds, .env y artefactos se cuelan).
- Respeta la plantilla del repo (`.github/PULL_REQUEST_TEMPLATE.md`) si existe.

## 4. Stacked PRs (la técnica Graphite, con git puro)

Cadena `main ← p1 ← p2 ← p3`, cada PR con base en la rama anterior → cada PR muestra solo su diff incremental.

- **Montar**: rama desde la rama anterior; `gh pr create --base <rama-anterior>`; títulos `[i/n]`.
- **Restack** (cambió una capa de abajo): `git rebase origin/main --update-refs` desde la rama superior mueve TODA la cadena de una vez (git ≥2.38), luego `git push --force-with-lease origin p1 p2 p3`.
- **Aterrizar**: merge de abajo hacia arriba; tras cada merge, retarget del siguiente (`gh pr edit --base main`) y restack. Verificar el retarget — GitHub a veces lo hace solo, a veces no.
- `--force-with-lease` siempre (aborta si alguien más pushó); `--force` a secas, jamás.

## 5. Merges seguros

Tres luces en verde o no hay merge: **checks** (todos SUCCESS), **reviews** (APPROVED o no requeridas), **sin conflictos**. Un check rojo "que no parece relacionado" se investiga (`gh run view --log-failed`), no se ignora. Estrategia según convención del repo (squash por defecto para ramas de trabajo). `--admin` para saltar protecciones: solo con orden explícita del usuario.

## 6. Conflictos

Rebase de la rama del PR sobre la base actualizada; resolver leyendo **ambos lados** del conflicto (jamás "aceptar todo lo mío/lo suyo" sin leer); re-ejecutar los tests del área; `--force-with-lease`. Si el conflicto revela que dos trabajos pisan el mismo diseño, eso es una conversación con el usuario, no un merge mecánico.

## 7. Automatización con GitHub

- Esperas largas (CI de 10 min): no bloquear la sesión — `gh pr checks --watch` en background, o volver luego con `/pr-merge`.
- Trabajo recurrente sobre PRs (¿está verde ya?, babysitting de un stack): ver `docs/AUTOMATION.md` (loops y schedules).
- CI que construye artefactos al taguear: empujar el tag y verificar el workflow, no duplicar el build a mano.
