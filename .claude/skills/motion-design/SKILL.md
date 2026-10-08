---
name: motion-design
description: Direct, build and render motion-design videos from code (launch teasers, product promos, explainers, showreels, logo stings, kinetic type, feature loops) as HTML animated by a pure function of time, rendered frame by frame to MP4 with Playwright and ffmpeg. Use whenever the user asks for a motion graphic, animated video, promo clip, explainer animation or "make a video about X", or wants a motion prompt written, critiqued or improved.
---

# Motion design from code

You are directing a short film, not decorating a web page. Generic AI motion (centered text on a gradient, everything fading in, a logo at the end) comes from skipping three things. This skill fixes all three:

1. **A reference or a genre**, so the model has rules to follow instead of defaults.
2. **A real render engine**, so the output is an actual MP4 at a fixed frame rate, not a browser demo.
3. **Self-review on rendered frames**, so you judge what the viewer sees, not what the code says.

## Workflow

Each step produces a file. Don't skip to code.

### 1. Brief → `BRIEF.md`
Pin down: product or subject in one line, format and length, aspect ratio, where it will be shown, brand (colors, font, logo) if any. If the request already implies these, infer the rest and write down your assumptions. Ask at most 3 questions otherwise. Pick a row:

| Format | Length | Story beats | On-screen words |
|---|---|---|---|
| Launch teaser / promo | 15-45 s | 8-10 per 30 s | 20-35 total |
| Feature / product clip | 8-30 s | 1 capability per 8-10 s | ≤ 15 |
| Showreel | 10-20 s | a new technique every shot | almost none |
| Feature loop (landing page) | 4-15 s, seamless | 3-5 | ≤ 8, reads muted |
| Logo sting | 3-8 s | 2-4 | name + ≤ 4 |
| Explainer | 30-120 s | 1 idea per 6-10 s | ≤ 6 per caption |

Default 1920x1080 at 60 fps (UI and text judder at 30). Vertical social: 1080x1920.

### 2. Concept → `TREATMENT.md`
- Write **3 concepts through different lenses**: (a) the product's own verb or metaphor made literal, (b) the viewer's pain made visible, (c) a formal device (one unbroken camera move, a bookend, an object relayed shot to shot). Pick one; throw out any whose props could appear in a competitor's film.
- Name the **story device**: one object, shape or color that travels through every shot and ideally resolves into the logo at the end.
- Name the **one accent color and what it means** ("today", "new", "yours").
- Write a **beat sheet**: time | picture | copy | (sound). Arc: hook inside the problem by 1 s → turn → proof (1-2 capabilities) → promise → lockup.
- Copy: one line at a time, ≤ 5 words per line. Never open on "Introducing…", a rhetorical question or the logo.

### 3. Style frames before motion
Build the static look first, then render 2-4 stills (`--stills`) and look at them: one hook frame, one product/proof frame, the lockup. Fix the look here; it is 10x cheaper than after animating.

### 4. Build: one HTML file, every pixel a function of `t`
Start from `assets/starter.html`. It defines `window.FILM = {width, height, fps, duration}` and `window.seek(t)`, plus a small house motion toolkit (`E` easing tokens, `prog`, `mix`, `lmix`, seeded `rand`, `put`). Non-negotiables, because the renderer screenshots one frame at a time:
- **No CSS `transition`/`animation`/`@keyframes`, no `Math.random`/`Date.now`.** Everything derives from `t`; randomness uses a seeded `rand`.
- **All movement through one `transform`** (`translate() rotate() scale()`), never `left/top`, so sub-pixel motion stays smooth.
- **Fonts must be local** (installed or bundled `@font-face`). The renderer waits on `document.fonts.ready`. Check `fc-list` for what's available.
- Build scene by scene. After each scene, render stills at its key moments and look.

### 5. Render
```bash
node scripts/render.mjs film.html out/sheet.png --sheet 16       # contact sheet for review
node scripts/render.mjs film.html out/stills --stills 0.5,3,6.2  # specific moments
node scripts/render.mjs film.html out/film.mp4 [--audio track.wav] [--from s --to s]
```
Output is H.264, yuv420p, BT.709-tagged, faststart. An 8 s 1080p60 film takes about a minute. Use `--from/--to` to re-render just a section while iterating.

For the final master, add `--blur 4` (or 6-8) when anything moves faster than ~12 px per frame: it renders sub-frames on a 180° shutter and averages them into real motion blur, at N times the render cost. Do it once, after the last review round. If a move still shows stepped copies, it is too fast (over ~60-80 px/frame): redesign it as a cut, a mask wipe or a shorter distance rather than adding samples.

