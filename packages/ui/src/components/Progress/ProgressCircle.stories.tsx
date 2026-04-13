import type { Meta, StoryObj } from "@storybook/react";
import { ProgressCircle } from "./Progress";

const meta: Meta<typeof ProgressCircle> = {
  title: "Components/ProgressCircle",
  component: ProgressCircle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "The current progress value.",
    },
    max: {
      control: { type: "number", min: 1 },
      description: "The maximum progress value.",
      table: { defaultValue: { summary: "100" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the circle.",
      table: { defaultValue: { summary: "md" } },
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "purple", "green", "blue", "orange", "pink", "yellow", "red"],
      description: "The color of the progress arc.",
      table: { defaultValue: { summary: "primary" } },
    },
    disableAnimation: {
      control: "boolean",
      description: "Disables the transition animation.",
    },
    disabled: {
      control: "boolean",
      description: "Applies disabled opacity styling.",
    },
  },
  args: {
    value: 65,
    size: "md",
    color: "primary",
  },
};

export default meta;
type Story = StoryObj<typeof ProgressCircle>;

export const Default: Story = {
  args: {
    value: 65,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <ProgressCircle value={65} size={size} />
          <span className="text-xs text-surface-500">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(["primary", "secondary", "purple", "green", "blue", "orange", "pink", "yellow", "red"] as const).map(
        (color) => (
          <div key={color} className="flex flex-col items-center gap-2">
            <ProgressCircle value={65} color={color} />
            <span className="text-xs text-surface-500">{color}</span>
          </div>
        )
      )}
    </div>
  ),
};

export const Complete: Story = {
  args: {
    value: 100,
    color: "green",
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

export const Disabled: Story = {
  args: {
    value: 60,
    disabled: true,
  },
};
