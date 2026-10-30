import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FoldableSplitPane,
  LaneCard,
  StopButton,
  TabletopContainer,
  formatTimer,
} from "./index";

describe("formatTimer", () => {
  test("formats hundredth precision and rolls over to hours", () => {
    expect(formatTimer(0)).toBe("00:00.00");
    expect(formatTimer(62_349)).toBe("01:02.34");
    expect(formatTimer(3_723_499)).toBe("01:02:03.49");
    expect(formatTimer(-100)).toBe("00:00.00");
    expect(() => formatTimer(Number.NaN)).toThrow(RangeError);
  });
});

describe("controls", () => {
  test("renders lane identity, status, swimmer, and a tabular timer", () => {
    const html = renderToStaticMarkup(
      <LaneCard lane={3} elapsedMs={62_340} status="active" swimmerName="Alex Morgan" />,
    );

    expect(html).toContain('aria-label="Lane 3"');
    expect(html).toContain("Lane 3");
    expect(html).toContain("Active");
    expect(html).toContain("Alex Morgan");
    expect(html).toContain("01:02.34");
  });

  test("renders a keyboard-accessible stop button with a large action target", () => {
    const html = renderToStaticMarkup(<StopButton disabled>Stop heat</StopButton>);

    expect(html).toContain('type="button"');
    expect(html).toContain("disabled");
    expect(html).toContain("Stop heat");
  });

  test("renders FoldableSplitPane with dual pane children and default ratio", () => {
    const html = renderToStaticMarkup(
      <FoldableSplitPane
        left={<div id="master-view">Master Schedule</div>}
        right={<div id="detail-view">Entry Details</div>}
        defaultRatio="40/60"
      />,
    );

    expect(html).toContain("deckgala-foldable-split-pane");
    expect(html).toContain("deckgala-foldable-split-pane__left");
    expect(html).toContain("deckgala-foldable-split-pane__right");
    expect(html).toContain("Master Schedule");
    expect(html).toContain("Entry Details");
  });

  test("renders TabletopContainer with upper display and lower controls", () => {
    const html = renderToStaticMarkup(
      <TabletopContainer
        display={<div id="scoreboard">Heat 1 Timer 01:23.45</div>}
        controls={<button id="pad">Lane 1 Touch</button>}
      />,
    );

    expect(html).toContain("deckgala-tabletop-container");
    expect(html).toContain("deckgala-tabletop-container__display");
    expect(html).toContain("deckgala-tabletop-container__controls");
    expect(html).toContain("Heat 1 Timer");
    expect(html).toContain("Lane 1 Touch");
  });
});
