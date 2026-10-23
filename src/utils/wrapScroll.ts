/**
 * Jumps `scrollLeft` by whole loops when the view nears either end, so the
 * repeated track feels endless.
 */
export const wrapScroll = (
  element: HTMLDivElement,
  loopWidth: number,
  contentWidth: number,
  viewportWidth: number,
  origin: number,
) => {
  if (loopWidth <= 0 || viewportWidth <= 0) return;

  const maxScroll = Math.max(0, contentWidth - viewportWidth);
  if (element.scrollLeft < loopWidth) {
    const jumps = Math.ceil((origin - element.scrollLeft) / loopWidth);
    element.scrollLeft += jumps * loopWidth;
  } else if (element.scrollLeft > maxScroll - loopWidth) {
    const jumps = Math.ceil((element.scrollLeft - origin) / loopWidth);
    element.scrollLeft -= jumps * loopWidth;
  }
};
