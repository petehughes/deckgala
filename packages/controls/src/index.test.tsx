import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LaneCard, StopButton, formatTimer } from "./index";

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
});
