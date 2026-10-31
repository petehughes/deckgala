import type { Meta, StoryObj } from "@storybook/react";
import { LaneCard } from "./LaneCard";

const meta: Meta<typeof LaneCard> = {
  title: "Controls/LaneCard",
  component: LaneCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LaneCard>;

export const Active: Story = {
  args: {
    lane: 4,
    status: "active",
    swimmerName: "Adam Peaty",
    elapsedMs: 26420,
  },
};

export const Finished: Story = {
  args: {
    lane: 3,
    status: "finished",
    swimmerName: "Duncan Scott",
    elapsedMs: 47800,
  },
};

export const Disqualified: Story = {
  args: {
    lane: 2,
    status: "disqualified",
    swimmerName: "James Guy",
    elapsedMs: 51200,
  },
};

export const Ready: Story = {
  args: {
    lane: 5,
    status: "ready",
    swimmerName: "Freya Anderson",
    elapsedMs: 0,
  },
};
