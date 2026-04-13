import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label";

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    children: {
      control: "text",
      description: "The label text.",
    },
    description: {
      control: "text",
      description: "A short description shown beside the label.",
    },
    tooltip: {
      control: "text",
      description: "Tooltip content shown on hover of the info icon.",
    },
    required: {
      control: "boolean",
      description: "Appends a required indicator to the label.",
    },
    disabled: {
      control: "boolean",
      description: "Dims the label to indicate a disabled state.",
    },
  },
  args: {
    children: "Field label",
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "Email address",
  },
};

export const Required: Story = {
  args: {
    children: "Required field",
    required: true,
  },
};

export const WithDescription: Story = {
  args: {
    children: "API Key",
    description: "Keep secret",
  },
};

export const WithTooltip: Story = {
  args: {
    children: "Advanced setting",
    tooltip: "This setting affects the performance of the application.",
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled label",
    disabled: true,
  },
};

export const AllFeatures: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <Label>Basic label</Label>
      <Label required>Required label</Label>
      <Label description="A short description">With description</Label>
      <Label tooltip="This is helpful tooltip text">With tooltip</Label>
      <Label disabled>Disabled label</Label>
    </div>
  ),
};
