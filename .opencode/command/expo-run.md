---
description: Instala y ejecuta una app Expo/React Native en emulador, simulador o dispositivo, con Metro bundler y logs filtrados para verificar que funciona. Úsalo para probar una build recién generada, reproducir un fallo en caliente o ver logs de Metro/la app.
---

Argumentos recibidos (formato esperado: [android|ios] (por defecto: android, detecta dispositivo conectado)): $ARGUMENTS

# Ejecutar y observar una app Expo/React Native

Arranca Metro, instala la app en un target real y **observa** los logs — el equivalente de "ejercita el flujo real" de `/verify-work` para Expo. Sin logs observados no hay verificación.

## 1. Android — ejecutable desde esta máquina

```powershell
npx expo start                     # solo Metro, para Expo Go o una dev build ya instalada
npx expo run:android               # compila (si hace falta), instala y arranca, con Metro en caliente
npx expo run:android --device      # elegir dispositivo/emulador si hay varios
```
- El entorno de dispositivo/emulador/adb ya lo cubre `/android-doctor` — si no hay ningún target disponible (`adb devices` vacío y sin AVDs), deriva ahí en vez de reinventar el diagnóstico.
- `npx expo run:android` reconstruye si detecta cambios nativos; si solo cambió JS, `npx expo start` con la app ya instalada es más rápido (recarga por Metro, sin recompilar).

## 2. iOS — NO ejecutable desde esta máquina

`npx expo run:ios` requiere Xcode y un simulador, ambos exclusivos de macOS. En Windows no hay camino local: ni simulador ni build nativa de iOS son posibles aquí.
- Para probar en un iPhone real: generar una build con `eas build --platform ios --profile development` (ver `/expo-build`), instalarla vía el link/QR que da EAS, y luego conectar Metro con `npx expo start --dev-client`.
- No inventes pasos de "abre Xcode" o "simulador local" en esta máquina — decláralo explícitamente como no disponible.

## 3. Logs — regla de tokens

Metro y logcat son mangueras igual que Gradle. Nunca los vuelques enteros.

```powershell
npx expo start *> "$env:TEMP\metro.log"   # en background si vas a seguir trabajando
Select-String -Path "$env:TEMP\metro.log" -Pattern "ERROR|WARN|Unable to resolve"
```
Para la parte nativa Android, usa el mismo patrón que `/android-run`:
```powershell
adb logcat -c
adb shell monkey -p <applicationId> 1
$p = adb shell pidof <applicationId>
adb logcat --pid=$p -d -v brief
```
El `applicationId` de una app Expo sale de `android/app/build.gradle` (generado por prebuild) o de `app.json` → `android.package`.

## 4. Veredicto

- Metro sirvió el bundle sin errores de resolución (`Unable to resolve module`, `Unsupported engine`, etc.).
- La app arrancó en el target y el proceso sigue vivo sin `FATAL EXCEPTION` en logcat (Android) o sin red screen de error JS.
- El flujo pedido por el usuario se observó en logs o capturas, no solo "se instaló".

## Reporte
```
## Ejecución Expo: OK | CRASH | NO OBSERVADO
- Plataforma: android (target <serial/AVD>) | ios (no disponible en esta máquina → usar EAS + dispositivo físico)
- Metro: sirvió el bundle sin errores | error: <mensaje>
- Observado: <líneas de log relevantes / captura>
- Si crash: <excepción JS o nativa + frame propio más alto>
```

## Reglas
- Generar el artefacto en sí (local o EAS) → eso es `/expo-build`.
- iOS local es una limitación de plataforma, no un fallo a diagnosticar — no lo trates como bug de configuración.
