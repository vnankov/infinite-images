const preloaded = new Set<string>();

export const preloadImages = (urls: string[]) => {
  for (const url of urls) {
    if (!url || preloaded.has(url)) continue;
    preloaded.add(url);
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  }
};
