"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "./drawer"
import { Button } from "./button"

interface DropdownMenuStateContext {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile: boolean
}

const DropdownMenuStateContext = React.createContext<DropdownMenuStateContext>({
  open: false,
  setOpen: () => {},
  isMobile: false,
})

function DropdownMenu({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
  ...props
}: MenuPrimitive.Root.Props) {
  const isMobile = useIsMobile()
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails: MenuPrimitive.Root.ChangeEventDetails
  ) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    controlledOnOpenChange?.(nextOpen, eventDetails)
  }

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }
      controlledOnOpenChange?.(nextOpen, {
        reason: "none",
        cancel: () => {},
        allowPropagation: () => {},
        isCanceled: false,
        isPropagationAllowed: true,
        trigger: undefined,
        event: new Event("change"),
        preventUnmountOnClose: () => {},
      })
    },
    [isControlled, controlledOnOpenChange]
  )

  return (
    <DropdownMenuStateContext.Provider value={{ open, setOpen, isMobile }}>
      <MenuPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </MenuPrimitive.Root>
    </DropdownMenuStateContext.Provider>
  )
}

function DropdownMenuTrigger({
  className,
  onClick,
  ...props
}: MenuPrimitive.Trigger.Props) {
  const { isMobile, setOpen } = React.useContext(DropdownMenuStateContext)

  const handleClick: MenuPrimitive.Trigger.Props["onClick"] = (event) => {
    if (isMobile) {
      setOpen(true)
    }
    onClick?.(event)
  }

  return (
    <MenuPrimitive.Trigger
      className={className}
      onClick={handleClick}
      {...props}
    />
  )
}

const DropdownMenuGroup = MenuPrimitive.Group
const DropdownMenuPortal = MenuPrimitive.Portal
const DropdownMenuSubmenu = MenuPrimitive.SubmenuRoot
const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup

export interface DropdownMenuPopupProps extends MenuPrimitive.Popup.Props {
  sideOffset?: number
  align?: "start" | "center" | "end"
  drawerTitle?: string
  title?: string
}

function DropdownMenuPopup({
  className,
  children,
  sideOffset = 4,
  align = "end",
  drawerTitle,
  title,
  ...props
}: DropdownMenuPopupProps) {
  const { open, setOpen, isMobile } = React.useContext(DropdownMenuStateContext)

  const isFa =
    typeof document !== "undefined" && document.documentElement.lang
      ? document.documentElement.lang.toLowerCase().startsWith("fa")
      : true

  if (isMobile) {
    const resolvedTitle =
      drawerTitle ?? title ?? (isFa ? "گزینه‌ها" : "Options")

    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{resolvedTitle}</DrawerTitle>
          </DrawerHeader>

          <div className="flex min-h-0 flex-1 flex-col space-y-1.5 overflow-y-auto overscroll-contain p-3">
            {children}
          </div>

          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full rounded-2xl text-base font-medium"
              onClick={() => setOpen(false)}
            >
              {isFa ? "بستن" : "Close"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

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
  disabled,
  children,
  ...props
}: MenuPrimitive.Item.Props & {
  variant?: "default" | "destructive"
  onSelect?: (
    event: Parameters<NonNullable<MenuPrimitive.Item.Props["onClick"]>>[0]
  ) => void
}) {
  const { setOpen, isMobile } = React.useContext(DropdownMenuStateContext)

  const handleClick: MenuPrimitive.Item.Props["onClick"] = (event) => {
    onClick?.(event)
    onSelect?.(event)
    if (isMobile) {
      setOpen(false)
    }
  }

  if (isMobile) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          handleClick(
            e as unknown as Parameters<
              NonNullable<MenuPrimitive.Item.Props["onClick"]>
            >[0]
          )
        }}
        className={cn(
          "flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors select-none hover:bg-muted/60 active:bg-muted disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
          variant === "destructive"
            ? "text-destructive hover:bg-destructive/10 active:bg-destructive/20"
            : "text-foreground",
          className
        )}
      >
        {children}
      </button>
    )
  }

  return (
    <MenuPrimitive.Item
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium outline-hidden transition-colors select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground sm:min-h-10 [&_svg]:size-4.5 [&_svg]:shrink-0",
        variant === "destructive" &&
          "text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive",
        className
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.Item>
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
  children,
  ...props
}: MenuPrimitive.GroupLabel.Props) {
  const { isMobile } = React.useContext(DropdownMenuStateContext)

  if (isMobile) {
    return (
      <div
        className={cn(
          "px-4 py-2 text-xs font-semibold text-muted-foreground",
          className
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <MenuPrimitive.GroupLabel
      className={cn(
        "px-3.5 py-2 text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.GroupLabel>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  const { isMobile } = React.useContext(DropdownMenuStateContext)

  if (isMobile) {
    return <div className={cn("-mx-1 my-1.5 h-px bg-border/80", className)} />
  }

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
