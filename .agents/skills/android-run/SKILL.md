---
name: android-run
description: Instala y ejecuta una app Android en emulador o dispositivo físico vía adb, con logcat filtrado para verificar que funciona. Úsalo para probar una APK recién compilada, reproducir un crash o ver los logs de la app.
argument-hint: [apk o proyecto] [qué verificar / síntoma a observar]
---

# Ejecutar y observar una app Android

Instala la APK en un target real, la arranca y **observa** (logcat) — el equivalente Android de "ejercita el flujo real" de `/verify-work`. Sin logs observados no hay verificación.

## Proceso

1. **Target**: `adb devices` — si hay varios, elige con `-s <serial>` (pregunta solo si la elección cambia el resultado). Si no hay ninguno:
   ```powershell
   & "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds
   & "$env:ANDROID_HOME\emulator\emulator.exe" -avd <nombre> -no-snapshot-load  # en background
   adb wait-for-device
   ```
   Si tampoco hay AVDs, deriva a `/android-doctor` (crear uno con `avdmanager`).
2. **Instala**: `adb install -r <apk>` (`-r` conserva datos; para partir de cero, `adb uninstall <applicationId>` primero). El `applicationId` sale de `app/build.gradle` — no lo adivines.
3. **Arranca con logcat limpio**:
   ```powershell
   adb logcat -c                                                    # limpia el buffer ANTES
   adb shell monkey -p <applicationId> 1                            # lanza la activity principal
   ```
   (`monkey -p ... 1` evita tener que conocer el nombre exacto de la MainActivity; si lo conoces, `am start -n <id>/<Activity>` es más preciso.)
4. **Observa con filtro — regla de tokens**: logcat crudo es una manguera; jamás lo vuelques entero.
   ```powershell
   $p = adb shell pidof <applicationId>
   adb logcat --pid=$p -d -v brief                                  # solo el proceso de la app, dump y salir
   adb logcat -d *:E                                                # solo errores, todo el sistema
   ```
   Para crashes: `adb logcat -d -b crash` da el stacktrace exacto.
5. **Veredicto**: la app arrancó (proceso vivo, sin `FATAL EXCEPTION`), y el flujo pedido se observó en los logs. Si hubo crash, reporta el stacktrace (solo las líneas del stacktrace, no el buffer entero) — y si hay que arreglarlo, entra por `/debug` con esa repro.

## Trucos que ahorran sesiones
- `adb shell dumpsys activity top | Select-String "ACTIVITY"` → qué pantalla está en primer plano.
- `adb exec-out screencap -p > pantalla.png` → captura para verificar UI sin mirar el móvil (léela con Read).
- `adb shell am force-stop <id>` + relanzar → reproduce el arranque en frío.
- Dispositivo físico: activar "Depuración USB" y aceptar la huella; `adb devices` debe decir `device`, no `unauthorized`.

## Reporte
```
## Ejecución: OK | CRASH | NO OBSERVADO
- Target: <serial/AVD> (Android <ver>)
- Instalado: <apk> → <applicationId>
- Observado: <líneas de log relevantes / captura>
- Si crash: <excepción + frame propio más alto>
```
