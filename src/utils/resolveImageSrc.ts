import type { CarouselImage } from "../types/carousel";

/**
 * Turns a plain URL, or a function of the drawn size, into the address the
 * slide should request.
 */
export const resolveImageSrc = (
  image: CarouselImage,
  width: number,
  height: number,
) => (typeof image.src === "function" ? image.src(width, height) : image.src);
