# Doctrina Full Stack — reglas por capa

Reglas que los agentes `backend` y `frontend` ya llevan incorporadas; esta guía es la referencia común y aplica también cuando trabajas el stack directamente sin agentes.

## El principio rector: contract-first

Frontend y backend nunca se construyen "a la vez y ya cuadrarán". Primero el contrato (endpoints, payloads con ejemplos rellenos, shape de errores, estados de UI), después las capas — y entonces sí, en paralelo si conviene. Comandos: `/api-contract` para diseñarlo, `/full-stack-feature` para el flujo completo.

## Backend

- **Validación en el borde**: todo input externo se valida al entrar (tipo, rango, tamaño, formato). El frontend valida por UX; el backend valida por seguridad — son dos validaciones, no una.
- **Errores de primera clase**: shape de error único en toda la API (código machine-readable + mensaje humano + detalle por campo). Cada endpoint implementa TODOS sus casos de error, no solo el happy path.
- **AuthZ en el servidor**: la UI esconde botones; el servidor decide permisos. Todo handler responde "¿quién puede llamar esto?" con código, no con confianza.
- **SQL parametrizado siempre**; transacciones donde varias escrituras son atómicas; ojo al N+1 (query dentro de bucle).
- **Config y secretos** por el mecanismo del repo (env/vault), jamás hardcodeados.
- **Idempotencia** en operaciones que el cliente puede reintentar (pagos, creaciones): clave de idempotencia o diseño upsert.

## Frontend

- **Los 4 estados**: loading, vacío, error, éxito — toda vista con datos los implementa. El error se muestra útil, nunca se traga.
- **Patrones del repo primero**: el fetching, formularios y modales se resuelven como ya los resuelve el repo. Componente nuevo con patrón nuevo = deuda.
- **Formularios**: validación cliente para UX + errores del servidor mostrados por campo + submit deshabilitado durante envío + no perder el input del usuario ante fallo.
- **Accesibilidad mínima**: button/a reales, inputs con label, alt en imágenes significativas, operable con teclado.
- **Estado del servidor** no se duplica a mano en estado local: usar la capa de datos del repo (React Query/SWR/store).

## Base de datos

- Migraciones: aditivas directas; destructivas con expand-contract (`/db-migration`).
- El esquema debe funcionar con la versión de código ANTERIOR y la nueva (siempre hay ventana de despliegue mixto).
- Índices para los patrones de consulta reales, no especulativos (`/sql-optimize` para diagnóstico con EXPLAIN).
- Dinero: enteros de unidad mínima o decimal, nunca float. Fechas: UTC dentro, local solo al presentar.

## Verificación full stack (mínimo por feature)

1. Backend: petición real por cada caso del contrato (éxito y errores) con el servidor levantado.
2. Frontend: build + flujo ejercitado en dev server, incluyendo un estado de error.
3. Integración: el flujo completo UI→API→DB→UI con datos reales, más un caso hostil de punta a punta.

## División en paralelo (con `/parallel-split`)

Segura solo si: el contrato está cerrado y escrito, y cada agente tiene archivos disjuntos (backend no toca `src/components`, frontend no toca `src/api`). Los tipos compartidos/contrato los fija el orquestador ANTES de lanzar los agentes — es el único archivo que ambos leen y ninguno edita.
