import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxGroup } from "./CheckboxGroup";
import { Checkbox } from "../Checkbox";

const meta: Meta<typeof CheckboxGroup> = {
  title: "Components/CheckboxGroup",
  component: CheckboxGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Layout direction of the checkbox items.",
      table: { defaultValue: { summary: "vertical" } },
    },
    label: {
      control: "text",
      description: "Group label displayed above the checkboxes.",
    },
    description: {
      control: "text",
      description: "Short description beside the group label.",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the group.",
    },
    disabled: {
      control: "boolean",
      description: "Disables all checkboxes in the group.",
    },
  },
  args: {
    label: "Notification preferences",
  },
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

export const Default: Story = {
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox label="Email notifications" />
      <Checkbox label="SMS notifications" />
      <Checkbox label="Push notifications" />
    </CheckboxGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <CheckboxGroup orientation="horizontal" label="Choose options">
      <Checkbox label="Option A" />
      <Checkbox label="Option B" />
      <Checkbox label="Option C" />
    </CheckboxGroup>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <CheckboxGroup
      label="Notification preferences"
      description="Choose how you want to be notified"
      helperText="You can change these settings at any time."
    >
      <Checkbox label="Email" />
      <Checkbox label="SMS" />
      <Checkbox label="Push" />
    </CheckboxGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <CheckboxGroup label="Disabled group" disabled>
      <Checkbox label="First option" />
      <Checkbox label="Second option" checked={true} />
      <Checkbox label="Third option" />
    </CheckboxGroup>
  ),
};
