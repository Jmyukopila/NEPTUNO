---
description: Diagnostica el entorno Capacitor/Ionic — versiones @capacitor/* desalineadas, capacitor.config desincronizado del bundler, plugins sin sincronizar — remitiendo al entorno Android subyacente cuando corresponde.
---

Argumentos recibidos (formato esperado: [síntoma] (opcional: sin argumentos hace el chequeo completo)): $ARGUMENTS

# Doctor del entorno Capacitor

Audita las piezas específicas de Capacitor (versiones, config, sync de plugins) y remite a `/android-doctor` para todo lo que sea entorno Android puro (JDK, SDK, licencias, adb, emulador) — sin duplicar ese chequeo.

## Chequeos

1. **Comando oficial**:
   ```powershell
   npx cap doctor
   ```
   Imprime "Latest Dependencies" vs "Installed Dependencies" para `@capacitor/cli`, `@capacitor/core`, `@capacitor/android` (y `@capacitor/ios` si está añadido), más un veredicto por plataforma (`[success] Android looking great!` o warnings). Cualquier fila donde Installed ≠ Latest — sobre todo si `cli`/`core`/`android` no comparten el mismo major — es el sospechoso #1 de bugs raros de sync y plugins que no aparecen en runtime.
2. **Desalineación de versiones**: `@capacitor/cli`, `@capacitor/core` y `@capacitor/android`(`/ios`) deben compartir el mismo major, idealmente el mismo minor. Fix:
   ```powershell
   npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest
   npx cap sync android
   ```
   Re-ejecuta `cap doctor` después para confirmar que quedó alineado — no asumas que el `npm install` ya lo arregló.
3. **`capacitor.config` desactualizado tras cambiar de bundler**: `cap doctor` NO detecta esto. Si el proyecto migró de bundler (Vite/webpack/Angular CLI/Nx) o cambió el output del build, `webDir` puede seguir apuntando a la carpeta vieja. Verifícalo a mano: compara `webDir` en `capacitor.config.ts`/`.json` contra la carpeta que realmente genera el script de build de `package.json` (mismo chequeo que el paso 2 de `/capacitor-build`).
4. **Plugins instalados pero no sincronizados**: un plugin en `package.json`/`node_modules` que no ha pasado por `npx cap sync` no existe en el proyecto nativo — síntoma típico: "plugin no encontrado" en runtime pese a estar instalado. Fix trivial: `npx cap sync`.
5. **Entorno Android subyacente**: JDK, `ANDROID_HOME`, licencias SDK, wrapper de Gradle, adb, emulador — eso es enteramente `/android-doctor`. Si el síntoma reportado apunta ahí (p. ej. el propio `cap sync` falla porque no encuentra el SDK), deriva sin repetir el chequeo aquí.

## Reporte
```
## Entorno Capacitor: SANO | REPARADO | ROTO
| Pieza | Estado | Detalle/fix aplicado |
|---|---|---|
| Versiones @capacitor/* | OK/FIX/ROTO | cli X, core Y, android Z |
| capacitor.config vs build web | ... | webDir=<...> vs salida real=<...> |
| Plugins sincronizados | ... | ... |
| Entorno Android (delegado) | ver /android-doctor | ... |
- Puede sincronizar: SÍ/NO · Puede compilar Android: según /android-doctor · iOS: solo vía CI (ver docs/CAPACITOR.md)
```

## Reglas
- No dupliques `/android-doctor`: si el síntoma es JDK/SDK/adb/emulador, deriva ahí directamente.
- Re-ejecuta `npx cap doctor` tras cualquier fix de versiones antes de dar el chequeo por cerrado.
- Si el argumento es un síntoma concreto (p. ej. "plugin no funciona"), ve directo al chequeo 4; el chequeo completo es para proyectos nuevos o desconocidos.
