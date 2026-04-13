import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      description: "Label displayed above the slider.",
    },
    description: {
      control: "text",
      description: "Short description beside the label.",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the slider.",
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "The orientation of the slider.",
      table: { defaultValue: { summary: "horizontal" } },
    },
    showTooltip: {
      control: "select",
      options: ["always", "hover", "never"],
      description: "When to show the value tooltip.",
      table: { defaultValue: { summary: "hover" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables the slider.",
    },
  },
  args: {
    defaultValue: [40],
    min: 0,
    max: 100,
    step: 1,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    label: "Volume",
    defaultValue: [40],
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Price range",
    helperText: "Set your maximum price.",
    defaultValue: [50],
  },
};

export const AlwaysShowTooltip: Story = {
  args: {
    label: "Brightness",
    showTooltip: "always",
    defaultValue: [70],
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled slider",
    disabled: true,
    defaultValue: [30],
  },
};

export const WithRange: Story = {
  args: {
    label: "Price range",
    defaultValue: [20, 80],
    showTooltip: "always",
  },
};

export const WithBeforeAfter: Story = {
  render: () => (
    <div className="w-80">
      <Slider
        label="Volume"
        defaultValue={[60]}
        before={<span className="text-sm text-surface-500">0</span>}
        after={<span className="text-sm text-surface-500">100</span>}
      />
    </div>
  ),
};

export const WithStep: Story = {
  args: {
    label: "Rating (1-10)",
    defaultValue: [5],
    min: 1,
    max: 10,
    step: 1,
    showTooltip: "always",
  },
};
