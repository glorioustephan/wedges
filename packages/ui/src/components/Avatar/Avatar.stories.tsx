import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    src: {
      control: "text",
      description: "Image URL for the avatar.",
    },
    alt: {
      control: "text",
      description: "Alt text for the avatar image.",
    },
    initials: {
      control: "text",
      description: "Initials displayed when no image is provided. Supports single/double chars or full name.",
    },
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl"],
      description: "The size of the avatar.",
      table: { defaultValue: { summary: "md" } },
    },
    status: {
      control: "select",
      options: [undefined, "primary", "gray", "green", "yellow", "red"],
      description: "Status indicator displayed on the avatar.",
    },
    notification: {
      control: "select",
      options: [undefined, "red", "primary"],
      description: "Notification indicator displayed on the avatar.",
    },
  },
  args: {
    size: "md",
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    initials: "JD",
    alt: "John Doe",
  },
};

export const WithImage: Story = {
  args: {
    src: "https://i.pravatar.cc/150?img=1",
    alt: "User avatar",
    size: "md",
  },
};

export const WithInitials: Story = {
  args: {
    initials: "John Doe",
    alt: "John Doe",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar initials="JD" size="xxs" alt="xxs" />
      <Avatar initials="JD" size="xs" alt="xs" />
      <Avatar initials="JD" size="sm" alt="sm" />
      <Avatar initials="JD" size="md" alt="md" />
      <Avatar initials="JD" size="lg" alt="lg" />
      <Avatar initials="JD" size="xl" alt="xl" />
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="GR" status="green" alt="Green" />
      <Avatar initials="RD" status="red" alt="Red" />
      <Avatar initials="YL" status="yellow" alt="Yellow" />
      <Avatar initials="GY" status="gray" alt="Gray" />
    </div>
  ),
};

export const WithNotification: Story = {
  args: {
    initials: "JD",
    notification: "red",
    alt: "With notification",
  },
};

export const FallbackIcon: Story = {
  args: {
    alt: "No image, no initials",
  },
};
