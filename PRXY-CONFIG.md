# PRXY.STUDIO — Project Configuration & Memory

## Brand Identity
- **Name:** PRXY.STUDIO
- **Tagline:** DESIGN YOURSELF.
- **Voice:** Provocative, self-empowerment, anti-system, no labels, identity sovereignty
- **Tone:** Direct, uppercase, no filler, no emojis, confrontational but supportive

## Visual System
- **Font:** GT Pressura Mono, 400 weight
- **Base size:** 15px web / 14px mobile / 84px 4K reels / 42px stories (1080w)
- **Colors:**
  - Primary text: `#4a4a4a`
  - Background: `#FFFFFF`
  - Accent: `#FF4D2A` (red dot, highlights)
  - Inverted: `#000000` bg + `#FFFFFF` text
- **Logo:** PRXY + morphing red dot (square → circle, rotating, scaling)
- **Seal:** Globe wireframe (ellipses + crosshairs) with red dot center
- **Text style:** UPPERCASE, monospace, letter-spacing -0.02em, line-height 1.6–1.7
- **Aesthetic:** Minimalist, airy, spacious, less is more. Inspired by Teenage Engineering, yeezy.com

## Asset Production Workflow
1. **Write content** in `src/stories.js` or `src/texts.js`
2. **Preview mockup** — open `preview-stories.html` (or `preview.html` for reels) to review line breaks, layout, colors
3. **Refine** — iterate on text, breaks, styling until approved
4. **Render** — only after approval:
   - Reels: `node render-all.mjs` (or `node render-all.mjs 1 8 12` for specific ones)
   - Stories: `node render-stories.mjs`
   - Covers: `node render-cover.mjs 1` (generates JPG)
5. **Output:** `out/` (reels), `out/stories/` (stories), `out/covers/` (covers)

## Content Format — Reels
- **Dimensions:** 2160×3840 (4K vertical / 9:16)
- **Duration:** 15 seconds @ 30fps
- **Effect:** Typewriter — letter by letter with cursor, keyboard typing sound
- **Structure:** Text types → blank line → "PRXY" (dim) + morphing red dot
- **Font size:** 84px (on 2160w canvas)
- **Sound:** `keyboard-typing.wav` — signature sound, used on ALL video assets

## Content Format — Stories
- **Dimensions:** 1080×1920 (standard story / 9:16)
- **Duration:** Dynamic based on text length + 90 frames breathing room
- **Effect:** Same typewriter as reels — identical look and feel
- **Structure:** Same as reels — text types → "PRXY" + dot
- **Font size:** 42px FIXED — same size regardless of text amount
- **Variations:** White/black backgrounds, text in gray/white/red
- **Sound:** Same `keyboard-typing.wav`

## Content Format — Covers
- **Format:** JPG, 95% quality
- **Frame:** Final frame of reel (all text visible + PRXY + dot morphing)
- **Script:** `node render-cover.mjs [reel numbers]`

## Website Structure
- `/` — Landing: hook phrase + CTA "READ MANIFESTO"
- `/vision` — Full manifesto with staggered reveal + email capture
- `/case` — Case study (CASE 001)
- **Language toggle:** EN/ES, persists via localStorage across all pages
- **Navigation:** All inner pages have BACK button to `/`

## Current Hook Phrase
- **EN:** IF I ASKED YOU TO NAME / EVERYTHING YOU LOVE, / HOW LONG UNTIL / YOU NAME YOURSELF?
- **ES:** SI TE PIDO QUE NOMBRES / TODO LO QUE AMAS, / ¿CUÁNTO TARDAS / EN NOMBRARTE A TI MISMO?

## Manifesto Closing (circular storytelling)
- **EN:** NOW, NAME EVERYTHING YOU LOVE. / THIS TIME, START WITH YOU. / DESIGN YOURSELF.
- **ES:** AHORA, NOMBRA TODO LO QUE AMAS. / ESTA VEZ, EMPIEZA POR TI. / DESIGN YOURSELF.

## Rules
- All text UPPERCASE always
- No emojis ever
- No stock photos, no images (except case study screenshots)
- Text IS the content
- Keyboard typing sound on ALL video assets — signature element
- Same font size across all stories (42px) — never scale based on content amount
- Preview → approve → render (never render without approval)
