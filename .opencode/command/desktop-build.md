---
description: Compila una app de escritorio Electron o Tauri para Windows desde la terminal, detectando el framework y diagnosticando errores de build. Úsalo para "hazme el instalador de la app de escritorio" o cuando falle un build de Electron/Tauri.
---

Argumentos recibidos (formato esperado: [ruta del proyecto] [electron|tauri] (por defecto: autodetecta)): $ARGUMENTS

# Build de app de escritorio (Electron / Tauri) sin asumir el framework

Compila la app de escritorio indicada (o la del directorio actual) para Windows y entrega la ruta del artefacto con evidencia. El framework se detecta por archivos reales del proyecto, nunca se asume.

## Proceso

1. **Detecta el framework**:
   - **Tauri**: existe `src-tauri/` con `Cargo.toml` y `tauri.conf.json` dentro.
   - **Electron**: `package.json` tiene `electron` en `dependencies`/`devDependencies`, y suele haber `electron-builder.yml`/`.json5` o una clave `"build"` en `package.json`, con un punto de entrada `main` (`main.js`, `src/main/index.js`...).
   - Si el argumento lo indica explícitamente, respétalo aunque la detección sea ambigua. Si no hay argumento y ambos indicadores faltan o coexisten, pregunta antes de adivinar.
2. **Preflight barato** (solo si el build falla después, no antes): Electron → `node -v` y confirma que `electron` está en `node_modules`; Tauri → `rustc --version` y `cargo --version`. Si algo falta, deriva a `/desktop-doctor` en vez de intentar arreglarlo aquí.
3. **Compila según el framework**:
   - **Electron (electron-builder)**:
     ```powershell
     npm run build   # revisa el script real en package.json "scripts" — el nombre varía por proyecto (build, dist, package...)
     ```
     Salida por defecto en `dist/` (configurable con `directories.output` en la config de electron-builder, que vive en `electron-builder.yml`/`.json` o en la clave `"build"` de `package.json`). El target Windows por defecto es NSIS; para forzar uno concreto: `npx electron-builder --win nsis|msi|portable`.
   - **Tauri (`tauri build`)**:
     ```powershell
     npm run tauri build   # invoca @tauri-apps/cli -> cargo build --release + el bundler
     ```
     Salida en `src-tauri\target\release\bundle\nsis\*.exe` y/o `src-tauri\target\release\bundle\msi\*.msi`, según `bundle.targets` en `tauri.conf.json`. La primera compilación es lenta porque compila todo el árbol de crates de Rust — no lo interpretes como cuelgue.
   - **Regla de tokens**: ambos generan logs largos (webpack/Vite del lado JS, o el compilador de Rust). Redirige a un archivo del scratchpad y muestra solo las últimas ~20 líneas:
     ```powershell
     npm run build *> "$env:TEMP\desktop-build.log"
     Get-Content "$env:TEMP\desktop-build.log" -Tail 20
     ```
     Si falla, filtra en vez de mostrar todo: `Select-String -Path $env:TEMP\desktop-build.log -Pattern "error|Error|panic|FAILED" -Context 0,3`.
4. **Si falla, diagnostica por la causa raíz real**, no por el último mensaje:
   - **Electron**: dependencia nativa no reconstruida para la versión de Electron instalada (`NODE_MODULE_VERSION` mismatch / "was compiled against a different Node.js version") → `npx electron-rebuild` (paquete `@electron/rebuild`).
   - **Tauri**: errores de compilación Rust → lee el primer `error[E...]` del log, no el resumen final; `webview2-com-sys` / "WebView2Loader.dll" en el error → falta WebView2 Runtime; `` error: linker `link.exe` not found `` → faltan las Visual Studio C++ Build Tools (MSVC). Ambos casos son entorno, no bug de código → `/desktop-doctor`.
   Tabla completa de síntoma→causa→fix en `C:\Users\Usuario\.claude\docs\DESKTOP.md`.
5. **Verifica el artefacto**: existe, tamaño plausible, timestamp fresco.
   ```powershell
   Get-Item dist\*.exe, dist\*.msi -ErrorAction SilentlyContinue | Select Name, Length, LastWriteTime                                                    # Electron
   Get-Item src-tauri\target\release\bundle\nsis\*.exe, src-tauri\target\release\bundle\msi\*.msi -ErrorAction SilentlyContinue | Select Name, Length, LastWriteTime   # Tauri
   ```
   `LastWriteTime` debe ser de hace segundos — un instalador viejo que "ya estaba ahí" no cuenta como build exitoso.

## Reporte
```
## Build: OK | FALLO
- Framework detectado: Electron | Tauri (evidencia: <archivo indicador>)
- Artefacto: <ruta absoluta> (<tamaño>, <hora>)
- Si falló: causa raíz + fix aplicado o propuesto
```

## Reglas
- Firma de código, bump de versión o instalador final para distribuir → eso es `/desktop-release`, no esto.
- Entorno roto de raíz (falta Rust, falta WebView2, toolchain MSVC ausente) → `/desktop-doctor`; no lo parchees a mano dentro de este skill.
- Nunca declares el build exitoso sin haber visto el mensaje de éxito del bundler Y el timestamp fresco del artefacto.
- Para arrancar la app en modo desarrollo en vez de empaquetarla, usa `/desktop-run`.
