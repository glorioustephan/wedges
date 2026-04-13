import type { Meta, StoryObj } from "@storybook/react";
import { Popover } from "./Popover";
import { Button } from "../Button";
import { Input } from "../Input";

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger asChild>
        <Button variant="outline">Open Popover</Button>
      </Popover.Trigger>
      <Popover.Content>
        <p className="text-sm text-surface-900 dark:text-surface-700">
          This is popover content. You can put any content here.
        </p>
      </Popover.Content>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger asChild>
        <Button variant="outline">Edit profile</Button>
      </Popover.Trigger>
      <Popover.Content className="w-72">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Edit your profile</p>
          <Input label="Name" placeholder="John Doe" />
          <Input label="Username" placeholder="@johndoe" />
          <Button size="sm">Save changes</Button>
        </div>
      </Popover.Content>
    </Popover>
  ),
};

export const Positioned: Story = {
  render: () => (
    <div className="flex gap-4">
      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline" size="sm">Top</Button>
        </Popover.Trigger>
        <Popover.Content side="top">
          <p className="text-sm">Opens above</p>
        </Popover.Content>
      </Popover>

      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline" size="sm">Bottom</Button>
        </Popover.Trigger>
        <Popover.Content side="bottom">
          <p className="text-sm">Opens below</p>
        </Popover.Content>
      </Popover>

      <Popover>
        <Popover.Trigger asChild>
          <Button variant="outline" size="sm">Right</Button>
        </Popover.Trigger>
        <Popover.Content side="right">
          <p className="text-sm">Opens to the right</p>
        </Popover.Content>
      </Popover>
    </div>
  ),
};
