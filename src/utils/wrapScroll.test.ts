import { describe, expect, it } from "vitest";
import { wrapScroll } from "./wrapScroll";

const scroller = (scrollLeft: number) => ({ scrollLeft }) as HTMLDivElement;

describe("wrapScroll", () => {
  const loopWidth = 100;
  const contentWidth = 500;
  const viewportWidth = 50;
  const origin = 200;

  it("leaves the position alone when there is nothing to loop", () => {
    const element = scroller(10);

    wrapScroll(element, 0, contentWidth, viewportWidth, origin);
    wrapScroll(element, loopWidth, contentWidth, 0, origin);

    expect(element.scrollLeft).toBe(10);
  });

  it("jumps forward by whole loops when scrolling into the first copy", () => {
    const element = scroller(10);

    wrapScroll(element, loopWidth, contentWidth, viewportWidth, origin);

    expect(element.scrollLeft).toBe(210);
  });

  it("jumps backward by whole loops when scrolling into the last copy", () => {
    const element = scroller(400);

    wrapScroll(element, loopWidth, contentWidth, viewportWidth, origin);

    expect(element.scrollLeft).toBe(200);
  });

  it("does not move a position that is already in the middle copies", () => {
    const element = scroller(origin);

    wrapScroll(element, loopWidth, contentWidth, viewportWidth, origin);

    expect(element.scrollLeft).toBe(origin);
  });
});
