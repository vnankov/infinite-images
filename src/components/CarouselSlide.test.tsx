import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CarouselImage } from "../types/carousel";
import CarouselSlide from "./CarouselSlide";

const photo = (src: string): CarouselImage => ({
  id: src,
  width: 400,
  height: 300,
  alt: "Photo",
  src,
});

const renderSlide = (src: string) => {
  const view = render(
    <CarouselSlide image={photo(src)} width={200} height={150} left={12} />,
  );
  const img = () => view.container.querySelector("img") as HTMLImageElement;
  return { ...view, img };
};

afterEach(() => {
  cleanup();
});

describe("CarouselSlide", () => {
  it("hides the image when the initial load fails", () => {
    const { img } = renderSlide("https://example.test/broken.jpg");

    fireEvent.error(img());

    expect(img().style.visibility).toBe("hidden");
  });

  it("shows a replacement source after the previous one failed", () => {
    const { img, rerender } = renderSlide("https://example.test/broken.jpg");
    fireEvent.error(img());

    rerender(
      <CarouselSlide
        image={photo("https://example.test/ok.jpg")}
        width={200}
        height={150}
        left={12}
      />,
    );

    expect(img().getAttribute("src")).toBe("https://example.test/ok.jpg");
    expect(img().style.visibility).toBe("");

    fireEvent.load(img());

    expect(img().style.visibility).toBe("");
  });

  it("stays hidden when the same source fails again", () => {
    const { img } = renderSlide("https://example.test/broken.jpg");

    fireEvent.error(img());
    fireEvent.error(img());

    expect(img().style.visibility).toBe("hidden");
  });

  it("keeps the image visible after a successful load", () => {
    const { img } = renderSlide("https://example.test/ok.jpg");

    fireEvent.load(img());

    expect(img().getAttribute("src")).toBe("https://example.test/ok.jpg");
    expect(img().style.visibility).toBe("");
  });

  it("restores visibility when a failed image later loads", () => {
    const { img } = renderSlide("https://example.test/retry.jpg");

    fireEvent.error(img());
    expect(img().style.visibility).toBe("hidden");

    fireEvent.load(img());

    expect(img().style.visibility).toBe("");
  });

  it("stops requesting a source after four failed retries", async () => {
    vi.useFakeTimers();
    try {
      const { img } = renderSlide("https://example.test/blocked.jpg");
      const waits = [1000, 2000, 4000, 8000];

      for (const wait of waits) {
        fireEvent.error(img());
        await act(async () => {
          await vi.advanceTimersByTimeAsync(wait);
        });
      }

      const lastRequest = img();
      fireEvent.error(lastRequest);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      window.dispatchEvent(new Event("online"));

      expect(img()).toBe(lastRequest);
      expect(img().style.visibility).toBe("hidden");
    } finally {
      vi.useRealTimers();
    }
  });

  it("refetches a failed image and shows it when the next load succeeds", async () => {
    vi.useFakeTimers();
    try {
      const { img } = renderSlide("https://example.test/blocked.jpg");
      fireEvent.error(img());
      expect(img().style.visibility).toBe("hidden");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(img().getAttribute("src")).toBe("https://example.test/blocked.jpg");
      expect(img().style.visibility).toBe("hidden");

      fireEvent.load(img());

      expect(img().style.visibility).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });
});
