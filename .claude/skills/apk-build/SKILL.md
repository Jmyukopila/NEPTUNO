---
name: apk-build
description: Compila o rebuildea una APK/AAB de un proyecto Android desde la terminal, sin abrir Android Studio, con diagnóstico de errores de build. Úsalo para "hazme la apk", "rebuild la app", o cuando un build de Gradle falle.
argument-hint: [ruta del proyecto] [debug|release] (por defecto: proyecto actual, debug)
---

# Build de APK/AAB sin Android Studio

Compila el proyecto Android indicado (o el del directorio actual) y entrega la ruta del artefacto con evidencia. Android Studio no es necesario: el build real siempre lo hace Gradle.

## Proceso

1. **Localiza el proyecto**: busca `settings.gradle(.kts)` (raíz) y `app/build.gradle(.kts)` (módulo). Extrae `applicationId`, `versionName`/`versionCode` y `compileSdk` — los necesitarás para el reporte y para diagnosticar.
2. **Preflight barato** (solo si el build luego falla, no antes): `.\gradlew --version` confirma wrapper + JDK. Si falta el wrapper o el JDK no cuadra con la versión de AGP, deriva a `/android-doctor`.
3. **Compila con el wrapper, nunca con un gradle global**:
   ```powershell
   .\gradlew assembleDebug --console=plain   # o assembleRelease / bundleRelease según pida
   ```
   - **Regla de tokens**: NO vuelques el output entero a la conversación. Redirige a un archivo del scratchpad y muestra solo las últimas ~20 líneas; si falla, filtra con `Select-String -Pattern "error|FAILURE|Caused by|Execution failed"` y sus 3 líneas de contexto.
   - Un rebuild normal NO necesita `clean`: Gradle es incremental. Usa `clean` solo si hay síntomas de caché corrupta (clases fantasma, recursos viejos).
4. **Si falla**, diagnostica por la primera causa real (`Caused by` más profundo), no por el último mensaje. Sospechosos por frecuencia: JDK incompatible con AGP, licencia SDK sin aceptar, dependencia sin resolver (¿repositorio caído/proxy?), recurso duplicado, heap de Gradle (`org.gradle.jvmargs` en `gradle.properties`). La tabla completa está en `docs/ANDROID.md`.
5. **Verifica el artefacto**: existe y tiene tamaño plausible.
   ```powershell
   Get-Item app\build\outputs\apk\debug\*.apk | Select-Object Name, Length, LastWriteTime
   ```
   `LastWriteTime` debe ser de hace segundos — un APK viejo que "ya estaba ahí" no cuenta como build exitoso.

## Reporte
```
## Build: OK | FALLO
- Artefacto: <ruta absoluta> (<tamaño>, <hora>)
- Módulo/variante: app / debug — applicationId <id>, versión <name> (<code>)
- Si falló: causa raíz + fix aplicado o propuesto
```

## Reglas
- Release firmado, bump de versión o AAB para Play Store → eso es `/apk-release`, no esto.
- Nunca declares el build exitoso sin haber visto `BUILD SUCCESSFUL` Y el timestamp fresco del artefacto.
- Para instalar y probar la APK en un dispositivo, encadena con `/android-run`.
