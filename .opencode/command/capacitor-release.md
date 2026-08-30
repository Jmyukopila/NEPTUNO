---
description: Genera el release firmado de la app Capacitor/Ionic en Android (reutilizando /apk-release tras sincronizar) y documenta el camino de CI en la nube para iOS, inejecutable desde Windows.
---

Argumentos recibidos (formato esperado: [android|ios] (por defecto: android)): $ARGUMENTS

# Release Capacitor firmado

Produce un release Android firmado a partir del proyecto nativo ya sincronizado con el build web más reciente. El firmado real es el mismo de cualquier proyecto Android: no se reinventa aquí, se delega a `/apk-release`.

## Proceso

1. **Bump de versión — dos lugares, no uno solo**: Capacitor no enlaza automáticamente la versión humana con la nativa.
   - `package.json` (`version`): semver del lado web/humano, súbelo con el criterio habitual del proyecto (`npm version patch|minor|major` si el repo lo usa así).
   - `android/app/build.gradle(.kts)` (`versionCode`/`versionName`): igual que en `/apk-release` — `versionCode` entero estrictamente creciente, `versionName` el semver visible. Mantenlos coherentes con el de `package.json` aunque sean campos independientes.
   - `capacitor.config` no lleva versión de app; no la toques por esto.
2. **Sync obligatorio antes de firmar**:
   ```powershell
   npx cap sync android
   ```
   Un release firmado sobre un build web desactualizado es peor que no firmarlo: el usuario recibe en producción un bug ya arreglado en el repo. Nunca firmes sin haber sincronizado *después* del último cambio a la capa web.
3. **Firmado real — delega a `/apk-release`**: sobre `android/` ya sincronizado, sigue el flujo de keystore/`bundleRelease`/`apksigner verify` de `/apk-release` tal cual. No dupliques esa lógica aquí.
   - Alternativa de un solo comando: `npx cap build android --androidreleasetype AAB --keystorepath <ruta> --keystorepass <pass> --keystorealias <alias> --keystorealiaspass <pass>` hace sync + build + firma en una llamada, pero las contraseñas quedan en texto plano en el historial de la shell. Prefiere siempre `/apk-release`, que las lee de `~/.gradle/gradle.properties` o variables de entorno.
4. **Prueba de humo**: si hay dispositivo/emulador disponible, instala el artefacto de release recién firmado y arráncalo (`/capacitor-run` o `/android-run`). Un WebView en blanco en el release firmado suele ser sync olvidado, no un bug del código.

### iOS: no ejecutable desde Windows

`cap sync ios` sí funciona aquí (solo copia archivos), pero compilar y firmar un IPA requiere `xcodebuild`/Xcode, exclusivo de macOS. El camino recomendado es CI en la nube:
- **GitHub Actions con runner macOS** + Fastlane para firma/certificados/subida a TestFlight — DIY, control total, facturación por minuto de runner.
- **Plataformas de CI dedicadas a Capacitor** (Codemagic, Capawesome Cloud) — YAML/flujo ya armado para Capacitor, gestión de certificados y publicación a las stores.
- **Ionic Appflow**: verificado que está en *wind-down* (sin ventas nuevas desde feb-2025, soporte a clientes existentes solo hasta dic-2027) — no lo recomiendes como camino nuevo para un proyecto que empieza ahora.

No hay build "casi local" de iOS: si el usuario lo pide desde esta máquina, la respuesta correcta es montar el pipeline de CI, no intentar un workaround.

## Reporte
```
## Release Capacitor: LISTO | PARCIAL | FALLO
- Versión: package.json <v> — versionCode <n> / versionName <v> (android/app/build.gradle)
- Sync: ejecutado antes de firmar — sí/no
- Firma Android: delegada a /apk-release (ver su reporte) | no ejecutada (motivo)
- Probado en dispositivo: sí (arranca) | no (motivo)
- iOS: fuera de alcance — camino recomendado <GitHub Actions macOS / Codemagic / Capawesome Cloud>
```

## Reglas
- Nunca pases contraseñas de keystore como flags de `npx cap build` en una sesión interactiva; usa `/apk-release`.
- Nunca firmes sin sync previo con el código actual.
- No recomiendes Ionic Appflow para proyectos nuevos: está en wind-down.
