import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./Tooltip";
import { Button } from "../Button";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    content: {
      control: "text",
      description: "The content displayed inside the tooltip.",
    },
    size: {
      control: "radio",
      options: ["sm", "md"],
      description: "Size of the tooltip.",
      table: { defaultValue: { summary: "sm" } },
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "soft"],
      description: "The color scheme of the tooltip.",
      table: { defaultValue: { summary: "primary" } },
    },
    arrow: {
      control: "boolean",
      description: "Whether to show an arrow pointing to the trigger.",
      table: { defaultValue: { summary: "true" } },
    },
    delayDuration: {
      control: { type: "number", min: 0, max: 2000, step: 100 },
      description: "Delay in milliseconds before the tooltip opens.",
      table: { defaultValue: { summary: "200" } },
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description: "The side where the tooltip appears.",
    },
  },
  args: {
    content: "This is a helpful tooltip",
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="outline">Hover me</Button>
    </Tooltip>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Primary tooltip" color="primary">
        <Button variant="outline" size="sm">Primary</Button>
      </Tooltip>
      <Tooltip content="Secondary tooltip" color="secondary">
        <Button variant="outline" size="sm">Secondary</Button>
      </Tooltip>
      <Tooltip content="Soft tooltip with border" color="soft">
        <Button variant="outline" size="sm">Soft</Button>
      </Tooltip>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Small tooltip" size="sm">
        <Button variant="outline" size="sm">Small</Button>
      </Tooltip>
      <Tooltip
        content="Medium tooltip with more detailed content that wraps to multiple lines."
        size="md"
      >
        <Button variant="outline" size="sm">Medium</Button>
      </Tooltip>
    </div>
  ),
};

export const WithoutArrow: Story = {
  render: () => (
    <Tooltip content="No arrow tooltip" arrow={false}>
      <Button variant="outline">No arrow</Button>
    </Tooltip>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-8">
      <Tooltip content="Appears on top" side="top">
        <Button variant="outline" size="sm">Top</Button>
      </Tooltip>
      <Tooltip content="Appears on right" side="right">
        <Button variant="outline" size="sm">Right</Button>
      </Tooltip>
      <Tooltip content="Appears on bottom" side="bottom">
        <Button variant="outline" size="sm">Bottom</Button>
      </Tooltip>
      <Tooltip content="Appears on left" side="left">
        <Button variant="outline" size="sm">Left</Button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tooltip
      content="This is a longer tooltip that contains more detailed information about the feature or action being described."
      size="md"
    >
      <Button variant="outline">More info</Button>
    </Tooltip>
  ),
};
