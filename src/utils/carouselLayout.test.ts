import { describe, expect, it } from "vitest";
import type { CarouselImage } from "../types/carousel";
import { getVisibleSlides, layoutSlides } from "./carouselLayout";

const photo = (id: string, width: number, height: number): CarouselImage => ({
  id,
  width,
  height,
  src: id,
});

describe("layoutSlides", () => {
  it("sizes each slide from its aspect ratio and includes the gap in the loop", () => {
    const layout = layoutSlides(
      [photo("wide", 200, 100), photo("tall", 100, 200)],
      100,
      12,
    );

    expect(layout.widths).toEqual([200, 50]);
    expect(layout.starts).toEqual([0, 212]);
    expect(layout.loopWidth).toBe(274);
  });

  it("keeps a minimum width when the track or the photo has no height", () => {
    const layout = layoutSlides([photo("flat", 0, 0)], 0, 8);

    expect(layout.widths).toEqual([1]);
    expect(layout.loopWidth).toBe(9);
  });
});

describe("getVisibleSlides", () => {
  it("returns nothing for an empty layout", () => {
    const layout = layoutSlides([], 100, 12);

    expect(getVisibleSlides(layout, 0, 800, 12)).toEqual([]);
  });

  it("covers the viewport and repeats the list when the window passes either end", () => {
    const layout = layoutSlides(
      [photo("a", 100, 100), photo("b", 100, 100)],
      100,
      0,
    );
    const slides = getVisibleSlides(layout, 150, 100, 0, 80, 80);
    const indexes = slides.map((slide) => slide.index);
    const lefts = slides.map((slide) => slide.left);

    expect(indexes).toContain(0);
    expect(indexes).toContain(1);
    expect(Math.min(...lefts)).toBeLessThan(150);
    expect(Math.max(...lefts)).toBeGreaterThanOrEqual(150);
    expect(slides.some((slide) => slide.left < 0 || slide.left >= layout.loopWidth)).toBe(
      true,
    );
  });

  it("covers a wide overscan even when each slide is only a pixel wide", () => {
    const layout = layoutSlides([photo("pixel", 1, 1)], 1, 0);
    const viewportWidth = 1000;
    const overscan = 5000;
    const slides = getVisibleSlides(layout, 0, viewportWidth, 0, overscan, overscan);
    const last = slides[slides.length - 1];
    const viewEnd = viewportWidth + overscan;

    expect(slides.length).toBeGreaterThan(38);
    expect(last.left + last.width).toBeGreaterThanOrEqual(viewEnd);
    expect(new Set(slides.map((slide) => slide.key)).size).toBe(slides.length);
  });

  it("stops instead of looping when a slide does not advance", () => {
    const layout = layoutSlides([photo("pixel", 1, 1)], 1, -5);

    expect(getVisibleSlides(layout, 0, 100, -5, 0, 0)).toEqual([]);
  });
});
