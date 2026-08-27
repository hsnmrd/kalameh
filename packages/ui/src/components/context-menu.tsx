"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const ContextMenu = ContextMenuPrimitive.Root

function ContextMenuTrigger({
  className,
  ...props
}: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger
      className={cn(
        "touch-manipulation select-none [-webkit-touch-callout:none]",
        className
      )}
      {...props}
    />
  )
}

const ContextMenuGroup = ContextMenuPrimitive.Group
const ContextMenuPortal = ContextMenuPrimitive.Portal
const ContextMenuSubmenu = ContextMenuPrimitive.SubmenuRoot
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

function ContextMenuPopup({
  className,
  children,
  sideOffset = 4,
  align = "start",
  ...props
}: ContextMenuPrimitive.Popup.Props & {
  sideOffset?: number
  align?: "start" | "center" | "end"
}) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        className="z-50"
      >
        <ContextMenuPrimitive.Popup
          className={cn(
            "relative z-50 min-w-52 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-hidden transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  variant = "default",
  onClick,
  onSelect,
  ...props
}: ContextMenuPrimitive.Item.Props & {
  variant?: "default" | "destructive"
  onSelect?: (
    event: Parameters<
      NonNullable<ContextMenuPrimitive.Item.Props["onClick"]>
    >[0]
  ) => void
}) {
  const handleClick: ContextMenuPrimitive.Item.Props["onClick"] = (event) => {
    onClick?.(event)
    onSelect?.(event)
  }

  return (
    <ContextMenuPrimitive.Item
      onClick={handleClick}
      className={cn(
        "relative flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-hidden transition-colors select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10 [&_svg]:size-4.5 [&_svg]:shrink-0",
        variant === "destructive" &&
          "text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex min-h-12 cursor-pointer items-center rounded-xl py-2.5 ps-9 pe-3 text-sm font-medium outline-hidden transition-colors select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute start-2.5 flex size-4 items-center justify-center">
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <Check className="size-4" />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  ...props
}: ContextMenuPrimitive.RadioItem.Props) {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(
        "relative flex min-h-12 cursor-pointer items-center rounded-xl py-2.5 ps-9 pe-3 text-sm font-medium outline-hidden transition-colors select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10",
        className
      )}
      {...props}
    >
      <span className="absolute start-2.5 flex size-4 items-center justify-center">
        <ContextMenuPrimitive.RadioItemIndicator>
          <Circle className="size-2 fill-current" />
        </ContextMenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuGroupLabel({
  className,
  ...props
}: ContextMenuPrimitive.GroupLabel.Props) {
  return (
    <ContextMenuPrimitive.GroupLabel
      className={cn(
        "px-3.5 py-2 text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn("-mx-1.5 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ContextMenuSubmenuTrigger({
  className,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      className={cn(
        "flex min-h-12 cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium outline-hidden select-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="size-4.5 text-muted-foreground" />
    </ContextMenuPrimitive.SubmenuTrigger>
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSubmenu,
  ContextMenuRadioGroup,
  ContextMenuPopup,
  ContextMenuPopup as ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuGroupLabel,
  ContextMenuGroupLabel as ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSubmenuTrigger,
}
