import type { Meta, StoryObj } from "@storybook/react";

import { CheckIcon } from "./CheckIcon";

const meta: Meta<typeof CheckIcon> = {
  title: "Components/Icons/CheckIcon",
  component: CheckIcon,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    className: {
      control: "text",
      description: "Additional classes applied to the icon.",
    },
  },
  args: {
    className: "text-primary",
  },
};

export default meta;
type Story = StoryObj<typeof CheckIcon>;

export const Default: Story = {};

export const AllColors: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 p-4 text-primary">
        <CheckIcon />
        <span className="text-xs text-surface-500">primary</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 p-4 text-secondary">
        <CheckIcon />
        <span className="text-xs text-surface-500">secondary</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 p-4 text-surface-500">
        <CheckIcon />
        <span className="text-xs text-surface-500">muted</span>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 p-4 text-surface-900 dark:text-white">
        <CheckIcon />
        <span className="text-xs text-surface-500">strong</span>
      </div>
    </div>
  ),
};
