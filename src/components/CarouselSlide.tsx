import { memo, useEffect, useMemo, useState } from "react";
import type { CarouselImage } from "../types/carousel";
import { resolveImageSrc } from "../utils/resolveImageSrc";

const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 8000;
/** Each failed attempt waits twice as long, up to three doublings (1s, 2s, 4s, 8s). */
const RETRY_BACKOFF_FACTOR = 2;
const MAX_BACKOFF_DOUBLINGS = 3;

type CarouselSlideProps = {
  image: CarouselImage;
  width: number;
  height: number;
  left: number;
};

const CarouselSlide = ({ image, width, height, left }: CarouselSlideProps) => {
  const src = useMemo(
    () => resolveImageSrc(image, width, height),
    [image, width, height],
  );
  const [attempt, setAttempt] = useState(0);
  const [failedAttempt, setFailedAttempt] = useState<number | null>(null);
  const [attemptSrc, setAttemptSrc] = useState(src);
  if (attemptSrc !== src) {
    setAttemptSrc(src);
    setAttempt(0);
    setFailedAttempt(null);
  }

  useEffect(() => {
    if (failedAttempt === null || failedAttempt !== attempt) return;

    const delay = Math.min(
      RETRY_MAX_MS,
      RETRY_BASE_MS * RETRY_BACKOFF_FACTOR ** Math.min(attempt, MAX_BACKOFF_DOUBLINGS),
    );
    const timer = window.setTimeout(() => {
      setAttempt((current) => (current === attempt ? current + 1 : current));
    }, delay);
    const retryNow = () => {
      setAttempt((current) => (current === attempt ? current + 1 : current));
    };
    window.addEventListener("online", retryNow);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", retryNow);
    };
  }, [attempt, failedAttempt]);

  return (
    <figure
      className="carousel-slide"
      style={{
        width,
        height,
        transform: `translate3d(${left}px, 0, 0)`,
      }}
    >
      <img
        key={attempt}
        src={src}
        alt={image.alt ?? ""}
        width={width}
        height={height}
        fetchPriority="high"
        decoding="async"
        style={failedAttempt !== null ? { visibility: "hidden" } : undefined}
        onError={() => {
          setFailedAttempt((current) => (current === attempt ? current : attempt));
        }}
        onLoad={() => {
          setFailedAttempt((current) => (current === null ? current : null));
        }}
      />
    </figure>
  );
};

export default memo(CarouselSlide);
