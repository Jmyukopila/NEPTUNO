# NEPTUNO — Ecosistema de alto rendimiento para Claude Code

**Manual completo del workspace**

Ecosistema diseñado para que cualquier modelo Claude (Haiku, Sonnet, Opus) trabaje con la disciplina de planificación, ejecución y verificación del nivel más alto, cubriendo **desarrollo full stack** y **datos** (análisis, ciencia e ingeniería). Todo se activa automáticamente al abrir Claude Code en este directorio.

---

## Índice

1. [Cómo funciona el ecosistema (la mecánica)](#1-cómo-funciona-el-ecosistema)
2. [Agentes: ¿en paralelo o en sesiones distintas?](#2-agentes-en-paralelo-o-en-sesiones-distintas)
3. [Manual de comandos](#3-manual-de-comandos)
4. [Manual de agentes](#4-manual-de-agentes)
5. [MCPs](#5-mcps)
6. [Flujos recomendados](#6-flujos-recomendados)
7. [Estructura de archivos](#7-estructura-de-archivos)
8. [Llevarlo a otros proyectos](#8-llevarlo-a-otros-proyectos)
9. [Compatibilidad opencode](#9-compatibilidad-opencode)
10. [Grafo de conocimiento (graphify)](#10-grafo-de-conocimiento-graphify)
11. [Hivemind: la flota externa](#11-hivemind--la-flota-externa)

---

## 1. Cómo funciona el ecosistema

Cuatro piezas, cada una con un mecanismo de activación distinto:

### `CLAUDE.md` — la doctrina (siempre activa)
Claude Code lo carga **automáticamente al inicio de cada sesión** en este directorio. Contiene el protocolo obligatorio (ENTENDER→PLANIFICAR→EJECUTAR→VERIFICAR), las reglas anti-fallo (no inventar APIs, no declarar éxito sin evidencia) y ajustes específicos por modelo. No hay que invocarlo: gobierna todo lo que el modelo hace, en cada turno.

### Skills (`.claude/skills/`) — los comandos
Cada carpeta con un `SKILL.md` es un comando invocable de dos formas:
- **Tú lo escribes**: `/eda datos/ventas.csv` — se carga el protocolo de esa skill y el modelo lo ejecuta paso a paso.
- **El modelo lo invoca solo**: la `description` del frontmatter le dice cuándo aplica; si pides "analiza este dataset", el modelo debe cargar `/eda` sin que lo escribas.

Una skill no es un script: es un **protocolo de trabajo** que fuerza al modelo a seguir un método probado en vez de improvisar.

### Agentes (`.claude/agents/`) — los especialistas
Cada `.md` define un subagente: qué modelo usa (haiku/sonnet/opus), qué herramientas tiene y su prompt de especialista. Se lanzan con la herramienta `Agent` desde la sesión principal (ver sección 2). Se invocan pidiéndolo ("usa el agente scout para encontrar X") o el modelo los usa solo cuando la descripción encaja.

### `.mcp.json` + `.claude/settings.json` — infraestructura
- `.mcp.json` declara los servidores MCP del proyecto; Claude Code los arranca al iniciar sesión (la primera vez pide tu aprobación).
- `settings.json` pre-aprueba permisos para operaciones seguras (git y `gh` de solo lectura, tests, typecheck) y declara los **hooks de automatización** (`tools/hooks/`): guardarraíles que corren a coste cero de tokens — bloqueo de escrituras sobre secretos, recordatorio automático de `HANDOFF.md` al abrir sesión, e inyección de la nota del proyecto desde la bóveda **ANDROMEDA** (`~/ANDROMEDA`): la sesión arranca con el mapa del proyecto sin explorar en frío, y `/handoff` actualiza esa nota al cerrar — memoria viva entre sesiones a coste casi cero. Cómo funcionan y cómo añadir más: `docs/AUTOMATION.md`.

---

## 2. Agentes: ¿en paralelo o en sesiones distintas?

La respuesta corta: **dentro de la misma sesión, en paralelo, cada uno con su propio contexto**. Así funciona:

### El modelo orquestador y los subagentes

Cuando trabajas en una sesión de Claude Code, el modelo principal (el que elegiste con `/model`) actúa de **orquestador**. Al lanzar un agente:

1. Se crea un subagente **con su propia ventana de contexto, vacía** — no ve tu conversación. Por eso los encargos deben ser autocontenidos (las skills de este workspace ya lo imponen).
2. El subagente corre **con el modelo definido en su archivo** (`scout` usa Haiku aunque tu sesión sea Opus; `critic` usa Opus aunque tu sesión sea Haiku).
3. Corre **en segundo plano**: el orquestador puede seguir trabajando mientras tanto.
4. Si el orquestador lanza **varios agentes en un mismo turno, corren simultáneamente** (paralelismo real). Es lo que hace `/parallel-split`.
5. Al terminar, el subagente devuelve **solo su reporte final** al orquestador — no su proceso. Esto es clave: una búsqueda que quemaría 5.000 líneas de tu contexto vuelve como 20 líneas de conclusión.

```
   TU SESIÓN (orquestador: p. ej. Sonnet)
        │
        ├──► agente scout (Haiku)      ─┐
        ├──► agente backend (Sonnet)    ├─ corren A LA VEZ,
        └──► agente frontend (Sonnet)  ─┘  cada uno con contexto propio
        │
        ◄── reportes finales → el orquestador integra y verifica el conjunto
```

### Reglas del paralelismo (importantes)

- **Archivos disjuntos**: dos agentes editando el mismo archivo se pisan. `/parallel-split` fusiona subtareas que comparten archivos antes de lanzar.
- **Sin dependencias**: si la tarea B necesita el resultado de A, van en serie, no en paralelo.
- **El orquestador verifica el conjunto**: los reportes de subagentes tienden al optimismo; la verificación integrada final (build + tests del total) la hace la sesión principal o el agente `verifier`.

### ¿Y sesiones distintas de verdad?

También es posible, para trabajo humano-paralelo: abrir **varias terminales** con `claude` en el mismo directorio (o en git worktrees distintos para no pisarse). Cada una es una sesión independiente con su propio contexto. Para pasar el estado de una a otra se usa `/handoff` (escribe `HANDOFF.md`) y la otra sesión lo lee. Úsalo cuando quieras supervisar dos frentes tú mismo; para todo lo demás, los subagentes en paralelo son más eficientes porque el orquestador integra automáticamente.

---

## 3. Manual de comandos

### 3.1 Comandos de proceso (calidad y rendimiento del modelo)

---

#### `/fable-mode <tarea>`
**Qué hace:** Ejecuta la tarea bajo el protocolo estricto de 6 fases: contrato → reconocimiento (verifica supuestos contra el código real) → plan → ejecución paso a paso verificada → ataque adversarial al propio trabajo → entrega con evidencia. Prohíbe declarar éxito sin output observado.
**Cuándo:** Tareas difíciles o críticas donde quieres la máxima calidad. Es el "modo Fable" del workspace.
**Ejemplo:** `/fable-mode implementa rate limiting por usuario en el API gateway`
**Devuelve:** El trabajo hecho + evidencia de verificación (comandos y outputs reales) + lo que quedó fuera.

---

#### `/optimize-prompt <prompt>`
**Qué hace:** Diagnostica tu prompt (qué falta: objetivo verificable, contexto, restricciones, formato, criterio de éxito) y lo reescribe con la estructura de 7 componentes y técnicas anti-fallo (anti-alucinación, few-shot, datos-arriba-instrucciones-abajo). No ejecuta la tarea: te entrega el prompt listo.
**Cuándo:** Antes de encargar una tarea importante, o cuando notes que el modelo entiende mal lo que pides.
**Ejemplo:** `/optimize-prompt haz que el dashboard cargue más rápido`
**Devuelve:** El prompt optimizado listo para copiar + qué cambió y por qué.

---

#### `/optimize-tokens [texto]`
**Qué hace:** Con argumento: comprime el texto/prompt sin perder información operativa. Sin argumento: audita la sesión actual (qué está quemando contexto), guarda el estado clave en notas para sobrevivir a `/compact`, y activa reglas de ahorro para el resto de la sesión (filtrar outputs en origen, delegar búsquedas a `scout`, no re-leer).
**Cuándo:** Sesiones largas (~60%+ de contexto), antes de compactar, o para abaratar un prompt que reutilizas mucho.
**Ejemplo:** `/optimize-tokens` (auditoría) o `/optimize-tokens <pega aquí tu prompt de sistema>`
**Devuelve:** Diagnóstico + acciones tomadas + ahorro estimado, en 5 líneas.

---

#### `/deep-plan <tarea>`
**Qué hace:** Explora el código real, identifica restricciones y convenciones, compara enfoques solo si compiten de verdad, y entrega un plan con pasos numerados donde **cada paso nombra archivos concretos y su forma de verificación**. No escribe código.
**Cuándo:** Features nuevas, refactors, cualquier cambio de 3+ archivos. Antes de implementar, no después.
**Ejemplo:** `/deep-plan migrar la autenticación de sesiones a JWT`
**Devuelve:** Objetivo → enfoque elegido (y por qué) → pasos/archivos/verificación → riesgos → qué NO incluye.

---

#### `/verify-work [qué]`
**Qué hace:** Verifica el cambio actual de verdad: estático (build/typecheck) → tests relacionados → **ejercita el flujo real** (levanta el servidor y hace la petición, ejecuta la CLI, escribe un script consumidor) → prueba un caso hostil.
**Cuándo:** Al terminar cualquier cambio no trivial. Es la diferencia entre "compila" y "funciona".
**Ejemplo:** `/verify-work` (verifica el diff del working tree)
**Devuelve:** Veredicto VERIFICADO | PARCIAL | FALLA, con cada afirmación respaldada por su comando y output.

---

#### `/debug <bug>`
**Qué hace:** Resuelve un bug con método científico: reproduce ANTES de leer código (repro mínima congelada como script/test) → biseca el espacio con hipótesis falsables (una variable por experimento, registro de hipótesis muertas) → exige causa raíz que explique el 100% del síntoma → test de regresión que falla primero → fix mínimo → re-verificación completa.
**Cuándo:** Cualquier bug no trivial, comportamiento inexplicable, o cuando un fix anterior no funcionó.
**Ejemplo:** `/debug el export a CSV corta los nombres con acentos`
**Devuelve:** Causa raíz con evidencia → fix (archivo:línea) → verificación antes/después → hipótesis descartadas → mismo patrón en otros sitios.

---

#### `/bug-hunt <área>`
**Qué hace:** Caza bugs latentes SIN necesitar un síntoma: prioriza la superficie de ataque (código recién tocado, fronteras de I/O, manejo de errores, concurrencia, aritmética de límites), barre con la taxonomía de `docs/DEBUGGING.md` y greps dirigidos, y **solo reporta hallazgos con escenario de fallo concreto** — los graves, confirmados con reproducción ejecutada. Los fixes no van aquí: cada CONFIRMADO entra a `/debug` con la repro ya hecha.
**Cuándo:** Antes de un release, al heredar código desconocido, o cuando algo "huele mal" sin síntoma claro. Complementa a `/debug` (que necesita síntoma) y a `/self-review`/`critic` (que solo miran el diff).
**Ejemplo:** `/bug-hunt el módulo de facturación, foco en fechas y redondeos`
**Devuelve:** Reporte priorizado por severidad (CONFIRMADO con repro | PLAUSIBLE con escenario) + zonas barridas sin hallazgos.

---

#### `/self-review`
**Qué hace:** Revisa el diff actual como un revisor hostil, con checklist de 8 ataques: fidelidad al pedido original, bugs de lógica, casos borde de datos, errores silenciados, consistencia (usos colaterales olvidados), duplicación, simplificación y seguridad. Corrige los hallazgos claros.
**Cuándo:** Antes de dar por terminada una tarea o hacer commit.
**Ejemplo:** `/self-review`
**Devuelve:** Hallazgos corregidos / no corregidos (con motivo) / nivel de confianza.

---

#### `/context-prime [área]`
**Qué hace:** Construye el mapa mental del proyecto gastando el mínimo de tokens: estructura (2 niveles), identidad (README, deps, scripts), convenciones (un archivo representativo + uno de tests), estado git y entry points.
**Cuándo:** Al empezar a trabajar en un proyecto o área que no conoces.
**Ejemplo:** `/context-prime` o `/context-prime el módulo de facturación`
**Devuelve:** Mapa denso de ~15 líneas: stack, estructura, comandos (build/test/run), convenciones, estado.

---

#### `/handoff`
**Qué hace:** Escribe `HANDOFF.md` con el estado exacto del trabajo: hecho-y-verificado vs hecho-sin-verificar vs en-curso vs pendiente, decisiones tomadas (para no re-litigarlas), hechos aprendidos con esfuerzo, archivos calientes y cómo verificar.
**Cuándo:** Final de sesiones largas, antes de `/clear`, o para pasar el trabajo a otra sesión/terminal.
**Ejemplo:** `/handoff`
**Devuelve:** El archivo escrito; la próxima sesión continúa leyendo solo eso.

---

#### `/parallel-split <tarea>`
**Qué hace:** Descompone la tarea en 2–4 subtareas independientes y sin solapamiento de archivos, asigna a cada una el agente adecuado (scout/architect/implementer/backend/frontend/...), redacta encargos autocontenidos, **lanza todos los agentes a la vez**, y al volver integra los resultados y verifica el conjunto.
**Cuándo:** Tareas grandes y divisibles (>15 min de trabajo directo). Si las partes se encadenan, te lo dice y ejecuta en serie.
**Ejemplo:** `/parallel-split añade exportación a CSV, PDF y Excel en el módulo de reportes`
**Devuelve:** Qué hizo cada agente + verificación integrada + pendientes.

---

#### `/write-tests <área>`
**Qué hace:** Escribe tests que muerden: inventario de comportamientos por la interfaz pública, casos borde y caminos de error, asserts con sustancia (nada de "no lanzó excepción" como único assert), determinismo (reloj/seed fijados), y **prueba de mutación manual**: sabotea el código y confirma que los tests clave fallan por la razón correcta.
**Cuándo:** Código nuevo sin tests, código legado antes de tocarlo, o suites existentes que no inspiran confianza.
**Ejemplo:** `/write-tests el parser de fechas de src/utils/dates.ts`
**Devuelve:** Tests instalados con el patrón del repo + comportamientos cubiertos + resultado del sabotaje + qué quedó sin cubrir y por qué.

---

#### `/refactor <objetivo>`
**Qué hace:** Reestructura sin cambiar el comportamiento observable: red de seguridad primero (tests del área en verde; si no existen, tests de caracterización), un movimiento a la vez con la suite en verde entre pasos, cero cambios funcionales colados (los bugs encontrados se reportan aparte), y verificación de equivalencia final (tests + flujo real + relectura del diff).
**Cuándo:** Eliminar duplicación, pagar deuda técnica, o preparar el terreno antes de una feature.
**Ejemplo:** `/refactor extraer la lógica de precios duplicada en checkout y carrito a un módulo común`
**Devuelve:** Movimientos aplicados + evidencia de equivalencia antes/después + hallazgos NO aplicados para decisión aparte.

---

### 3.2 Comandos full stack

---

#### `/full-stack-feature <feature>`
**Qué hace:** Construye la feature atravesando el stack en orden anti-desajuste: **1) contrato** (endpoints con ejemplos rellenos, errores, estados de UI) → **2) datos** (schema/migración) → **3) backend** (validación en el borde, todos los errores, authZ, verificado con peticiones reales) → **4) frontend** (los 4 estados de UI, verificado en dev server) → **5) integración** (flujo completo UI→API→DB→UI + un caso hostil). Nunca avanza de fase sin verificar la anterior.
**Cuándo:** Cualquier feature que toque más de una capa.
**Ejemplo:** `/full-stack-feature los usuarios pueden guardar búsquedas y recibir alertas`
**Devuelve:** La feature funcionando con evidencia de verificación por capa.

---

#### `/api-contract <qué API>`
**Qué hace:** Diseña el contrato antes que el código: por endpoint, request/response con **ejemplos JSON rellenos con datos realistas**, todos los códigos de error con su shape, auth, paginación, idempotencia. Pasa un checklist de diseño (errores con shape único, fechas ISO/UTC, dinero sin floats, evolución sin romper clientes). Se escribe donde el repo ya tenga contratos (OpenAPI, tipos TS, GraphQL).
**Cuándo:** Endpoints nuevos; siempre antes de paralelizar backend y frontend.
**Ejemplo:** `/api-contract CRUD de suscripciones con planes y prorrateo`
**Devuelve:** El contrato escrito + decisiones tomadas para que el implementador no las re-litigue.

---

#### `/db-migration <cambio>`
**Qué hace:** Clasifica el cambio de esquema (seguro/aditivo vs peligroso/destructivo) y lo ejecuta como toca: directo si es aditivo, con patrón **expand-contract** (expandir → migrar datos por lotes → conmutar lecturas → contraer días después) si es destructivo. Escribe up y down, verifica en local aplicando y revirtiendo, y entrega el plan de despliegue (¿código o migración primero?).
**Cuándo:** Cualquier ALTER/CREATE/DROP sobre tablas con datos o en producción.
**Ejemplo:** `/db-migration renombrar users.name a users.full_name`
**Devuelve:** La migración + clasificación + plan de despliegue + cómo revertir.

---

#### `/sql-optimize <query o síntoma>`
**Qué hace:** Mide el estado actual con `EXPLAIN ANALYZE`, lee el plan buscando los sospechosos habituales (seq scan con filtro selectivo, índice inutilizado por función/cast, estadísticas viejas, N+1 desde la app), aplica **una mejora a la vez** en orden de coste/beneficio (estadísticas → query sargable → índice → estructural), y **mide después**. Verifica que el resultado de la query sigue siendo el mismo.
**Cuándo:** Queries lentas, timeouts, revisión de rendimiento de acceso a datos.
**Ejemplo:** `/sql-optimize el listado de pedidos tarda 12s con filtro por fecha`
**Devuelve:** Antes → cambio (y por qué el plan lo pedía) → después con la mejora en ×, y riesgos.

---

### 3.3 Comandos de datos

---

#### `/eda <dataset>`
**Qué hace:** Análisis exploratorio con rigor: carga defensiva (inspecciona el crudo antes de parsear, tipos explícitos), perfil por columna (nulos, cardinalidad, centinelas disfrazados), integridad (¿la clave "única" es única?, duplicados, huérfanas), distribuciones y relaciones que importan a la pregunta de negocio. **Describe, no limpia** — las decisiones de limpieza vienen después y documentadas.
**Cuándo:** Al recibir datos nuevos; antes de modelar o construir pipelines sobre ellos.
**Ejemplo:** `/eda data/transacciones_2025.parquet`
**Devuelve:** Script reproducible + reporte donde cada afirmación lleva su cifra exacta ("34% nulos en email (12.403/36.480)"), sorpresas y preguntas abiertas.

---

#### `/data-quality <dataset o tabla>`
**Qué hace:** Audita las 6 dimensiones — completitud, unicidad, validez, consistencia entre columnas/tablas, frescura y volumen vs histórico — y **deja los checks instalados como tests re-ejecutables** (dbt tests, pandera, asserts SQL) para que la auditoría no sea de un solo uso.
**Cuándo:** Sospecha de datos malos, antes de confiar en una fuente nueva, o para monitorizar una tabla crítica.
**Ejemplo:** `/data-quality la tabla analytics.daily_revenue`
**Devuelve:** Veredicto APTO / APTO CON RESERVAS / NO APTO **para el uso previsto**, tabla de checks con cifras y severidad, y los checks instalados con su comando de re-ejecución.

---

#### `/data-pipeline <pipeline>`
**Qué hace:** Diseña y construye el ETL/ELT con las 4 propiedades no negociables: **idempotente** (upsert/merge por clave — re-ejecutar no duplica), **validado en fronteras** (schema al entrar, cuadres al salir, inválidos a cuarentena con motivo), **observable** (conteos por run) y **reanudable** (fallo a mitad → re-ejecutar es seguro). Incluye estrategia incremental con watermark y llegadas tardías.
**Cuándo:** Crear o modificar cualquier proceso que mueva/transforme datos.
**Ejemplo:** `/data-pipeline carga incremental diaria de pedidos de la API de Shopify al warehouse`
**Devuelve:** El pipeline + resultados del test de idempotencia (dos ejecuciones → destino idéntico), test de reanudación y cuadre origen/destino con cifras.

---

#### `/ml-experiment <experimento>`
**Qué hace:** Protocolo anti-leakage completo: definición (qué información existirá **en el momento de la predicción**, métrica primaria por coste real de errores) → split ANTES de explorar (temporal para datos temporales, por grupo para entidades repetidas) → **baseline trivial y simple primero** → features auditadas contra fuga → entrenamiento con una variable por experimento → evaluación final única en test + **análisis de 20-30 errores concretos**.
**Cuándo:** Entrenar, evaluar o comparar modelos; también para auditar un modelo existente con métricas sospechosamente buenas.
**Ejemplo:** `/ml-experiment predecir churn a 30 días con los datos de actividad`
**Devuelve:** Reporte: pregunta → split (y por qué) → tabla baseline vs modelos → métrica en test → patrones de error → limitaciones → cómo reproducir (seed + versiones).

---

### 3.4 Comandos Android (sin abrir Android Studio)

Todo el ciclo Android por terminal: Gradle + adb + sdkmanager (Android Studio es solo un editor encima). Doctrina completa en `docs/ANDROID.md`; para builds/logs masivos, delega en el agente `android`.

---

#### `/apk-build [proyecto] [debug|release]`
**Qué hace:** Compila o rebuildea la APK/AAB con el wrapper de Gradle, con output filtrado (el log va a archivo; a la conversación solo llega el error raíz o la confirmación). Si falla, diagnostica por el `Caused by` más profundo con la tabla de sospechosos de `docs/ANDROID.md`. Verifica el artefacto por timestamp fresco, no por fe.
**Cuándo:** "Hazme la apk", "rebuild", o cualquier build de Gradle que falle.
**Ejemplo:** `/apk-build` o `/apk-build C:\proyectos\miapp release`
**Devuelve:** Ruta del artefacto + tamaño + hora, variante y versión — o la causa raíz del fallo con su fix.

---

#### `/apk-release [proyecto] [apk|aab]`
**Qué hace:** Produce el artefacto de release firmado: gestiona el keystore (lo crea si no existe, con aviso de backup y `.gitignore`; credenciales fuera del repo), bump de `versionCode`/`versionName`, revisa minify/ProGuard, compila `bundleRelease`/`assembleRelease` y **verifica la firma con apksigner** + prueba de arranque en dispositivo si hay uno.
**Cuándo:** Publicar en Play Store (AAB) o distribuir una APK firmada.
**Ejemplo:** `/apk-release . apk`
**Devuelve:** Artefacto firmado + verificación de firma + avisos (backup de keystore, reglas ProGuard).

---

#### `/android-run [apk o proyecto] [qué verificar]`
**Qué hace:** Instala la APK en emulador o dispositivo (arranca el emulador si hace falta), lanza la app y **observa logcat filtrado por el proceso de la app** — el equivalente Android de "ejercita el flujo real". Captura de pantalla vía adb para verificar UI. Si crashea, extrae el stacktrace exacto (`-b crash`) listo para `/debug`.
**Cuándo:** Probar una APK recién compilada, reproducir un crash, ver los logs de la app.
**Ejemplo:** `/android-run app-debug.apk verifica que el login no crashea`
**Devuelve:** Veredicto OK/CRASH/NO OBSERVADO con las líneas de log o captura que lo respaldan.

---

#### `/android-doctor [síntoma]`
**Qué hace:** Audita las 6 piezas del entorno en orden de dependencia — JDK (tríada JDK↔Gradle↔AGP), `ANDROID_HOME`, licencias/paquetes SDK, wrapper, adb/dispositivos, emulador — y repara lo roto, re-ejecutando cada chequeo tras su fix. Cura el clásico "funciona en Studio pero no en terminal" (JBR vs JAVA_HOME).
**Cuándo:** Builds que fallan por entorno, máquina nueva, proyecto Android desconocido.
**Ejemplo:** `/android-doctor` o `/android-doctor gradle dice Unsupported class file major version`
**Devuelve:** Tabla de veredictos por pieza + "puede compilar SÍ/NO, puede ejecutar SÍ/NO".

---

### 3.5 Comandos GitHub (con tu `gh`, sin colaboradores ni bots)

Todo corre con el `gh` CLI autenticado como TÚ (`gh auth login`, una vez): PRs, merges y releases salen con tu identidad y tus permisos — no hay que dar acceso a nadie. Doctrina completa en `docs/GITHUB.md`.

---

#### `/pr [título o intención]`
**Qué hace:** Publica el trabajo actual como PR bien formado: rama descriptiva (nunca desde main), commits atómicos (`git add` por nombre, nunca `-A` a ciegas), push y `gh pr create` con descripción generada **del diff real** — incluyendo "Cómo se probó" solo con lo ejecutado de verdad. Respeta la plantilla del repo si existe.
**Cuándo:** "Haz PR", "sube esto a GitHub", publicar el trabajo de la sesión.
**Ejemplo:** `/pr arregla el encoding del export CSV`
**Devuelve:** URL del PR + estado inicial de los checks.

---

#### `/pr-merge [número o URL]`
**Qué hace:** Aterriza un PR con las tres luces en verde: checks (si uno falla, investiga el log con `--log-failed` — no mergea "porque no parece relacionado"), reviews y conflictos (rebase + `--force-with-lease` si hay). Elige la estrategia que usa el repo (squash por defecto), mergea, borra ramas y sincroniza el local.
**Cuándo:** "Mergea el PR", "¿está verde ya?", aterrizar trabajo aprobado.
**Ejemplo:** `/pr-merge 42`
**Devuelve:** Merge confirmado (state MERGED) + limpieza hecha, o el semáforo en rojo con el motivo exacto.

---

#### `/pr-stack <crear|status|restack|land>`
**Qué hace:** Stacked PRs estilo **Graphite con git y gh puros**: divide trabajo grande en una cadena `main ← p1 ← p2 ← p3` donde cada PR tiene como base la rama anterior (GitHub muestra solo el diff incremental → PRs de 200 líneas revisables en minutos). `restack` propaga cambios hacia arriba con un solo `git rebase --update-refs`; `land` mergea de abajo arriba retargeteando cada PR siguiente.
**Cuándo:** Features grandes, "divide esto en PRs", gestionar un stack en review.
**Ejemplo:** `/pr-stack crear migración de auth a JWT` → `/pr-stack restack` tras una review → `/pr-stack land`
**Devuelve:** La cadena visible (`main ← #12 ✓ ← #13 ✓ ← #14 ✗`) y cada operación verificada contra el servidor.

---

#### `/release [versión o major|minor|patch] [artefactos]`
**Qué hace:** Convierte lo mergeado en release: deduce la versión semver de los commits (`feat`→minor, `fix`→patch, breaking→major), sincroniza la versión en el código (package.json, versionCode/Name...), genera el changelog **trazable a commits/PRs reales** en lenguaje de usuario, crea el tag y `gh release create` con artefactos adjuntos (el APK de `/apk-release`, binarios).
**Cuándo:** "Saca la versión", publicar release, etiquetar un hito.
**Ejemplo:** `/release minor app\build\outputs\apk\release\app-release.apk`
**Devuelve:** URL de la release verificada (assets subidos con tamaño > 0).

---

### 3.6 Comandos de diseño y frontend

Dirección de arte deliberada para que la UI no caiga en el "look de IA" (degradados morado-azul, tarjetas idénticas, Inter+Poppins, iconos sin curar). `/frontend-design` es siempre el paso 0; el resto se combina según lo que la tarea necesite. Doctrina completa en `docs/DESIGN.md`.

---

#### `/frontend-design <qué se construye>`
**Qué hace:** Fuerza una dirección de diseño concreta (frase de carácter + referencias reales, no adjetivos como "moderno y limpio") ANTES de tocar color, tipografía o layout, y prohíbe explícitamente los defaults genéricos de IA (degradados morado-azul, sombra difusa idéntica en toda tarjeta, combo Inter+Poppins, border-radius uniforme sin sistema).
**Cuándo:** Primer paso de cualquier tarea de frontend/UI nueva sin dirección estética ya establecida.
**Ejemplo:** `/frontend-design landing de una app de finanzas personales`
**Devuelve:** La dirección declarada en una línea + qué queda prohibido para esta UI.

---

#### `/editorial-layout <página o sección>`
**Qué hace:** Aplica retícula estricta, escala tipográfica derivada de una razón matemática (1.25/1.333/1.5) y espacio en blanco como jerarquía — reserva tarjetas/bordes para cuando de verdad agrupan elementos heterogéneos, en vez de envolver cada bloque por costumbre.
**Cuándo:** Dirección editorial/minimalista, o cuando el layout se siente "lleno de cajas" sin necesidad.
**Ejemplo:** `/editorial-layout la página de un artículo de blog`
**Devuelve:** Retícula + escala tipográfica declaradas, aplicadas de forma consistente.

---

#### `/theme-factory <dirección elegida>`
**Qué hace:** Entrega un tema completo (paleta + pareja tipográfica) de un catálogo curado de 5 direcciones (nórdico, retro-futurista, corporativo premium, editorial monocromo, brutalista) con valores concretos, en vez de improvisar hex y fuentes al azar. Deriva variantes por luminosidad del mismo tono para hover/disabled/focus.
**Cuándo:** Al fijar la paleta y tipografía de un proyecto, tras `/frontend-design`.
**Ejemplo:** `/theme-factory retro-futurista`
**Devuelve:** Tokens de color y tipografía listos para aplicar como variables.

---

#### `/motion-design <qué se anima>`
**Qué hace:** Fija una escala de duración (100-500ms según el tipo de transición) y curvas de easing por tipo de movimiento (entrada/salida/loop), exige animar solo `transform`/`opacity` por rendimiento, stagger proporcional al tamaño de la lista, y respeto obligatorio a `prefers-reduced-motion`.
**Cuándo:** Cualquier animación o microinteracción, para que se sienta viva sin ser ruidosa ni costosa.
**Ejemplo:** `/motion-design transiciones del menú y las tarjetas del dashboard`
**Devuelve:** Duraciones/curvas aplicadas de forma sistemática + fallback de accesibilidad.

---

#### `/generative-art <elemento a generar>`
**Qué hace:** Codifica fondos/elementos visuales originales con algoritmos (campos de ruido, partículas, flow fields, teselación, formas paramétricas) en Canvas/SVG/WebGL en vez de imágenes de stock, con color tomado del tema fijado y rendimiento cuidado (`requestAnimationFrame`, pausa fuera de viewport, fallback estático con `prefers-reduced-motion`).
**Cuándo:** La dirección estética pide un elemento visual original, o un fondo estático se siente genérico.
**Ejemplo:** `/generative-art fondo del hero de la landing`
**Devuelve:** El generador implementado + verificación de rendimiento y fallback de accesibilidad.

---

#### `/responsive-grid <componente o página>`
**Qué hace:** Reemplaza breakpoints fijos por escalado continuo con `clamp()` (tipografía, padding, gaps) y `container queries` para componentes reutilizados en anchos de contenedor distintos; reserva breakpoints tradicionales solo para cambios estructurales reales (columnas, dirección flex).
**Cuándo:** Cualquier layout que deba verse bien de 320px a pantallas 4K sin saltos bruscos.
**Ejemplo:** `/responsive-grid la grilla de productos del catálogo`
**Devuelve:** Fórmulas `clamp()` + escala de espaciado de 4/8 aplicadas, verificadas en móvil/tablet/desktop.

---

#### `/figma-to-code <fuente del diseño>`
**Qué hace:** Extrae tokens (color, tipografía, espaciado redondeado a la escala del sistema) de un diseño/design system dado antes de maquetar, mapea auto-layout de Figma a flex/grid real, y distingue componentes reutilizables de maquetación única — infiriendo estados no dibujados (hover/disabled) del propio patrón del sistema.
**Cuándo:** El usuario da un diseño, capturas de Figma o un design system existente que el código debe respetar.
**Ejemplo:** `/figma-to-code el sistema de componentes del link de Figma adjunto`
**Devuelve:** Tokens + componentes fieles al sistema + qué estados se infirieron y de dónde.

---

#### `/a11y-review <componente o página>`
**Qué hace:** Verifica contraste real por cada par texto/fondo usado (mínimo 4.5:1 texto normal, 3:1 texto grande/UI), navegación completa por teclado con foco siempre visible, y HTML semántico con ARIA solo como último recurso.
**Cuándo:** Al cerrar la paleta en `/theme-factory`, y como pase final de cualquier UI antes de darla por terminada.
**Ejemplo:** `/a11y-review el formulario de checkout`
**Devuelve:** Hallazgos con severidad (bloqueante/importante/menor), elemento exacto y fix — no un veredicto genérico.

---

### 3.7 Comandos React Native / Expo

Ciclo completo por terminal: `npx expo`/EAS CLI. Windows no tiene Xcode, así que iOS local es imposible — todo lo de iOS pasa por EAS Build en la nube. Doctrina completa en `docs/REACT-NATIVE.md`; para builds/logs masivos, delega en el agente `react-native`.

---

#### `/expo-build [ruta] [development|preview|production]`
**Qué hace:** Build de desarrollo o preview: local con `npx expo run:android` (reutiliza Gradle) o en la nube con `eas build --profile <perfil>` según `eas.json`. Diagnostica errores típicos de Metro, dependencias nativas no vinculadas o prebuild desincronizado, con el log a archivo y solo el error raíz en la conversación.
**Cuándo:** "Hazme un build de la app", "genera un preview build", o un build de Expo que falla.
**Ejemplo:** `/expo-build . preview`
**Devuelve:** Ruta/URL del artefacto (o link de EAS) + variante + causa raíz si falló.

---

#### `/expo-release [android|ios|all]`
**Qué hace:** Build de producción (`eas build --profile production`) y submit a tiendas (`eas submit`), con bump de versión en `app.json`/`app.config` (`version`, `buildNumber`/`versionCode`) y verificación de que la subida se completó.
**Cuándo:** Publicar en Play Store/App Store desde un proyecto Expo.
**Ejemplo:** `/expo-release android`
**Devuelve:** Confirmación de build + submit, o el punto exacto donde falló.

---

#### `/expo-run [android|ios]`
**Qué hace:** Instala y ejecuta la app en emulador/dispositivo con Metro bundler, logs filtrados (mismo principio que logcat en Android). iOS queda fuera de alcance en esta máquina (requiere Mac/EAS).
**Cuándo:** Probar una build recién generada, ver logs de Metro.
**Ejemplo:** `/expo-run android`
**Devuelve:** Veredicto OK/error con las líneas de log que lo respaldan.

---

#### `/expo-doctor [síntoma]`
**Qué hace:** Corre `npx expo-doctor`, revisa Node/Expo CLI/EAS CLI (`eas whoami`) y remite a `/android-doctor` para el SDK Android subyacente en vez de duplicar esa lógica.
**Cuándo:** Builds que fallan por entorno, máquina nueva, proyecto Expo desconocido.
**Ejemplo:** `/expo-doctor`
**Devuelve:** Tabla de veredictos por pieza.

---

### 3.8 Comandos Capacitor / Ionic

Apps web empaquetadas como nativas. El compile final de Android reutiliza el mismo Gradle que ya cubren `/apk-build`/`/apk-release`/`/android-doctor` — estos comandos se encargan de la capa web y la sincronización nativa. iOS local es imposible en Windows (sin Xcode); camino recomendado: CI con runner macOS. Doctrina completa en `docs/CAPACITOR.md`; agente dedicado: `capacitor`.

---

#### `/capacitor-build [ruta] [android|ios]`
**Qué hace:** Build de la capa web (script real del `package.json`, no asumido) + `npx cap sync android` (copia assets y actualiza plugins nativos) + compile Gradle delegado al mismo proceso de `/apk-build`. Diagnostica desincronización web↔nativo y versiones core/cli/android desalineadas.
**Cuándo:** "Hazme el build de la app Capacitor", o falla la sincronización nativa.
**Ejemplo:** `/capacitor-build . android`
**Devuelve:** Artefacto compilado + confirmación de sync, o causa raíz del fallo.

---

#### `/capacitor-release [android|ios]`
**Qué hace:** Sincroniza y delega el firmado/versión a `/apk-release` para Android; documenta el camino de iOS (CI con runner macOS / Ionic Appflow) sin fingir un build local imposible.
**Cuándo:** Publicar la versión Android de una app Capacitor.
**Ejemplo:** `/capacitor-release android`
**Devuelve:** Artefacto firmado + verificación, o el plan de CI para iOS.

---

#### `/capacitor-run [android]`
**Qué hace:** `npx cap sync` + ejecución en emulador/dispositivo Android con logcat filtrado (mismo patrón que `/android-run`).
**Cuándo:** Probar una app Capacitor recién sincronizada.
**Ejemplo:** `/capacitor-run`
**Devuelve:** Veredicto OK/CRASH con evidencia de logcat.

---

#### `/capacitor-doctor [síntoma]`
**Qué hace:** `npx cap doctor` + chequeo de versiones `@capacitor/core`/`cli`/`android` desalineadas (causa común de bugs), remitiendo a `/android-doctor` para el entorno Android subyacente.
**Cuándo:** Builds que fallan por entorno o desalineación de versiones.
**Ejemplo:** `/capacitor-doctor`
**Devuelve:** Tabla de veredictos por pieza.

---

### 3.9 Comandos de apps de escritorio (Electron / Tauri)

Autodetectan el framework (indicadores de archivo: `src-tauri/`+`Cargo.toml` = Tauri; `electron-builder` config + `electron` en `package.json` = Electron) en vez de asumir uno. Target principal: instalador Windows. Doctrina completa en `docs/DESKTOP.md`; agente dedicado: `desktop`.

---

#### `/desktop-build [ruta] [electron|tauri]`
**Qué hace:** Compila con `electron-builder` o `npm run tauri build` según el framework detectado, con log a archivo y diagnóstico de errores típicos (dependencias nativas de Electron sin reconstruir, toolchain Rust/WebView2 faltante en Tauri).
**Cuándo:** "Hazme el instalador de la app de escritorio", o un build de Electron/Tauri que falla.
**Ejemplo:** `/desktop-build`
**Devuelve:** Ruta del instalador + framework detectado, o causa raíz del fallo.

---

#### `/desktop-release [electron|tauri]`
**Qué hace:** Bump de versión (`package.json` o `Cargo.toml`+`tauri.conf.json`), empaquetado, y firma de código si hay certificado configurado (documentada como paso opcional, no asumida).
**Cuándo:** Distribuir un instalador versionado.
**Ejemplo:** `/desktop-release`
**Devuelve:** Instalador verificado (existe, tamaño plausible, lanzable) + avisos de firma.

---

#### `/desktop-run [electron|tauri]`
**Qué hace:** Arranca en modo desarrollo (`electron .` o `npm run tauri dev`) y verifica consola del proceso principal/renderer sin volcar el log completo.
**Cuándo:** Probar cambios en desarrollo antes de empaquetar.
**Ejemplo:** `/desktop-run`
**Devuelve:** Veredicto de arranque OK/error con las líneas relevantes.

---

#### `/desktop-doctor [síntoma]`
**Qué hace:** Verifica Node, toolchain Rust (`rustc`/`cargo`) para Tauri, WebView2 Runtime en Windows, y versión de `electron-builder` vs Node ABI para Electron.
**Cuándo:** Builds que fallan por entorno, máquina nueva.
**Ejemplo:** `/desktop-doctor`
**Devuelve:** Tabla de veredictos por pieza.

---

## 4. Manual de agentes

Todos se lanzan desde tu sesión (ver sección 2): corren en paralelo si lanzas varios a la vez, cada uno con contexto propio, y devuelven solo su reporte. Se invocan pidiéndolo por nombre ("lanza el agente critic sobre el diff") o el modelo los elige solo.

| Agente | Modelo | Rol | Cuándo pedirlo | Regla clave que lleva grabada |
|---|---|---|---|---|
| `scout` | Haiku | Explorador de código, solo lectura | "¿Dónde está X?", inventarios, greps masivos — cualquier búsqueda amplia | Reporta `ruta:línea` denso, máx 30 líneas; si no encuentra, dice qué variantes probó |
| `architect` | Opus | Diseño y planes, solo lectura | Decisiones de arquitectura, trade-offs, planes de refactor | Explora el código real antes de opinar; caza la sobre-ingeniería incluso en sus propuestas |
| `implementer` | Sonnet | Ejecutar un plan ya definido | Cuando ya hay plan con archivos y criterios concretos | Verifica algo tras cada edición; prohibido reportar éxito sin output de ejecución |
| `verifier` | Sonnet | Verificación independiente | Tras implementar, para veredicto imparcial | No confía en el reporte del implementador; ejercita el flujo real + 2 casos hostiles |
| `critic` | Opus | Revisión adversarial, solo lectura | Control de calidad final de cambios importantes | Cada hallazgo con escenario de fallo concreto; prohibido inventar nitpicks para justificarse |
| `debugger` | Opus | Causa raíz de bugs con evidencia | Bugs difíciles, "no reproduce", fixes que no funcionaron | Prohibido diagnosticar sin reproducir; la causa debe explicar el 100% del síntoma o no es la causa |
| `backend` | Sonnet | APIs, servicios, lógica, acceso a datos | Capa servidor de una feature (paralelo con `frontend` si el contrato está cerrado) | El contrato manda; valida en el borde; verifica con peticiones reales de cada caso |
| `frontend` | Sonnet | UI, componentes, estado, consumo de API | Capa cliente de una feature | Los 4 estados (loading/vacío/error/éxito) siempre; imita los patrones del repo |
| `data-engineer` | Sonnet | Pipelines, SQL pesado, modelado, migraciones | Mover/transformar datos, trabajo de warehouse | Mira el dato real antes de codificar; test de idempotencia obligatorio |
| `data-scientist` | Sonnet | Análisis, EDA, features, modelos | Responder preguntas con datos, explorar, modelar | Anti-leakage como reflejo; toda afirmación con su cifra; baseline antes que modelo |
| `android` | Sonnet | Builds Gradle, adb/emulador, releases firmadas | Compilar/instalar/probar APKs sin quemar tu contexto con logs de Gradle/logcat | Output filtrado en origen; build exitoso = BUILD SUCCESSFUL + artefacto con timestamp fresco |
| `react-native` | Sonnet | Builds EAS, Metro bundler, emulador/dispositivo | Compilar/ejecutar/depurar apps Expo sin quemar tu contexto con logs de Metro/EAS | iOS local es imposible en Windows; siempre EAS o `expo run`, nunca Xcode |
| `capacitor` | Sonnet | Build web, sync nativo, ejecución Android | Compilar/sincronizar/ejecutar apps Capacitor sin quemar tu contexto | Sync antes de build siempre; delega el compile Android final al agente `android` |
| `desktop` | Sonnet | Builds Electron/Tauri, empaquetado, instaladores | Compilar/ejecutar/depurar apps de escritorio sin quemar tu contexto con logs de Rust/webpack | Detecta el framework antes de asumir comandos; code signing documentado, no asumido |

**Cómo se combinan (patrón típico):** `scout` encuentra → `architect` diseña → `backend`+`frontend` (o `implementer`) construyen en paralelo → `verifier` verifica → `critic` revisa. El orquestador (tu sesión) integra entre cada paso. No hace falta usar toda la cadena: la matriz de `docs/WORKFLOWS.md` dice cuánto proceso merece cada tarea.

**Economía:** el modelo caro en las decisiones (`architect`, `critic` en Opus), el barato en el volumen (`scout` en Haiku), el equilibrado en la ejecución (Sonnet). Así una sesión de Sonnet obtiene diseño y revisión de nivel Opus pagándolo solo donde importa.

---

## 5. MCPs

Declarados en `.mcp.json`; Claude Code los arranca al iniciar sesión (aprueba la primera vez). Requieren Node (ya instalado); la primera invocación descarga el paquete.

### `sequential-thinking`
Herramienta de razonamiento estructurado: el modelo descompone un problema en pensamientos numerados, puede revisar pensamientos anteriores y ramificar. **Para qué sirve aquí:** compensa la menor profundidad de razonamiento de los modelos pequeños — `CLAUDE.md` y `/fable-mode` instruyen a usarlo en algoritmos, concurrencia, diagnósticos de leakage y diseños de pipeline. Con Haiku/Sonnet en problemas duros, marca diferencia real.

### `memory`
Grafo de conocimiento persistente (entidades + relaciones + observaciones) guardado en `.claude/knowledge-graph.json`. **Para qué sirve aquí:** memoria entre sesiones — decisiones de arquitectura, gotchas del entorno, preferencias. Pídele al modelo "guarda en memoria que la API de pagos exige idempotency-key" y estará disponible en la sesión de mañana. Complementa (no sustituye) a `HANDOFF.md`: el grafo para hechos duraderos, el handoff para el estado de un trabajo en curso.

### `chrome-devtools`
Controla un Chrome real vía el protocolo DevTools: navegar, click/rellenar formularios, capturar pantalla, leer mensajes de consola y peticiones de red, y trazar performance. **Para qué sirve aquí:** es la forma de cumplir de verdad la regla "ejercita el flujo real" (CLAUDE.md §1, `/verify-work` paso 4) en frontend — en vez de declarar una UI "no verificada" por no tener navegador, se abre, se ejercita el flujo y se lee la consola por errores reales. Lo usan `/verify-work`, `/full-stack-feature` (capa frontend) y `a11y-review`.
Configurado con `--isolated` (perfil temporal, sin arrastrar cookies/sesión entre proyectos), `--viewport 1280x800` (desktop estándar) y capturas en WebP comprimido (`--screenshotFormat webp --screenshotQuality 80 --screenshotMaxWidth 1280`) para no inflar el contexto con PNGs pesados. Registrado tanto en `.mcp.json` (portable con el ecosistema) como a nivel usuario (disponible fuera de NEPTUNO); si necesitas verificar en móvil, pásale un viewport distinto al invocar sus herramientas.

### Opcionales según tu stack
Si conectas una base de datos al trabajo diario, añade su MCP a `.mcp.json` (p. ej. el de Neon si usas Neon — da `run_sql`, `explain_sql_statement`, `list_slow_queries` y branching de DB para probar migraciones sin riesgo; o un servidor MCP de Postgres/SQLite genérico). Las skills `/sql-optimize` y `/db-migration` los aprovechan automáticamente si están.

---

## 6. Flujos recomendados

Recetas completas en `docs/WORKFLOWS.md`. Las cuatro que más usarás:

```
# Feature full stack
/api-contract <feature> → /db-migration (si toca schema) → /full-stack-feature <feature> → /verify-work

# Tarea difícil de cualquier tipo
/deep-plan <tarea> → /fable-mode implementa el plan → /self-review

# Dataset nuevo hasta modelo
/eda <dataset> → /data-quality <dataset> → /ml-experiment <objetivo>

# Sesión larga
[inicio] leer HANDOFF.md → /context-prime
[al 70% de contexto] /optimize-tokens → /compact
[final] /handoff

# Release Android de principio a fin
/apk-release → /android-run (humo en dispositivo real) → /release con el APK adjunto

# Release Expo/Capacitor de principio a fin
/expo-release (o /capacitor-release) → /expo-run (o /capacitor-run) humo en dispositivo → /release

# Instalador de escritorio
/desktop-build → /desktop-run (humo en modo dev) → /desktop-release (empaquetado + firma si aplica)

# Trabajo grande hacia GitHub (estilo Graphite)
/pr-stack crear <tarea> → reviews → /pr-stack restack → /pr-stack land
# (PR suelto: /pr → /pr-merge. Babysitting de CI: /loop /pr-merge <n>)
```

Guías de doctrina por dominio: `docs/FULLSTACK.md` (reglas por capa, contract-first, división en paralelo segura), `docs/DATA.md` (las 5 leyes del dato, anti-leakage, las 4 propiedades de un pipeline), `docs/ANDROID.md` (la tríada JDK↔Gradle↔AGP, sospechosos de build por síntoma, firma y adb), `docs/REACT-NATIVE.md` (Expo/EAS, Metro, límite de iOS local en Windows), `docs/CAPACITOR.md` (sync web↔nativo, versiones core/cli/android), `docs/DESKTOP.md` (Electron vs Tauri, empaquetado y firma en Windows), `docs/GITHUB.md` (los 3 mandamientos de `gh`, chuleta de comandos, stacks estilo Graphite) y `docs/DESIGN.md` (dirección antes que ejecución, orden de trabajo entre las 8 skills de diseño, reglas transversales de sistema y accesibilidad). Guías transversales: `docs/PROMPTING.md` (patrones de prompt por tipo de tarea y ajustes por modelo), `docs/ECONOMIA-TOKENS.md` (jerarquía de coste, subagentes como cortafuegos de contexto, prompt caching), `docs/DEBUGGING.md` (taxonomía de sospechosos por síntoma + arsenal de técnicas — la usan `/debug`, `/bug-hunt` y el agente `debugger`) y `docs/AUTOMATION.md` (hooks, loops, schedules y headless `claude -p`, con matriz de decisión por coste).

---

## 7. Estructura de archivos

```
~/github/Jmyukopila/NEPTUNO
├── CLAUDE.md                        ← Doctrina (se carga sola en cada sesión)
├── README.md                        ← Este manual
├── .mcp.json                        ← MCPs: sequential-thinking + memory
├── .claude/
│   ├── settings.json                ← Permisos pre-aprobados + hooks de automatización
│   ├── skills/                      ← 49 comandos
│   │   ├── fable-mode/  optimize-prompt/  optimize-tokens/
│   │   ├── deep-plan/  verify-work/  self-review/  debug/  bug-hunt/  write-tests/  refactor/
│   │   ├── context-prime/  handoff/  parallel-split/
│   │   ├── full-stack-feature/  api-contract/  db-migration/  sql-optimize/
│   │   ├── eda/  data-quality/  data-pipeline/  ml-experiment/
│   │   ├── apk-build/  apk-release/  android-run/  android-doctor/
│   │   ├── expo-build/  expo-release/  expo-run/  expo-doctor/
│   │   ├── capacitor-build/  capacitor-release/  capacitor-run/  capacitor-doctor/
│   │   ├── desktop-build/  desktop-release/  desktop-run/  desktop-doctor/
│   │   ├── pr/  pr-merge/  pr-stack/  release/
│   │   └── frontend-design/  editorial-layout/  theme-factory/  motion-design/
│   │       generative-art/  responsive-grid/  figma-to-code/  a11y-review/
│   └── agents/                      ← 14 especialistas
│       ├── scout.md  architect.md  implementer.md  verifier.md  critic.md  debugger.md
│       └── backend.md  frontend.md  data-engineer.md  data-scientist.md
│           android.md  react-native.md  capacitor.md  desktop.md
├── docs/
│   ├── PROMPTING.md  ECONOMIA-TOKENS.md  WORKFLOWS.md
│   ├── DEBUGGING.md                 ← Arsenal de depuración (sospechosos por síntoma + técnicas)
│   ├── FULLSTACK.md                 ← Doctrina full stack por capa
│   ├── DATA.md                      ← Doctrina de datos (las 5 leyes)
│   ├── ANDROID.md                   ← Doctrina Android por terminal (tríada, firma, adb)
│   ├── REACT-NATIVE.md              ← Doctrina Expo/RN (EAS, Metro, límite de iOS en Windows)
│   ├── CAPACITOR.md                 ← Doctrina Capacitor/Ionic (sync web↔nativo)
│   ├── DESKTOP.md                   ← Doctrina Electron/Tauri (empaquetado y firma)
│   ├── GITHUB.md                    ← Doctrina gh (PRs, merges, stacks estilo Graphite)
│   ├── AUTOMATION.md                ← Hooks, loops, schedules, headless (matriz de coste)
│   └── DESIGN.md                    ← Doctrina de diseño (dirección antes que ejecución)
├── opencode.json                    ← MCPs para opencode (generado, ver §9)
├── .opencode/                       ← Generado por tools/sync-opencode.js — NO editar a mano
│   ├── command/                     ← 49 comandos (espejo de .claude/skills/*/SKILL.md)
│   ├── agent/                       ← 14 agentes (espejo de .claude/agents/*.md)
│   └── plugin/                      ← Copia de tools/plugins/
└── tools/
    ├── sync-global.js               ← Re-sincroniza la copia global en ~/.claude (node tools/sync-global.js)
    ├── sync-opencode.js             ← Genera .opencode/ + opencode.json, proyecto y global (node tools/sync-opencode.js)
    ├── hooks/                       ← Automatizaciones Claude Code a coste cero de tokens
    │   ├── protect-secrets.js       ← Bloquea Edit/Write sobre .env, keystores, credenciales
    │   ├── handoff-reminder.js      ← Inyecta el recordatorio de HANDOFF.md al abrir sesión
    │   └── andromeda-context.js     ← Inyecta la nota de proyecto de la bóveda ANDROMEDA
    └── plugins/                     ← Los mismos 3, portados a plugins opencode (ver §9)
```

---

## 8. Llevarlo a otros proyectos

El ecosistema es **por-directorio**: aplica a las sesiones abiertas en `~/github/Jmyukopila/NEPTUNO` (y sus subdirectorios — puedes clonar tus repos dentro y todo aplica).

- **Copiarlo a otro proyecto:** copia `.claude/` y `.mcp.json`, y fusiona `CLAUDE.md` con el del destino (si el destino ya tiene CLAUDE.md, pega la doctrina encima de lo específico del proyecto).
- **Global — HECHO (2026-07-06)**: skills, agentes, docs y doctrina están copiados en `~/.claude\` (con las referencias `docs/*.md` reescritas a rutas absolutas para que resuelvan desde cualquier proyecto), y los dos MCPs registrados a nivel usuario (el `memory` global usa su propio grafo en `~/.claude\knowledge-graph.json`). **~/github/Jmyukopila/NEPTUNO sigue siendo la copia maestra**: dentro de NEPTUNO manda la versión del proyecto (precedencia normal de Claude Code). Tras editar skills/agentes/docs/CLAUDE.md aquí, re-sincroniza la copia global con:
  ```powershell
  node ~/github/Jmyukopila/NEPTUNO/tools/sync-global.js
  ```
  (borra y re-copia las carpetas globales y re-aplica las reescrituras; es idempotente). El `settings.json` global NO se toca: los permisos pre-aprobados siguen siendo por-proyecto.
- **Personalizarlo:** cada skill/agente es un `.md` editable — ajusta protocolos a tu gusto y la próxima sesión los usa. Si un olvido se vuelve recurrente, automatízalo con un hook (ejemplo en `docs/WORKFLOWS.md`).

---

## 9. Compatibilidad opencode

El ecosistema no es exclusivo de Claude Code: los mismos 49 comandos, 14 agentes y 3 servidores MCP funcionan con [opencode](https://opencode.ai) como runtime alternativo. `.claude/` sigue siendo la única fuente de verdad — nada se edita a mano en `.opencode/`.

- **Generarlo/actualizarlo:** `node tools/sync-opencode.js [--provider=anthropic|google|openai]` — traduce `.claude/skills/` → `.opencode/command/`, `.claude/agents/` → `.opencode/agent/` (con tabla de modelos `haiku/sonnet/opus` por proveedor y traducción de `tools:` a `permission:`) y fusiona `.mcp.json` en la clave `mcp` de `opencode.json`, en el proyecto y en `~/.config/opencode/` (mismo patrón que `sync-global.js` con `~/.claude/`, preservando cualquier MCP propio que el usuario ya tuviera registrado globalmente).
- **Otros modelos, de verdad:** un agente subagente fija su propio `model:`, y eso GANA sobre el `--model` de la sesión de opencode (verificado con evidencia — ver `docs/OPENCODE.md` §3) — por eso cambiar de proveedor para toda la flota de agentes exige `--provider`, no basta con invocar `opencode run --model otro/proveedor`. Ahora mismo la generación activa usa `--provider=google` (la cuenta de Anthropic de esta máquina está sin saldo; OpenAI sin cuota; Google sí respondió), verificado con una delegación real al agente `scout` sobre contenido real del repo.
- **Doctrina:** `CLAUDE.md` no se traduce — opencode lo lee de forma nativa como `AGENTS.md` (documentado en sus propios docs), así que la doctrina de la sección 0-7 de este ecosistema aplica igual sin ningún paso extra.
- **Hooks → plugins:** los 3 hooks de `tools/hooks/` (Claude Code) tienen puerto a mano en `tools/plugins/` (opencode), porque el modelo de hooks no es el mismo entre ambos runtimes. `protect-secrets` es una traducción directa y de alta confianza; los 2 que inyectan contexto al inicio de sesión usan un hook `experimental.*` de opencode — funciona, pero está marcado como de confianza media en `docs/OPENCODE.md`.
- **Verificado en esta máquina** (`opencode 1.17.18`): `opencode agent list` muestra los 14 agentes, `opencode mcp list` muestra los 3 MCPs conectados, `opencode debug config` confirma que los 6 archivos de plugin (proyecto + global) se cargan, y una invocación real (`opencode run`) delegando en `scout` sobre un archivo real del repo devolvió una respuesta correcta.
- Detalle completo (tablas de mapeo, gotchas encontrados y corregidos, notas de confianza) en `docs/OPENCODE.md`.

---

## 10. Grafo de conocimiento (graphify)

`graphify` indexa una carpeta (código, docs, papers, imágenes, vídeo) en un grafo consultable y persistente. En NEPTUNO ocupa el escalón que faltaba en la jerarquía de coste: **responder sin leer**. Manual completo en `docs/GRAPHIFY.md`.

- **Por qué**: `graphify query "<pregunta>"` devuelve un subgrafo con presupuesto de tokens (`--budget`, 2000 por defecto) en lugar de 40 archivos completos. La primera construcción cuesta una llamada de LLM por chunk; después, `graphify update` es AST puro y **no vuelve a llamar al LLM**.
- **Tres grafos vivos**: `~/github/Jmyukopila/NEPTUNO` (el propio ecosistema: skills, agentes, docs, sincronizadores), `~/ANDROMEDA` (la bóveda de notas) y el global en `~/.graphify/global-graph.json` (unión de ambos, para preguntas cross-proyecto). Desde otro cwd hay que pasar `--graph`.
- **Sin gasto nuevo**: backend `claude-cli`, que enruta por el binario `claude` local y autentica con la suscripción de Claude Code ya pagada (esta máquina no tiene ninguna API key, y la clave de Anthropic de la cuenta está sin saldo). Ollama queda documentado como alternativa de coste literalmente cero pero peor extracción.
- **Enganchado en la doctrina, no solo instalado**: §2 y §5 de `CLAUDE.md` (el grafo antes que el grep, y la jerarquía de coste revisada), paso 0.5 de `/context-prime`, paso 0 del agente `scout`, refresco del grafo al cerrar en `/handoff`, y realimentación `save-result`/`reflect` en `/verify-work`.
- **Hook PreToolUse** (`Bash|Grep` y `Read|Glob`): recuerda consultar el grafo antes de grepear o leer fuentes indexadas. Modo nudge — inyecta contexto, nunca bloquea, y falla abierto ante cualquier error. Verificado por stdin en los cuatro casos (con grafo / sin grafo / dentro / fuera del proyecto).
- **Dos trampas de sincronización resueltas**: `sync-global.js` borra `~/.claude/skills` y sobrescribe la clave `hooks` del settings global en cada ejecución, así que tanto la skill como el hook de graphify viven en `~/github/Jmyukopila/NEPTUNO/.claude/` (la fuente de verdad) y no en la copia global. La instalación va con `CLAUDE_CONFIG_DIR=~/github/Jmyukopila/NEPTUNO/.claude`.
- **Ignores obligatorios**: `.graphifyignore` excluye `.opencode/` en NEPTUNO (es copia generada de `.claude/`: indexarla duplicaría cada skill como nodo gemelo) y `04-Recursos/Grafo/` en ANDROMEDA (es el export del propio grafo: sin esa línea la bóveda se realimentaría con su propia salida).
- **opencode**: los grafos son artefactos neutros — mismo `graph.json`, mismo CLI, mismo resultado. La doctrina llega nativa vía `CLAUDE.md` y la skill vía `sync-opencode.js`. El hook no se portó a plugin: `tool.execute.before` solo puede bloquear, no inyectar contexto (razonado en `docs/GRAPHIFY.md` §7).

---

## 11. Hivemind — la flota externa

Claude Code decide y verifica; los ejecutores son CLIs agénticas externas con sus propios modelos,
herramientas y subagentes. La regla que lo sostiene: **delegar no es dejar de responder**. Un agente
que reporta éxito no es evidencia de éxito, y quien encarga es quien responde ante el usuario.

Y delegar tampoco termina al recibir el trabajo. La salida normal no es aceptarlo ni reencargarlo:
es **intervenirlo** — el agente entrega entre el 60% y el 90%, y el resto (convenciones del repo,
casos borde, nombres, tests que de verdad fallen) lo pone Claude encima.

| Agente | Fuerte en | Débil en |
|---|---|---|
| `antigravity` (`agy`) | Repos desconocidos, contexto grande, volumen mecánico, multimodal. Rápido y barato. **57 herramientas nativas con control de navegador completo** y 4 de subagentes | Menos disciplinado con protocolos largos. Ejecuta los comandos en su propio scratch: sin rutas absolutas devuelve `0` fingiendo éxito |
| `opencode` | Refactors multi-archivo con plan cerrado. Es el único que ya tiene la doctrina NEPTUNO entera y sus 15 agentes | Sin navegador ni visión. Sin `--auto` se queda esperando un permiso que nadie responderá |
| `devin` | Trabajo autónomo largo. Único con sandbox de proceso real (`bwrap`+`seccomp`) y entornos en la nube. Lee `.claude/skills/` nativamente | Caro y de arranque lento. Responde por inferencia si el criterio de salida no es un comando |

| Comando | Qué hace |
|---|---|
| `node tools/hivemind.js doctor` | Quién está instalado **y autenticado** (corrige las rutas XDG si la sesión vive dentro de un snap) |
| `node tools/hivemind.js roster` | Enrutado resumido por forma de tarea |
| `node tools/hivemind.js run <agente> "<encargo>"` | Despacha; el log va a `.hivemind/runs/`, no al contexto de la sesión |
| `node tools/hivemind.js session <agente> "<msg>" --turno "<otro>"` | Sesión con turnos y memoria en **los tres** (ACP en devin/opencode, stream-json en agy) |
| `node tools/hivemind.js session capabilities <agente>` | Qué herramientas publica de verdad ese agente |

**No se delega**: las decisiones de arquitectura, la verificación visual final, y la integración
entre trozos repartidos en paralelo — que
suele ser la parte que más piensa. Tampoco lo que se hace en cinco minutos: el arranque en frío de un
agente externo cuesta más que la tarea.

**El encargo es un contrato autocontenido** — objetivo, contexto, alcance, criterio de salida,
formato, autonomía — porque el agente externo arranca sin tu contexto. Y el criterio de salida tiene
que ser **un comando ejecutable**: medido en esta flota, el mismo encargo en prosa dio una respuesta
incorrecta que el agente reportó como éxito, y reescrito como «ejecuta esto y reporta su salida»
acertó en un tercio del tiempo.

La interoperabilidad sale de una sola fuente de verdad (`.claude/`): `.opencode/` para opencode y
`.agents/` + `AGENTS.md` + `.windsurf/rules/` — el terreno común que leen Devin y Antigravity — con
`node tools/sync-agents.js`.

Doctrina completa, fichas por agente, las cuatro capas del ecosistema agéntico (MCP, A2A/ACP, Computer
Use, sandboxes), las trampas de operación con su evidencia y el registro de deuda de verificación:
`docs/HIVEMIND.md`.
