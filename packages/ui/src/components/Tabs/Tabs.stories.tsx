import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["underlined", "contained-bottom", "contained-top"],
      description: "The visual style of the tab list.",
      table: { defaultValue: { summary: "underlined" } },
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Layout direction of the tabs.",
      table: { defaultValue: { summary: "horizontal" } },
    },
    defaultValue: {
      control: "text",
      description: "The default active tab value.",
    },
  },
  args: {
    defaultValue: "tab1",
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Tabs.List>
        <Tabs.Trigger value="tab1">Overview</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Analytics</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Reports</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">
        <p className="text-sm text-surface-700">Overview content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab2">
        <p className="text-sm text-surface-700">Analytics content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab3">
        <p className="text-sm text-surface-700">Reports content goes here.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ContainedBottom: Story = {
  render: () => (
    <Tabs variant="contained-bottom" defaultValue="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Overview</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Analytics</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Reports</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">
        <p className="text-sm text-surface-700">Overview content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab2">
        <p className="text-sm text-surface-700">Analytics content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab3">
        <p className="text-sm text-surface-700">Reports content goes here.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ContainedTop: Story = {
  render: () => (
    <Tabs variant="contained-top" defaultValue="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Overview</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Analytics</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Reports</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">
        <p className="text-sm text-surface-700">Overview content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab2">
        <p className="text-sm text-surface-700">Analytics content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab3">
        <p className="text-sm text-surface-700">Reports content goes here.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs orientation="vertical" defaultValue="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Overview</Tabs.Trigger>
        <Tabs.Trigger value="tab2">Analytics</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Reports</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">
        <p className="text-sm text-surface-700">Overview content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab2">
        <p className="text-sm text-surface-700">Analytics content goes here.</p>
      </Tabs.Content>
      <Tabs.Content value="tab3">
        <p className="text-sm text-surface-700">Reports content goes here.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <Tabs.List>
        <Tabs.Trigger value="tab1">Active</Tabs.Trigger>
        <Tabs.Trigger value="tab2" disabled>Disabled</Tabs.Trigger>
        <Tabs.Trigger value="tab3">Another</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="tab1">
        <p className="text-sm text-surface-700">Active tab content.</p>
      </Tabs.Content>
      <Tabs.Content value="tab3">
        <p className="text-sm text-surface-700">Another tab content.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-96">
      {(["underlined", "contained-bottom", "contained-top"] as const).map((variant) => (
        <div key={variant}>
          <p className="text-xs text-surface-500 mb-2">{variant}</p>
          <Tabs variant={variant} defaultValue="tab1">
            <Tabs.List>
              <Tabs.Trigger value="tab1">First</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Second</Tabs.Trigger>
              <Tabs.Trigger value="tab3">Third</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tab1"><p className="text-sm pt-2">First tab</p></Tabs.Content>
            <Tabs.Content value="tab2"><p className="text-sm pt-2">Second tab</p></Tabs.Content>
            <Tabs.Content value="tab3"><p className="text-sm pt-2">Third tab</p></Tabs.Content>
          </Tabs>
        </div>
      ))}
    </div>
  ),
};
