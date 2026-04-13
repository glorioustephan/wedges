import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Label displayed above the input.",
    },
    description: {
      control: "text",
      description: "Short description beside the label.",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the input.",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text for the input.",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "url", "search", "tel"],
      description: "The HTML input type.",
    },
    required: {
      control: "boolean",
      description: "Marks the input as required.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input.",
    },
    destructive: {
      control: "boolean",
      description: "Applies error/destructive styling.",
    },
  },
  args: {
    label: "Label",
    placeholder: "Enter text...",
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "Email address",
    placeholder: "you@example.com",
    type: "email",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Username",
    placeholder: "johndoe",
    helperText: "Must be 3–20 characters and contain only letters, numbers, and underscores.",
  },
};

export const WithDescription: Story = {
  args: {
    label: "API Key",
    description: "Keep this secret",
    placeholder: "sk-...",
    type: "password",
  },
};

export const Required: Story = {
  args: {
    label: "Full name",
    placeholder: "John Doe",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled field",
    placeholder: "Cannot edit",
    disabled: true,
    defaultValue: "Read-only value",
  },
};

export const Destructive: Story = {
  args: {
    label: "Email address",
    placeholder: "you@example.com",
    type: "email",
    destructive: true,
    helperText: "Please enter a valid email address.",
    defaultValue: "not-an-email",
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <Input label="Text" placeholder="Enter text" type="text" />
      <Input label="Email" placeholder="you@example.com" type="email" />
      <Input label="Password" placeholder="••••••••" type="password" />
      <Input label="Number" placeholder="42" type="number" />
      <Input label="Search" placeholder="Search..." type="search" />
    </div>
  ),
};
