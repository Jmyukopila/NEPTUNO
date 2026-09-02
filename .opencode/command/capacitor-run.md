---
description: Instala y ejecuta una app Capacitor/Ionic en emulador o dispositivo Android, con logcat filtrado para verificar que funciona. Úsalo para probar un build Capacitor recién sincronizado o reproducir un WebView en blanco.
---

Argumentos recibidos (formato esperado: [android] (por defecto: android — iOS no ejecutable desde Windows)): $ARGUMENTS

# Ejecutar y observar una app Capacitor (Android)

Instala el build más reciente en un target real y **observa** el resultado — mismo principio que `/android-run`, adaptado a que aquí el contenido es una WebView que puede fallar en la capa web sin que Android se entere.

## Proceso

1. **Sync primero, siempre**:
   ```powershell
   npx cap sync android
   ```
   Sin este paso, lo que se instala es el web build cacheado en `android/app/src/main/assets/public`, que puede no ser el actual. Un WebView en blanco tras "funcionaba en el navegador" casi siempre es este paso saltado.
2. **Ejecuta** — dos caminos válidos:
   - **Un comando** (incluye su propio sync):
     ```powershell
     npx cap run android              # instala y lanza en el target elegido
     npx cap run android --list       # lista targets disponibles (dispositivos + AVDs)
     npx cap run android --target <id>
     npx cap run android -l --external  # live reload contra el dev server, para iterar sin reinstalar
     ```
   - **Preferido si ya sincronizaste y quieres control fino de logcat**: delega a `/android-run` apuntando a la carpeta `android/` ya sincronizada — mismo `adb install` + logcat filtrado, sin reinventar nada.
3. **Verifica con logcat filtrado** (regla de tokens: nunca vuelques el buffer entero, igual que en `/android-run`):
   ```powershell
   $p = adb shell pidof <applicationId>
   adb logcat --pid=$p -d -v brief
   ```
   Busca `FATAL EXCEPTION` (crash nativo) y también errores de la WebView (`chromium`, `Console` tags) — un error de JS en la capa web no siempre tumba el proceso Android, así que "sigue vivo" no basta: hay que ver la UI o el log de consola.
4. **Síntoma específico de Capacitor**: WebView en blanco con proceso vivo y sin `FATAL EXCEPTION` = build web no llegó al nativo (sync olvidado) o `webDir` mal configurado. Ver tabla de síntomas en `/home/jasen/.claude/docs/CAPACITOR.md` antes de asumir un bug de código.

### iOS: fuera de alcance en esta máquina

No hay simulador ni `xcodebuild` en Windows. Cualquier pedido de "ejecuta en iOS" se responde derivando a la sección CI de `/home/jasen/.claude/docs/CAPACITOR.md` — no hay equivalente local que probar.

## Reporte
```
## Ejecución Capacitor: OK | CRASH | WEBVIEW EN BLANCO | NO OBSERVADO
- Target: <serial/AVD> (Android <ver>)
- Sync: ejecutado antes de instalar — sí/no
- Instalado: <apk> -> <applicationId>
- Observado: <líneas de log relevantes / captura>
- Si falla: causa raíz (sync olvidado / webDir mal configurado / crash nativo real)
```
