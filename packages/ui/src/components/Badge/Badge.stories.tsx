import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    color: {
      control: "select",
      options: ["gray", "primary", "red", "green", "yellow", "blue", "orange", "pink", "purple"],
      description: "The color scheme of the badge.",
      table: { defaultValue: { summary: "gray" } },
    },
    size: {
      control: "radio",
      options: ["md", "sm"],
      description: "The size of the badge.",
      table: { defaultValue: { summary: "md" } },
    },
    shape: {
      control: "radio",
      options: ["rounded", "pill"],
      description: "The border radius shape.",
      table: { defaultValue: { summary: "rounded" } },
    },
    stroke: {
      control: "boolean",
      description: "Whether the badge has a border stroke.",
    },
    children: {
      control: "text",
      description: "The label text of the badge.",
    },
  },
  args: {
    children: "Badge",
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Default",
    color: "gray",
    size: "md",
    shape: "rounded",
  },
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["gray", "primary", "red", "green", "yellow", "blue", "orange", "pink", "purple"] as const).map((color) => (
        <Badge key={color} color={color}>{color}</Badge>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="md">Medium</Badge>
      <Badge size="sm">Small</Badge>
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex gap-3">
      <Badge shape="rounded" color="primary">Rounded</Badge>
      <Badge shape="pill" color="primary">Pill</Badge>
    </div>
  ),
};

export const WithStroke: Story = {
  render: () => (
    <div className="flex gap-3">
      <Badge stroke color="primary">With stroke</Badge>
      <Badge color="primary">Without stroke</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  args: {
    children: "Label",
    size: "sm",
    color: "green",
    shape: "pill",
  },
};
