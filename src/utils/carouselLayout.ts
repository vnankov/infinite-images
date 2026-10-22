import type { CarouselImage } from "../types/carousel";

/** Avoid a zero or negative slide size when the photo or the track has no height. */
const MIN_EDGE_PX = 1;
/** Fallback distance, in pixels, to mount slides outside the viewport. */
const DEFAULT_OVERSCAN_PX = 600;

export type SlideLayout = {
  widths: number[];
  starts: number[];
  loopWidth: number;
};

export const layoutSlides = (
  images: CarouselImage[],
  height: number,
  gap: number,
): SlideLayout => {
  const widths = images.map((image) => {
    const ratio = image.width / Math.max(image.height, MIN_EDGE_PX);
    return Math.max(MIN_EDGE_PX, ratio * height);
  });

  const starts: number[] = [];
  let x = 0;
  for (const width of widths) {
    starts.push(x);
    x += width + gap;
  }

  return { widths, starts, loopWidth: x };
};

const findSlideIndex = (starts: number[], offset: number) => {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= offset) low = mid + 1;
    else high = mid - 1;
  }
  return Math.max(0, high);
};

export type VisibleSlide = {
  key: string;
  index: number;
  left: number;
  width: number;
};

export const getVisibleSlides = (
  layout: SlideLayout,
  scrollLeft: number,
  viewportWidth: number,
  gap: number,
  overscanBefore = DEFAULT_OVERSCAN_PX,
  overscanAfter = overscanBefore,
): VisibleSlide[] => {
  const { widths, starts, loopWidth } = layout;
  if (widths.length === 0 || loopWidth <= 0) return [];

  const viewStart = scrollLeft - overscanBefore;
  const viewEnd = scrollLeft + viewportWidth + overscanAfter;
  const offset = ((viewStart % loopWidth) + loopWidth) % loopWidth;
  let index = findSlideIndex(starts, offset);
  let worldX = viewStart - (offset - starts[index]);

  const slides: VisibleSlide[] = [];
  const seen = new Map<number, number>();

  while (worldX < viewEnd) {
    const stride = widths[index] + gap;
    if (stride <= 0) break;

    const occurrence = (seen.get(index) ?? 0) + 1;
    seen.set(index, occurrence);
    slides.push({
      key: `${index}:${occurrence}`,
      index,
      left: worldX,
      width: widths[index],
    });
    worldX += stride;
    index = (index + 1) % widths.length;
  }

  return slides;
};
