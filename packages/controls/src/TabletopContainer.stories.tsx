import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TabletopContainer } from "./TabletopContainer";
import { LaneCard } from "./LaneCard";
import { StopButton } from "./StopButton";

const meta: Meta<typeof TabletopContainer> = {
  title: "Controls/TabletopContainer",
  component: TabletopContainer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TabletopContainer>;

export const SingleLaneTiming: Story = {
  render: () => (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <TabletopContainer
        display={
          <LaneCard
            lane={4}
            status="active"
            swimmerName="Sarah Jenkins"
            elapsedMs={28920}
          />
        }
        controls={
          <StopButton onClick={() => alert("Recorded")}>
            LANE 4 - FINISH TIME (SPACE)
          </StopButton>
        }
      />
    </div>
  ),
};
