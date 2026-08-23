"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value
function SelectTrigger({ className, children, ...props }) {
  return _jsxs(SelectPrimitive.Trigger, {
    className: cn(
      "flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-2xs focus:border-ring focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
      className
    ),
    ...props,
    children: [
      children,
      _jsx(SelectPrimitive.Icon, {
        className: "size-4 shrink-0 text-muted-foreground",
        children: _jsx(ChevronDown, { className: "size-4" }),
      }),
    ],
  })
}
function SelectPopup({ className, children, ...props }) {
  return _jsx(SelectPrimitive.Portal, {
    children: _jsx(SelectPrimitive.Positioner, {
      sideOffset: 4,
      className: "z-50",
      children: _jsx(SelectPrimitive.Popup, {
        className: cn(
          "relative max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className
        ),
        ...props,
        children: _jsx(SelectPrimitive.List, {
          className: "p-1",
          children: children,
        }),
      }),
    }),
  })
}
function SelectItem({ className, children, ...props }) {
  return _jsxs(SelectPrimitive.Item, {
    className: cn(
      "relative flex w-full cursor-pointer items-center rounded-lg py-2 ps-8 pe-2 text-sm outline-hidden select-none hover:bg-muted focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      _jsx("span", {
        className: "absolute start-2 flex size-3.5 items-center justify-center",
        children: _jsx(SelectPrimitive.ItemIndicator, {
          children: _jsx(Check, { className: "size-4 text-foreground" }),
        }),
      }),
      _jsx(SelectPrimitive.ItemText, { children: children }),
    ],
  })
}
function SelectLabel({ className, ...props }) {
  return _jsx(SelectPrimitive.GroupLabel, {
    className: cn(
      "px-2 py-1.5 text-xs font-semibold text-muted-foreground",
      className
    ),
    ...props,
  })
}
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectPopup,
  SelectPopup as SelectContent,
  SelectItem,
  SelectLabel,
}
