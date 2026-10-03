import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Copy, Pencil, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"

const meta = {
  title: "Navigation/Context Menu",
  component: ContextMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

export const CardActions: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex w-80 flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-card-foreground">
        <p className="font-semibold">Advanced English</p>
        <p className="text-sm text-muted-foreground">
          Right-click or long-press this card to open its actions.
        </p>
      </ContextMenuTrigger>
      <ContextMenuPopup drawerTitle="Class actions">
        <ContextMenuGroup>
          <ContextMenuGroupLabel>Actions</ContextMenuGroupLabel>
          <ContextMenuItem>
            <Pencil data-icon="inline-start" /> Edit class
          </ContextMenuItem>
          <ContextMenuItem>
            <Copy data-icon="inline-start" /> Duplicate
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem variant="destructive">
            <Trash2 data-icon="inline-start" /> Delete class
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuPopup>
    </ContextMenu>
  ),
}

export const MobileBottomSheet: Story = {
  ...CardActions,
  parameters: { viewport: { defaultViewport: "mobile1" } },
}
