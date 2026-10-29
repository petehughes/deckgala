import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeCallbackPath } from "./redirect-url";

describe("authentication callback URLs", () => {
  it("preserves local paths and falls back for external destinations", () => {
    assert.equal(safeCallbackPath("/invite/token?next=1"), "/invite/token?next=1");
    assert.equal(safeCallbackPath("https://example.com/"), "/");
    assert.equal(safeCallbackPath("//example.com/"), "/");
    assert.equal(safeCallbackPath("/\\\\example.com/"), "/");
    assert.equal(safeCallbackPath(undefined), "/");
  });
});
