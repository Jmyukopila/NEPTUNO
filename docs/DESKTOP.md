# DESKTOP.md — Doctrina de apps de escritorio por terminal (Electron / Tauri)

Todo el ciclo de escritorio (compilar, empaquetar, firmar, ejecutar, observar) se hace por terminal: npm, cargo y las CLIs de electron-builder/Tauri. Ningún IDE gráfico es un requisito. Las skills `/desktop-build`, `/desktop-release`, `/desktop-run` y `/desktop-doctor` implementan esta doctrina; el agente `desktop` la ejecuta en contexto aparte. Target principal de esta doctrina: **Windows** (NSIS/MSI/portable). macOS/Linux se mencionan solo como referencia — no asumas que la máquina de desarrollo puede compilar para ellos.

## 1. El mapa mental mínimo

**Electron** — proceso *main* (Node) + proceso(s) *renderer* (Chromium) comunicados por IPC, empaquetados con electron-builder:
```
proyecto/
├── package.json              ← "main": punto de entrada del proceso main, "electron" en deps, clave "build" (electron-builder)
├── electron-builder.yml       ← config de empaquetado (o .json/.json5, o la clave "build" de package.json)
├── main.js / src/main/...     ← proceso main: crea BrowserWindow, IPC, acceso a Node/OS
├── preload.js                 ← puente seguro entre main y renderer (contextBridge)
└── dist/                      ← salida por defecto de electron-builder: instaladores NSIS/MSI/portable
```

**Tauri** — frontend web (cualquier bundler: Vite, webpack...) + backend Rust nativo, empaquetados con el bundler de Tauri:
```
proyecto/
├── package.json                    ← scripts "tauri dev"/"tauri build", @tauri-apps/cli
├── src/ (o similar)                 ← frontend web normal
└── src-tauri/
    ├── Cargo.toml                  ← crate Rust: [package] version, dependencias, edition
    ├── tauri.conf.json             ← identifier, version, build.{devUrl,frontendDist}, bundle.targets, bundle.windows (firma)
    ├── src/main.rs                 ← entrypoint Rust, comandos invocables desde el frontend (#[tauri::command])
    └── target/release/bundle/      ← salida: nsis/*.exe, msi/*.msi
```

- **Electron** empaqueta Chromium + Node completos dentro del instalador (binarios grandes, ~80-200 MB típico); todo el runtime es JS/Node de punta a punta.
- **Tauri** usa el WebView2 del sistema operativo (no lo empaqueta) y compila un binario nativo en Rust; instaladores mucho más ligeros (~3-10 MB típico) pero requiere toolchain de compilación (Rust + MSVC) en la máquina de build.
- Ambos usan **NSIS** como formato de instalador recomendado en Windows; Tauri además puede generar **MSI** (WiX Toolset v3).

## 2. Compatibilidad de versiones

**Electron ↔ Node ABI** (afecta a módulos nativos, `NODE_MODULE_VERSION`):

| Electron | ABI | Notas |
|---|---|---|
| 30 | 124 | |
| 31 | 125 | |
| 32 | 128 | |
| 33 | 130 | |
| 34 | 132 | |
| 35 | 133 | |

- Un módulo nativo (`.node`) compilado para una versión de Node NO sirve para Electron sin recompilar: `npx electron-rebuild` (paquete `@electron/rebuild`) lo recompila contra el ABI de Electron instalado.
- electron-builder reciente (v27+) requiere Node.js ≥ 22.12 para el propio proceso de build (no confundir con el Node embebido en Electron, que es independiente).
- Tabla viva y autoritativa: repo `electron/node-abi` (`abi_registry.json`) — no fiarse de memoria para versiones nuevas.

**Tauri ↔ Rust**:

| Componente | Requisito |
|---|---|
| Tauri CLI v2.x | rustc ≥ 1.77 (usar stable más reciente salvo razón concreta) |
| Toolchain Windows | host triple `x86_64-pc-windows-msvc` (NO `-gnu`) — se elige en el instalador de rustup |
| Edition del crate | `edition = "2021"` en `Cargo.toml` (estándar de los proyectos Tauri v2) |
| Node (CLI/frontend) | 20 LTS o superior; 22 LTS recomendado para proyectos nuevos |
| WebView2 Runtime | requerido siempre en Windows; preinstalado en Win10 1803+ y Win11 |

## 3. Diagnóstico de builds: síntoma → causa probable → fix

