"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@workspace/ui/lib/utils"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "./drawer"
import { Button } from "./button"

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

export interface ResponsivePopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactElement
  drawerTitle: React.ReactNode
  children: React.ReactNode
  className?: string
  drawerClassName?: string
  drawerBodyClassName?: string
  sideOffset?: number
  align?: "start" | "center" | "end"
}

export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  drawerTitle,
  children,
  className,
  drawerClassName,
  drawerBodyClassName,
  sideOffset = 4,
  align = "center",
}: ResponsivePopoverProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className={drawerClassName}>
          <DrawerHeader>
            <DrawerTitle>{drawerTitle}</DrawerTitle>
          </DrawerHeader>
          <div
            className={cn(
              "flex-1 overflow-y-auto px-4 pt-2",
              drawerBodyClassName
            )}
          >
            {children}
          </div>
          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full rounded-2xl text-base font-medium"
              onClick={() => onOpenChange(false)}
            >
              بستن
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverPopup className={className} sideOffset={sideOffset} align={align}>
        {children}
      </PopoverPopup>
    </Popover>
  )
}
