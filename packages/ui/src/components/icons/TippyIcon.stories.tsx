import type { Meta, StoryObj } from "@storybook/react";

import TippyIcon from "./TippyIcon";

const meta: Meta<typeof TippyIcon> = {
  title: "Components/Icons/TippyIcon",
  component: TippyIcon,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: { type: "number", min: 8, max: 72, step: 1 },
      description: "Icon width in pixels.",
      table: { defaultValue: { summary: "24" } },
    },
    title: {
      control: "text",
      description: "Accessible title for the icon.",
    },
  },
  args: {
    size: 24,
    title: "Tippy icon",
  },
};

export default meta;
type Story = StoryObj<typeof TippyIcon>;

export const Default: Story = {};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {[16, 24, 32, 40].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <TippyIcon size={size} title={`${size}px Tippy icon`} />
          <span className="text-xs text-surface-500">{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const WithTitle: Story = {
  args: {
    size: 32,
    title: "Tooltip arrow",
  },
};
