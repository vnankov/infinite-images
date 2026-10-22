import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CarouselImage } from "../types/carousel";
import InfiniteCarousel from "./InfiniteCarousel";

const box = { width: 800, height: 200 };

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }

  observe() {}

  unobserve() {}

  disconnect() {}

  trigger() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

const photo = (id: string, width = 200, height = 200): CarouselImage => ({
  id,
  width,
  height,
  alt: id,
  src: `https://example.test/${id}.jpg`,
});

const scrollerOf = (container: HTMLElement) =>
  container.querySelector(".carousel-scroller") as HTMLDivElement;

const slidesOf = (container: HTMLElement) =>
  [...container.querySelectorAll(".carousel-slide")] as HTMLElement[];

describe("InfiniteCarousel", () => {
  beforeEach(() => {
    ResizeObserverMock.instances = [];
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return box.width;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return box.height;
      },
    });
    box.width = 800;
    box.height = 200;
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const renderCarousel = (images: CarouselImage[], rangeStart = 0) => {
    const onViewportChange = vi.fn();
    const view = render(
      <InfiniteCarousel
        images={images}
        rangeStart={rangeStart}
        onViewportChange={onViewportChange}
        gap={12}
      />,
    );
    return { ...view, onViewportChange };
  };

  it("opens on image 1 when the loaded window starts before it", () => {
    const { container } = renderCarousel(
      [photo("minus-two"), photo("minus-one"), photo("one"), photo("two")],
      -2,
    );
    const labels = slidesOf(container).map((slide) => slide.textContent);

    expect(labels).toContain("1");
    expect(container.querySelector("img[alt='one']")).toBeTruthy();
    expect(slidesOf(container).length).toBeLessThanOrEqual(4);
  });

  it("keeps the same photos in view when the front of the window is dropped", () => {
    const images = [photo("one"), photo("two"), photo("three")];
    const { container, rerender, onViewportChange } = renderCarousel(images, 0);
    const scroller = scrollerOf(container);

    act(() => {
      scroller.scrollLeft = 212;
      fireEvent.scroll(scroller);
    });

    rerender(
      <InfiniteCarousel
        images={images.slice(1)}
        rangeStart={1}
        onViewportChange={onViewportChange}
        gap={12}
      />,
    );

    expect(scroller.scrollLeft).toBe(0);
    expect(container.querySelector("img[alt='one']")).toBeNull();
    expect(container.querySelector("img[alt='two']")).toBeTruthy();
  });

  it("mounts only the slides that fit the viewport and its overscan", () => {
    const images = Array.from({ length: 80 }, (_, index) => photo(`photo-${index}`, 400, 200));
    const { container } = renderCarousel(images);
    const mounted = container.querySelectorAll("img").length;

    expect(mounted).toBeGreaterThan(1);
    expect(mounted).toBeLessThan(images.length);
  });

  it("resizes slide widths when the track height changes", () => {
    const { container } = renderCarousel([photo("square", 200, 200)]);

    expect(slidesOf(container)[0]?.style.width).toBe("200px");

    box.height = 100;
    act(() => {
      ResizeObserverMock.instances[0]?.trigger();
    });

    expect(slidesOf(container)[0]?.style.width).toBe("100px");
  });

  it("replaces the mounted photos when the image collection changes", () => {
    const { container, rerender, onViewportChange } = renderCarousel([
      photo("one"),
      photo("two"),
    ]);

    expect(container.querySelector("img[alt='one']")).toBeTruthy();

    rerender(
      <InfiniteCarousel
        images={[photo("three")]}
        rangeStart={0}
        onViewportChange={onViewportChange}
        gap={12}
      />,
    );

    expect(container.querySelector("img[alt='one']")).toBeNull();
    expect(container.querySelector("img[alt='two']")).toBeNull();
    expect(container.querySelector("img[alt='three']")).toBeTruthy();
  });
});
