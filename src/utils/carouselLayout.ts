import type { CarouselImage } from "../types/carousel";

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
    const ratio = image.width / Math.max(image.height, 1);
    return Math.max(1, ratio * height);
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
  overscanBefore = 600,
  overscanAfter = overscanBefore,
): VisibleSlide[] => {
  const { widths, starts, loopWidth } = layout;
  if (widths.length === 0 || loopWidth <= 0) return [];

  const viewStart = scrollLeft - overscanBefore;
  const viewEnd = scrollLeft + viewportWidth + overscanAfter;
  if (viewEnd <= 0 || viewStart >= loopWidth) return [];

  let index = findSlideIndex(
    starts,
    Math.min(Math.max(viewStart, 0), starts[starts.length - 1]),
  );
  const slides: VisibleSlide[] = [];

  for (; index < widths.length; index += 1) {
    const left = starts[index];
    const width = widths[index];
    if (left >= viewEnd) break;
    if (left + width <= viewStart) continue;
    slides.push({
      key: String(index),
      index,
      left,
      width,
    });
  }

  return slides;
};
