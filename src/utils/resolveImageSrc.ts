import type { CarouselImage } from "../types/carousel";

export const resolveImageSrc = (
  image: CarouselImage,
  width: number,
  height: number,
) => (typeof image.src === "function" ? image.src(width, height) : image.src);
