import type { CarouselImage } from "../types/carousel";

type PicsumPhoto = {
  id: string;
  author: string;
  width: number;
  height: number;
};

const PAGE_SIZE = 100;
/**
 * Cap retina requests so a 3x display does not download a 3x photo.
 */
const MAX_DEVICE_PIXEL_RATIO = 2;
const MIN_REQUESTED_PIXELS = 1;

/**
 * Downloads the Picsum list and maps each photo to a carousel image with a
 * size-aware URL.
 */
export const fetchPicsumImages = async (
  count: number,
): Promise<CarouselImage[]> => {
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const batches = await Promise.all(
    pages.map(async (page) => {
      const response = await fetch(
        `https://picsum.photos/v2/list?page=${page}&limit=${PAGE_SIZE}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load images (${response.status})`);
      }
      return (await response.json()) as PicsumPhoto[];
    }),
  );

  return batches
    .flat()
    .slice(0, count)
    .map((photo) => ({
      id: photo.id,
      width: photo.width,
      height: photo.height,
      alt: `Photo by ${photo.author}`,
      src: (displayWidth, displayHeight) => {
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
        const w = Math.max(MIN_REQUESTED_PIXELS, Math.round(displayWidth * dpr));
        const h = Math.max(MIN_REQUESTED_PIXELS, Math.round(displayHeight * dpr));
        return `https://picsum.photos/id/${photo.id}/${w}/${h}`;
      },
    }));
};
