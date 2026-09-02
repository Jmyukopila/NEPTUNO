---
description: Diagnostica y repara el entorno de desarrollo Android (JDK, SDK, licencias, emulador, adb, wrapper de Gradle) sin abrir Android Studio. Úsalo cuando un build falle por entorno, al preparar una máquina nueva, o antes de trabajar con un proyecto Android desconocido.
---

Argumentos recibidos (formato esperado: [síntoma o proyecto] (opcional: sin argumentos hace el chequeo completo)): $ARGUMENTS

# Doctor del entorno Android

Audita las 6 piezas de las que depende cualquier build Android y arregla lo que esté roto. El output es una tabla de veredictos, no un volcado de versiones.

## Chequeos (en orden de dependencia)

1. **JDK**: `java -version`. La versión debe cuadrar con el AGP del proyecto (AGP 8.x → JDK 17+; ver tabla en `/home/jasen/.claude/docs/ANDROID.md`). Android Studio trae su propio JBR — si los builds funcionan en Studio pero no en terminal, es casi seguro esto: apunta `JAVA_HOME` al JBR (`<Android Studio>\jbr`) o a un JDK 17.
2. **SDK**: `$env:ANDROID_HOME` (o `ANDROID_SDK_ROOT`) debe existir y contener `platform-tools\adb.exe`. Ubicación típica en Windows: `%LOCALAPPDATA%\Android\Sdk`. Si la variable no está, defínela persistente:
   ```powershell
   [Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
   ```
3. **Licencias y paquetes**: el fallo `Failed to install the following Android SDK packages as some licences have not been accepted` se cura con:
   ```powershell
   & "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
   ```
   Con `sdkmanager --list_installed` confirma que están el `platforms;android-<compileSdk>` y `build-tools` que pide el proyecto.
4. **Wrapper de Gradle**: `.\gradlew --version` en la raíz del proyecto. Comprueba compatibilidad Gradle↔AGP↔JDK (tríada — la mayoría de builds rotos "de la nada" son una pata de la tríada actualizada sin las otras).
5. **adb y dispositivos**: `adb devices`. `unauthorized` → aceptar la huella en el móvil; lista vacía con cable → drivers/modo depuración; adb zombi → `adb kill-server; adb start-server`.
6. **Emulador**: `& "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds`. Si no hay ninguno y hace falta:
   ```powershell
   sdkmanager "system-images;android-35;google_apis;x86_64"
   avdmanager create avd -n test -k "system-images;android-35;google_apis;x86_64"
   ```

## Reporte
```
## Entorno Android: SANO | REPARADO | ROTO
| Pieza | Estado | Detalle/fix aplicado |
|---|---|---|
| JDK | OK/FIX/ROTO | ... |
| SDK+ANDROID_HOME | ... | ... |
| Licencias/paquetes | ... | ... |
| Gradle wrapper | ... | ... |
| adb/dispositivos | ... | ... |
| Emulador | ... | ... |
- Puede compilar: SÍ/NO · Puede ejecutar en dispositivo: SÍ/NO
```

## Reglas
- Verifica cada fix re-ejecutando el chequeo que fallaba, no asumas que el cambio de variable "ya está" (las de usuario requieren shell nuevo: usa `$env:X = ...` para la sesión actual además del cambio persistente).
- No instales paquetes SDK de gigas (system images) sin que hagan falta para la tarea.
- Si el argumento es un síntoma concreto, ve directo a la pieza sospechosa; el chequeo completo es para máquinas nuevas.
