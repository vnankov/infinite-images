import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import CarouselSlide from "./CarouselSlide";
import { getVisibleSlides, layoutSlides } from "../utils/carouselLayout";
import { wrapScroll } from "../utils/wrapScroll";
import { preloadImages } from "../utils/preloadImages";
import { resolveImageSrc } from "../utils/resolveImageSrc";
import { useElementSize } from "../hooks/useElementSize";
import type { CarouselImage } from "../types/carousel";
import "./InfiniteCarousel.css";

export type { CarouselImage };

export type InfiniteCarouselProps = {
  images: CarouselImage[];
  height?: string;
  gap?: number;
  className?: string;
};

const InfiniteCarousel = ({
  images,
  height,
  gap = 12,
  className,
}: InfiniteCarouselProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const placedRef = useRef(false);
  const loopWidthRef = useRef(0);
  const imagesRef = useRef(images);
  const { width: viewportWidth, height: trackHeight } =
    useElementSize(scrollerRef);
  const [scrollLeft, setScrollLeft] = useState(0);

  if (imagesRef.current !== images) {
    imagesRef.current = images;
    placedRef.current = false;
  }

  const layout = useMemo(
    () => layoutSlides(images, trackHeight, gap),
    [images, trackHeight, gap],
  );

  const copies = useMemo(() => {
    if (layout.loopWidth <= 0 || viewportWidth <= 0) return 3;
    return Math.max(
      3,
      Math.ceil((viewportWidth * 2 + layout.loopWidth) / layout.loopWidth) + 2,
    );
  }, [layout.loopWidth, viewportWidth]);

  const lastScrollRef = useRef(0);
  const contentWidth = layout.loopWidth * copies;
  const origin = layout.loopWidth * Math.floor(copies / 2);
  const renderOverscan = Math.max(viewportWidth * 8, 4000);
  const prefetchAhead = Math.max(viewportWidth * 16, 8000);
  const prefetchBehind = Math.max(viewportWidth * 4, 2000);

  const metricsRef = useRef({
    loopWidth: layout.loopWidth,
    contentWidth,
    viewportWidth,
    origin,
  });
  metricsRef.current = {
    loopWidth: layout.loopWidth,
    contentWidth,
    viewportWidth,
    origin,
  };

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element || layout.loopWidth <= 0 || viewportWidth <= 0) return;

    const previousLoop = loopWidthRef.current;
    if (!placedRef.current) {
      element.scrollLeft = origin;
      placedRef.current = true;
    } else if (previousLoop > 0) {
      const offset =
        ((element.scrollLeft % previousLoop) + previousLoop) % previousLoop;
      element.scrollLeft = origin + offset * (layout.loopWidth / previousLoop);
    } else {
      element.scrollLeft = origin;
    }

    loopWidthRef.current = layout.loopWidth;
    wrapScroll(element, layout.loopWidth, contentWidth, viewportWidth, origin);
    setScrollLeft(element.scrollLeft);
  }, [origin, layout.loopWidth, contentWidth, viewportWidth, images]);

  useLayoutEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    let frame = 0;
    const onScroll = () => {
      const metrics = metricsRef.current;
      wrapScroll(
        element,
        metrics.loopWidth,
        metrics.contentWidth,
        metrics.viewportWidth,
        metrics.origin,
      );
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
        gap,
        renderOverscan,
        renderOverscan,
      ),
    [layout, scrollLeft, viewportWidth, gap, renderOverscan],
  );

  useEffect(() => {
    if (trackHeight <= 0 || images.length === 0) return;

    const before = scrollingRight ? prefetchBehind : prefetchAhead;
    const after = scrollingRight ? prefetchAhead : prefetchBehind;
    const upcoming = getVisibleSlides(
      layout,
      scrollLeft,
      viewportWidth,
      gap,
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
    gap,
    scrollingRight,
    prefetchAhead,
    prefetchBehind,
  ]);

  const heightStyle = height ? { height } : undefined;

  return (
    <div
      className={["carousel", className].filter(Boolean).join(" ")}
      style={heightStyle}
    >
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
                  key={slide.key}
                  image={image}
                  width={slide.width}
                  height={trackHeight}
                  left={slide.left}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default InfiniteCarousel;
