const preloaded = new Set<string>();

/**
 * Fetches each URL once, ahead of the slide that will display it, and skips
 * ones already requested.
 */
export const preloadImages = (urls: string[]) => {
  for (const url of urls) {
    if (!url || preloaded.has(url)) continue;
    preloaded.add(url);
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  }
};
