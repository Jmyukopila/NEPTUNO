---
description: Genera el instalador de escritorio (Electron o Tauri) listo para distribuir, con bump de versión y firma de código si hay certificado configurado. Úsalo para publicar una nueva versión de la app de escritorio o preparar el instalador final.
---

Argumentos recibidos (formato esperado: [electron|tauri] (por defecto: autodetecta)): $ARGUMENTS

# Release de escritorio (Electron / Tauri)

Produce el instalador final versionado y, si hay certificado configurado, firmado. Un release sin verificar el artefacto generado (existe, tamaño plausible, arranca) es un release a medias.

## Proceso

1. **Detecta el framework** (mismos indicadores que `/desktop-build`: `src-tauri/` + `Cargo.toml` + `tauri.conf.json` = Tauri; `electron` en `package.json` + config de electron-builder = Electron).
2. **Bump de versión**:
   - **Electron**: campo `"version"` en `package.json` (semver). `npm version patch|minor|major --no-git-tag-version` si no hay un número explícito pedido, o edítalo directamente.
   - **Tauri**: campo `"version"` en `src-tauri/tauri.conf.json`. Si esa clave no está presente, Tauri toma el `[package] version` de `src-tauri/Cargo.toml`. **Mantén ambos sincronizados** si el proyecto los declara por separado — una discrepancia entre `Cargo.toml` y `tauri.conf.json` es el bug de versión más frecuente en Tauri y produce instaladores con el número equivocado sin ningún error visible.
3. **Firma de código en Windows — opcional y manual si no hay certificado, nunca la asumas**:
   - **Electron (electron-builder)**: variables de entorno `CSC_LINK` (ruta local o base64 del `.pfx`) y `CSC_KEY_PASSWORD`. Si no están seteadas, electron-builder genera el instalador sin firmar (Windows mostrará "Editor desconocido" al instalarlo) — es un aviso, no un fallo de build.
   - **Tauri**: bloque `bundle.windows` en `tauri.conf.json` (`certificateThumbprint`, `digestAlgorithm`, `timestampUrl`), o `signCommand` para una herramienta de firma propia. Tauri invoca `signtool.exe` del Windows SDK internamente. Sin `certificateThumbprint` configurado, el bundler no firma y tampoco falla el build.
   - Si el usuario no tiene certificado: documenta la firma como paso pendiente en el reporte y sigue adelante — no bloquees el release por esto.
4. **Compila el release** (mismos comandos que `/desktop-build`, que ya construyen en modo release por defecto):
   ```powershell
   npm run build            # Electron -> electron-builder
   npm run tauri build      # Tauri -> cargo build --release + bundler
   ```
   Output filtrado igual que en `/desktop-build` (a archivo, mostrar solo las últimas líneas o el error).
5. **Verifica la firma** si había certificado configurado — el paso que todos se saltan:
   ```powershell
   & "${env:ProgramFiles(x86)}\Windows Kits\10\bin\<version-del-sdk>\x64\signtool.exe" verify /pa <ruta-instalador>
   ```
   Si no hay certificado, declara la firma como "no configurada" en el reporte, no como fallo.
6. **Verifica el instalador generado**:
   - Existe y tiene tamaño plausible (un NSIS/MSI de Electron o Tauri típico va de ~40 MB a varios cientos de MB según assets embebidos).
   - Se puede lanzar: si el instalador NSIS soporta modo silencioso, prueba `<instalador>.exe /S` contra una carpeta temporal de destino; si no es viable de forma no interactiva en la sesión, declara esta verificación como PARCIAL en vez de darla por buena sin evidencia.

## Reporte
```
## Release: LISTO | PARCIAL | FALLO
- Framework: Electron | Tauri — versión <x.y.z>
- Artefacto: <ruta> (<tamaño>)
- Firma: verificada (<sujeto del cert>) | no configurada (sin CSC_LINK/thumbprint) | fallo
- Verificación de arranque/instalación: sí | parcial (motivo) | no
```

## Reglas
- Nunca reutilices un número de versión ya publicado; si el instalador de esa versión ya existe, es una señal de que falta el bump.
- Certificados y contraseñas de firma: jamás hardcodeados en config versionada ni en el reporte — siempre por variable de entorno o gestor de secretos externo.
- Sin certificado configurado, el release sigue siendo un artefacto válido (instalador sin firmar); dilo explícitamente, no finjas que se firmó.
- Para compilar sin tocar versión ni firma (solo confirmar que el proyecto compila), usa `/desktop-build`.
