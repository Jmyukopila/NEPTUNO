---
description: Arranca una app de escritorio Electron o Tauri en modo desarrollo y verifica que inició sin errores, con el output filtrado. Úsalo para probar cambios en caliente o reproducir un fallo al arrancar la app.
---

Argumentos recibidos (formato esperado: [electron|tauri] (por defecto: autodetecta)): $ARGUMENTS

# Ejecutar y observar una app de escritorio en desarrollo

Arranca la app en modo dev y **observa** la consola del proceso principal (y devtools si aplica) — el equivalente de escritorio a "ejercita el flujo real" de `/verify-work`. Sin output observado no hay verificación.

## Proceso

1. **Detecta el framework** (mismos indicadores que `/desktop-build`).
2. **Arranca**:
   - **Electron**:
     ```powershell
     npm run dev      # o npm start / electron . — revisa el script real en package.json "scripts", no asumas el nombre
     ```
     El proceso *main* imprime en esa misma consola; el proceso *renderer* (la ventana) tiene su propia consola, solo visible con DevTools (`Ctrl+Shift+I` dentro de la app, o si el código ya llama `mainWindow.webContents.openDevTools()` en dev).
   - **Tauri**:
     ```powershell
     npm run tauri dev     # @tauri-apps/cli: levanta el devServer del frontend + compila y lanza el binario Rust
     ```
     La primera vez recompila Rust (lento); recompilaciones posteriores son incrementales gracias al watcher. La consola mezcla logs del frontend (Vite/webpack, `beforeDevCommand`) con los del backend Rust (`println!`/`log`/`tracing`).
3. **Ejecuta en background y captura a archivo** — misma regla de tokens que logcat: nunca sigas un proceso de dev en foreground dentro de la sesión, y nunca vuelques el log entero a la conversación.
   ```powershell
   Start-Process npm -ArgumentList "run","dev" -RedirectStandardOutput "$env:TEMP\desktop-dev.log" -RedirectStandardError "$env:TEMP\desktop-dev-err.log" -NoNewWindow -PassThru
   ```
   Espera unos segundos a que el proceso llegue a listo (Electron: ventana creada, sin más actividad de arranque en el log; Tauri: el devServer del frontend confirma "ready"/puerto abierto y luego aparece la compilación de Rust) y filtra:
   ```powershell
   Select-String -Path "$env:TEMP\desktop-dev.log","$env:TEMP\desktop-dev-err.log" -Pattern "error|Error|panic|panicked|unhandled|ENOENT|EADDRINUSE" -Context 0,3
   ```
4. **Veredicto**: la ventana/proceso arrancó sin excepción no capturada — Electron: sin `Uncaught Exception` en el proceso main ni error en rojo en la consola del renderer; Tauri: sin `thread 'main' panicked` en el log de Rust ni error de conexión al devServer del frontend. Si aparece una pantalla en blanco, sospecha primero de un fallo al cargar el `index.html`/la URL del devServer, no de lógica de negocio.
5. **Cierra el proceso** al terminar la verificación (`Stop-Process -Id <pid>`) — un `npm run dev` colgado en background bloquea el puerto/handle para la siguiente sesión de trabajo.

## Reporte
```
## Ejecución: OK | ERROR | NO OBSERVADO
- Framework: Electron | Tauri
- Arrancó: sí (ventana/proceso vivo) | no
- Observado: <líneas de log relevantes>
- Si error: <mensaje + frame/stack más alto propio del proyecto>
```

## Reglas
- No genera el instalador final: eso es `/desktop-build` (compilación) o `/desktop-release` (versionado y firmado).
- Si el entorno no tiene lo necesario para arrancar (falta Rust, falta WebView2, `node_modules` sin instalar), deriva a `/desktop-doctor` en vez de forzar reintentos ciegos.
