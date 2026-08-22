"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ComboboxProps {
  items: ComboboxOption[]
  value?: string | null
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
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
  searchable = true,
  clearable = true,
  className,
  "data-invalid": dataInvalid,
}: ComboboxProps) {
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value]
  )

  const defaultSelectedItem = React.useMemo(
    () => items.find((item) => item.value === defaultValue) ?? null,
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
          "relative flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-2xs transition-colors focus-within:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          !searchable && "cursor-pointer",
          dataInvalid && "border-destructive focus-within:border-destructive",
          className
        )}
      >
        <ComboboxPrimitive.Input
          placeholder={placeholder}
          readOnly={!searchable}
          className={cn(
            "h-full w-full border-0 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground",
            !searchable && "cursor-pointer select-none"
          )}
        />

        <div className="flex items-center gap-1">
          {clearable && (
            <ComboboxPrimitive.Clear
              className="cursor-pointer rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </ComboboxPrimitive.Clear>
          )}

          <ComboboxPrimitive.Trigger
            className="cursor-pointer rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Toggle options"
          >
            <ChevronDown className="size-4" />
          </ComboboxPrimitive.Trigger>
        </div>
      </ComboboxPrimitive.InputGroup>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
          <ComboboxPrimitive.Popup className="max-h-60 w-[var(--anchor-width)] overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <ComboboxPrimitive.Empty className="p-3 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </ComboboxPrimitive.Empty>

            <ComboboxPrimitive.List className="p-0.5">
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  disabled={item.disabled}
                  className="relative flex cursor-pointer items-center rounded-lg py-2 ps-8 pe-2 text-sm outline-hidden select-none hover:bg-muted focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute start-2 flex size-3.5 items-center justify-center">
                    <ComboboxPrimitive.ItemIndicator>
                      <Check className="size-4 text-foreground" />
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
