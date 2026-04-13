import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectTrigger, SelectValue, SelectIcon, SelectContent, SelectItem, SelectLabel, SelectGroup, SelectSeparator } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Label displayed above the select.",
    },
    description: {
      control: "text",
      description: "Short description beside the label.",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the select.",
    },
    required: {
      control: "boolean",
      description: "Marks the select as required.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the select.",
    },
    destructive: {
      control: "boolean",
      description: "Applies error/destructive styling.",
    },
  },
  args: {
    label: "Favorite fruit",
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select label="Timezone">
      <SelectTrigger>
        <SelectValue placeholder="Select timezone" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <Select
      label="Country"
      helperText="We use this to comply with local regulations."
    >
      <SelectTrigger>
        <SelectValue placeholder="Select country" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="us">United States</SelectItem>
        <SelectItem value="gb">United Kingdom</SelectItem>
        <SelectItem value="ca">Canada</SelectItem>
        <SelectItem value="au">Australia</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select label="Disabled select" disabled>
      <SelectTrigger>
        <SelectValue placeholder="Cannot select" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Option A</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Select
      label="Status"
      destructive
      helperText="Please select a valid status."
    >
      <SelectTrigger>
        <SelectValue placeholder="Select status" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Required: Story = {
  render: () => (
    <Select label="Role" required>
      <SelectTrigger>
        <SelectValue placeholder="Select role" />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="editor">Editor</SelectItem>
        <SelectItem value="viewer">Viewer</SelectItem>
      </SelectContent>
    </Select>
  ),
};
