## Move mobile secondary CTA outside the hero bubble

In `src/pages/Index.tsx`, the mobile hero wraps everything in a single `bg-card` rounded bubble. The new "Conoce nuestro proyecto educativo" button currently lives inside that bubble, where its longer label wraps and visually mismatches the primary "Agenda un tour" button.

### Change

- Remove the secondary `<Button>` from inside the `bg-card` bubble (so the bubble ends right after the primary CTA, as before).
- Add the secondary CTA as a sibling **below** the bubble, inside the outer `lg:hidden` yellow wrapper, centered. Style:
  - `variant="outlineWarm"`, `size="xl"`, `rounded-full`
  - `w-full max-w-xs mx-auto mt-5` so it sits centered under the bubble at the same width as the primary CTA inside the bubble
  - Wrap in a `flex justify-center` so it stays centered on all mobile widths
- Keep `href="#sobre"`.

### Result

The bubble keeps its tight composition (badges → headline → subtitle → photo → primary CTA). The secondary action floats on the yellow background just below the bubble, matching the primary button's size and giving the eye a clear hierarchy.

No desktop changes — desktop layout already shows the two CTAs side by side and is fine.
