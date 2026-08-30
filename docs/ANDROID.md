# ANDROID.md — Doctrina Android por terminal

Todo el ciclo Android (compilar, firmar, instalar, observar, publicar) se hace por terminal: Gradle + adb + sdkmanager. Android Studio es un editor encima de estas herramientas, no un requisito. Las skills `/apk-build`, `/apk-release`, `/android-run` y `/android-doctor` implementan esta doctrina; el agente `android` la ejecuta en contexto aparte.

## 1. El mapa mental mínimo

```
proyecto/
├── settings.gradle(.kts)      ← raíz: qué módulos existen
├── gradle.properties          ← flags de build (jvmargs, AndroidX)
├── gradle/wrapper/            ← versión de Gradle (única fuente de verdad)
└── app/
    ├── build.gradle(.kts)     ← applicationId, versionCode/Name, compileSdk, signingConfigs, deps
    ├── proguard-rules.pro     ← reglas de minificación (release)
    └── build/outputs/
        ├── apk/{debug,release}/    ← APKs
        └── bundle/release/         ← AAB (Play Store)
```

- **APK** = instalable directo (`adb install`, distribución web). **AAB** = formato de subida a Play Store (Play genera los APKs por dispositivo).
- **debug** = firmado con el keystore de debug automático, `debuggable`. **release** = tu keystore, minificado si `minifyEnabled` — son apps distintas a efectos de instalación (firmas distintas no se sobreescriben).

## 2. La tríada JDK ↔ Gradle ↔ AGP

La mayoría de builds "rotos de la nada" son una pata de la tríada actualizada sin las otras. Compatibilidades clave:

| AGP (plugin Android) | Gradle mínimo | JDK |
|---|---|---|
| 8.0 – 8.2 | 8.0 – 8.2 | 17 |
| 8.3 – 8.7 | 8.4 – 8.9 | 17 |
| 8.8+ / 9.x | 8.10+ | 17 (21 recomendado) |

- La versión de AGP está en el `plugins {}` o en `libs.versions.toml`; la de Gradle en `gradle/wrapper/gradle-wrapper.properties`.
- "Funciona en Android Studio pero no en terminal" = casi siempre JDK: Studio usa su JBR embebido. Fix: `JAVA_HOME` → `<Android Studio>\jbr`.
- Tabla oficial viva: buscar "Android Gradle plugin release notes" — NO fiarse de memoria para versiones nuevas.

## 3. Diagnóstico de builds: sospechosos por síntoma

| Síntoma en el log | Causa probable | Fix |
|---|---|---|
| `Unsupported class file major version` | JDK más nuevo/viejo que lo que Gradle soporta | alinear tríada |
| `licences have not been accepted` | licencias SDK | `sdkmanager --licenses` |
| `Could not resolve <dep>` | repo caído, proxy, versión inexistente | probar URL a mano; mirar `repositories {}` |
| `Duplicate class` | dos deps traen la misma librería | `.\gradlew app:dependencies` filtrado + exclude |
| `OutOfMemoryError` / daemon muere | heap de Gradle corto | `org.gradle.jvmargs=-Xmx4g` en gradle.properties |
| `Execution failed for task ':app:minifyRelease...'` / crash solo en release | ProGuard/R8 comió clases usadas por reflexión | reglas `-keep` en proguard-rules.pro |
| clases/recursos fantasma tras cambiar ramas | caché incremental corrupta | `.\gradlew clean` (solo entonces) |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | firma distinta a la app instalada | `adb uninstall <id>` primero |

Regla de lectura de logs: el error real es el **`Caused by` más profundo**, no la primera línea `FAILURE`. Y regla de tokens: el log de Gradle va a un archivo, a la conversación solo llegan las líneas del error.

## 4. Firma y releases

- El keystore de release es **irreemplazable**: perderlo = no poder actualizar la app en Play jamás. Backup fuera del repo, keystore en `.gitignore`, contraseñas en `~/.gradle/gradle.properties` (global del usuario, nunca versionado) o variables de entorno.
- `versionCode` es un entero **estrictamente creciente** entre subidas a Play; `versionName` es el semver humano. Bump de ambos en cada release.
- Verificación de firma: `apksigner verify --print-certs` (en `build-tools/<ver>/`). Un release sin firma verificada + prueba de arranque en dispositivo es un release a medias.

## 5. adb: observar es verificar

- `adb devices` — `device` es utilizable; `unauthorized` = aceptar huella en el móvil; `offline` = `adb kill-server; adb start-server`.
- Logcat **siempre filtrado**: `--pid=$(adb shell pidof <id>)` para la app, `-b crash` para stacktraces, `-d` para volcar-y-salir (nunca en modo seguimiento dentro de una sesión de Claude salvo en background).
- `adb exec-out screencap -p > s.png` — la captura leída con Read es la forma más barata de verificar UI.
- El emulador se maneja sin Studio: `emulator -list-avds`, `emulator -avd <n>` (background), `avdmanager create avd`.

## 6. División del trabajo

- Sesión principal: decide qué construir y verifica el resultado final.
- Agente `android`: todo lo que genere output masivo (builds, logcat, instalación en varios dispositivos) — devuelve veredicto + evidencia en ~25 líneas.
- Flujo release completo: `/apk-release` (artefacto firmado) → `/android-run` (humo en dispositivo) → `/release` (tag + GitHub release con el APK adjunto).
