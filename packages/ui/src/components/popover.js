"use client"
import { jsx as _jsx } from "react/jsx-runtime"
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
}) {
  return _jsx(PopoverPrimitive.Portal, {
    children: _jsx(PopoverPrimitive.Positioner, {
      sideOffset: sideOffset,
      align: align,
      className: "z-50",
      children: _jsx(PopoverPrimitive.Popup, {
        className: cn(
          "relative z-50 w-72 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-md outline-hidden transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className
        ),
        ...props,
        children: children,
      }),
    }),
  })
}
export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverClose,
  PopoverPopup,
  PopoverPopup as PopoverContent,
}
