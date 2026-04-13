import type { Meta, StoryObj } from "@storybook/react";
import { Loading } from "./Loading";

const meta: Meta<typeof Loading> = {
  title: "Components/Loading",
  component: Loading,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["line", "spinner", "dots"],
      description: "The animation type of the loading indicator.",
      table: { defaultValue: { summary: "line" } },
    },
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "The size of the loading indicator.",
      table: { defaultValue: { summary: "md" } },
    },
    color: {
      control: "radio",
      options: ["primary", "secondary"],
      description: "The color of the loading indicator.",
      table: { defaultValue: { summary: "primary" } },
    },
  },
  args: {
    type: "line",
    size: "md",
    color: "primary",
  },
};

export default meta;
type Story = StoryObj<typeof Loading>;

export const Default: Story = {};

export const AllTypes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Loading type="line" />
        <span className="text-xs text-surface-500">line</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Loading type="spinner" />
        <span className="text-xs text-surface-500">spinner</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Loading type="dots" />
        <span className="text-xs text-surface-500">dots</span>
      </div>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Loading size={size} />
          <span className="text-xs text-surface-500">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Loading color="primary" />
        <span className="text-xs text-surface-500">primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Loading color="secondary" />
        <span className="text-xs text-surface-500">secondary</span>
      </div>
    </div>
  ),
};

export const Spinner: Story = {
  args: {
    type: "spinner",
    size: "lg",
  },
};

export const Dots: Story = {
  args: {
    type: "dots",
    size: "lg",
  },
};
