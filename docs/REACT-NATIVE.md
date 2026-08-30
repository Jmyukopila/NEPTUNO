# REACT-NATIVE.md — Doctrina Expo/React Native por terminal

Todo el ciclo Expo (compilar, versionar, ejecutar, observar, publicar) se hace por terminal: Expo CLI + EAS CLI + adb para la parte Android. Xcode/Android Studio no son un requisito — y en esta máquina (Windows, sin macOS) Xcode directamente **no existe**: todo build de iOS pasa por EAS Build en la nube. Las skills `/expo-build`, `/expo-release`, `/expo-run` y `/expo-doctor` implementan esta doctrina; el agente `react-native` la ejecuta en contexto aparte. La capa Android subyacente (JDK, SDK, Gradle, adb) la cubre `docs/ANDROID.md` — este documento no la duplica.

## 1. El mapa mental mínimo

```
proyecto/
├── app.json / app.config.js|ts   ← identidad de la app: name, slug, version, runtimeVersion, plugins
├── eas.json                       ← perfiles de build/submit (development, preview, production, ...)
├── package.json                   ← dependencias JS + versión de Expo SDK instalada
├── android/                       ← generado por `expo prebuild` — NO editar a mano si el proyecto usa CNG
├── ios/                           ← ídem, generado — solo relevante para builds EAS (no hay Xcode local)
├── assets/                        ← iconos, splash, fuentes referenciados desde app.json
└── app/ o src/                    ← código de la app (con Expo Router, `app/` es también el router de pantallas)
```

- **Continuous Native Generation (CNG)**: si `android/`/`ios/` no están en el repo (o están en `.gitignore`), el proyecto usa el flujo managed — `expo prebuild` los regenera desde `app.json` + plugins cada vez que hace falta. Si SÍ están versionados, el proyecto es bare/eyected y esas carpetas se editan a mano como un proyecto nativo normal — prebuild ya no aplica sin `--clean` explícito.
- **`eas.json`** define perfiles bajo `build` (qué tipo de artefacto, variables de entorno, `distribution`) y bajo `submit` (a qué pista/track sube cada plataforma). Un perfil inexistente no se inventa, se pregunta o se crea explícitamente.
- **`runtimeVersion`** (en `app.json` o vía policy) es el contrato entre el binario nativo y los OTA updates de `expo-updates`: un update con `runtimeVersion` distinto al del binario instalado simplemente no se aplica (o crashea si se fuerza).

## 2. Compatibilidad SDK Expo ↔ React Native ↔ Node

Verificado en `docs.expo.dev` a julio de 2026 — esta tabla cambia con cada release de SDK, comprobar `https://docs.expo.dev/versions/latest/` si el proyecto usa una versión no listada aquí:

| Expo SDK | React Native | Node mínimo |
|---|---|---|
| 52 | 0.77 | 18.x |
| 54 | 0.81 (React 19.1) | 20.19.4 |
| 55 | 0.83 | 20.19.4+ |
| 56 (beta) | 0.85.2 (React 19.2.3) | 20.19.4+ |

- La versión de SDK instalada está en `package.json` → `"expo": "~54.x.x"`. La de React Native, en `"react-native"` — deben corresponderse según esta tabla; si no, `npx expo-doctor` lo marca.
- Node por debajo del mínimo del SDK es la causa nº1 de fallos de instalación/Metro sin relación aparente con el error mostrado — comprobar primero (`node -v`) ante cualquier fallo raro.
- No fiarse de memoria para SDKs nuevos: `npx expo-doctor` y el changelog oficial (`expo.dev/changelog/sdk-<n>`) son la fuente viva.

## 3. Diagnóstico: síntoma → causa probable → fix

