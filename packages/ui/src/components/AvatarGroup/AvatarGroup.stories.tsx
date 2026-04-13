import type { Meta, StoryObj } from "@storybook/react";
import { AvatarGroup } from "./AvatarGroup";

const sampleItems = [
  { src: "https://i.pravatar.cc/150?img=1", alt: "Alice" },
  { src: "https://i.pravatar.cc/150?img=2", alt: "Bob" },
  { src: "https://i.pravatar.cc/150?img=3", alt: "Carol" },
  { initials: "DX", alt: "Dave" },
];

const meta: Meta<typeof AvatarGroup> = {
  title: "Components/AvatarGroup",
  component: AvatarGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of all avatars in the group.",
      table: { defaultValue: { summary: "md" } },
    },
    moreLabel: {
      control: "text",
      description: "Label displayed at the end of the group for overflow items.",
    },
    previousOnTop: {
      control: "boolean",
      description: "Whether previous items appear on top of the stack.",
    },
  },
  args: {
    items: sampleItems,
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {
  args: {
    items: sampleItems,
  },
};

export const WithMoreLabel: Story = {
  args: {
    items: sampleItems,
    moreLabel: "+12",
  },
};

export const PreviousOnTop: Story = {
  args: {
    items: sampleItems,
    previousOnTop: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 items-start">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} className="flex items-center gap-4">
          <span className="w-8 text-sm text-surface-500">{size}</span>
          <AvatarGroup items={sampleItems} size={size} />
        </div>
      ))}
    </div>
  ),
};

export const InitialsOnly: Story = {
  args: {
    items: [
      { initials: "Alice Brown", alt: "Alice Brown" },
      { initials: "Bob Chen", alt: "Bob Chen" },
      { initials: "Carol Doe", alt: "Carol Doe" },
    ],
    moreLabel: "+5",
  },
};
