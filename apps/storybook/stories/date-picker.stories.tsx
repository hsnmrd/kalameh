import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { DatePicker } from "@workspace/ui/components/date-picker"

const meta = {
  title: "Inputs/Date Picker",
  component: DatePicker,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Gregorian: Story = {
  args: {
    locale: "en",
    calendarType: "gregorian",
    defaultValue: "2026-08-29",
    placeholder: "Select date",
    className: "w-80",
  },
}

export const Jalali: Story = {
  args: {
    locale: "fa",
    calendarType: "jalali",
    defaultValue: "2026-08-29",
    className: "w-80",
  },
  globals: { direction: "rtl" },
}

export const MobileDrawer: Story = {
  args: {
    locale: "en",
    calendarType: "gregorian",
    placeholder: "Select date",
    drawerTitle: "Select a date",
    className: "w-full",
  },
  parameters: { viewport: { defaultViewport: "mobile1" } },
}
