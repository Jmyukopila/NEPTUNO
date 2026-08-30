---
name: expo-release
description: Genera una build de producción y la sube a las tiendas (EAS Build + EAS Submit), gestionando versionado en app.json/app.config (runtimeVersion, version, buildNumber/versionCode). Úsalo para publicar en Play Store/App Store o cortar una release de una app Expo.
argument-hint: [android|ios|all] (por defecto: all)
---

# Release de producción: EAS Build + EAS Submit

Produce el binario de producción y lo sube a la tienda correspondiente. Un release sin confirmación de que la subida se completó no es un release.

## 1. Versionado — antes de compilar nada

Revisa `app.json`/`app.config.js|ts`:
```powershell
Get-Content app.json | Select-String -Pattern "version|runtimeVersion|buildNumber|versionCode"
```
- **`version`**: semver humano (`1.2.0`). Súbelo si hay cambios visibles para el usuario.
- **`android.versionCode`** / **`ios.buildNumber`**: identificador interno que la tienda exige estrictamente creciente en cada subida. Dos formas de manejarlo:
  - **Local**: lo subes tú a mano en `app.json` antes de cada build.
  - **Remoto (recomendado)**: en `eas.json`, `cli.appVersionSource: "remote"` + `autoIncrement: true` en el perfil `production` — EAS lo incrementa solo en cada build nuevo. Verifica cuál usa el proyecto antes de tocar el número a mano (si es remoto y lo editas tú, se pisan).
- **`runtimeVersion`**: determina compatibilidad de OTA updates (`expo-updates`) con el binario nativo. Si el cambio incluye código nativo (nueva lib nativa, cambio de config nativo), el `runtimeVersion` debe cambiar (o usar policy `"fingerprint"`/`"appVersion"` en vez de fijarlo a mano) — si no, un OTA update puede instalarse sobre un binario incompatible y crashear.

## 2. Credenciales

- **Android**: EAS puede generar y gestionar el keystore de Play por ti (`eas credentials`), o usar uno propio si el usuario ya publica en Play (nunca reemplaces un keystore existente — perderlo bloquea futuras actualizaciones de la app ya publicada).
- **iOS**: EAS puede gestionar certificado + perfil de aprovisionamiento automáticamente (necesita cuenta de Apple Developer). Primera vez, `eas build --platform ios --profile production` pregunta interactivamente; en `--non-interactive` (CI) las credenciales deben existir ya en la cuenta de Expo.
- Nunca pidas ni muestres contraseñas de Apple/Google en la conversación; EAS las gestiona vía su propio login OAuth.

## 3. Build de producción

```powershell
eas build --platform android --profile production
eas build --platform ios --profile production
eas build --platform all --profile production --non-interactive --no-wait
```
Con `--no-wait` sigue el estado con `eas build:list --limit 1` o `eas build:view <id>` hasta ver `finished` (no `errored`).

## 4. Submit a la tienda

```powershell
eas submit --platform android --profile production          # último build production por defecto
eas submit --platform ios --profile production --id <buildId>  # build concreto si no es el más reciente
eas submit --platform android --path ./app-release.aab       # artefacto local, sin pasar por EAS Build
```
- Android: sube a la pista configurada en `eas.json` (`submit.production.android.track`, típicamente `internal` o `production`) vía Google Play API — requiere una service account key configurada una vez.
- iOS: sube a App Store Connect / TestFlight — requiere Apple ID app-specific password o API key configurada.
- **Regla de tokens**: si el submit falla, no repitas el log completo; extrae el mensaje de error de la tienda (Play/App Store suelen dar el motivo exacto: metadata faltante, versión duplicada, etc).

## 5. Verificación de que la subida se completó

```powershell
eas submit:list --platform android --limit 1
```
El veredicto es el estado final (`finished`/`errored`), no que el comando haya devuelto el prompt. Si el submit quedó "in progress", no lo des por hecho — hay que re-consultar.

## Reporte
```
## Release Expo: LISTO | PARCIAL | FALLO
- Plataforma(s): <android|ios|all>
- Versión: <version> — versionCode/buildNumber <n> (origen: local | remoto/autoIncrement)
- Build: <url expo.dev> — estado <finished|errored>
- Submit: <estado en Play/App Store> | no ejecutado (motivo)
- Avisos: <runtimeVersion cambiado por código nativo | credenciales nuevas generadas | etc.>
```

## Reglas
- No subas `versionCode`/`buildNumber` dos veces por el mismo cambio; si el proyecto usa `autoIncrement` remoto, no lo edites a mano.
- Build de desarrollo/preview → eso es `/expo-build`, no esto.
- iOS producción es SIEMPRE vía EAS Build (no hay Xcode local en Windows); no propongas un build local de iOS bajo ninguna circunstancia.
