# CAPACITOR.md — Doctrina Capacitor/Ionic por terminal

Capacitor envuelve una app web en un proyecto nativo. El ciclo Android (sync, compilar, firmar, instalar, observar) se hace por terminal reutilizando `docs/ANDROID.md` una vez sincronizado; iOS no es ejecutable en Windows y su camino es siempre CI en la nube. Las skills `/capacitor-build`, `/capacitor-release`, `/capacitor-run` y `/capacitor-doctor` implementan esta doctrina; el agente `capacitor` la ejecuta en contexto aparte, coordinando con el agente `android` para el compile final.

## 1. El mapa mental mínimo

```
proyecto/
├── capacitor.config.ts(.json)         ← appId, appName, webDir, config de plugins — ÚNICA fuente de qué carpeta web se copia
├── package.json                        ← script de build real (build, build:prod, ionic build...) — nunca asumir "npm run build"
├── dist/ o www/ (según webDir)         ← salida del build web; lo que `cap sync` copia al nativo
├── android/                             ← proyecto nativo GENERADO por `npx cap add android`
│   └── app/
│       ├── build.gradle(.kts)           ← EDITABLE a mano: versionCode/Name, signingConfigs (igual que cualquier proyecto Android)
│       └── src/main/assets/public/      ← REGENERADO por sync: copia del web build. Nunca editar aquí, se pierde en el próximo sync
├── ios/                                  ← ídem para iOS, generado por `npx cap add ios` — NO compilable en Windows
└── node_modules/@capacitor/{core,cli,android,ios}  ← deben compartir versión/major entre sí
```

- **Fuente de verdad web** = `webDir` en `capacitor.config`. Si el bundler cambia de carpeta de salida y el config no se actualiza, `cap sync` copia lo que ya no existe o queda desfasado — WebView en blanco.
- **`android/` e `ios/` son proyectos nativos reales**, no cajas negras: se pueden editar (signing, `build.gradle`, `Info.plist`) y esos cambios sobreviven a `cap sync`; lo único que `sync` sobreescribe es la copia del web build y las dependencias/plugins nativos gestionados por Capacitor.
- **`cap sync` = `cap copy` + `cap update`**: copy mueve `webDir` al proyecto nativo; update instala/actualiza los plugins y dependencias nativas declarados en `package.json`.

## 2. Compatibilidad de versiones (Capacitor 8.x, vigente — verificado)

| Pieza | Requisito |
|---|---|
| `@capacitor/core` / `@capacitor/cli` / `@capacitor/android` | mismo major (idealmente mismo minor); mezclar majors es la causa #1 de fallos de sync silenciosos |
| Android Gradle Plugin (AGP) | 8.13.0 |
| Gradle wrapper | 8.14.3 |
| minSdk | 24 |
| compileSdk / targetSdk | 36 |
| Android Studio | Otter · 2025.2.1 o más nuevo |
| JDK | 17+ soportado, 21 recomendado |

Para otros majors (6.x, 7.x) no confíes en memoria: la tabla se mueve con cada release. Fuente viva: `capacitorjs.com/docs/updating/<major>-0`. La tríada JDK↔Gradle↔AGP del proyecto nativo generado sigue las reglas de `docs/ANDROID.md` §2 una vez que `android/` existe.

## 3. Diagnóstico: síntoma → causa → fix

| Síntoma | Causa probable | Fix |
|---|---|---|
| WebView en blanco tras instalar | `sync` no corrido tras el último build web, o `webDir` apunta a carpeta vieja | build web real + `npx cap sync android`, confirmar `webDir` |
| Plugin instalado no funciona en runtime | falta `cap sync` tras `npm install @capacitor/plugin-x` | `npx cap sync` |
| `cap doctor` muestra Installed ≠ Latest en cli/core/android | versiones `@capacitor/*` desalineadas | `npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest` + sync |
| Build Gradle falla justo tras actualizar el major de Capacitor | AGP/Gradle/JDK no cuadran con el nuevo mínimo del major | ver tabla §2 + `docs/ANDROID.md` §2 (tríada) |
| `npx cap add android` falla "already exists" | `android/` ya generado, no se puede re-add | editar a mano, o borrar la carpeta para regenerar (se pierden cambios manuales no versionados) |
| Funciona en emulador pero WebView en blanco en dispositivo real | build de producción con rutas absolutas / CORS distinto en el bundler | build relativo en el bundler; `npx cap run android -l --external` para descartar red |
| `cap build android` pide contraseña de keystore en cada llamada | flags de línea de comando en vez de config persistente | preferir `/apk-release` (lee credenciales de `gradle.properties`/env), no pasar `--keystorepass` en texto plano |

## 4. Release

- Bump de versión en **dos lugares independientes**: `package.json` (semver humano) y `android/app/build.gradle` (`versionCode`/`versionName`) — Capacitor no los enlaza.
- `npx cap sync android` es obligatorio antes de firmar: un release firmado con web desactualizada es peor que uno sin firmar.
- El firmado real se delega íntegro a `/apk-release` (keystore, `apksigner verify`, prueba de arranque) — no se reinventa para Capacitor.
- **iOS no es ejecutable desde Windows.** Camino recomendado: CI en la nube.
  - GitHub Actions con runner macOS + Fastlane (DIY, control total, factura por minuto de runner).
  - Plataformas dedicadas a Capacitor (Codemagic, Capawesome Cloud) con flujo/YAML ya armado.
  - Ionic Appflow: verificado que está en *wind-down* (sin ventas nuevas desde feb-2025, clientes existentes solo hasta dic-2027) — no recomendarlo para un proyecto que empieza ahora.

## 5. División del trabajo

- Sesión principal: decide qué construir y verifica el resultado final end-to-end (web + nativo).
- Agente `capacitor`: build web, `cap sync`, diagnóstico de versiones/config — todo lo que genere output de npm/cap sin quemar contexto principal.
- Agente `android`: el compile Gradle final, firmado, adb/logcat — mismo rol que ya cumple para proyectos Android nativos, reutilizado tal cual sobre `android/` una vez sincronizado.
- iOS: ningún agente local lo ejecuta; siempre CI. Documentar el pipeline es tarea de la sesión principal o de quien mantenga el repo, no de un build local fantasma.
- Flujo release completo: `/capacitor-build` (sync) → `/capacitor-release` (firma vía `/apk-release`) → `/capacitor-run` o `/android-run` (humo en dispositivo) → `/release` (tag + GitHub release).
