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

  it("starts in the middle of the repeated track so both directions have room", () => {
    const { container } = render(
      <InfiniteCarousel images={[photo("one"), photo("two")]} gap={12} />,
    );
    const scroller = scrollerOf(container);
    const trackWidth = Number.parseFloat(
      (container.querySelector(".carousel-track") as HTMLElement).style.width,
    );

    expect(slidesOf(container).length).toBeGreaterThan(2);
    expect(scroller.scrollLeft).toBeGreaterThan(0);
    expect(scroller.scrollLeft).toBeLessThan(trackWidth);
  });

  it("wraps forward and backward while keeping the same photos on screen", () => {
    const { container } = render(
      <InfiniteCarousel images={[photo("one"), photo("two")]} gap={12} />,
    );
    const scroller = scrollerOf(container);
    let scrollLeft = scroller.scrollLeft;
    const parked = scrollLeft;
    Object.defineProperty(scroller, "scrollLeft", {
      configurable: true,
      get: () => scrollLeft,
      set: (value: number) => {
        scrollLeft = value;
      },
    });
    const trackWidth = Number.parseFloat(
      (container.querySelector(".carousel-track") as HTMLElement).style.width,
    );

    act(() => {
      scroller.scrollLeft = 0;
      fireEvent.scroll(scroller);
    });

    expect(scroller.scrollLeft).toBeGreaterThan(parked / 2);
    expect(container.querySelector("img[alt='one']")).toBeTruthy();
    expect(container.querySelector("img[alt='two']")).toBeTruthy();

    act(() => {
      scroller.scrollLeft = trackWidth;
      fireEvent.scroll(scroller);
    });

    expect(scroller.scrollLeft).toBeLessThan(trackWidth);
    expect(container.querySelectorAll("img").length).toBeGreaterThan(2);
  });

  it("fills a wide viewport when the photos are very narrow", () => {
    box.width = 1000;
    box.height = 10;
    const { container } = render(
      <InfiniteCarousel images={[photo("pixel", 1, 1)]} gap={0} />,
    );

    expect(container.querySelectorAll("img").length).toBeGreaterThan(38);
  });

  it("resizes slide widths when the track height changes", () => {
    const { container } = render(
      <InfiniteCarousel images={[photo("square", 200, 200)]} gap={0} />,
    );

    expect(slidesOf(container)[0]?.style.width).toBe("200px");

    box.height = 100;
    act(() => {
      ResizeObserverMock.instances[0]?.trigger();
    });

    expect(slidesOf(container)[0]?.style.width).toBe("100px");
  });

  it("replaces the mounted photos when the image collection changes", () => {
    const { container, rerender } = render(
      <InfiniteCarousel images={[photo("one"), photo("two")]} gap={12} />,
    );

    expect(container.querySelector("img[alt='one']")).toBeTruthy();

    rerender(<InfiniteCarousel images={[photo("three")]} gap={12} />);

    expect(container.querySelector("img[alt='one']")).toBeNull();
    expect(container.querySelector("img[alt='two']")).toBeNull();
    expect(container.querySelector("img[alt='three']")).toBeTruthy();
  });
});
