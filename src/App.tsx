import { fetchImageRange } from "./api/picsum";
import InfiniteCarousel from "./components/InfiniteCarousel";
import { useSlidingWindow } from "./hooks/useSlidingWindow";

const BATCH_SIZE = 1000;
const FETCH_AT = 800;

/**
 * Loads the demo photos, then renders the carousel. Shows a status line while
 * loading or on failure.
 */
const App = () => {
  const { images, rangeStart, ready, error, onViewportChange } = useSlidingWindow(
    fetchImageRange,
    BATCH_SIZE,
    FETCH_AT,
  );

  if (!ready) {
    return <main className="app-status">{error ?? "Loading images…"}</main>;
  }

  return (
    <main className="app">
      <InfiniteCarousel
        images={images}
        rangeStart={rangeStart}
        onViewportChange={onViewportChange}
      />
    </main>
  );
};

export default App;
