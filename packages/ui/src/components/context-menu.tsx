"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
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

interface ContextMenuStateContext {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile: boolean
}

const ContextMenuStateContext = React.createContext<ContextMenuStateContext>({
  open: false,
  setOpen: () => {},
  isMobile: false,
})

function ContextMenu({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  children,
  ...props
}: ContextMenuPrimitive.Root.Props) {
  const isMobile = useIsMobile()
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails: ContextMenuPrimitive.Root.ChangeEventDetails
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
      })
    },
    [isControlled, controlledOnOpenChange]
  )

  return (
    <ContextMenuStateContext.Provider value={{ open, setOpen, isMobile }}>
      <ContextMenuPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </ContextMenuPrimitive.Root>
    </ContextMenuStateContext.Provider>
  )
}

function ContextMenuTrigger({
  className,
  ...props
}: ContextMenuPrimitive.Trigger.Props) {
  const { open } = React.useContext(ContextMenuStateContext)

  return (
    <ContextMenuPrimitive.Trigger
      data-popup-open={open ? "" : undefined}
      className={cn(
        "touch-manipulation transition-colors duration-150 select-none [-webkit-touch-callout:none] data-[popup-open]:rounded-2xl data-[popup-open]:bg-muted/70",
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

export interface ContextMenuPopupProps
  extends ContextMenuPrimitive.Popup.Props {
  sideOffset?: number
  align?: "start" | "center" | "end"
  drawerTitle?: string
  title?: string
}

function ContextMenuPopup({
  className,
  children,
  sideOffset = 4,
  align = "start",
  drawerTitle,
  title,
  ...props
}: ContextMenuPopupProps) {
  const { open, setOpen, isMobile } = React.useContext(ContextMenuStateContext)

  const isFa =
    typeof document !== "undefined" && document.documentElement.lang
      ? document.documentElement.lang.toLowerCase().startsWith("fa")
      : true

  if (isMobile) {
    const resolvedTitle = drawerTitle ?? title ?? (isFa ? "عملیات" : "Actions")

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
  disabled,
  children,
  ...props
}: ContextMenuPrimitive.Item.Props & {
  variant?: "default" | "destructive"
  onSelect?: (
    event: Parameters<
      NonNullable<ContextMenuPrimitive.Item.Props["onClick"]>
    >[0]
  ) => void
}) {
  const { setOpen, isMobile } = React.useContext(ContextMenuStateContext)

  const handleClick: ContextMenuPrimitive.Item.Props["onClick"] = (event) => {
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
              NonNullable<ContextMenuPrimitive.Item.Props["onClick"]>
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
    <ContextMenuPrimitive.Item
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
    </ContextMenuPrimitive.Item>
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
  children,
  ...props
}: ContextMenuPrimitive.GroupLabel.Props) {
  const { isMobile } = React.useContext(ContextMenuStateContext)

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
    <ContextMenuPrimitive.GroupLabel
      className={cn(
        "px-3.5 py-2 text-xs font-semibold text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.GroupLabel>
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  const { isMobile } = React.useContext(ContextMenuStateContext)

  if (isMobile) {
    return <div className={cn("-mx-1 my-1.5 h-px bg-border/80", className)} />
  }

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
