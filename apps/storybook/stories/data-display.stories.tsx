import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Price } from "@workspace/ui/components/price"
import { Separator } from "@workspace/ui/components/separator"

const meta = {
  title: "Data/Price and Separators",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const CurrencyFormats: Story = {
  render: () => (
    <div className="mx-auto flex max-w-lg flex-col gap-4 rounded-2xl bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-6">
        <span className="text-sm text-muted-foreground">Tuition</span>
        <Price amount={1500000} locale="fa" />
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-6">
        <span className="text-sm text-muted-foreground">Discount</span>
        <Price amount={250000} locale="en" />
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-6 font-semibold">
        <span>Total</span>
        <Price amount={1250000} locale="en" />
      </div>
    </div>
  ),
}
