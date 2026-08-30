---
description: Genera una APK o AAB de release firmada y lista para distribuir (keystore, versionCode, minify, verificación de firma). Úsalo para publicar en Play Store, distribuir una APK firmada, o configurar el signing de un proyecto Android.
---

Argumentos recibidos (formato esperado: [ruta del proyecto] [apk|aab] (por defecto: aab si es para Play, apk si es distribución directa)): $ARGUMENTS

# Release Android firmado

Produce el artefacto de release correcto: **AAB** para Play Store, **APK** para distribución directa (web, testers, MDM). Un release sin firma verificada no es un release.

## Proceso

1. **Estado del signing**: busca `signingConfigs` en `app/build.gradle(.kts)` y un keystore referenciado (`*.jks`/`*.keystore`).
   - **Si no hay keystore**: genera uno y cablea el signing leyendo credenciales desde `~/.gradle/gradle.properties` o variables de entorno — NUNCA hardcodeadas en el build.gradle ni en archivos versionados:
     ```powershell
     keytool -genkeypair -v -keystore release.jks -alias release -keyalg RSA -keysize 2048 -validity 10000
     ```
     Advierte SIEMPRE: perder este keystore = no poder actualizar la app en Play jamás. Recomienda copia de seguridad fuera del repo y añade el keystore a `.gitignore` antes de crearlo.
   - **Si hay keystore pero faltan credenciales**: pide al usuario que las ponga en `~/.gradle/gradle.properties` (no las escribas tú en la conversación ni en el repo).
2. **Bump de versión**: incrementa `versionCode` (obligatorio para Play — cada subida debe ser mayor) y ajusta `versionName` según el cambio (semver del lado humano).
3. **Revisa la config de release** en el módulo: `minifyEnabled`/`shrinkResources` (si están activos, existe riesgo de romper reflexión/serialización → reglas ProGuard), `debuggable false`, y que no queden `applicationIdSuffix` ni logs de debug activos.
4. **Compila**:
   ```powershell
   .\gradlew bundleRelease --console=plain    # AAB → app\build\outputs\bundle\release\
   .\gradlew assembleRelease --console=plain  # APK → app\build\outputs\apk\release\
   ```
   Output filtrado igual que en `/apk-build` (a archivo, mostrar solo errores o las últimas líneas).
5. **Verifica la firma** — el paso que todos se saltan:
   ```powershell
   & "$env:ANDROID_HOME\build-tools\<ver>\apksigner.bat" verify --print-certs <ruta.apk>
   ```
   Para AAB, la firma se comprueba generando el APK universal con bundletool o confiando en `BUILD SUCCESSFUL` + config verificada (decláralo como PARCIAL si no lo ejecutaste).
6. **Prueba de humo**: si hay dispositivo/emulador disponible, instala el artefacto de release (no el de debug) y arranca la app (`/android-run`). Un release que crashea al abrir por ProGuard es el fallo clásico.

## Reporte
```
## Release: LISTO | PARCIAL | FALLO
- Artefacto: <ruta> (<tamaño>) — versionCode <n>, versionName <v>
- Firma: verificada con apksigner (cert: <CN>) | no verificada (motivo)
- Probado en dispositivo: sí (arranca) | no (motivo)
- Avisos: <keystore nuevo → hacer backup | reglas proguard añadidas | etc.>
```

## Reglas
- Contraseñas del keystore: jamás en archivos versionados, jamás en el output de la conversación.
- Nunca subas `versionCode` dos veces por el mismo cambio; nunca reutilices uno ya publicado.
- Si `minifyEnabled true` y la app usa reflexión (Gson, Room, Retrofit ya traen reglas; código propio no), revisa `proguard-rules.pro` antes de dar el release por bueno.
