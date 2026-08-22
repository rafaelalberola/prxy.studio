# PRXY.STUDIO — Project Configuration & Memory

## Positioning (desde 2026-08-22)
- **Marca personal de Rafa**, no estudio. Primera persona del singular.
- **Título:** Rafa | Encuentra tu voz creativa
- **Bio:** Tu voz creativa ya existe. Te ayudo a descubrirla. Empieza aquí → prxy.studio
- **Público:** creativos y diseñadores bloqueados o derivativos. NO marcas, músicos, actores ni empresas.
- **Voz:** primera persona, directa, sin método propietario, sin promesa de resultado,
  sin lenguaje de agencia ("nosotros", "nuestro equipo", "soluciones").
- **Copy:** aplicar SIEMPRE la skill `humanizer` antes de entregar.

## Brand Identity
- **Name:** PRXY.STUDIO
- **Tagline:** DESIGN YOURSELF. (se mantiene en el sello)
- **Tone:** Direct, uppercase, no filler, no emojis

## Visual System (verificado contra el código, 2026-08-22)
- **Font:** GT Pressura Mono 400, self-hosted en `/fonts/gt-pressura/`
- **Base size:** 15px web / 84px 4K reels / 42px stories (1080w)
- **Colors:**
  - Background: `#fbfbfb` (NO blanco puro)
  - Primary text: `#111`
  - Muted text: `#8e8e8e`
  - Accent: `#FF4D2A` (punto del logo, loader, sello, badge del carrito)
- **Logo:** PRXY + cuadrado rojo que morfea (cuadrado → círculo, 0°→90°→180°→270°)
- **Seal:** Globo wireframe con texto en arco `PRXY.STUDIO — DESIGN YOURSELF` + punto rojo
- **Favicon:** cuadrado rojo rotado 7° (`favicon.svg`)
- **Text style:** UPPERCASE, letter-spacing -0.02em, line-height 1.5–1.7
- **Aesthetic:** Minimalista, aireado. Teenage Engineering, yeezy.com

## Website Structure (2 rutas navegables)
- `/` — Landing única: hero, qué pasa en una sesión, quién soy, para quién es / no es,
  reserva (3 opciones), cierre. Todos los CTA van a Cal.com.
- `/shop` — Tienda (Printful + Stripe vía `shop-worker.js`)
- `404.html` — Página de error real, con vuelta a la home

### Deprecadas (301 → `/` vía `_redirects`)
`/vision`, `/process`, `/services`, `/shop/shop/`. Los archivos siguen en el repo con
un comentario `DEPRECATED` en primera línea. No están enlazados desde ninguna página viva.

## Booking (Cal.com — usuario `prxy.studio`)
| Evento | Slug | Duración | Precio |
|---|---|---|---|
| Primera conversación / First call | `primera-conversacion` | 15 min | Gratis |
| Sesión de voz / Voice session | `sesion-de-voz` | 90 min | 120 € |
| Tres sesiones / Three sessions | `tres-sesiones` | 3 × 90 min / 6 semanas | 320 € |

## i18n
Sin archivos de locales. El inglés es el `innerHTML` por defecto; el español vive en
`data-es="..."` del mismo elemento. `setLang()` intercambia el `innerHTML` y persiste en
`localStorage['prxy-lang']`. Default `'en'`. Placeholders: `data-es-ph`.
La tienda usa además objetos `{en,es}` en su catálogo `PRODUCTS`.

## Hosting
- **Actual:** GitHub Pages (`CNAME` = prxy.studio)
- **Objetivo:** Cloudflare Pages, para que `_redirects` haga 301 reales.
  GitHub Pages ignora `_redirects`. Borrar `CNAME` SOLO después de migrar.
- **Workers:** `worker.js` (Beehiiv + Telegram) y `shop-worker.js` (Printful + Stripe),
  desplegados aparte con Wrangler.

## Asset Production Workflow
1. **Escribir contenido** en `src/stories.js` o `src/texts.js`
2. **Preview mockup** — `preview-stories.html` (o `preview.html` para reels)
3. **Refinar** hasta aprobación
4. **Render** solo tras aprobación:
   - Reels: `node render-all.mjs`
   - Stories: `node render-stories.mjs`
   - Covers: `node render-cover.mjs 1`
5. **Salida:** `out/`, `out/stories/`, `out/covers/`

## Content Format — Reels
- 2160×3840 (4K vertical 9:16), 15 s @ 30 fps
- Typewriter letra a letra con cursor + sonido `keyboard-typing.wav`
- Fuente 84px sobre lienzo de 2160w

## Content Format — Stories
- 1080×1920, duración dinámica + 90 frames de aire
- Fuente 42px FIJA, sin escalar según cantidad de texto

## Content Format — Covers
- JPG calidad 95%, frame final del reel

## Rules
- Todo el texto en MAYÚSCULAS
- Sin emojis
- Sin stock, sin imágenes (salvo producto en la tienda)
- El texto ES el contenido
- Preview → aprobar → render. Nunca renderizar sin aprobación
- Todo el copy pasa por `humanizer`
