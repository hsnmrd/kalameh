import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { DateInput } from "@workspace/ui/components/date-input"

const meta = {
  title: "Inputs/Date Input",
  component: DateInput,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DateInput>

export default meta
type Story = StoryObj<typeof meta>

export const Gregorian: Story = {
  args: {
    locale: "en",
    calendarType: "gregorian",
    defaultValue: "2026-08-29",
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

export const Invalid: Story = {
  args: {
    locale: "en",
    "data-invalid": true,
    className: "w-80",
  },
}

export const Disabled: Story = {
  args: {
    locale: "en",
    defaultValue: "2026-08-29",
    disabled: true,
    className: "w-80",
  },
}
