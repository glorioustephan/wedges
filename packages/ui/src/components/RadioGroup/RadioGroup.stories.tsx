import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "./RadioGroup";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Layout direction of the radio items.",
      table: { defaultValue: { summary: "vertical" } },
    },
    label: {
      control: "text",
      description: "Group label displayed above the radio items.",
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
      description: "Disables all radio items in the group.",
    },
  },
  args: {
    label: "Notification method",
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args} defaultValue="email">
      <RadioGroup.Item value="email" label="Email" />
      <RadioGroup.Item value="sms" label="SMS" />
      <RadioGroup.Item value="push" label="Push notification" />
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup orientation="horizontal" label="Choose a plan">
      <RadioGroup.Item value="free" label="Free" />
      <RadioGroup.Item value="pro" label="Pro" />
      <RadioGroup.Item value="enterprise" label="Enterprise" />
    </RadioGroup>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <RadioGroup
      label="Privacy"
      description="Control who can see your content"
      helperText="You can change this setting later."
      defaultValue="public"
    >
      <RadioGroup.Item value="public" label="Public" helperText="Anyone can see this" />
      <RadioGroup.Item value="private" label="Private" helperText="Only you can see this" />
      <RadioGroup.Item value="friends" label="Friends" helperText="Only friends can see this" />
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup label="Disabled group" disabled defaultValue="option1">
      <RadioGroup.Item value="option1" label="Option 1" />
      <RadioGroup.Item value="option2" label="Option 2" />
      <RadioGroup.Item value="option3" label="Option 3" />
    </RadioGroup>
  ),
};

export const Required: Story = {
  render: () => (
    <RadioGroup label="Terms" required>
      <RadioGroup.Item value="agree" label="I agree to the terms and conditions" />
      <RadioGroup.Item value="disagree" label="I do not agree" />
    </RadioGroup>
  ),
};
