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

    expect(getVisibleSlides(layout, 0, 800)).toEqual([]);
  });

  it("returns every loaded slide that intersects the viewport", () => {
    const layout = layoutSlides(
      [photo("a", 100, 100), photo("b", 100, 100)],
      100,
      0,
    );
    const slides = getVisibleSlides(layout, 50, 100, 0, 0);
    const indexes = slides.map((slide) => slide.index);

    expect(indexes).toEqual([0, 1]);
    expect(slides.every((slide) => slide.left >= 0 && slide.left < layout.loopWidth)).toBe(
      true,
    );
  });

  it("mounts the loaded window across a wide overscan without repeating it", () => {
    const images = Array.from({ length: 80 }, (_, index) => photo(String(index), 1, 1));
    const layout = layoutSlides(images, 1, 0);
    const slides = getVisibleSlides(layout, 0, 20, 0, 10);
    const last = slides[slides.length - 1];

    expect(slides.map((slide) => slide.index)).toEqual(
      Array.from({ length: 30 }, (_, index) => index),
    );
    expect(last.left + last.width).toBe(30);
    expect(new Set(slides.map((slide) => slide.key)).size).toBe(slides.length);
  });

  it("stops at the end of the loaded list", () => {
    const layout = layoutSlides([photo("only", 100, 100)], 100, 0);

    expect(getVisibleSlides(layout, 0, 1000, 0, 0)).toHaveLength(1);
  });
});
