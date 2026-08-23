"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
export function Combobox({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option...",
  emptyMessage = "No items found.",
  disabled = false,
  searchable = true,
  clearable = true,
  className,
  "data-invalid": dataInvalid,
}) {
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value]
  )
  const defaultSelectedItem = React.useMemo(
    () => items.find((item) => item.value === defaultValue) ?? null,
    [items, defaultValue]
  )
  const handleItemChange = (item) => {
    onValueChange?.(item?.value)
  }
  return _jsxs(ComboboxPrimitive.Root, {
    items: items,
    value: selectedItem,
    defaultValue: defaultSelectedItem,
    onValueChange: handleItemChange,
    disabled: disabled,
    children: [
      _jsxs(ComboboxPrimitive.InputGroup, {
        className: cn(
          "relative flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-2xs transition-colors focus-within:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          !searchable && "cursor-pointer",
          dataInvalid && "border-destructive focus-within:border-destructive",
          className
        ),
        children: [
          _jsx(ComboboxPrimitive.Input, {
            placeholder: placeholder,
            readOnly: !searchable,
            className: cn(
              "h-full w-full border-0 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground",
              !searchable && "cursor-pointer select-none"
            ),
          }),
          _jsxs("div", {
            className: "flex items-center gap-1",
            children: [
              clearable &&
                _jsx(ComboboxPrimitive.Clear, {
                  className:
                    "cursor-pointer rounded-sm p-0.5 text-muted-foreground hover:text-foreground",
                  "aria-label": "Clear selection",
                  children: _jsx(X, { className: "size-3.5" }),
                }),
              _jsx(ComboboxPrimitive.Trigger, {
                className:
                  "cursor-pointer rounded-sm p-0.5 text-muted-foreground hover:text-foreground",
                "aria-label": "Toggle options",
                children: _jsx(ChevronDown, { className: "size-4" }),
              }),
            ],
          }),
        ],
      }),
      _jsx(ComboboxPrimitive.Portal, {
        children: _jsx(ComboboxPrimitive.Positioner, {
          sideOffset: 4,
          className: "z-50",
          children: _jsxs(ComboboxPrimitive.Popup, {
            className:
              "max-h-60 w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            children: [
              _jsx(ComboboxPrimitive.Empty, {
                className: "p-3 text-center text-xs text-muted-foreground",
                children: emptyMessage,
              }),
              _jsx(ComboboxPrimitive.List, {
                className: "p-0.5",
                children: (item) =>
                  _jsxs(
                    ComboboxPrimitive.Item,
                    {
                      value: item,
                      disabled: item.disabled,
                      className:
                        "relative flex cursor-pointer items-center rounded-lg py-2 ps-8 pe-2 text-sm outline-hidden select-none hover:bg-muted focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      children: [
                        _jsx("span", {
                          className:
                            "absolute start-2 flex size-3.5 items-center justify-center",
                          children: _jsx(ComboboxPrimitive.ItemIndicator, {
                            children: _jsx(Check, {
                              className: "size-4 text-foreground",
                            }),
                          }),
                        }),
                        _jsx("span", { children: item.label }),
                      ],
                    },
                    item.value
                  ),
              }),
            ],
          }),
        }),
      }),
    ],
  })
}
