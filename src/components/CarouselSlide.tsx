import { memo, useMemo } from "react";
import type { CarouselImage } from "../types/carousel";
import { resolveImageSrc } from "../utils/resolveImageSrc";

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
        src={src}
        alt={image.alt ?? ""}
        width={width}
        height={height}
        fetchPriority="high"
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
      />
    </figure>
  );
};

export default memo(CarouselSlide);
