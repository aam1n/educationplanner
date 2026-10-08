# Motion prompts that work

Use this when the user asks you to write or improve a motion prompt, or hands you a one-liner and you need to decide how much to fill in.

## Why short prompts sometimes work

A short brief that **names a genre** beats a long brief that names effects. The genre carries rules the model already knows.

- "...like it's your **showreel for a résumé**" → fast cuts, a new technique every shot, best work first, almost no copy.
- "**Netflix-style documentary** for normies" → title cards, slow pushes, archival framing, a narrator's structure.
- "**Launch teaser** for X" → hook in the problem, one reveal, a lockup with a date.
- "**Dribbble-level UI motion**" → one element morphing through states, springs, cursor-driven, loops.

Making the model the subject ("shows what an incredible motion designer **you** are", "who **you** are as a model") pushes it to show techniques instead of explaining a product. Point that energy at the product by naming it: "...about Pocketsflow that shows what an incredible motion designer you are".

"Go all out" and maximum reasoning effort matter: the strongest gallery films were one-shot at the highest effort setting.

## Guardrails worth adding to any prompt

- "Avoid frames and text in the corners, which are typical AI-made giveaways."
- "No centered text on a gradient, no fade-in on everything."
- "Real UI and real data, never placeholder cards."
- "Render stills / a storyboard before the full render, and fix anything cluttered, overlapping or hard to read."

## Using a reference

Screenshot **one frame** of a video you like and attach it. Then say exactly what to take and what to leave:

> Take the palette, the type treatment and the film grain from this frame. Ignore the subject and the layout.

Without that sentence the model copies the subject. One reference frame plus a "take / leave" line is usually enough; several references dilute it.

## Structured prompt template (for serious pieces)

The highest-bookmarked prompts in the community galleries share this shape. Fill it in for the user, or use it as your own brief:

```
<inputs>
Ask me for: [product name + one-line promise], [3-5 moments to show], [one accent color],
[assets I own: clips, logo, font], [a royalty-free track ~120 BPM if sound is wanted].
</inputs>

<direction>
[Genre/level, e.g. "High-end minimal" or "Dribbble-level UI motion"]. One idea per shot,
one accent color, one clean sans with tight tracking. [Signature moves: masked type reveals,
match cuts, one camera language]. 
Banned: [bouncy easing, particles, glows, lens flares, gradients on UI chrome, corner text,
anything that looks like a template].
</direction>

<structure>
[BPM], [N bars], something happens on every beat.
Bar 1: [hook]. Bar 2: [turn]. ... Last: [lockup].
</structure>

<build>
1. One HTML file at [WxH]. Every style is computed from time inside seek(t): no CSS
   animations, no timers, no state between frames.
2. Springs are closed-form, so every value is a pure function of time.
3. Render with Playwright frame by frame, [N] sub-frames per frame blended for motion blur, 60 fps.
4. [If music] Analyze the track for the beat grid; cuts on downbeats, UI hits on beats.
5. Render one frame per beat before the full render. Fix anything off-grid, cramped or hard to read.
</build>

<gotchas>
No will-change on anything the camera scales (text goes blurry). Text that swaps inside a
morphing container needs its own enter/exit timing. For a loop, last frame == first frame.
Never set opacity or filter on a preserve-3d element; fade its wrapper.
</gotchas>

<start>
Ask me for the inputs, then show me the storyboard on the beat grid before writing any code.
</start>
```

## Real prompts from the gallery (one-shot results unless noted)

Short, genre-led:
- `make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.` (the most-bookmarked motion prompt of its wave)
- `make a dynamic 10-second motion graphics video that shows who are you as Opus 5.5 - be as creative and dynamic as possible. Avoid the frames and texts on the corners which are typical ai made giveaways!`
- `make a dynamic 15-second motion graphics video for AIsa. Go all out.`
- `make a modern slick and punchy video for a modern startup that works on inference`
- `high-end netflix style documentary about superintelligence for normies`
- `make a 1-min promo for this product from the codebase.` (run inside the product's repo, so the model can read the real UI and copy)
- `make me an animation to explain why celld earns its place.`
- `make a similar version but with a crypto reference` (iterating on a previous film: keep the craft, swap the subject)

Spec-led (when a specific look matters, specify the rendering constraints, not adjectives):
- A pixel-art wizard loop specified as: fixed 128x96 logical canvas scaled by an integer factor, a ~24-color palette, everything snapped to integer pixels, a pose state machine (idle → charge → cast → recover), allocation-free particles, "should look like a polished 16-bit sprite animation, not vector shapes scaled down".

Sources: the Prompt Motion gallery (prompt-motion.github.io, promptmotion.org) and the awesome-ai-motion collection (github.com/guanmo-ai/awesome-ai-motion). Prompts belong to their creators.
