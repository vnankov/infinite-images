import type { CarouselImage } from "../types/carousel";

type PicsumPhoto = {
  id: string;
  author: string;
  width: number;
  height: number;
};

const PAGE_SIZE = 100;
const PAGE_COUNT = 10;
/**
 * Cap retina requests so a 3x display does not download a 3x photo.
 */
const MAX_DEVICE_PIXEL_RATIO = 2;
const MIN_REQUESTED_PIXELS = 1;

let catalogPromise: Promise<PicsumPhoto[]> | null = null;

const loadCatalog = (): Promise<PicsumPhoto[]> => {
  if (!catalogPromise) {
    catalogPromise = Promise.all(
      Array.from({ length: PAGE_COUNT }, (_, index) => index + 1).map(async (page) => {
        const response = await fetch(
          `https://picsum.photos/v2/list?page=${page}&limit=${PAGE_SIZE}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load images (${response.status})`);
        }
        return (await response.json()) as PicsumPhoto[];
      }),
    )
      .then((batches) => {
        const photos = batches.flat();
        if (photos.length === 0) {
          throw new Error("Could not load images");
        }
        return photos;
      })
      .catch((error: unknown) => {
        catalogPromise = null;
        throw error;
      });
  }

  return catalogPromise;
};

const toCarouselImage = (photo: PicsumPhoto, index: number): CarouselImage => ({
  id: String(index),
  width: photo.width,
  height: photo.height,
  alt: `Image ${index + 1} by ${photo.author}`,
  src: (displayWidth, displayHeight) => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const w = Math.max(MIN_REQUESTED_PIXELS, Math.round(displayWidth * dpr));
    const h = Math.max(MIN_REQUESTED_PIXELS, Math.round(displayHeight * dpr));
    return `https://picsum.photos/id/${photo.id}/${w}/${h}`;
  },
});

/**
 * Builds `count` carousel images from an absolute start index.
 * Indexes past the Picsum catalog reuse its photos.
 */
export const fetchImageRange = async (
  start: number,
  count: number,
): Promise<CarouselImage[]> => {
  if (count <= 0) return [];

  const catalog = await loadCatalog();
  const images: CarouselImage[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const index = start + offset;
    const catalogIndex = ((index % catalog.length) + catalog.length) % catalog.length;
    images.push(toCarouselImage(catalog[catalogIndex], index));
  }
  return images;
};
