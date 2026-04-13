import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Label displayed beside the switch.",
    },
    description: {
      control: "text",
      description: "Short description beside the label.",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the switch.",
    },
    alignLabel: {
      control: "radio",
      options: ["start", "end"],
      description: "Where the label appears relative to the switch.",
      table: { defaultValue: { summary: "end" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the switch.",
    },
    required: {
      control: "boolean",
      description: "Marks the switch as required.",
    },
    checked: {
      control: "boolean",
      description: "The controlled checked state.",
    },
  },
  args: {
    label: "Enable notifications",
    alignLabel: "end",
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    label: "Enable notifications",
  },
};

export const Checked: Story = {
  args: {
    label: "Dark mode",
    checked: true,
  },
};

export const LabelStart: Story = {
  args: {
    label: "Dark mode",
    alignLabel: "start",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Marketing emails",
    helperText: "Receive product updates and promotional content.",
    description: "Optional",
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled switch",
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Cannot change",
    disabled: true,
    checked: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch label="Default (unchecked)" />
      <Switch label="Checked" checked={true} />
      <Switch label="Disabled" disabled />
      <Switch label="Disabled checked" disabled checked={true} />
    </div>
  ),
};
