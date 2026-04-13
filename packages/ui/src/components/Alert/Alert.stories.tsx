import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["inline", "expanded"],
      description: "The layout variant of the alert.",
      table: { defaultValue: { summary: "inline" } },
    },
    color: {
      control: "select",
      options: ["gray", "primary", "info", "success", "error", "warning"],
      description: "The color scheme of the alert.",
    },
    title: {
      control: "text",
      description: "The title displayed within the alert.",
    },
    closable: {
      control: "boolean",
      description: "Whether the alert can be dismissed by the user.",
    },
    children: {
      control: "text",
      description: "The description content of the alert.",
    },
  },
  args: {
    children: "This is an alert description with helpful information.",
    variant: "inline",
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    title: "Heads up!",
    children: "You can change this in your account settings.",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Alert variant="inline" title="Inline alert">
        This is an inline alert layout with description text.
      </Alert>
      <Alert variant="expanded" title="Expanded alert">
        This is an expanded alert layout with more vertical space for content.
      </Alert>
    </div>
  ),
};

export const AllColors: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Alert color="gray" title="Gray">Default gray alert.</Alert>
      <Alert color="primary" title="Primary">Primary colored alert.</Alert>
      <Alert color="info" title="Info">Informational alert.</Alert>
      <Alert color="success" title="Success">Success alert.</Alert>
      <Alert color="error" title="Error">Error alert.</Alert>
      <Alert color="warning" title="Warning">Warning alert.</Alert>
    </div>
  ),
};

export const Closable: Story = {
  args: {
    title: "Dismissible alert",
    children: "Click the X button to dismiss this alert.",
    closable: true,
  },
};

export const WithoutTitle: Story = {
  args: {
    children: "An alert without a title, just a description.",
  },
};

export const ExpandedWithAction: Story = {
  render: () => (
    <Alert
      variant="expanded"
      color="info"
      title="Update available"
      after={
        <button className="rounded bg-primary px-3 py-1 text-xs text-white">
          Update now
        </button>
      }
    >
      A new version is available. Update to get the latest features.
    </Alert>
  ),
};
