import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import CarouselSlide from "./CarouselSlide";
import { getVisibleSlides, layoutSlides } from "../utils/carouselLayout";
import { preloadImages } from "../utils/preloadImages";
import { resolveImageSrc } from "../utils/resolveImageSrc";
import { useElementSize } from "../hooks/useElementSize";
import type { CarouselImage } from "../types/carousel";
import "./InfiniteCarousel.css";

export type { CarouselImage };

export type InfiniteCarouselProps = {
  images: CarouselImage[];
  rangeStart: number;
  onViewportChange: (minIndex: number, maxIndex: number) => void;
  height?: string;
  gap?: number;
  className?: string;
};

const InfiniteCarousel = ({
  images,
  rangeStart,
  onViewportChange,
  height,
  gap = 12,
  className,
}: InfiniteCarouselProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const placedRef = useRef(false);
  const prevStartRef = useRef(rangeStart);
  const prevImagesRef = useRef(images);
  const prevLoopRef = useRef(0);
  const latestScrollRef = useRef(0);
  const ignoreScrollRef = useRef(false);
  const onViewportChangeRef = useRef(onViewportChange);
  if (rangeStart !== prevStartRef.current) ignoreScrollRef.current = true;
  const { width: viewportWidth, height: trackHeight } = useElementSize(scrollerRef);
  const [scrollLeft, setScrollLeft] = useState(0);

  onViewportChangeRef.current = onViewportChange;

  const layout = useMemo(
    () => layoutSlides(images, trackHeight, gap),
    [images, trackHeight, gap],
  );

  const contentWidth = layout.loopWidth;
  const renderOverscan = Math.max(viewportWidth * 8, 4000);
  const prefetchAhead = Math.max(viewportWidth * 16, 8000);
  const prefetchBehind = Math.max(viewportWidth * 4, 2000);
  const lastScrollRef = useRef(0);

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element || images.length === 0 || layout.loopWidth <= 0 || viewportWidth <= 0) {
      ignoreScrollRef.current = false;
      return;
    }
    if (trackHeight <= 0) {
      ignoreScrollRef.current = false;
      return;
    }

    const previousStart = prevStartRef.current;
    const previousImages = prevImagesRef.current;
    const delta = rangeStart - previousStart;
    // Shrinking the track clamps scrollLeft before this effect runs. The React
    // state and the ref still hold the position from before that clamp.
    const baseScroll = Math.max(scrollLeft, latestScrollRef.current);
    let nextScroll = element.scrollLeft;

    if (!placedRef.current) {
      const originLocal = Math.min(images.length - 1, Math.max(0, -rangeStart));
      nextScroll = layout.starts[originLocal] ?? 0;
      placedRef.current = true;
    } else if (delta > 0) {
      const removedWidth = layoutSlides(
        previousImages.slice(0, delta),
        trackHeight,
        gap,
      ).loopWidth;
      nextScroll = Math.max(0, baseScroll - removedWidth);
    } else if (delta < 0) {
      const addedWidth = layoutSlides(images.slice(0, -delta), trackHeight, gap).loopWidth;
      nextScroll = baseScroll + addedWidth;
    } else if (
      previousImages.length === images.length &&
      prevLoopRef.current > 0 &&
      prevLoopRef.current !== layout.loopWidth
    ) {
      nextScroll = baseScroll * (layout.loopWidth / prevLoopRef.current);
    }

    const maxScroll = Math.max(0, layout.loopWidth - viewportWidth);
    nextScroll = Math.min(Math.max(0, nextScroll), maxScroll);
    if (element.scrollLeft !== nextScroll) element.scrollLeft = nextScroll;
    latestScrollRef.current = element.scrollLeft;
    ignoreScrollRef.current = false;

    prevStartRef.current = rangeStart;
    prevImagesRef.current = images;
    prevLoopRef.current = layout.loopWidth;

    if (element.scrollLeft !== scrollLeft) setScrollLeft(element.scrollLeft);

    const visible = getVisibleSlides(layout, element.scrollLeft, viewportWidth, 0, 0);
    if (visible.length > 0) {
      onViewportChangeRef.current(
        rangeStart + visible[0].index,
        rangeStart + visible[visible.length - 1].index,
      );
    }
  }, [gap, images, layout, rangeStart, scrollLeft, trackHeight, viewportWidth]);

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    let frame = 0;
    const onScroll = () => {
      if (ignoreScrollRef.current) return;
      latestScrollRef.current = element.scrollLeft;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrollLeft(element.scrollLeft);
      });
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const scrollingRight = scrollLeft >= lastScrollRef.current;
  lastScrollRef.current = scrollLeft;

  const slides = useMemo(
    () =>
      getVisibleSlides(
        layout,
        scrollLeft,
        viewportWidth,
        renderOverscan,
        renderOverscan,
      ),
    [layout, scrollLeft, viewportWidth, renderOverscan],
  );

  const inView = useMemo(
    () => getVisibleSlides(layout, scrollLeft, viewportWidth, 0, 0),
    [layout, scrollLeft, viewportWidth],
  );

  useEffect(() => {
    if (trackHeight <= 0 || images.length === 0) return;

    const before = scrollingRight ? prefetchBehind : prefetchAhead;
    const after = scrollingRight ? prefetchAhead : prefetchBehind;
    const upcoming = getVisibleSlides(
      layout,
      scrollLeft,
      viewportWidth,
      before,
      after,
    );

    preloadImages(
      upcoming.map((slide) =>
        resolveImageSrc(images[slide.index], slide.width, trackHeight),
      ),
    );
  }, [
    images,
    layout,
    scrollLeft,
    viewportWidth,
    trackHeight,
    scrollingRight,
    prefetchAhead,
    prefetchBehind,
  ]);

  const heightStyle = height ? { height } : undefined;
  const firstLabel = inView.length > 0 ? rangeStart + inView[0].index + 1 : rangeStart + 1;
  const lastLabel =
    inView.length > 0
      ? rangeStart + inView[inView.length - 1].index + 1
      : firstLabel;

  return (
    <div
      className={["carousel", className].filter(Boolean).join(" ")}
      style={heightStyle}
    >
      <p className="carousel-meta">
        {firstLabel === lastLabel
          ? firstLabel.toLocaleString()
          : `${firstLabel.toLocaleString()}–${lastLabel.toLocaleString()}`}
        {" · "}
        {images.length.toLocaleString()} in memory
      </p>
      <div
        ref={scrollerRef}
        className="carousel-scroller"
        style={heightStyle}
        tabIndex={0}
        role="region"
        aria-label="Image carousel"
      >
        <div className="carousel-track" style={{ width: contentWidth }}>
          {images.length > 0 &&
            trackHeight > 0 &&
            slides.map((slide) => {
              const image = images[slide.index];
              return (
                <CarouselSlide
                  key={image.id}
                  image={image}
                  width={slide.width}
                  height={trackHeight}
                  left={slide.left}
                  indexLabel={rangeStart + slide.index + 1}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default InfiniteCarousel;
