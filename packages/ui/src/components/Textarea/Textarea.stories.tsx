import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Label displayed above the textarea.",
    },
    description: {
      control: "text",
      description: "Short description beside the label.",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the textarea.",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text for the textarea.",
    },
    required: {
      control: "boolean",
      description: "Marks the textarea as required.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the textarea.",
    },
    destructive: {
      control: "boolean",
      description: "Applies error/destructive styling.",
    },
  },
  args: {
    label: "Description",
    placeholder: "Enter your text here...",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: "Bio",
    placeholder: "Tell us about yourself...",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Message",
    placeholder: "Type your message...",
    helperText: "Maximum 500 characters.",
  },
};

export const WithDescription: Story = {
  args: {
    label: "Feedback",
    description: "Optional",
    placeholder: "Your feedback helps us improve.",
  },
};

export const Required: Story = {
  args: {
    label: "Comments",
    placeholder: "Please leave a comment...",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled textarea",
    placeholder: "Cannot edit",
    disabled: true,
    defaultValue: "This content cannot be modified.",
  },
};

export const Destructive: Story = {
  args: {
    label: "Description",
    placeholder: "Enter description...",
    destructive: true,
    helperText: "Description must be at least 20 characters.",
    defaultValue: "Too short",
  },
};

export const WithTooltip: Story = {
  args: {
    label: "Technical notes",
    tooltip: "This field is visible only to administrators.",
    placeholder: "Enter technical notes...",
  },
};
