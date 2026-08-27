"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const DropdownMenu = MenuPrimitive.Root
const DropdownMenuTrigger = MenuPrimitive.Trigger
const DropdownMenuGroup = MenuPrimitive.Group
const DropdownMenuPortal = MenuPrimitive.Portal
const DropdownMenuSubmenu = MenuPrimitive.SubmenuRoot
const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup

function DropdownMenuPopup({
  className,
  children,
  sideOffset = 4,
  align = "end",
  ...props
}: MenuPrimitive.Popup.Props & {
  sideOffset?: number
  align?: "start" | "center" | "end"
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        className="z-50"
      >
        <MenuPrimitive.Popup
          className={cn(
            "relative z-50 min-w-52 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-hidden transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  variant = "default",
  onClick,
  onSelect,
  ...props
}: MenuPrimitive.Item.Props & {
  variant?: "default" | "destructive"
  onSelect?: (
    event: Parameters<NonNullable<MenuPrimitive.Item.Props["onClick"]>>[0]
  ) => void
}) {
  const handleClick: MenuPrimitive.Item.Props["onClick"] = (event) => {
    onClick?.(event)
    onSelect?.(event)
  }

  return (
    <MenuPrimitive.Item
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

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      className={cn(
        "relative flex min-h-12 cursor-pointer items-center rounded-xl py-2.5 ps-9 pe-3 text-sm font-medium outline-hidden transition-colors select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute start-2.5 flex size-4 items-center justify-center">
        <MenuPrimitive.CheckboxItemIndicator>
          <Check className="size-4" />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        "relative flex min-h-12 cursor-pointer items-center rounded-xl py-2.5 ps-9 pe-3 text-sm font-medium outline-hidden transition-colors select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10",
        className
      )}
      {...props}
    >
      <span className="absolute start-2.5 flex size-4 items-center justify-center">
        <MenuPrimitive.RadioItemIndicator>
          <Circle className="size-2 fill-current" />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuGroupLabel({
  className,
  ...props
}: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      className={cn(
        "px-3.5 py-2 text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      className={cn("-mx-1.5 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuSubmenuTrigger({
  className,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props) {
  return (
    <MenuPrimitive.SubmenuTrigger
      className={cn(
        "flex min-h-12 cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium outline-hidden select-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="size-4.5 text-muted-foreground" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSubmenu,
  DropdownMenuRadioGroup,
  DropdownMenuPopup,
  DropdownMenuPopup as DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuGroupLabel,
  DropdownMenuGroupLabel as DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSubmenuTrigger,
}
