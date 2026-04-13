import type { Meta, StoryObj } from "@storybook/react";
import { SwitchGroup } from "./SwitchGroup";
import { Switch } from "../Switch";

const meta: Meta<typeof SwitchGroup> = {
  title: "Components/SwitchGroup",
  component: SwitchGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Group label displayed above the switches.",
    },
    description: {
      control: "text",
      description: "Short description beside the group label.",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the group.",
    },
    alignLabels: {
      control: "radio",
      options: ["start", "end"],
      description: "Alignment of all switch labels in the group.",
      table: { defaultValue: { summary: "end" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables all switches in the group.",
    },
  },
  args: {
    label: "Notification preferences",
  },
};

export default meta;
type Story = StoryObj<typeof SwitchGroup>;

export const Default: Story = {
  render: (args) => (
    <SwitchGroup {...args}>
      <Switch label="Email notifications" />
      <Switch label="SMS notifications" />
      <Switch label="Push notifications" />
    </SwitchGroup>
  ),
};

export const LabelsStart: Story = {
  render: () => (
    <SwitchGroup alignLabels="start" label="Settings">
      <Switch label="Dark mode" checked={true} />
      <Switch label="Compact view" />
      <Switch label="Auto-save" checked={true} />
    </SwitchGroup>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <SwitchGroup
      label="Privacy settings"
      description="Control your privacy"
      helperText="Changes are saved automatically."
    >
      <Switch label="Show online status" />
      <Switch label="Allow messages from strangers" />
      <Switch label="Share activity" checked={true} />
    </SwitchGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <SwitchGroup label="Disabled group" disabled>
      <Switch label="First option" />
      <Switch label="Second option" checked={true} />
      <Switch label="Third option" />
    </SwitchGroup>
  ),
};
