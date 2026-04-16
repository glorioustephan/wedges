import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from ".";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["default", "inline"],
      description: "The layout variant of the progress bar.",
      table: { defaultValue: { summary: "default" } },
    },
    color: {
      control: "select",
      options: ["primary", "secondary", "purple", "green", "blue", "orange", "pink", "yellow", "red"],
      description: "The color of the progress indicator.",
      table: { defaultValue: { summary: "primary" } },
    },
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "The current progress value.",
    },
    max: {
      control: { type: "number", min: 1 },
      description: "The maximum progress value.",
      table: { defaultValue: { summary: "100" } },
    },
    label: {
      control: "text",
      description: "Label displayed above the progress bar.",
    },
    indicator: {
      control: "text",
      description: "Content rendered to the right of the progress bar.",
    },
    disableAnimation: {
      control: "boolean",
      description: "Disables the CSS transition animation.",
    },
  },
  args: {
    value: 60,
    max: 100,
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
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: {
    label: "Progress",
    value: 60,
  },
};

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      {(["primary", "secondary", "purple", "green", "blue", "orange", "pink", "yellow", "red"] as const).map(
        (color) => (
          <ProgressBar key={color} color={color} value={65} label={color} />
        )
      )}
    </div>
  ),
};

export const Inline: Story = {
  args: {
    variant: "inline",
    label: "Storage used",
    value: 75,
    indicator: "75%",
  },
};

export const WithIndicator: Story = {
  args: {
    label: "Upload progress",
    value: 45,
    indicator: "45%",
    helperText: "Uploading file...",
  },
};

export const Complete: Story = {
  args: {
    label: "Complete",
    value: 100,
    indicator: "Done",
    color: "green",
  },
};

export const Empty: Story = {
  args: {
    label: "Not started",
    value: 0,
  },
};
