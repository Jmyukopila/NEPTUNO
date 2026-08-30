---
name: release
description: Publica una release en GitHub - decide la versión semver desde los commits, genera el changelog, crea el tag y gh release create, con artefactos adjuntos (APK, binarios) si los hay. Úsalo para "saca la versión", "publica release" o para etiquetar un hito.
argument-hint: [versión o major|minor|patch] [artefactos a adjuntar] (opcional: la versión se deduce de los commits)
---

# Release en GitHub

Convierte el trabajo mergeado en una release versionada, con changelog real y artefactos adjuntos. Corre con el `gh` del usuario.

## Proceso

1. **Punto de partida**: en la rama por defecto, actualizada (`git pull`), y trabajando sobre lo mergeado — nunca releases desde una rama con trabajo sin aterrizar. Último tag: `git describe --tags --abbrev=0` (si no hay ninguno, propón `v0.1.0`).
2. **Versión**: recorre `git log <último-tag>..HEAD --oneline` y aplica semver: `BREAKING`/`!` → major, `feat` → minor, solo `fix`/`chore` → patch. Si los commits no siguen conventional commits, deduce del contenido y **declara** la deducción. El argumento del usuario manda sobre la deducción.
3. **Sincroniza la versión en el código** si el proyecto la declara (`package.json`, `build.gradle` `versionName`+`versionCode`, `pyproject.toml`, `Cargo.toml`...): bump + commit + push. Una release cuyo tag no coincide con la versión del código es un bug de release.
4. **Changelog desde los commits/PRs reales**, agrupado por tipo (Añadido / Corregido / Cambiado / Roto), en lenguaje de usuario — qué le cambia a quien usa el software, no "refactor del helper X". Enlaza PRs (`#n`).
5. **Tag + release + artefactos**:
   ```powershell
   git tag -a v<X.Y.Z> -m "v<X.Y.Z>"; git push origin v<X.Y.Z>
   gh release create v<X.Y.Z> --title "v<X.Y.Z>" --notes @'
   <changelog>
   '@ <ruta\app-release.apk> ...
   ```
   - Proyecto Android: el artefacto sale de `/apk-release` (firmado y verificado) — nunca adjuntes un APK de debug a una release.
   - Pre-release (`-rc.1`, beta): añade `--prerelease`.
6. **Verifica**: `gh release view v<X.Y.Z> --json url,assets -q '{url, assets:[.assets[].name]}'` — URL viva y assets subidos con tamaño > 0.

## Reglas
- El tag es inmutable una vez publicado: si algo salió mal, nueva versión patch, nunca re-tagear.
- Nada de changelogs inventados: cada línea trazable a un commit o PR.
- Si hay CI que ya construye artefactos al taguear, no los dupliques a mano — empuja el tag y verifica el workflow (`gh run watch` solo si el usuario quiere esperar).
