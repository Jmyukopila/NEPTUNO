---
name: desktop-doctor
description: Diagnostica y repara el entorno de desarrollo de apps de escritorio (Node, Rust/Cargo para Tauri, WebView2, herramientas de firma) sin asumir que ya está todo instalado. Úsalo cuando un build o `dev` falle por entorno, al preparar una máquina nueva, o antes de trabajar con un proyecto Electron/Tauri desconocido.
argument-hint: [síntoma] (opcional: sin argumentos hace el chequeo completo)
---

# Doctor del entorno de escritorio (Electron / Tauri)

Audita las piezas de las que depende un build de escritorio en Windows y arregla lo que esté roto. El output es una tabla de veredictos, no un volcado de versiones.

## Chequeos (en orden de dependencia)

1. **Node**: `node -v` / `npm -v`. Debe cuadrar con el `engines` de `package.json` si lo declara. Tanto Electron como `@tauri-apps/cli` corren sobre Node — sin esto no hay ni dev ni build en ningún framework.
2. **Detecta el framework** antes de seguir (mismos indicadores que `/desktop-build`): decide si los chequeos de Rust (3-4) aplican.
3. **Rust toolchain (solo Tauri)**: `rustc --version` y `cargo --version`. Si faltan, instalar con rustup (`https://rustup.rs`) y asegurar que el host triple por defecto sea `x86_64-pc-windows-msvc` (no `-gnu`) — Tauri en Windows requiere el toolchain MSVC, no el GNU.
4. **Visual Studio C++ Build Tools (solo Tauri)**: necesarios para el linker de MSVC (`link.exe`). Si `cargo build`/`tauri build` falla con `` error: linker `link.exe` not found ``, instalar el workload "Desktop development with C++" desde el instalador de Visual Studio Build Tools.
5. **WebView2 Runtime**: requisito siempre de Tauri, y de algunas apps Electron que lo usan explícitamente. Viene preinstalado de fábrica en Windows 10 (build 1803+) y Windows 11. Verificar:
   ```powershell
   Get-AppxPackage -Name "*WebView2*"
   Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue
   ```
   Si no aparece nada: descargar el "Evergreen Bootstrapper" desde la página oficial de WebView2 Runtime e instalarlo (instalación silenciosa, unos segundos).
6. **Electron ↔ ABI de módulos nativos (solo Electron, si el proyecto tiene dependencias nativas)**: compara la versión de Electron instalada (`node_modules/electron/package.json` → `"version"`) contra el ABI con el que se compilaron los módulos nativos. Síntoma: `NODE_MODULE_VERSION` mismatch al arrancar la app. Fix: `npx electron-rebuild` (paquete `@electron/rebuild`; instalar con `npm i -D @electron/rebuild` si no está en devDependencies).
7. **Herramientas de firma (opcional, solo si se va a firmar código)**: `signtool.exe` viene con el Windows SDK (`C:\Program Files (x86)\Windows Kits\10\bin\<versión>\x64\signtool.exe`). Sin esto —y sin certificado configurado (`CSC_LINK` en Electron, `certificateThumbprint` en Tauri)— ambos frameworks generan igualmente el instalador, solo que sin firmar.

## Reporte
```
## Entorno de escritorio: SANO | REPARADO | ROTO
| Pieza | Estado | Detalle/fix aplicado |
|---|---|---|
| Node/npm | OK/FIX/ROTO | ... |
| Framework detectado | Electron/Tauri | ... |
| Rust + cargo (si Tauri) | ... | ... |
| MSVC Build Tools (si Tauri) | ... | ... |
| WebView2 Runtime | ... | ... |
| Electron<->ABI módulos nativos (si aplica) | ... | ... |
| signtool (si se va a firmar) | ... | ... |
- Puede compilar dev: SÍ/NO · Puede generar instalador: SÍ/NO
```

## Reglas
- No instales el toolchain de Rust completo (varios GB) si el proyecto detectado es Electron puro — instala solo lo que el framework realmente detectado necesita.
- Verifica cada fix re-ejecutando el chequeo que fallaba, no asumas que el cambio "ya está": variables de entorno de usuario nuevas requieren shell nueva (`$env:X = ...` para la sesión actual, además del cambio persistente con `[Environment]::SetEnvironmentVariable`).
- Si el argumento es un síntoma concreto, ve directo a la pieza sospechosa; el chequeo completo es para máquinas nuevas o proyectos desconocidos.
