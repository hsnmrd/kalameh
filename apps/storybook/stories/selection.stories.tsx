import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

const meta = {
  title: "Inputs/Select",
  parameters: {
    layout: "centered",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const LanguageSelector: Story = {
  render: () => (
    <div className="w-80">
      <Select defaultValue="fa">
        <SelectTrigger aria-label="Interface language">
          <SelectValue placeholder="Choose a language" />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            <SelectLabel>Languages</SelectLabel>
            <SelectItem value="fa">فارسی</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
          </SelectGroup>
        </SelectPopup>
      </Select>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole("combobox", {
      name: "Interface language",
    })

    await userEvent.click(trigger)
    const englishOption = await within(document.body).findByRole("option", {
      name: "English",
    })
    await userEvent.click(englishOption)
    await expect(trigger).toHaveTextContent("en")
  },
}
