import type { Meta, StoryObj } from "@storybook/react";
import { Tag } from "./Tag";
import { Avatar } from "../Avatar";

const meta: Meta<typeof Tag> = {
  title: "Components/Tag",
  component: Tag,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    color: {
      control: "select",
      options: ["gray", "primary", "red", "green", "yellow", "blue", "orange", "pink", "purple"],
      description: "The color scheme of the tag.",
    },
    size: {
      control: "radio",
      options: ["md", "sm"],
      description: "The size of the tag.",
      table: { defaultValue: { summary: "md" } },
    },
    shape: {
      control: "radio",
      options: ["rounded", "pill"],
      description: "The border radius shape.",
    },
    stroke: {
      control: "boolean",
      description: "Whether the tag has a border stroke.",
    },
    closable: {
      control: "boolean",
      description: "Whether the tag shows a close/remove button.",
    },
    children: {
      control: "text",
      description: "The label text of the tag.",
    },
  },
  args: {
    children: "Tag label",
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    children: "React",
  },
};

export const Closable: Story = {
  args: {
    children: "Removable",
    closable: true,
  },
};

export const WithAvatar: Story = {
  args: {
    children: "John Doe",
    avatar: <Avatar initials="JD" alt="John Doe" />,
  },
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["gray", "primary", "red", "green", "yellow", "blue", "orange", "pink", "purple"] as const).map((color) => (
        <Tag key={color} color={color}>{color}</Tag>
      ))}
    </div>
  ),
};

export const WithStroke: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["gray", "primary", "blue", "green"] as const).map((color) => (
        <Tag key={color} color={color} stroke>{color}</Tag>
      ))}
    </div>
  ),
};

export const Pill: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tag shape="pill" color="primary">Design</Tag>
      <Tag shape="pill" color="blue">Development</Tag>
      <Tag shape="pill" color="green" closable>Marketing</Tag>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Tag size="md">Medium tag</Tag>
      <Tag size="sm">Small tag</Tag>
    </div>
  ),
};
