import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "./Kbd";

const meta: Meta<typeof Kbd> = {
  title: "Components/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    keys: {
      control: "text",
      description: "Keyboard key(s) to display. Can be a single key name or an array.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg"],
      description: "The size of the keyboard badge.",
      table: { defaultValue: { summary: "xs" } },
    },
    children: {
      control: "text",
      description: "Text content to display inside the Kbd component.",
    },
  },
  args: {
    size: "xs",
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = {
  args: {
    children: "K",
  },
};

export const WithKey: Story = {
  args: {
    keys: "command",
  },
};

export const MultipleKeys: Story = {
  render: () => (
    <div className="flex items-center gap-1">
      <Kbd keys="command" />
      <span className="text-surface-500">+</span>
      <Kbd keys="shift" />
      <span className="text-surface-500">+</span>
      <Kbd keys="escape" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Kbd size="xs">K</Kbd>
      <Kbd size="sm">K</Kbd>
      <Kbd size="md">K</Kbd>
      <Kbd size="lg">K</Kbd>
    </div>
  ),
};

export const CommonShortcuts: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-start">
      <div className="flex items-center gap-2">
        <span className="text-sm w-24">Save</span>
        <Kbd keys="command" /> + <Kbd>S</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm w-24">Copy</span>
        <Kbd keys="command" /> + <Kbd>C</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm w-24">Undo</span>
        <Kbd keys="command" /> + <Kbd>Z</Kbd>
      </div>
    </div>
  ),
};
