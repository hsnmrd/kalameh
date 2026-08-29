import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Calendar } from "@workspace/ui/components/calendar"

const meta = {
  title: "Inputs/Calendar",
  component: Calendar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Gregorian: Story = {
  args: {
    mode: "single",
    locale: "en",
    calendarType: "gregorian",
    selected: new Date(2026, 7, 29),
    defaultMonth: new Date(2026, 7, 1),
  },
}

export const Jalali: Story = {
  args: {
    mode: "single",
    locale: "fa",
    calendarType: "jalali",
    selected: new Date(2026, 7, 29),
    defaultMonth: new Date(2026, 7, 1),
  },
  globals: { direction: "rtl" },
}
