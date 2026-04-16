import type { Meta, StoryObj } from "@storybook/react";

import CloseIcon from "./CloseIcon";

const meta: Meta<typeof CloseIcon> = {
  title: "Components/Icons/CloseIcon",
  component: CloseIcon,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: { type: "number", min: 8, max: 64, step: 1 },
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
    title: "Close icon",
  },
};

export default meta;
type Story = StoryObj<typeof CloseIcon>;

export const Default: Story = {};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {[16, 24, 32, 40].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <CloseIcon size={size} title={`${size}px close icon`} />
          <span className="text-xs text-surface-500">{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const WithTitle: Story = {
  args: {
    size: 32,
    title: "Dismiss dialog",
  },
};
