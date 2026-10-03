import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"

const meta = {
  title: "Theming/Theme Provider and Toggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Storybook is wrapped with the shared ThemeProvider. ThemeToggle cycles through light, dark, and system modes.",
      },
    },
  },
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const IconOnly: Story = {}

export const WithLabel: Story = {
  args: { showLabel: true },
}
