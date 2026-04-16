import type { Meta, StoryObj } from "@storybook/react";

import LemonSqueezyIcon from "./LemonSqueezy";

const meta: Meta<typeof LemonSqueezyIcon> = {
  title: "Components/Icons/LemonSqueezyIcon",
  component: LemonSqueezyIcon,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: { type: "number", min: 8, max: 72, step: 1 },
      description: "Icon size in pixels.",
      table: { defaultValue: { summary: "24" } },
    },
    title: {
      control: "text",
      description: "Accessible title for the icon.",
    },
  },
  args: {
    size: 24,
    title: "Lemon Squeezy icon",
  },
};

export default meta;
type Story = StoryObj<typeof LemonSqueezyIcon>;

export const Default: Story = {};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {[16, 24, 32, 40].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <LemonSqueezyIcon size={size} title={`${size}px Lemon Squeezy icon`} />
          <span className="text-xs text-surface-500">{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const WithTitle: Story = {
  args: {
    size: 32,
    title: "Lemon Squeezy",
  },
};
