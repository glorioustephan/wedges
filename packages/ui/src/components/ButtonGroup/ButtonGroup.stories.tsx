import type { Meta, StoryObj } from "@storybook/react";
import { ButtonGroup } from "./ButtonGroup";

const meta: Meta<typeof ButtonGroup> = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Size applied to all buttons in the group.",
      table: { defaultValue: { summary: "md" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables all buttons in the group.",
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "The layout direction of the group.",
      table: { defaultValue: { summary: "horizontal" } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup.Item>First</ButtonGroup.Item>
      <ButtonGroup.Item>Second</ButtonGroup.Item>
      <ButtonGroup.Item>Third</ButtonGroup.Item>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <ButtonGroup.Item>Top</ButtonGroup.Item>
      <ButtonGroup.Item>Middle</ButtonGroup.Item>
      <ButtonGroup.Item>Bottom</ButtonGroup.Item>
    </ButtonGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ButtonGroup disabled>
      <ButtonGroup.Item>First</ButtonGroup.Item>
      <ButtonGroup.Item>Second</ButtonGroup.Item>
      <ButtonGroup.Item>Third</ButtonGroup.Item>
    </ButtonGroup>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <ButtonGroup size="sm">
      <ButtonGroup.Item>One</ButtonGroup.Item>
      <ButtonGroup.Item>Two</ButtonGroup.Item>
      <ButtonGroup.Item>Three</ButtonGroup.Item>
    </ButtonGroup>
  ),
};
