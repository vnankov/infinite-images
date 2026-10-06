import type { CarouselImage } from "../types/carousel";

type PicsumPhoto = {
  id: string;
  author: string;
  width: number;
  height: number;
};

const PAGE_SIZE = 100;

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
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(displayWidth * dpr));
        const h = Math.max(1, Math.round(displayHeight * dpr));
        return `https://picsum.photos/id/${photo.id}/${w}/${h}`;
      },
    }));
};
