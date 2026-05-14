## Hero revisions

Update both the mobile and desktop hero in `src/pages/Index.tsx` to match the new copy structure. Headline and badges stay the same; we add a subtitle and a secondary CTA, and tighten the desktop CTAs.

### Copy

- **Title** (unchanged): *Sembrando excelencia en el corazón de la familia puertorriqueña.*
- **Subtitle** (new): *Educación personalizada con formación humana y espíritu cristiano, donde cada niño es tratado como un ser único e irrepetible.*
- **Badges** (unchanged): `Maternal · Preescolar · PreKínder` and `Cupey, cerca de Los Paseos` (fix the existing "PreKinder" → "PreKínder" and the stray "•" so both badges read consistently with `·`).
- **Primary CTA**: *Agenda un tour* → `#contacto`
- **Secondary CTA** (new): *Conoce nuestro proyecto educativo* → `#sobre`

### Mobile card (lines ~261–303)

- Insert a subtitle `<p>` between the `<h1>` and the photo block, styled `text-base text-ink/80 leading-relaxed`.
- Below the existing primary "Agenda un tour" button, add a secondary button using `variant="outlineWarm"` (or `outline`) linking to `#sobre` with the same `rounded-full w-full max-w-xs` width so the two CTAs stack cleanly.

### Desktop hero (lines ~306–323)

- Add the subtitle `<p>` between the `<h1>` and the CTA row: `text-lg lg:text-xl text-white/90 max-w-xl mb-8 leading-relaxed`.
- Replace the current second button (Calendly "Agenda una cita") with *Conoce nuestro proyecto educativo* → `#sobre`, keeping `variant="outlineWarm" size="xl"`.
- Normalize the badge separator from `•` to `·` and `PreKinder` → `PreKínder`.

### Notes

- Subtitles use the existing `Sora` body font (no inline font override) so they contrast with the `ChildsPlayground` headline.
- No new components or assets; pure presentation edits inside `Index.tsx`.
- Verify after changes by previewing at desktop (≥1280px) and mobile (≤640px) widths to confirm wrapping and CTA stacking.
