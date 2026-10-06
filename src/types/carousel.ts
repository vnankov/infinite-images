export type CarouselImage = {
  id: string;
  width: number;
  height: number;
  alt?: string;
  src: string | ((displayWidth: number, displayHeight: number) => string);
};
