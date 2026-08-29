import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Attachment } from "@workspace/ui/components/attachment"

const previewImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='20' fill='%231d4ed8'/%3E%3Cpath d='M26 65V31h9v13l13-13h12L45 47l17 18H50L35 49v16z' fill='white'/%3E%3C/svg%3E"

const meta = {
  title: "Media/Attachment",
  component: Attachment,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Attachment>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { className: "w-[28rem]" },
}

export const WithPreview: Story = {
  args: {
    value: previewImage,
    className: "w-[28rem]",
    description: "SVG logo · 3 KB",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    className: "w-[28rem]",
  },
}
