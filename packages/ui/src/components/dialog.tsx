"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DialogPopup({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPrimitive.Popup
          className={cn(
            "relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl transition-all duration-150 focus:outline-hidden data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </div>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-start",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-lg leading-none font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DialogCloseButton({
  className,
  ...props
}: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "absolute end-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-ring focus:outline-hidden",
        className
      )}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  )
}

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerCloseButton,
} from "./drawer"

// ─── ResponsiveDialog ─────────────────────────────────────────────────────────
// On mobile (< lg): renders a bottom-sheet Drawer.
// On desktop (≥ lg): renders the standard centered Dialog.
//
// Usage mirrors Dialog:
//   <ResponsiveDialog open={open} onOpenChange={setOpen}>
//     <ResponsiveDialogContent>
//       <ResponsiveDialogHeader>
//         <ResponsiveDialogTitle>…</ResponsiveDialogTitle>
//       </ResponsiveDialogHeader>
//       …
//       <ResponsiveDialogFooter>…</ResponsiveDialogFooter>
//     </ResponsiveDialogContent>
//   </ResponsiveDialog>

interface ResponsiveDialogContextValue {
  isMobile: boolean
}
const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextValue>({ isMobile: false })

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value={{ isMobile: true }}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    )
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext)

  if (isMobile) {
    return (
      <DrawerContent className={cn("px-0", className)} {...props}>
        {children}
      </DrawerContent>
    )
  }

  return (
    <DialogPopup className={className} {...props}>
      {children}
    </DialogPopup>
  )
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext)
  if (isMobile) {
    return <DrawerHeader className={cn("px-4 pt-2", className)} {...props} />
  }
  return <DialogHeader className={className} {...props} />
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext)
  if (isMobile) {
    return <DrawerFooter className={className} {...props} />
  }
  return <DialogFooter className={className} {...props} />
}

function ResponsiveDialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext)
  if (isMobile) {
    return <DrawerTitle className={className} {...props} />
  }
  return <DialogTitle className={className} {...props} />
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext)
  if (isMobile) {
    return <DrawerDescription className={className} {...props} />
  }
  return <DialogDescription className={className} {...props} />
}

function ResponsiveDialogCloseButton({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext)
  if (isMobile) {
    return <DrawerCloseButton className={className} {...(props as object)} />
  }
  return <DialogCloseButton className={className} {...(props as object)} />
}

// ─── FormDialog (Fullscreen on mobile, centered modal on desktop) ───────────────
// For modals containing forms (inputs, validation, selects, keyboard interaction).
// Renders as a full-screen modal on mobile viewports and a centered dialog on desktop,
// preventing virtual keyboard clipping and drawer scrolling issues.

function FormDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

function FormDialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-0 z-50 flex h-dvh max-h-dvh min-h-0 w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-background p-0 text-foreground outline-hidden transition-all duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:relative sm:inset-auto sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-6 sm:text-card-foreground sm:shadow-xl",
            className
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </div>
    </DialogPortal>
  )
}

function FormDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-3 sm:border-0 sm:p-0 sm:pb-4",
        className
      )}
      {...props}
    />
  )
}

function FormDialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-base font-semibold tracking-tight text-foreground sm:text-lg",
        className
      )}
      {...props}
    />
  )
}

function FormDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-xs text-muted-foreground sm:text-sm", className)}
      {...props}
    />
  )
}

function FormDialogCloseButton({
  className,
  ...props
}: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-hidden sm:absolute sm:end-4 sm:top-4",
        className
      )}
      {...props}
    >
      <X className="size-5 sm:size-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  )
}

function FormDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-border/80 bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:border-0 sm:bg-transparent sm:p-0 sm:pt-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogCloseButton,
  // Responsive variants (for non-form / drawer dialogs)
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogCloseButton,
  // Form dialog variants (fullscreen on mobile, centered modal on desktop)
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogFooter,
  FormDialogTitle,
  FormDialogDescription,
  FormDialogCloseButton,
}
