import { useEffect, useState } from "react";
import { fetchPicsumImages } from "./api/picsum";
import InfiniteCarousel from "./components/InfiniteCarousel";
import type { CarouselImage } from "./types/carousel";

const IMAGE_COUNT = 1000;

const App = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPicsumImages(IMAGE_COUNT)
      .then((result) => {
        if (!cancelled) setImages(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load images");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <main className="app-status">{error}</main>;
  }

  if (images.length === 0) {
    return <main className="app-status">Loading images…</main>;
  }

  return (
    <main className="app">
      <InfiniteCarousel images={images} />
    </main>
  );
};

export default App;
