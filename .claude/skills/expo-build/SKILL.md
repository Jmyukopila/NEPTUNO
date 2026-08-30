---
name: expo-build
description: Compila una build de desarrollo o preview de una app Expo/React Native (Android local, iOS vía EAS Build en la nube) con diagnóstico de errores de Metro/Gradle/EAS. Úsalo para "hazme un build de la app", "genera un preview build" o cuando falle un build de Expo.
argument-hint: [ruta del proyecto] [development|preview|production] (por defecto: proyecto actual, development)
---

# Build de una app Expo/React Native

Hay dos caminos y no son intercambiables: **build local** (Gradle en esta máquina, solo Android) y **build EAS** (en la nube de Expo, Android o iOS). Elige el camino antes de compilar, no a mitad de camino.

## 1. Decide el camino

| Camino | Comando | Cuándo |
|---|---|---|
| Local Android | `npx expo run:android` | Iterar rápido en esta máquina, ya tienes el entorno Android listo (`/android-doctor`) |
| EAS Build | `eas build --platform android\|ios\|all --profile <perfil>` | iOS (obligatorio, no hay Xcode en Windows), o necesitas un artefacto instalable para compartir/subir a tienda |

- **iOS en esta máquina es imposible**: `npx expo run:ios` requiere Xcode/macOS. En Windows, iOS SIEMPRE pasa por `eas build --platform ios` (build en la nube). No lo intentes local ni lo prometas.
- Si el proyecto no tiene carpeta `android/` (o `ios/`), `expo run:android` ejecuta `npx expo prebuild` primero para generarla — normal en la primera build, no es un error.

## 2. Perfiles: viven en `eas.json`

```powershell
Get-Content eas.json
```
Por defecto Expo trae `development`, `preview`, `production` bajo la clave `build`. Cada perfil puede tener bloques `android`/`ios` propios (tipo de build, `gradleCommand`, variables de entorno). Si el usuario pide "preview" y no existe ese perfil, avísalo — no inventes uno silenciosamente.

## 3. Build local (Android)

```powershell
npx expo run:android                     # debug, dispositivo/emulador detectado automáticamente
npx expo run:android --variant release   # build de producción local, sin pasar por EAS
npx expo run:android --device            # elegir dispositivo si hay varios
```
- Por debajo corre Gradle igual que un proyecto Android nativo — si falla por JDK/SDK/licencias, es terreno de `/android-doctor`, no de Metro.
- **Regla de tokens**: redirige el output a un archivo del scratchpad y muestra solo las últimas ~20 líneas o el error filtrado:
  ```powershell
  npx expo run:android *> "$env:TEMP\expo-build.log"
  Select-String -Path "$env:TEMP\expo-build.log" -Pattern "error|FAILURE|Caused by|Execution failed" -Context 0,3
  ```

## 4. Build EAS (Android o iOS, siempre en la nube)

```powershell
eas build --platform android --profile development
eas build --platform ios --profile preview
eas build --platform all --profile production --non-interactive
```
- Requiere sesión iniciada (`eas whoami`; si no, `/expo-doctor` lo detecta y corrige).
- El build corre en servidores de Expo: no consume CPU local, pero sí necesitas esperar la cola. Usa `--no-wait` si vas a seguir trabajando y comprobar más tarde con `eas build:list` / `eas build:view <id>`.
- **Regla de tokens**: el CLI ya es razonablemente silencioso, pero si vuelca logs largos (fase de instalación de deps o de Gradle remoto), igual redirige a archivo y filtra por `error`/`Error:`/`fail`.
- Primer build de iOS sin credenciales: EAS pregunta si quiere gestionar el certificado/perfil de aprovisionamiting por ti — deja que lo haga salvo que el usuario tenga sus propias credenciales (ver `/expo-release`).

## 5. Diagnóstico de errores típicos

| Síntoma | Causa probable | Fix |
|---|---|---|
| `Unable to resolve module ...` en Metro | dependencia no instalada o caché de Metro corrupta | `npm install`; `npx expo start --clear` |
| Build local falla en fase Gradle | entorno Android roto (JDK/SDK/licencias) | `/android-doctor` |
| `Native module cannot be null` / crash al abrir tras instalar librería nativa | prebuild desincronizado — instalaste una lib nativa pero no regeneraste `android/`/`ios/` | `npx expo prebuild --clean` y rebuild |
| EAS build falla en fase "Install dependencies" | lockfile desincronizado o versión de Node distinta a la del perfil | fijar `node` en el perfil de `eas.json` o regenerar lockfile |
| EAS build falla en fase "Run gradlew" | mismo espacio de causas que un build Android nativo | mirar el log completo del build en el link que da `eas build`, filtrar por `Caused by` |
| `CommandError: Xcode is not installed` o similar en `run:ios` | intentaste build local de iOS en Windows | usar `eas build --platform ios`, no hay alternativa local |

## Reporte
```
## Build Expo: OK | FALLO
- Camino: local (Android) | EAS (<plataforma>, perfil <nombre>)
- Artefacto: <ruta .apk local> | <url del build en expo.dev>
- Si falló: causa raíz (Metro/Gradle/EAS) + fix aplicado o propuesto
```

## Reglas
- Release firmado para tienda, versionado y submit → eso es `/expo-release`, no esto.
- Instalar/ejecutar y ver logs en dispositivo → eso es `/expo-run`.
- Nunca declares un build EAS exitoso sin haber visto el estado `finished` (no solo "en cola" o "in progress").
