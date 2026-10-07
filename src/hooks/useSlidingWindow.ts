import { useCallback, useEffect, useRef, useState } from "react";
import type { CarouselImage } from "../types/carousel";

export type LoadRange = (start: number, count: number) => Promise<CarouselImage[]>;

type WindowState = {
  start: number;
  images: CarouselImage[];
};

type ViewportEdge = {
  minIndex: number;
  maxIndex: number;
};

type BlockedDirection = "append" | "prepend" | null;

const planWindow = (
  window: WindowState,
  minIndex: number,
  maxIndex: number,
  batchSize: number,
  fetchAt: number,
  blocked: BlockedDirection,
):
  | { type: "drop-front"; start: number; images: CarouselImage[] }
  | { type: "drop-tail"; start: number; images: CarouselImage[] }
  | { type: "append"; start: number; from: number }
  | { type: "prepend"; start: number; from: number; count: number }
  | null => {
  const { start, images } = window;
  const length = images.length;
  if (length === 0 || batchSize <= 0) return null;

  const forwardIndex = Math.max(0, fetchAt - 1);
  const keepBehind = Math.max(0, batchSize - fetchAt);

  if (length > batchSize) {
    if (minIndex >= start + batchSize + keepBehind) {
      return {
        type: "drop-front",
        start: start + batchSize,
        images: images.slice(batchSize),
      };
    }

    // Far enough back that the prefetched page is no longer needed.
    if (maxIndex <= start + forwardIndex - keepBehind) {
      return {
        type: "drop-tail",
        start,
        images: images.slice(0, length - batchSize),
      };
    }

    return null;
  }

  if (blocked !== "append" && maxIndex >= start + forwardIndex) {
    return { type: "append", start, from: start + length };
  }

  if (blocked !== "prepend" && minIndex < start + keepBehind) {
    return {
      type: "prepend",
      start,
      from: start - batchSize,
      count: batchSize,
    };
  }

  return null;
};

export const useSlidingWindow = (
  loadRange: LoadRange,
  batchSize: number,
  fetchAt: number,
) => {
  const [windowState, setWindowState] = useState<WindowState>({
    start: 0,
    images: [],
  });
  const [error, setError] = useState<string | null>(null);
  const windowRef = useRef(windowState);
  const configRef = useRef({ loadRange, batchSize, fetchAt });
  const busyRef = useRef(false);
  const pendingEdgeRef = useRef<ViewportEdge | null>(null);
  const blockedRef = useRef<BlockedDirection>(null);

  windowRef.current = windowState;
  configRef.current = { loadRange, batchSize, fetchAt };

  const apply = (next: WindowState) => {
    windowRef.current = next;
    setWindowState(next);
  };

  useEffect(() => {
    let cancelled = false;

    // Include the batch before image 1 so the row can scroll backward immediately.
    loadRange(-batchSize, batchSize * 2)
      .then((images) => {
        if (!cancelled) {
          const next = { start: -batchSize, images };
          windowRef.current = next;
          setWindowState(next);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Could not load images");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadRange, batchSize]);

  const onViewportChange = useCallback((minIndex: number, maxIndex: number) => {
    const sync = async (edge: ViewportEdge) => {
      if (busyRef.current) {
        pendingEdgeRef.current = edge;
        return;
      }

      const { batchSize: size, fetchAt: at, loadRange: load } = configRef.current;
      const current = windowRef.current;
      const forwardIndex = Math.max(0, at - 1);
      const keepBehind = Math.max(0, size - at);
      if (
        blockedRef.current === "append" &&
        edge.maxIndex < current.start + forwardIndex
      ) {
        blockedRef.current = null;
      }
      if (
        blockedRef.current === "prepend" &&
        edge.minIndex >= current.start + keepBehind
      ) {
        blockedRef.current = null;
      }

      const action = planWindow(
        current,
        edge.minIndex,
        edge.maxIndex,
        size,
        at,
        blockedRef.current,
      );
      if (!action) return;

      busyRef.current = true;
      try {
        if (action.type === "drop-front" || action.type === "drop-tail") {
          apply({ start: action.start, images: action.images });
          return;
        }

        if (action.type === "append") {
          const nextImages = await load(action.from, size);
          const latest = windowRef.current;
          if (latest.start !== action.start || latest.images.length !== size) return;
          apply({ start: latest.start, images: [...latest.images, ...nextImages] });
          blockedRef.current = null;
          return;
        }

        const previousImages = await load(action.from, action.count);
        const latest = windowRef.current;
        if (latest.start !== action.start || latest.images.length !== size) return;
        apply({
          start: action.from,
          images: [...previousImages, ...latest.images],
        });
        blockedRef.current = null;
      } catch (reason: unknown) {
        blockedRef.current = action.type === "prepend" ? "prepend" : "append";
        setError(reason instanceof Error ? reason.message : "Could not load images");
      } finally {
        busyRef.current = false;
        const pending = pendingEdgeRef.current;
        pendingEdgeRef.current = null;
        if (pending) void sync(pending);
      }
    };

    void sync({ minIndex, maxIndex });
  }, []);

  return {
    images: windowState.images,
    rangeStart: windowState.start,
    ready: windowState.images.length > 0,
    error,
    onViewportChange,
  };
};
