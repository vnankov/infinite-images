# Infinite image carousel

A React + TypeScript carousel that loops in both directions. Navigation is **scroll only** (touch, trackpad, or mouse wheel). There are no arrows or buttons.

It is built to handle mixed image sizes, desktop and mobile viewports, and large lists (dozens or 1000+ photos) by virtualizing slides and prefetching images ahead of the viewport.

Demo images come from the [Picsum list API](https://picsum.photos/).

## Stack

- React 19
- TypeScript
- Vite

## Project structure

```text
carousel_react/
├── index.html                 # App shell
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx               # React mount
    ├── App.tsx                # Loads Picsum photos and renders the carousel
    ├── index.css              # Global layout
    ├── api/
    │   └── picsum.ts          # Fetch helper (not part of the carousel itself)
    ├── components/
    │   ├── InfiniteCarousel.tsx   # Reusable scroll-loop carousel
    │   ├── InfiniteCarousel.css
    │   └── CarouselSlide.tsx      # One image slide
    ├── hooks/
    │   └── useElementSize.ts  # ResizeObserver for viewport size
    ├── types/
    │   └── carousel.ts        # CarouselImage type
    └── utils/
        ├── carouselLayout.ts  # Widths, prefix sums, visible-window math
        ├── preloadImages.ts   # Prefetch URLs before slides enter view
        └── resolveImageSrc.ts
```

**Data flow:** `App` fetches photos → passes `{ id, width, height, src, alt }` into `InfiniteCarousel` → layout utils size each slide from aspect ratio × track height → only nearby slides are mounted → extra URLs are preloaded in the scroll direction.

`InfiniteCarousel` does not depend on Picsum. Any source that provides intrinsic width/height and a `src` works.

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
