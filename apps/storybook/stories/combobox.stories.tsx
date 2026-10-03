import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"
import { Combobox, ResponsiveCombobox } from "@workspace/ui/components/combobox"

const institutes = [
  { value: "tehran", label: "Tehran Language Institute" },
  { value: "shiraz", label: "Shiraz Learning Center" },
  { value: "tabriz", label: "Tabriz Academy" },
  { value: "mashhad", label: "Mashhad Education Hub" },
  { value: "isfahan", label: "Isfahan Language House" },
  { value: "rasht", label: "Rasht Institute", disabled: true },
]

const meta = {
  title: "Inputs/Combobox",
  component: Combobox,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

export const Searchable: Story = {
  args: {
    items: institutes,
    defaultValue: "tehran",
    locale: "en",
    placeholder: "Select an institute",
    searchPlaceholder: "Search institutes…",
    className: "w-80",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("combobox")
    await userEvent.click(trigger)
    const option = await within(document.body).findByRole("option", {
      name: "Tabriz Academy",
    })
    await userEvent.click(option)
    await expect(trigger).toHaveTextContent("Tabriz Academy")
  },
}

export const Empty: Story = {
  args: {
    items: [],
    locale: "en",
    placeholder: "No institutes available",
    className: "w-80",
  },
}

export const Disabled: Story = {
  args: {
    items: institutes,
    defaultValue: "tehran",
    locale: "en",
    disabled: true,
    className: "w-80",
  },
}

export const ResponsiveMobile: StoryObj<typeof ResponsiveCombobox> = {
  render: (args) => <ResponsiveCombobox {...args} />,
  args: {
    items: institutes,
    defaultValue: "shiraz",
    locale: "en",
    drawerTitle: "Select institute",
    className: "w-full",
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
}
