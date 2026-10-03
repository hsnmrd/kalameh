import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, within } from "storybook/test"
import { FABMenuTrigger, FABSingle } from "@workspace/ui/components/fab"

const meta = {
  title: "Mobile/Floating Action Button",
  component: FABSingle,
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
} satisfies Meta<typeof FABSingle>

export default meta
type Story = StoryObj<typeof meta>

export const PrimaryAction: Story = {
  args: { onClick: fn(), "aria-label": "Add student" },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Add student" })
    )
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

export const MenuAction: StoryObj<typeof FABMenuTrigger> = {
  render: (args) => <FABMenuTrigger {...args} />,
  args: { onClick: fn(), "aria-label": "Open page actions" },
}
