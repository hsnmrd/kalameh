import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"

const meta = {
  title: "Overlays/Examples",
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const DialogExample: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogPopup>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>Edit institute</DialogTitle>
          <DialogDescription>
            Review the institute information before saving your changes.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </DialogPopup>
    </Dialog>
  ),
  parameters: {
    layout: "fullscreen",
  },
}

export const DrawerExample: Story = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <DrawerTitle>More actions</DrawerTitle>
          <DrawerDescription>
            Choose an action for the selected student.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-2 px-4 py-3">
          <Button variant="outline">Edit student</Button>
          <Button variant="outline">Reset password</Button>
        </div>
        <DrawerFooter>
          <Button variant="outline">Close</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile1",
    },
  },
}

export const PopoverExample: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline" />}>
        Open menu
      </PopoverTrigger>
      <PopoverPopup align="start" aria-label="Profile actions">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Profile actions</p>
          <p className="text-sm text-muted-foreground">
            Popovers remain compact on desktop surfaces.
          </p>
        </div>
      </PopoverPopup>
    </Popover>
  ),
}

export const AlertDialogExample: Story = {
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Yes, delete account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}
