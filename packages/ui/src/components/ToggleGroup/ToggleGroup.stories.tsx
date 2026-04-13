import type { Meta, StoryObj } from "@storybook/react";
import { ToggleGroup } from "./ToggleGroup";

const meta: Meta<typeof ToggleGroup> = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    type: {
      control: "radio",
      options: ["single", "multiple"],
      description: "Whether single or multiple items can be active.",
      table: { defaultValue: { summary: "single" } },
    },
    size: {
      control: "radio",
      options: ["sm", "md"],
      description: "Size applied to all items in the group.",
      table: { defaultValue: { summary: "md" } },
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Layout direction of the group.",
      table: { defaultValue: { summary: "horizontal" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables all items in the group.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
      <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
      <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup type="multiple">
      <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
      <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
      <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ToggleGroup type="single" orientation="vertical">
      <ToggleGroup.Item value="a">Option A</ToggleGroup.Item>
      <ToggleGroup.Item value="b">Option B</ToggleGroup.Item>
      <ToggleGroup.Item value="c">Option C</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <ToggleGroup type="single" size="sm">
      <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
      <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
      <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup type="single" disabled>
      <ToggleGroup.Item value="a">First</ToggleGroup.Item>
      <ToggleGroup.Item value="b">Second</ToggleGroup.Item>
      <ToggleGroup.Item value="c">Third</ToggleGroup.Item>
    </ToggleGroup>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="week">
      <ToggleGroup.Item value="day">Day</ToggleGroup.Item>
      <ToggleGroup.Item value="week">Week</ToggleGroup.Item>
      <ToggleGroup.Item value="month">Month</ToggleGroup.Item>
      <ToggleGroup.Item value="year">Year</ToggleGroup.Item>
    </ToggleGroup>
  ),
};
