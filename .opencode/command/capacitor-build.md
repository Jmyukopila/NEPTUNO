---
description: Compila la capa web y sincroniza/genera el proyecto nativo de una app Capacitor/Ionic (Android local vía Gradle, iOS vía CI en la nube). Úsalo para "hazme el build de la app Capacitor" o cuando falle la sincronización nativa.
---

Argumentos recibidos (formato esperado: [ruta del proyecto] [android|ios] (por defecto: android)): $ARGUMENTS

# Build de app Capacitor (web + nativo)

Compila la capa web, la sincroniza con el proyecto nativo y entrega el artefacto con evidencia. El compile Android real lo sigue haciendo Gradle (vía `/apk-build`) — esta skill no lo duplica, se asegura de que Gradle compile el HTML/JS/CSS *actual*.

## Proceso

1. **Localiza el proyecto**: busca `capacitor.config.ts`/`.js`/`.json` en la raíz. Extrae `appId`, `appName` y sobre todo `webDir` (carpeta donde Capacitor espera el build web). Confirma que exista `android/` (y `ios/` si aplica) — si falta, es un `npx cap add android` pendiente; avísalo, no lo ejecutes sin confirmar que es intencional (crear el proyecto nativo desde cero).
2. **Build de la capa web primero**: NO asumas `npm run build`. Lee los `scripts` de `package.json` del proyecto real (puede ser `build`, `build:prod`, `ionic build`, un comando de Vite/Angular/Nx...) y usa el que exista.
   - Verifica que la carpeta de salida real coincide con `webDir` de `capacitor.config`. Es la causa #1 de "WebView en blanco": el build fue a `dist/` pero el config sigue apuntando a `www/` (o viceversa, típico tras migrar de bundler).
3. **Sincroniza el proyecto nativo**:
   ```powershell
   npx cap sync android    # copia webDir -> android/app/src/main/assets/public + actualiza plugins/deps nativas
   ```
   (`npx cap sync ios` para iOS, o `npx cap sync` sin plataforma para todas las instaladas). `sync` = `copy` (assets web) + `update` (dependencias nativas y plugins) en un solo paso. Debe terminar con "Sync finished" sin warnings de plugins incompatibles.
   - Si falla la resolución de un plugin: sospecha desalineación entre `@capacitor/core`, `@capacitor/cli` y `@capacitor/android` — verifica con `/capacitor-doctor` antes de reintentar.
4. **Compile nativo Android — delega, no dupliques**: una vez sincronizado, el compile es exactamente el mismo Gradle que cualquier proyecto Android. Usa `/apk-build` sobre `android/` para el `assembleDebug`/`assembleRelease` y su verificación de artefacto.
   - Atajo de un solo comando (`npx cap build android`) existe y hace sync + gradle build + firma en un paso, pero requiere pasar credenciales de keystore por flags de línea de comando — para debug rápido es mejor sync + `/apk-build`; para release, ver `/capacitor-release`.
5. **iOS**: `cap sync ios` copia los assets a `ios/App`, pero el compile (`xcodebuild`) requiere macOS/Xcode — imposible desde Windows. No lo intentes ni simules el resultado; deriva a la sección CI de `C:\Users\Usuario\.claude\docs\CAPACITOR.md`.

## Reporte
```
## Build Capacitor: OK | FALLO
- Web: <script de build usado> -> <carpeta de salida> (coincide con webDir: sí/no)
- Sync: <plataforma(s)> — OK/FALLO (plugins actualizados: N, warnings: ...)
- Nativo Android: delegado a /apk-build (ver su reporte) | no ejecutado (motivo)
- iOS: fuera de alcance en esta máquina — ver docs/CAPACITOR.md#ios
```

## Reglas
- Nunca compiles Gradle a mano duplicando `/apk-build`: esta skill se detiene en build web + sync + verificación, y remite el compile final.
- Nunca asumas el script de build web: léelo del `package.json` real del proyecto.
- Un `sync` "exitoso" con un `dist/` desactualizado no es un build válido — si dudas, compara el timestamp de la carpeta web contra el último cambio de código antes de sincronizar.
- Para instalar y probar en un dispositivo, encadena con `/capacitor-run`. Para release firmado, con `/capacitor-release`.
