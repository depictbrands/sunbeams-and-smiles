## Problem
The first video card in the Performances grid shows a black block on 14" MacBooks because:
- The `<video>` uses `preload="metadata"`, so the first frame isn't cached and the black `bg-ink` parent shows through while autoplay spins up.
- Narrower column widths at ~14" make the gap more visible.

## Fix (2-line change)

**File: `src/components/Performances.tsx`**

1. **Change `bg-ink` → `bg-card`** on the card wrapper:
   ```
   className="group relative rounded-3xl overflow-hidden shadow-playful bg-card"
   ```
   This replaces the near-black fallback with the warm cream card color.

2. **Change `preload="metadata"` → `preload="auto"`** on each `<video>` element.
   This tells the browser to buffer enough of the file so the first frame paints immediately.

No new assets or layout changes needed. The black block disappears because the background is no longer black and the video starts painting sooner.

## Verify
After the change, preview the site at a ~1280–1400px width (14" MacBook range). The first card should show the video frame immediately instead of a black rectangle.
