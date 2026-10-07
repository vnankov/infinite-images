import { memo, useMemo } from "react";
import type { CarouselImage } from "../types/carousel";
import { resolveImageSrc } from "../utils/resolveImageSrc";

type CarouselSlideProps = {
  image: CarouselImage;
  width: number;
  height: number;
  left: number;
  indexLabel: number;
};

const CarouselSlide = ({
  image,
  width,
  height,
  left,
  indexLabel,
}: CarouselSlideProps) => {
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
      <span className="carousel-slide-index">{indexLabel.toLocaleString()}</span>
    </figure>
  );
};

export default memo(CarouselSlide);
