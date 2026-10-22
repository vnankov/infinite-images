# Infinite image carousel

A React + TypeScript carousel that loops in both directions. Navigation is **scroll only** (touch, trackpad, or mouse wheel). There are no arrows or buttons.

It is built to handle mixed image sizes, desktop and mobile viewports, and large lists (dozens or 1000+ photos) by virtualizing slides and prefetching images ahead of the viewport.

Demo images come from the [Picsum list API](https://picsum.photos/). The app loads 1,000 photos. Retina requests are capped at 2× so a 3× display does not download a 3× file.

## Stack

- React 19
- TypeScript
- Vite
- Vitest and React Testing Library

## Project structure

```text
carousel_react/
├── index.html                 # App shell
├── package.json
├── vite.config.ts
├── vitest.config.ts           # jsdom test runner
└── src/
    ├── main.tsx               # React mount
    ├── App.tsx                # Loads 1,000 Picsum photos and renders the carousel
    ├── index.css              # Global layout
    ├── api/
    │   └── picsum.ts          # Fetch helper (not part of the carousel itself)
    ├── components/
    │   ├── InfiniteCarousel.tsx   # Reusable scroll-loop carousel
    │   ├── InfiniteCarousel.css   # Strip height: min(70vh, 560px)
    │   ├── InfiniteCarousel.test.tsx
    │   ├── CarouselSlide.tsx      # One image slide, with load retry
    │   └── CarouselSlide.test.tsx
    ├── hooks/
    │   └── useElementSize.ts  # ResizeObserver for viewport size
    ├── types/
    │   └── carousel.ts        # CarouselImage type
    └── utils/
        ├── carouselLayout.ts      # Widths, prefix sums, visible-window math
        ├── carouselLayout.test.ts
        ├── wrapScroll.ts          # Jump the scroll position between loop copies
        ├── wrapScroll.test.ts
        ├── preloadImages.ts       # Prefetch URLs before slides enter view
        └── resolveImageSrc.ts
```

**Data flow:** `App` fetches photos → passes `{ id, width, height, src, alt }` into `InfiniteCarousel` → layout utils size each slide from aspect ratio × track height → the list is repeated so both directions have room to scroll → only slides inside the viewport plus overscan are mounted → extra URLs are preloaded in the scroll direction.

`InfiniteCarousel` does not depend on Picsum. Any source that provides intrinsic width/height and a `src` works. `src` may be a URL or a function of the displayed width and height.

## How scrolling stays infinite

The track holds several copies of the same list, at least three, so the view can sit in a middle copy. `wrapScroll` moves `scrollLeft` by whole loops when it gets within one loop of either end. The photos on screen do not change.

`getVisibleSlides` walks slide by slide until the viewport and its overscan are covered. A slide that does not advance (width plus gap of zero or less) stops the walk. Copies of the same photo get distinct keys.

Slides are mounted at least 8 viewports past each edge, and never less than 4,000px. Prefetch looks 16 viewports ahead (at least 8,000px) and 4 viewports behind (at least 2,000px). The larger distance follows the current scroll direction.

## Image loading

A failed image is hidden and requested again. Each failure waits twice as long as the last: 1s, 2s, 4s, then 8s. After those four retries the slide stays hidden, so a blocked URL is not requested forever. Coming back online retries immediately until that limit. A new `src` clears the failure and shows the replacement. A successful load shows the image again.

## Setup after cloning

You need **Node.js** (18 or newer) and **npm**.

```bash
git clone <repository-url>
cd carousel_react
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Open it in the browser and scroll the strip.

### Other scripts

```bash
npm test          # Run the unit and component tests
npm run build     # Typecheck and production build
npm run preview   # Serve the production build locally
```

## Reusing the carousel

```tsx
import InfiniteCarousel from "./components/InfiniteCarousel";
import type { CarouselImage } from "./types/carousel";

<InfiniteCarousel
  images={images}
  height="min(70vh, 560px)"
  gap={12}
/>
```

`height` is CSS (for example `"240px"` for a compact strip). Slide widths follow each photo’s aspect ratio at that height. The carousel fills the width of its parent.
