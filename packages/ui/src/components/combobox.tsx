"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown, Search, X } from "lucide-react"
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
  searchPlaceholder?: string
  emptyMessage?: string
  locale?: string
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
  placeholder,
  searchPlaceholder,
  emptyMessage,
  locale,
  disabled = false,
  searchable = true,
  clearable = true,
  className,
  "data-invalid": dataInvalid,
}: ComboboxProps) {
  const currentLocale =
    locale ??
    (typeof document !== "undefined" && document.documentElement.lang
      ? document.documentElement.lang
      : "fa")
  const isFa = currentLocale.toLowerCase().startsWith("fa")

  const resolvedPlaceholder =
    placeholder ?? (isFa ? "انتخاب کنید..." : "Select an option...")
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? (isFa ? "جستجو..." : "Search...")
  const resolvedEmptyMessage =
    emptyMessage ?? (isFa ? "موردی یافت نشد." : "No items found.")
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
      <ComboboxPrimitive.Trigger
        className={cn(
          "relative flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-2xs transition-colors hover:bg-muted/30 focus-visible:border-primary focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          dataInvalid && "border-destructive focus-visible:border-destructive",
          className
        )}
      >
        <span className="truncate text-start">
          <ComboboxPrimitive.Value placeholder={resolvedPlaceholder} />
        </span>

        <ComboboxPrimitive.Icon className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </ComboboxPrimitive.Icon>
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner
          sideOffset={4}
          className="z-50 outline-hidden"
        >
          <ComboboxPrimitive.Popup className="max-h-64 w-[var(--anchor-width)] min-w-[12rem] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {searchable && (
              <div className="flex items-center border-b border-border px-3 py-2">
                <Search className="me-2 size-4 shrink-0 text-muted-foreground" />
                <ComboboxPrimitive.Input
                  placeholder={resolvedSearchPlaceholder}
                  className="h-7 w-full bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
                />
              </div>
            )}

            <ComboboxPrimitive.Empty className="p-3 text-center text-xs text-muted-foreground">
              {resolvedEmptyMessage}
            </ComboboxPrimitive.Empty>

            <ComboboxPrimitive.List className="max-h-48 overflow-y-auto p-1">
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
