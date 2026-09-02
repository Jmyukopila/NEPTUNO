---
name: theme-factory
description: Catálogo de combinaciones tipografía+color de alta gama listas para usar (nórdico, retro-futurista, corporativo premium, editorial mono, brutalista), para no "adivinar" códigos hexadecimales ni parejas de fuentes al azar. Úsalo al fijar la paleta y tipografía de un proyecto, después de elegir dirección en `frontend-design`.
argument-hint: <dirección de diseño elegida>
---

# Theme Factory — temas curados, no hex al azar

Elegir colores y fuentes "a ojo" es la causa directa del look genérico de IA. Esta skill entrega temas completos (paleta + tipografía) ya validados para que la elección sea seleccionar, no improvisar.

## Catálogo de temas

Cada tema: fondo, texto, superficie (tarjetas/paneles), acento primario, acento secundario opcional, y pareja tipográfica (display/heading + body, ambas de Google Fonts o system stack).

1. **Nórdico / calma**
   - Fondo `#F7F5F2`, texto `#1C1C1A`, superficie `#EFEBE5`, acento `#3D5A47` (verde musgo), acento 2 `#B5651D` (terracota, uso mínimo).
   - Tipografía: `Fraunces` (display, pesos variables) + `Inter` solo si ya no se usó en otro sitio del proyecto — alternativa: `Söhne`/`Public Sans`.

2. **Retro-futurista / synthwave técnico**
   - Fondo `#0A0E27`, texto `#E8E9F3`, superficie `#151A3A`, acento `#FF3D81` (magenta), acento 2 `#00E5C7` (cian).
   - Tipografía: `Space Grotesk` (display) + `JetBrains Mono` (datos/labels) + `IBM Plex Sans` (body).

3. **Corporativo premium / confianza**
   - Fondo `#FFFFFF`, texto `#0F1419`, superficie `#F4F5F7`, acento `#1A56DB` (azul contenido), acento 2 `#0F9D58` (éxito, uso funcional solo).
   - Tipografía: `Söhne`/`General Sans` (display) + `Source Serif 4` para citas/editorial + `Inter` body si no hay conflicto.

4. **Editorial monocromo**
   - Fondo `#FAFAF8`, texto `#111111`, superficie `#EDEDEA`, acento único `#C1440E` (naranja quemado, uso muy restringido — subrayados, links, un botón por vista).
   - Tipografía: `Fraunces` o `Canela`-alike (`Newsreader`) display + `Untitled Sans`-alike (`Archivo`) body.

5. **Brutalista / técnico crudo**
   - Fondo `#F0F0F0`, texto `#000000`, superficie `#FFFFFF` con borde `2px solid #000`, acento `#FFD400` (amarillo puro, alto uso intencional).
   - Tipografía: `Space Mono` o `IBM Plex Mono` para TODO (display y body) — la monoespaciada es la decisión de sistema.

## Proceso

1. Selecciona el tema que casa con la dirección de `frontend-design` (no mezcles paletas de dos temas).
2. Deriva variantes de cada color por luminosidad (hover, disabled, focus-ring) desde el MISMO tono base — nunca introduzcas un gris neutro suelto que no pertenezca a la paleta.
3. Fija los tokens como variables (CSS custom properties o config de Tailwind/tema del framework) antes de aplicarlos, para que un cambio de tema sea de un solo lugar.
4. Verifica contraste texto/fondo con `a11y-review` ANTES de dar la paleta por cerrada — un tema de este catálogo puede fallar WCAG AA si se usa mal (ej. acento sobre fondo claro para texto pequeño).

## Regla
Si ninguno de estos 5 temas encaja con el pedido explícito del usuario (marca existente, paleta corporativa dada), no lo fuerces: usa la paleta real del usuario, pero aplica el mismo rigor — deriva variantes por luminosidad del mismo tono, no añadas colores sueltos.
