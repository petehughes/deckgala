import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FoldableSplitPane } from "./FoldableSplitPane";

const meta: Meta<typeof FoldableSplitPane> = {
  title: "Controls/FoldableSplitPane",
  component: FoldableSplitPane,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FoldableSplitPane>;

export const Default: Story = {
  render: () => (
    <div style={{ height: "400px", width: "100%", background: "#0B1528", padding: "16px" }}>
      <FoldableSplitPane
        left={
          <div style={{ padding: "16px", background: "#16233B", height: "100%", color: "#F4F7FB" }}>
            <h3>Lane Overview (Left Pane)</h3>
            <p>Heats & Lane allocation list</p>
          </div>
        }
        right={
          <div style={{ padding: "16px", background: "#1E3152", height: "100%", color: "#F4F7FB" }}>
            <h3>Stopwatch Controls (Right Pane)</h3>
            <p>Interactive timing controls</p>
          </div>
        }
      />
    </div>
  ),
};

