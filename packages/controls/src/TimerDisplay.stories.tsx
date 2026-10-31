import type { Meta, StoryObj } from "@storybook/react";
import { TimerDisplay } from "./TimerDisplay";

const meta: Meta<typeof TimerDisplay> = {
  title: "Controls/TimerDisplay",
  component: TimerDisplay,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TimerDisplay>;

export const Running: Story = {
  args: {
    elapsedMs: 58420,
  },
};

export const SubMinute: Story = {
  args: {
    elapsedMs: 24350,
  },
};

export const OverAnHour: Story = {
  args: {
    elapsedMs: 3725400,
  },
};

export const Stopped: Story = {
  args: {
    elapsedMs: 0,
  },
};
