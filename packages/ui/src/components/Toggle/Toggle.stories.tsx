import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["outline", "transparent"],
      description: "The visual style variant.",
      table: { defaultValue: { summary: "outline" } },
    },
    size: {
      control: "select",
      options: ["xs-icon", "sm", "md"],
      description: "The size of the toggle button.",
      table: { defaultValue: { summary: "md" } },
    },
    shape: {
      control: "radio",
      options: ["rounded", "pill"],
      description: "The border radius shape.",
      table: { defaultValue: { summary: "rounded" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the toggle.",
    },
    isIconOnly: {
      control: "boolean",
      description: "Apply icon-only padding.",
    },
    children: {
      control: "text",
      description: "The toggle label.",
    },
  },
  args: {
    children: "Bold",
    variant: "outline",
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    children: "Toggle me",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-3">
      <Toggle variant="outline">Outline</Toggle>
      <Toggle variant="transparent">Transparent</Toggle>
    </div>
  ),
};

export const Pressed: Story = {
  args: {
    children: "Pressed",
    defaultPressed: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle size="sm">Small</Toggle>
      <Toggle size="md">Medium</Toggle>
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex gap-3">
      <Toggle shape="rounded">Rounded</Toggle>
      <Toggle shape="pill">Pill</Toggle>
    </div>
  ),
};