### 6. Self-review (mandatory, at least one round)
Render a contact sheet and Read it as an image. Then check the densest and the fastest moments as full-size stills. Ask:
- **First frame:** is frame 0 already composed and moving? A muted feed decides in one second.
- **Thumbnail test:** at sheet size, can you tell what the product is and see the accent?
- **Empty space:** any region over a quarter of the frame empty without a reason? Fill it with purpose or reframe.
- **Collisions:** does anything cover text, clip at the frame edge unintentionally, or overlap mid-transition into mush?
- **Continuity:** does the device survive every cut? Does anything pop on or off in one frame?
- **Slop tells** (list below): any present?
- **Deletion test:** remove the decorative moves. Does the idea still read? If removing them changes nothing, they were filler.
Fix, re-render the affected stills, and repeat. Then render the final MP4 and verify with `ffprobe` (size, fps, duration, frame count).

## Craft rules that matter most

**Motion.** About 3 easing characters per film, from the tokens (`out` for arrivals, `inOut` for whips and lockups, `cam` for camera, `glide`, `exit`, `smooth`). Entrances decelerate, exits accelerate, only the camera eases both ways. Interpolate scale in log space (`lmix`). Duration grows with distance. One hero motion plus at most two supporting ones at a time. Overshoot/bounce only on a true landing, at most twice per film. Secondary moves start at 55-75% of the leading move so nothing stalls and lurches.

**Timing.** Something visibly changes about every 0.5 s in the hook. Nothing is static for more than ~0.8 s except one designed hold on the key claim. Text that resolves stays ≥ 0.6 s + 0.1 s per word. Energy builds toward the payoff at 75-90% of the runtime. End card 1.5-2.5 s, still creeping slightly, never frozen. If there is music, pick a BPM where a beat is whole frames (120 BPM at 60 fps = 30 f) and land section changes on downbeats.

**Type.** One clean sans at 2 weights (plus mono for code/numbers). Statements 88-128 px, tight tracking (-0.03 to -0.05 em), leading ~1. Secondary 44-56 px. UI text ≥ 22 px after camera scale. Tabular figures for numbers. Text reveals by rising through a mask or by whole words; text lands sharp.

**Color.** Ink and paper (light or dark, tinted toward the brand's world, not pure #000), 2-4 neutrals, one accent with one meaning, used on ≤ ~8% of pixels and flooding the frame at most once. New things arrive in the accent and relax to neutral.

**Layout.** Product UI large (70-92% of frame width, can overflow an edge), never a small floating card on an empty field. Type anchored to the lower third or an eye line. Safe margins ≥ 96 px sides, 64 px top/bottom. Push the camera in 2-5x on any interaction that carries the story so it reads on a phone.

**Product truth.** Data on screen is specific, named and consistent: counters count on each visible event, sorted lists are sorted, totals add up, dates match weekdays.

## Slop tells (avoid unless the brand supplies them)

- Centered text on a gradient; everything fading in; logo only at the end with nothing driving to it.
- Frames, brackets, labels or text in the corners (the classic "AI made this" giveaway); fake HUD readouts, decorative mono captions, fake metrics, lorem ipsum.
- Eyebrow/kicker labels above headlines, stacked taglines, "Introducing…", stock phrases (seamless, unlock, AI-powered, streamline).
- Purple/violet-to-blue gradients, neon glows, bloom, glassmorphism, lens flares, particles, confetti, sparkles meaning "AI", code rain.
- Serif or italic display type picked by default; condensed display faces.
- Bouncy overshoot on everything; crossfades as the default transition; dips to black; preset glitch/light-leak/film-burn transitions.
- Small UI card on the right, text on the left.

A brand the user supplies always wins over these defaults.

## Prompting patterns

When the user wants a **prompt** (for you or another model) rather than a finished film, or gives a one-liner, see `references/prompts.md`: genre framing ("like it's your showreel for a résumé"), reference frames ("take the palette, type and grain from this frame; ignore the subject"), effort, and real prompts from the community gallery that produced strong films.

## Going further

For studio-grade launch films (synthesized beat-locked score, true motion blur, technique randomizer, critic subagents, ProRes alpha deliverables), the open-source **cinetic** skill implements this whole approach in depth: `npx skills add Leonxlnx/cinetic` (MIT, Remotion or HTML/GSAP). Several craft numbers above are distilled from it.
