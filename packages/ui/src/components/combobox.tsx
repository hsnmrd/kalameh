"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  items: ComboboxOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  "data-invalid"?: boolean
}

export function Combobox({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option...",
  emptyMessage = "No items found.",
  disabled = false,
  className,
  "data-invalid": dataInvalid,
}: ComboboxProps) {
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value),
    [items, value]
  )

  const defaultSelectedItem = React.useMemo(
    () => items.find((item) => item.value === defaultValue),
    [items, defaultValue]
  )

  const handleItemChange = (item: ComboboxOption | null) => {
    onValueChange?.(item?.value)
  }

  return (
    <ComboboxPrimitive.Root
      items={items}
      value={selectedItem}
      defaultValue={defaultSelectedItem}
      onValueChange={handleItemChange}
      disabled={disabled}
    >
      <ComboboxPrimitive.InputGroup
        className={cn(
          "relative flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-2xs transition-colors focus-within:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
          dataInvalid && "border-destructive focus-within:border-destructive",
          className
        )}
      >
        <ComboboxPrimitive.Input
          placeholder={placeholder}
          className="h-full w-full border-0 bg-transparent text-sm text-slate-900 outline-hidden placeholder:text-slate-400"
        />

        <div className="flex items-center gap-1">
          <ComboboxPrimitive.Clear
            className="cursor-pointer rounded-sm p-0.5 text-slate-400 hover:text-slate-700"
            aria-label="Clear selection"
          >
            <X className="size-3.5" />
          </ComboboxPrimitive.Clear>

          <ComboboxPrimitive.Trigger
            className="cursor-pointer rounded-sm p-0.5 text-slate-400 hover:text-slate-700"
            aria-label="Toggle options"
          >
            <ChevronDown className="size-4" />
          </ComboboxPrimitive.Trigger>
        </div>
      </ComboboxPrimitive.InputGroup>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
          <ComboboxPrimitive.Popup className="max-h-60 w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-lg data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <ComboboxPrimitive.Empty className="p-3 text-center text-xs text-slate-500">
              {emptyMessage}
            </ComboboxPrimitive.Empty>

            <ComboboxPrimitive.List className="p-0.5">
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  className="relative flex cursor-pointer items-center rounded-lg py-2 ps-8 pe-2 text-sm outline-hidden select-none hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute start-2 flex size-3.5 items-center justify-center">
                    <ComboboxPrimitive.ItemIndicator>
                      <Check className="size-4 text-slate-900" />
                    </ComboboxPrimitive.ItemIndicator>
                  </span>
                  <span>{item.label}</span>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}
