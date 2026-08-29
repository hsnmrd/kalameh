import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { ArrowRight, Save } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

const meta = {
  title: "Foundations/Button",
  component: Button,
  args: {
    children: "Save changes",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "auth", "icon"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Outline: Story = {
  args: {
    variant: "outline",
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete record",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithLeadingIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <Save data-icon="inline-start" />
      Save changes
    </Button>
  ),
}

export const WithTrailingIcon: Story = {
  render: (args) => (
    <Button {...args} variant="outline">
      Continue
      <ArrowRight data-icon="inline-end" />
    </Button>
  ),
}

export const InteractionTest: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: "Save changes" })

    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}
