import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, within } from "storybook/test"
import { Inbox } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"

const meta = {
  title: "Feedback/States",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Statuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Active</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="success">Paid</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Blocked</Badge>
      <Badge variant="outline">Archived</Badge>
    </div>
  ),
}

export const Loading: Story = {
  render: () => (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Spinner />
      <span>Loading institute data…</span>
    </div>
  ),
}

export const EmptyState: Story = {
  render: () => (
    <Empty className="mx-auto max-w-xl">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No students found</EmptyTitle>
        <EmptyDescription>
          Add the first student or change the active filters to see results.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Add student</Button>
        <Button variant="outline">Clear filters</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const ToastInteraction: Story = {
  render: () => (
    <Button onClick={() => toast.success("Changes saved successfully")}>
      Show success toast
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: "Show success toast" })
    )

    await within(canvasElement.ownerDocument.body).findByText(
      "Changes saved successfully"
    )
    await expect(canvasElement.ownerDocument.body).toHaveTextContent(
      "Changes saved successfully"
    )
  },
}