| Síntoma | Causa probable | Fix |
|---|---|---|
| `Unable to resolve module ...` en Metro | dependencia no instalada, o caché de Metro corrupta | `npm install`; `npx expo start --clear` |
| Build local Android falla en fase Gradle | entorno Android roto (JDK/SDK/licencias/tríada) | `/android-doctor` — no es un problema de Expo |
| `Native module cannot be null` al abrir tras añadir una lib nativa | `android/`/`ios/` desincronizados de las dependencias (prebuild no re-corrido) | `npx expo prebuild --clean` y rebuild |
| `npx expo-doctor` marca paquetes incompatibles con el SDK | dependencias actualizadas fuera de la matriz que espera Expo | `npx expo install --check` (NO `npm update` a ciegas) |
| `eas build` falla en "Install dependencies" | lockfile desincronizado, o Node del perfil EAS distinto al del proyecto | fijar `node` en el perfil de `eas.json`, regenerar lockfile |
| `eas build` falla en "Run gradlew" (Android) | mismo espacio de causas que un build Android nativo, pero corriendo en servidores de Expo | mirar el log completo en el link de `eas build`, buscar `Caused by` |
| `CommandError: Xcode is not installed` / intento de `run:ios` | build local de iOS intentado en Windows — no existe ese camino | `eas build --platform ios` siempre |
| App instalada pero OTA update no llega / crash tras update | `runtimeVersion` del update no coincide con el del binario | verificar policy de `runtimeVersion`, generar update con el runtime correcto |
| Metro no detecta cambios de archivos en Windows | NO es Watchman (no aplica en Windows) — típicamente ruta con caracteres especiales o antivirus bloqueando el watcher | mover el proyecto a una ruta simple; excluir la carpeta del antivirus |

## 4. Builds y EAS

- **Local vs EAS**: local (`npx expo run:android`) solo existe para Android en esta máquina y reutiliza Gradle — mismas reglas de la tríada JDK↔Gradle↔AGP que un proyecto nativo. EAS (`eas build --platform android|ios|all --profile <perfil>`) compila en la nube de Expo; es el único camino para iOS desde Windows.
- **Versionado de producción**: `version` (semver humano) sube con cambios visibles; `android.versionCode`/`ios.buildNumber` deben ser estrictamente crecientes en cada subida a tienda — o se gestionan a mano en `app.json`, o remotos vía `eas.json` → `cli.appVersionSource: "remote"` + `autoIncrement: true` en el perfil (no mezclar ambos modelos en el mismo proyecto).
- **Submit**: `eas submit --platform android|ios --profile <perfil>` sube el build más reciente de ese perfil (o uno concreto con `--id`) a Play Store/App Store Connect. Requiere credenciales de la tienda configuradas una vez (service account de Google, API key/Apple ID de Apple) — las gestiona EAS, nunca se piden en la conversación.
- El estado real de un build/submit es `finished`/`errored`, consultable con `eas build:list`, `eas build:view <id>`, `eas submit:list` — "se lanzó el comando" no es lo mismo que "terminó".

## 5. Verificación: Metro + adb, observar es verificar

- Metro sirviendo sin errores de resolución es la primera señal; la segunda es la app arrancando en el target sin red screen (error JS) ni `FATAL EXCEPTION` (crash nativo).
- Para Android, la observación es idéntica a un proyecto nativo (`docs/ANDROID.md` §5): `adb logcat -c`, lanzar, filtrar por `--pid`, `-b crash` para stacktraces, screenshot con `adb exec-out screencap -p`.
- Para iOS, sin Mac local la única verificación posible es una build EAS instalada en un dispositivo físico (vía el link/QR que da `eas build`) conectada a Metro con `npx expo start --dev-client` — no hay simulador disponible en esta máquina.

## 6. División del trabajo

- Sesión principal: decide qué construir/publicar y verifica el resultado final.
- Agente `react-native`: todo lo que genere output masivo (builds locales o EAS, Metro, logcat) — devuelve veredicto + evidencia en ~25 líneas.
- Flujo release completo: `/expo-build` (o build de producción dentro de `/expo-release`) → `/expo-run` (humo en dispositivo, Android local o build EAS en físico) → `/expo-release` (submit a tienda) → `/release` (tag + GitHub release si también hay artefacto que adjuntar).
- Cualquier chequeo de JDK/SDK/Gradle/adb/emulador se delega a `/android-doctor`; `/expo-doctor` solo cubre la capa Node/Expo/EAS por encima.
