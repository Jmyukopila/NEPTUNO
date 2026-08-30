---
description: Diagnostica y repara el entorno Expo/React Native (Node, Expo CLI/EAS CLI, dependencias, config nativa, entorno Android subyacente). Úsalo cuando un build o `expo start` falle por entorno, al preparar una máquina nueva, o antes de trabajar con un proyecto Expo desconocido.
---

Argumentos recibidos (formato esperado: [síntoma] (opcional: sin argumentos hace el chequeo completo)): $ARGUMENTS

# Doctor del entorno Expo/React Native

Audita las piezas de las que depende cualquier proyecto Expo, en orden de dependencia. No es un duplicado de `/android-doctor`: reutilízalo para todo lo que sea SDK/JDK/adb Android, este skill cubre la capa Expo/JS por encima.

## Chequeos (en orden de dependencia)

1. **Node**: `node -v`. Cada SDK de Expo fija un mínimo (ver `C:\Users\Usuario\.claude\docs\REACT-NATIVE.md` para la tabla de compatibilidad SDK↔RN↔Node del proyecto actual) — un Node más viejo que el mínimo del SDK instalado es la causa nº1 de fallos raros de instalación/build.
2. **Dependencias del proyecto**: `npx expo-doctor` — es el chequeo oficial de Expo, valida versiones de paquetes contra el React Native Directory, sincronía entre `app.json`/`package.json` y la config nativa si `android/`/`ios/` ya existen, y detecta paquetes incompatibles con el SDK instalado.
   ```powershell
   npx expo-doctor
   ```
   Si reporta paquetes desalineados, `npx expo install --check` los alinea a las versiones que espera el SDK (no un `npm update` genérico, que puede saltarse a versiones no soportadas).
3. **Expo CLI / EAS CLI**: el CLI de Expo va empaquetado con el proyecto (`npx expo ...`, sin instalación global necesaria). El CLI de EAS sí es global:
   ```powershell
   eas --version
   eas whoami          # si no hay sesión, "Not logged in"
   eas login           # abre flujo de login por navegador
   ```
   Sin sesión de EAS, `/expo-build` y `/expo-release` con perfiles que no sean puramente locales fallarán.
4. **Config nativa sincronizada**: si el proyecto ya generó `android/`/`ios/` (prebuild), comprueba que no estén desincronizados de `app.json` — es exactamente lo que valida `expo-doctor` en el paso 2. Si detecta desincronía y el equipo no edita nativo a mano, `npx expo prebuild --clean` es la cura.
5. **Entorno Android subyacente**: JDK, `ANDROID_HOME`, licencias SDK, wrapper de Gradle, adb, emulador — eso es exactamente `/android-doctor`. No reimplementes esos chequeos aquí, deriva ahí y vuelve con el resultado.
6. **watchman**: en macOS/Linux, Watchman acelera el file-watching de Metro y su ausencia puede causar recargas lentas o perdidas. **En Windows watchman no aplica** — Metro usa su propio watcher basado en Node en Windows y Watchman ni siquiera tiene soporte oficial completo ahí. No lo instales ni lo diagnostiques como causa en esta máquina; si Metro no detecta cambios en Windows, sospecha primero de rutas con caracteres especiales/antivirus bloqueando el watcher, no de Watchman.

## Reporte
```
## Entorno Expo: SANO | REPARADO | ROTO
| Pieza | Estado | Detalle/fix aplicado |
|---|---|---|
| Node | OK/FIX/ROTO | versión actual vs mínima del SDK |
| npx expo-doctor | OK/FIX/ROTO | issues reportados y resueltos |
| EAS CLI / sesión | OK/FIX/ROTO | ... |
| Config nativa sincronizada | OK/FIX/ROTO | ... |
| Entorno Android (delegado) | ver /android-doctor | ... |
| Watchman | N/A en Windows | ... |
- Puede compilar local (Android): SÍ/NO · Puede lanzar builds EAS: SÍ/NO
```

## Reglas
- Si el argumento es un síntoma concreto (ej. "Metro no arranca"), ve directo a la pieza sospechosa; el chequeo completo es para proyectos/máquinas nuevas.
- No reescribas `package.json` a mano para alinear versiones — usa `npx expo install --check`, que conoce la matriz de compatibilidad real del SDK.
