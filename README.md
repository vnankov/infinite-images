# Infinite image carousel

A React + TypeScript carousel that scrolls in both directions. Navigation is **scroll only** (touch, trackpad, or mouse wheel). There are no arrows or buttons.

The index is unbounded. Only a sliding window of images is kept in memory, and only the slides near the viewport are mounted. At rest that window is **2,000** images (one batch behind the viewport and one ahead). After you leave a batch behind, it is dropped and memory goes back to **1,000** until the next batch is fetched.

Demo images come from the [Picsum list API](https://picsum.photos/). That API is one document of about 1,000 photos. Later indexes reuse those photos, so the carousel can keep scrolling without holding every page.

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
    ├── App.tsx                # Batch size, fetch point, and the carousel
    ├── index.css              # Global layout
    ├── api/
    │   └── picsum.ts          # Loads the Picsum catalog and builds an index range
    ├── components/
    │   ├── InfiniteCarousel.tsx   # Scrollable strip, virtualized slides, scroll anchoring
    │   ├── InfiniteCarousel.css
    │   └── CarouselSlide.tsx      # One image slide
    ├── hooks/
    │   ├── useSlidingWindow.ts    # Fetches the next batch and drops the one left behind
    │   └── useElementSize.ts      # ResizeObserver for viewport size
    ├── types/
    │   └── carousel.ts            # CarouselImage type
    └── utils/
        ├── carouselLayout.ts      # Widths, prefix sums, visible-window math
        ├── preloadImages.ts       # Prefetch URLs before slides enter view
        └── resolveImageSrc.ts
```

**Data flow:** `App` sets `BATCH_SIZE` (1000) and `FETCH_AT` (800) → `useSlidingWindow` asks `fetchImageRange` for a range of absolute indexes → `InfiniteCarousel` reports the leftmost and rightmost visible indexes → when the viewport reaches the 800th image of the current batch, the next 1,000 are appended → once the old batch is 200 images behind the viewport, it is removed. Scroll position is shifted by the width of the images that were added or removed, so the photo on screen stays put.

The first window is indexes **-1000 through 999**. The view opens on **image 1**, which leaves a batch to the left, so scrolling left continues through **0**, **-1**, and further.

`InfiniteCarousel` does not depend on Picsum. Any `loadRange(start, count)` that returns `{ id, width, height, src, alt }` works. `src` may be a URL or a function of the displayed width and height.

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
npm run build     # Typecheck and production build
npm run preview   # Serve the production build locally
```

## Reusing the carousel

```tsx
import { fetchImageRange } from "./api/picsum";
import InfiniteCarousel from "./components/InfiniteCarousel";
import { useSlidingWindow } from "./hooks/useSlidingWindow";

const BATCH_SIZE = 1000;
const FETCH_AT = 800;

const { images, rangeStart, ready, error, onViewportChange } = useSlidingWindow(
  fetchImageRange,
  BATCH_SIZE,
  FETCH_AT,
);

<InfiniteCarousel
  images={images}
  rangeStart={rangeStart}
  onViewportChange={onViewportChange}
  height="min(70vh, 560px)"
  gap={12}
/>
```

`height` is CSS (for example `"240px"` for a compact strip). Slide widths follow each photo’s aspect ratio at that height. The carousel fills the width of its parent. The corner label shows the visible index and how many images are currently in memory.
