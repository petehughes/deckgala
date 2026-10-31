import type { Meta, StoryObj } from "@storybook/react";
import { StopButton } from "./StopButton";

const meta: Meta<typeof StopButton> = {
  title: "Controls/StopButton",
  component: StopButton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StopButton>;

export const Default: Story = {
  args: {
    children: "STOP (SPACE)",
    disabled: false,
    onClick: () => alert("Lane timer stopped!"),
  },
};

export const Disabled: Story = {
  args: {
    children: "STOPPED",
    disabled: true,
  },
};
