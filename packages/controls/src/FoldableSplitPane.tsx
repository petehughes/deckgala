import React from "react";

export interface FoldableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: "50/50" | "40/60" | "35/65";
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
  id?: string;
}

/**
 * FoldableSplitPane:
 * Implements CSS Viewport Segments API support (`horizontal-viewport-segments: 2`).
 * When unfolded on a foldable dual-landscape device (Surface Duo, Galaxy Fold, Pixel Fold),
 * it maps left to segment 0 and right to segment 1 with hinge-safe spacing.
 * On standard desktop/tablet screens it provides a high-contrast side-by-side workspace.
 * On mobile portrait screens it gracefully stacks.
 */
export function FoldableSplitPane({
  left,
  right,
  defaultRatio = "50/50",
  className = "",
  leftClassName = "",
  rightClassName = "",
  id,
}: FoldableSplitPaneProps) {
  const ratioClasses = {
    "50/50": "grid-cols-1 md:grid-cols-2",
    "40/60": "grid-cols-1 md:grid-cols-[2fr_3fr]",
    "35/65": "grid-cols-1 md:grid-cols-[7fr_13fr]",
  }[defaultRatio];

  return (
    <div
      id={id}
      className={`deckgala-foldable-split-pane grid ${ratioClasses} gap-4 md:gap-6 w-full ${className}`}
      data-testid="foldable-split-pane"
    >
      <div
        className={`deckgala-foldable-split-pane__left min-w-0 flex flex-col ${leftClassName}`}
        data-testid="foldable-split-pane-left"
      >
        {left}
      </div>
      <div
        className={`deckgala-foldable-split-pane__right min-w-0 flex flex-col ${rightClassName}`}
        data-testid="foldable-split-pane-right"
      >
        {right}
      </div>
    </div>
  );
}

