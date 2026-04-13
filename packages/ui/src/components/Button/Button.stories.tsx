import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "outline", "transparent", "link"],
      description: "The visual style variant of the button.",
      table: { defaultValue: { summary: "primary" } },
    },
    size: {
      control: "select",
      options: ["xs-icon", "sm", "md"],
      description: "The size of the button.",
      table: { defaultValue: { summary: "md" } },
    },
    shape: {
      control: "radio",
      options: ["rounded", "pill"],
      description: "The border radius shape.",
      table: { defaultValue: { summary: "rounded" } },
    },
    destructive: {
      control: "boolean",
      description: "Applies destructive styling to indicate a dangerous action.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button.",
    },
    isIconOnly: {
      control: "boolean",
      description: "Apply icon-only padding when the button contains only an icon.",
    },
    children: {
      control: "text",
      description: "The button label text.",
    },
  },
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    shape: "rounded",
    destructive: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Click me",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="transparent">Transparent</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
    </div>
  ),
};

export const Destructive: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary" destructive>Delete</Button>
      <Button variant="outline" destructive>Delete</Button>
      <Button variant="tertiary" destructive>Delete</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary" disabled>Primary</Button>
      <Button variant="secondary" disabled>Secondary</Button>
      <Button variant="outline" disabled>Outline</Button>
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button shape="rounded">Rounded</Button>
      <Button shape="pill">Pill</Button>
    </div>
  ),
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline button",
  },
};
