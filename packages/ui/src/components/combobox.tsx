"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

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
  "aria-label"?: string
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
  "aria-label": ariaLabel,
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

  const handleItemChange = (item: ComboboxOption | null | undefined) => {
    onValueChange?.(item?.value)
  }

  const isSearchable = items.length >= 5 && searchable !== false
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      setSearchQuery("")
    }
  }, [])

  const controlledValueProps =
    value !== undefined ? { value: selectedItem } : {}

  return (
    <ComboboxPrimitive.Root
      items={items}
      defaultValue={defaultSelectedItem}
      onValueChange={handleItemChange}
      disabled={disabled}
      filter={isSearchable ? undefined : null}
      inputValue={isSearchable ? searchQuery : ""}
      onInputValueChange={isSearchable ? setSearchQuery : undefined}
      onOpenChange={handleOpenChange}
      itemToStringLabel={(item: ComboboxOption) => item?.label ?? ""}
      {...controlledValueProps}
    >
      <ComboboxPrimitive.Trigger
        aria-label={ariaLabel ?? resolvedPlaceholder}
        className={cn(
          "relative flex h-14 w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-background px-4 text-base text-foreground shadow-2xs transition-colors hover:bg-muted/30 focus-visible:border-2 focus-visible:border-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          dataInvalid && "border-destructive focus-visible:border-destructive",
          className
        )}
      >
        <span
          className={cn(
            "truncate text-start",
            !selectedItem && "text-muted-foreground/35"
          )}
        >
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
          <ComboboxPrimitive.Popup className="max-h-72 w-[var(--anchor-width)] min-w-[12rem] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {isSearchable && (
              <div className="flex items-center border-b border-border px-3 py-2.5">
                <Search className="me-2 size-4 shrink-0 text-muted-foreground" />
                <ComboboxPrimitive.Input
                  placeholder={resolvedSearchPlaceholder}
                  className="h-8 w-full bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground/35"
                />
              </div>
            )}

            <ComboboxPrimitive.Empty className="hidden px-4 py-6 text-center text-sm text-muted-foreground data-[empty]:block data-[hidden]:hidden">
              {resolvedEmptyMessage}
            </ComboboxPrimitive.Empty>

            <ComboboxPrimitive.List className="max-h-60 space-y-1 overflow-y-auto overscroll-contain p-1.5">
              {(item: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={item.value}
                  value={item}
                  disabled={item.disabled}
                  className="relative flex min-h-12 cursor-pointer items-center rounded-xl py-3 ps-10 pe-4 text-base font-medium outline-hidden transition-colors select-none hover:bg-muted focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute start-3.5 flex size-4.5 items-center justify-center">
                    <ComboboxPrimitive.ItemIndicator>
                      <Check className="size-4.5 text-primary" />
                    </ComboboxPrimitive.ItemIndicator>
                  </span>
                  <span className="truncate">{item.label}</span>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

// ─── ResponsiveCombobox ───────────────────────────────────────────────────────
// On desktop (≥ lg): renders standard Combobox dropdown.
// On mobile (< lg):  renders a trigger button that opens a bottom-sheet Drawer
//                    with a search input and scrollable option list.

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "./drawer"
import { Button } from "./button"

export interface ResponsiveComboboxProps extends ComboboxProps {
  /** Label shown in the Drawer header on mobile */
  drawerTitle?: string
}

export function ResponsiveCombobox(props: ResponsiveComboboxProps) {
  const { drawerTitle, ...comboboxProps } = props
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | undefined
  >(props.defaultValue)

  const isFa = (props.locale ?? "fa").startsWith("fa")
  const resolvedPlaceholder =
    props.placeholder ?? (isFa ? "انتخاب کنید..." : "Select an option...")

  if (!isMobile) {
    return <Combobox {...comboboxProps} />
  }

  const selectedValue =
    comboboxProps.value !== undefined
      ? (comboboxProps.value ?? undefined)
      : uncontrolledValue
  const selectedItem = comboboxProps.items.find(
    (item) => item.value === selectedValue
  )

  const filtered = search.trim()
    ? comboboxProps.items.filter((item) =>
        item.label.toLowerCase().includes(search.trim().toLowerCase())
      )
    : comboboxProps.items

  const handleSelect = (item: ComboboxOption) => {
    if (comboboxProps.value === undefined) {
      setUncontrolledValue(item.value)
    }
    comboboxProps.onValueChange?.(item.value)
    setDrawerOpen(false)
    setSearch("")
  }

  const handleClear = () => {
    if (comboboxProps.value === undefined) {
      setUncontrolledValue(undefined)
    }
    comboboxProps.onValueChange?.(undefined)
    setDrawerOpen(false)
    setSearch("")
  }

  const isSearchable =
    comboboxProps.items.length >= 5 && comboboxProps.searchable !== false

  return (
    <>
      <div
        onClick={() => {
          if (!comboboxProps.disabled) {
            setDrawerOpen(true)
          }
        }}
        data-invalid={comboboxProps["data-invalid"]}
        className={cn(
          "relative flex h-14 w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-background px-4 text-base text-foreground shadow-2xs transition-colors focus-within:border-2 focus-within:border-ring hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50 data-[invalid=true]:border-destructive",
          comboboxProps.className
        )}
      >
        <input
          type="text"
          readOnly
          role="combobox"
          aria-label={comboboxProps["aria-label"] ?? resolvedPlaceholder}
          aria-expanded={drawerOpen}
          aria-haspopup="dialog"
          inputMode="none"
          tabIndex={comboboxProps.disabled ? -1 : 0}
          disabled={comboboxProps.disabled}
          value={selectedItem ? selectedItem.label : ""}
          placeholder={resolvedPlaceholder}
          onFocus={() => {
            if (!comboboxProps.disabled) {
              setDrawerOpen(true)
            }
          }}
          className="h-full w-full cursor-pointer bg-transparent text-start text-base text-foreground outline-hidden placeholder:text-muted-foreground/35 disabled:cursor-not-allowed"
        />
        <ChevronDown className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </div>

      <Drawer
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o)
          if (!o) setSearch("")
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {drawerTitle || (isFa ? "انتخاب گزینه" : "Select option")}
            </DrawerTitle>
          </DrawerHeader>

          {isSearchable && (
            <div className="flex items-center border-b border-border px-4 py-2.5">
              <Search className="me-2 size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  props.searchPlaceholder ?? (isFa ? "جستجو..." : "Search...")
                }
                className="h-9 w-full bg-transparent text-base text-foreground outline-hidden placeholder:text-muted-foreground/35"
              />
            </div>
          )}

          <div className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-3">
            {comboboxProps.clearable !== false && selectedItem && (
              <button
                type="button"
                onClick={handleClear}
                className="flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <X className="size-4 shrink-0" />
                <span>{isFa ? "پاک کردن انتخاب" : "Clear selection"}</span>
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {props.emptyMessage ??
                  (isFa ? "موردی یافت نشد." : "No items found.")}
              </p>
            ) : (
              filtered.map((item) => {
                const isSelected = item.value === selectedValue
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex min-h-13 w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-colors disabled:opacity-50",
                      isSelected
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted/60 active:bg-muted"
                    )}
                  >
                    <span>{item.label}</span>
                    {isSelected && (
                      <Check className="size-5 shrink-0 text-primary" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              className="h-14 w-full rounded-2xl text-base font-medium"
              onClick={() => setDrawerOpen(false)}
            >
              {isFa ? "بستن" : "Close"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
