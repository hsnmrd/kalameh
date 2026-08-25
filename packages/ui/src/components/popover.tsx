"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@workspace/ui/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverPortal = PopoverPrimitive.Portal
const PopoverClose = PopoverPrimitive.Close

function PopoverPopup({
  className,
  children,
  sideOffset = 4,
  align = "center",
  ...props
}: PopoverPrimitive.Popup.Props & {
  sideOffset?: number
  align?: "start" | "center" | "end"
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          className={cn(
            "relative z-50 w-72 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-md outline-hidden transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverClose,
  PopoverPopup,
  PopoverPopup as PopoverContent,
}

// ─── ResponsivePopover ────────────────────────────────────────────────────────
// On desktop: renders a standard Popover anchored to the trigger.
// On mobile:  renders a bottom-sheet Drawer opened by the trigger.

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./drawer"

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

export interface ResponsivePopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
  /** Title shown in the Drawer header on mobile */
  drawerTitle?: string
  children: React.ReactNode
  className?: string
}

export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  drawerTitle,
  children,
  className,
}: ResponsivePopoverProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className={className}>
            {drawerTitle && (
              <DrawerHeader>
                <DrawerTitle>{drawerTitle}</DrawerTitle>
              </DrawerHeader>
            )}
            <div className="pb-safe-or-4 overflow-y-auto">{children}</div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger && <PopoverTrigger render={<span />}>{trigger}</PopoverTrigger>}
      <PopoverPopup className={className}>{children}</PopoverPopup>
    </Popover>
  )
}