| Síntoma en el log | Causa probable | Fix |
|---|---|---|
| `NODE_MODULE_VERSION X does not match... was compiled against a different Node.js version` | módulo nativo sin recompilar para el ABI de Electron | `npx electron-rebuild` |
| Pantalla en blanco al abrir la ventana Electron | fallo al cargar el HTML/URL del renderer, o error de contextIsolation/preload | revisar DevTools del renderer (`Ctrl+Shift+I`), consola del preload |
| `Could not resolve <dep>` / falla `npm ci` antes de compilar | registro npm caído, proxy, versión inexistente | probar instalar la dep a mano; revisar `.npmrc` |
| `error[E0308]`, `error[E0433]`... | error real de compilación Rust | leer el primer `error[...]`, no el resumen final — es un bug de código, no de entorno |
| `` error: linker `link.exe` not found `` | faltan Visual Studio C++ Build Tools (MSVC) | instalar workload "Desktop development with C++" |
| `webview2-com-sys` falla al compilar / `WebView2Loader.dll` no encontrado | falta WebView2 Runtime o SDK asociado | instalar el "Evergreen Bootstrapper" de WebView2 Runtime |
| `thread 'main' panicked at ...` en `tauri dev`/`tauri build` | panic real en el código Rust del backend | leer el mensaje del panic + backtrace (`$env:RUST_BACKTRACE=1`) |
| Instalador se genera pero Windows dice "Editor desconocido" | no hay certificado de firma configurado | esperado sin `CSC_LINK`/`certificateThumbprint`; firmar es opcional, ver §4 |
| `EADDRINUSE` al lanzar `dev` | el devServer de una sesión anterior sigue vivo | `Stop-Process` del proceso colgado antes de reintentar |
| Build de Rust "colgado" en la primera compilación | compilación completa de dependencias (`cargo build` en frío) | normal, no es cuelgue — las siguientes son incrementales |

Regla de tokens: los logs de Rust y de webpack/Vite van a un archivo; a la conversación solo llegan las líneas del error real.

## 4. Empaquetado y firma

- **Electron (electron-builder)**: config en `electron-builder.yml`/`.json` o clave `"build"` de `package.json`. Target Windows por defecto: NSIS; también soporta `msi`, `portable`, `appx`. Firma vía variables de entorno `CSC_LINK` (ruta o base64 del `.pfx`) + `CSC_KEY_PASSWORD` (usar `WIN_CSC_LINK`/`WIN_CSC_KEY_PASSWORD` si se firma también para otra plataforma en la misma sesión de build).
- **Tauri**: config de bundle en `tauri.conf.json` → `bundle.targets` (`["nsis","msi"]` o `"all"`). Firma en `bundle.windows`: `certificateThumbprint` (obtenido de `certmgr.msc` tras importar el `.pfx`), `digestAlgorithm` (normalmente `sha256`), `timestampUrl`; o `signCommand` para delegar en una herramienta propia. Internamente ambos frameworks terminan invocando `signtool.exe` del Windows SDK.
- **Sin certificado, en ambos casos**: el instalador se genera igual, simplemente sin firmar — no es un fallo de build, es un paso de distribución pendiente. No lo asumas configurado; pregúntalo o decláralo pendiente.
- El keystore/certificado, si existe, es tan sensible como un keystore de Android: nunca versionado, contraseñas fuera del repo (entorno o gestor de secretos), backup fuera del repo.

## 5. Verificación: cómo confirmar que el instalador funciona

- **Evidencia mínima**: el instalador existe, tiene tamaño plausible y `LastWriteTime` reciente — un artefacto viejo "que ya estaba ahí" no es una build nueva.
- **Firma**: `signtool.exe verify /pa <instalador>` si había certificado configurado; si no, decláralo "no configurada" en vez de fingir verificación.
- **Arranque**: instalación silenciosa cuando el instalador lo soporta (`<setup>.exe /S` en NSIS) contra un directorio temporal, o al menos confirmar que el proceso del asistente arranca sin corrupción. Si no es viable de forma no interactiva en la sesión, la verificación queda como PARCIAL — decláralo así, no como éxito.
- **Modo dev** (antes de empaquetar): la app arrancó sin excepción no capturada en main (Electron) ni panic en Rust (Tauri) — ver `/desktop-run`.

## 6. División del trabajo

- Sesión principal: decide qué construir/liberar y verifica el resultado final.
- Agente `desktop`: todo lo que genere output masivo (builds de Rust/webpack, sesiones de `dev` largas) — devuelve veredicto + evidencia en ~25 líneas.
- Flujo release completo: `/desktop-build` (confirma que compila) → `/desktop-run` (humo en modo dev) → `/desktop-release` (instalador versionado y firmado si aplica) → `/release` (tag + GitHub release con el instalador adjunto).
- Entorno roto en cualquier punto del flujo → `/desktop-doctor`, no parchear a mano dentro de los otros skills.
