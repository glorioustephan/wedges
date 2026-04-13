import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    checked: {
      control: "select",
      options: [true, false, "indeterminate"],
      description: "The checked state of the checkbox.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the checkbox.",
    },
    label: {
      control: "text",
      description: "The label displayed beside the checkbox.",
    },
    description: {
      control: "text",
      description: "A short description shown beside the label.",
    },
    helperText: {
      control: "text",
      description: "Helper text shown below the checkbox.",
    },
    required: {
      control: "boolean",
      description: "Marks the checkbox as required.",
    },
  },
  args: {
    label: "Accept terms and conditions",
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: "Accept terms and conditions",
  },
};

export const Checked: Story = {
  args: {
    label: "Already checked",
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: "Partially selected",
    checked: "indeterminate",
  },
};

export const WithDescription: Story = {
  args: {
    label: "Marketing emails",
    description: "Receive product updates and announcements",
    helperText: "You can unsubscribe at any time.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled checkbox",
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Disabled and checked",
    disabled: true,
    checked: true,
  },
};

export const Required: Story = {
  args: {
    label: "I agree to the terms",
    required: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" checked={true} />
      <Checkbox label="Indeterminate" checked="indeterminate" />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled checked" disabled checked={true} />
    </div>
  ),
};
