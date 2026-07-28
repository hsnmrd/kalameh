# Design System

## Philosophy

Use a hand-drawn, sketchbook-like visual style for a mobile study app. The interface should feel like paper notes, flashcards, classroom stickers, marker sketches, sticky notes, and study worksheets rather than clinical digital precision.

## Core Principles

- No straight lines: every border, shape, and container should feel organic through irregular radii or sketch-like outlines.
- Authentic texture: use paper grain, dot patterns, and subtle background textures to simulate physical media.
- Playful rotation: use small rotations from `-2deg` to `2deg` to break rigid grid alignment.
- Hard offset shadows: avoid soft blur shadows. Use solid offset shadows for a cut-paper, layered collage aesthetic.
- Handwritten typography: prefer handwritten or marker-style fonts such as Kalam or Patrick Hand when available.
- Scribbled decoration: use dashed lines, hand-drawn arrows, tape effects, thumbtacks, and irregular shapes.
- Limited study palette: lean on pencil blacks, paper whites, post-it yellow, classroom green, soft progress blue, peach/pink review accents, gray tape, and small correction-marker red accents.
- Intentional messiness: use asymmetry and light overlap when it improves the sketched feel.

## Tokens

- Shared colors, shadows, radii, textures, and related design tokens belong in `packages/ui/src/styles/globals.css`.
- Dark theme must be handled with CSS variables. Do not use `dark:...` Tailwind variants in `className`.
- Use semantic tokens and variable-backed utilities so light and dark themes resolve from the same component markup.

## Typography

- Use large, readable type.
- Headings may vary dramatically in size to mimic emphasized notes.
- Prefer handwritten or marker-style typography, never sterile corporate type when a warmer option is available.
- Keep small text highly legible on narrow mobile screens. Decorative font choices must not make labels, progress text, or instructions hard to read.

## Mobile App Layout

- Design mobile-first. The primary viewport is a narrow phone screen around 390px wide.
- Use a single-column stack for primary screens.
- Use compact but breathable page padding, usually around `px-5` and vertical gaps around `gap-5` or `gap-6`.
- Keep content inside the viewport without horizontal overflow, even when cards have shadows, pins, tape, or rotations.
- Prefer focused sections over large landing-page bands. Avoid desktop-like hero sections inside app screens.
- Make primary actions large and thumb-friendly.
- Preserve readability over decorative messiness. Overlap is allowed only when it does not obscure text or controls.

## Radius And Borders

- Do not rely on standard `rounded-*` classes alone for prominent UI.
- Store reusable wobbly radius values as CSS variables/utilities, such as `wobbly` and `wobbly-md`.
- Use multi-value border radii for organic shapes, for example:

```css
border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
```

- Use `border-2` minimum.
- Use `border-[3px]` or `border-4` for emphasis.
- Use solid borders by default.
- Use dashed borders for secondary elements, dividers, and sketch overlays.

## Shadows And Effects

- Use hard offset shadows with no blur:

```css
box-shadow: 4px 4px 0 0 var(--sketch-ink);
box-shadow: 8px 8px 0 0 var(--sketch-ink);
box-shadow: 8px 10px 0 0 var(--sketch-ink);
```

- Hover states may reduce the offset to create a pressed or lifted paper effect.
- Mobile pressed states should reduce the shadow offset or translate the element by a few pixels.
- Body/page backgrounds may use a radial dot pattern:

```css
background-image: radial-gradient(var(--paper-dot) 1px, transparent 1px);
background-size: 24px 24px;
```

- Use gentle bounce, small rotations, and snappy transitions for decorative motion.
- Use `motion/react` for animated React elements.

## Layout

- Keep app content contained like a sketchbook page. For marketing or wide layouts, usually cap content around `max-w-5xl`.
- Use responsive grids such as `md:grid-cols-2` or `md:grid-cols-3`, then add visual irregularity.
- Use generous section padding for marketing pages, but keep app screens denser and task-focused.
- Break rigid alignment with small rotations, organic shapes, and occasional overlap.
- Decorative elements may sit outside parent bounds when it reinforces the sketch aesthetic.

## Study Card Pattern

Use reusable study/class cards for enrolled classes, practice modules, review sets, and similar study units.

- Card shell: off-white paper fill, thick ink border, wobbly radius, heavy right/bottom hard shadow.
- Decoration: one tape strip or pin may overlap the top edge. Keep it away from important text.
- Header: large handwritten title on the left, status pill on the right.
- Metadata: short subtitle below the title, such as session, term, or review status.
- Progress row: label on the left and bold handwritten percentage on the right.
- Progress bar: thick outlined capsule track with cream/paper fill and pastel inner fill.
- Primary action: large yellow full-width button with hard shadow and right arrow icon.
- Secondary actions: two pastel buttons, often peach/pink for weak words and blue for random tests.
- Avoid nesting cards inside cards. The card itself is the framed surface.

## Pills And Progress

- Status pills use organic capsule radii, thick borders, and pastel fills.
- Use green for active/enrolled/success states, gray or paper for finished/neutral states, and red only for small warning accents.
- Progress bars should feel hand-drawn: thick border, rounded/wobbly capsule shape, cream track, pastel fill.
- Percentages should be visually strong and handwritten.

## Visual Signatures

- Wobbly borders on containers, buttons, cards, and frames.
- Hand-drawn SVG decorations such as dashed arrows, squiggles, and corner frame marks.
- Tape strips on cards.
- Thumbtack dots for card decoration.
- Dashed circles around highlighted items.
- Speech-bubble tails on testimonial or note surfaces.
- Sticky-note tags.
- Wavy underlines for selected navigation/footer labels.
- Rough circles around key icons.
- Stationery-themed details: tape, pencil marks, notebook dots, pins, labels, stickers, alert-bell sketches, and flashcard-like surfaces.

Decorations should support the study/classroom theme. Do not add random doodles that do not relate to learning, review, classes, notes, stationery, or progress.

## Interaction

- Hover can use `hover:rotate-1` or `hover:-rotate-1`.
- Pressed buttons should flatten by reducing or removing the hard shadow.
- Cards may rotate slightly or increase shadow offset on hover.
- Keep transitions fast and tactile, typically `transition-transform duration-100`.

## Icons

- Use lucide icons.
- Prefer heavier strokes, usually `strokeWidth={2.5}` or `strokeWidth={3}`.
- Enclose key icons in rough outlined circles or organic shapes.
- Keep icon meaning simple and app-like: arrows for continue, heart/review marks for weak words, dice/cards for random tests, bell for reminders, pencil for tips.
