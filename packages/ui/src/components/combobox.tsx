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

  const isSearchable = searchable !== undefined ? searchable : items.length > 6

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
          "relative flex h-14 w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-background px-4 text-base text-foreground shadow-2xs transition-colors hover:bg-muted/30 focus-visible:border-2 focus-visible:border-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
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
            {isSearchable && (
              <div className="flex items-center border-b border-border px-3 py-2">
                <Search className="me-2 size-4 shrink-0 text-muted-foreground" />
                <ComboboxPrimitive.Input
                  placeholder={resolvedSearchPlaceholder}
                  className="h-8 w-full bg-transparent text-base text-foreground outline-hidden placeholder:text-muted-foreground sm:text-sm"
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

// ─── ResponsiveCombobox ───────────────────────────────────────────────────────
// On desktop (≥ lg): renders standard Combobox dropdown.
// On mobile (< lg):  renders a trigger button that opens a bottom-sheet Drawer
//                    with a search input and scrollable option list.

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./drawer"

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

export interface ResponsiveComboboxProps extends ComboboxProps {
  /** Label shown in the Drawer header on mobile */
  drawerTitle?: string
}

export function ResponsiveCombobox(props: ResponsiveComboboxProps) {
  const { drawerTitle, ...comboboxProps } = props
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const isFa = (props.locale ?? "fa").startsWith("fa")
  const resolvedPlaceholder =
    props.placeholder ?? (isFa ? "انتخاب کنید..." : "Select an option...")

  if (!isMobile) {
    return <Combobox {...comboboxProps} />
  }

  const selectedItem = comboboxProps.items.find(
    (item) => item.value === comboboxProps.value
  )

  const filtered = search.trim()
    ? comboboxProps.items.filter((item) =>
        item.label.toLowerCase().includes(search.trim().toLowerCase())
      )
    : comboboxProps.items

  const handleSelect = (item: ComboboxOption) => {
    comboboxProps.onValueChange?.(item.value)
    setDrawerOpen(false)
    setSearch("")
  }

  const handleClear = () => {
    comboboxProps.onValueChange?.(undefined)
    setDrawerOpen(false)
    setSearch("")
  }

  const isSearchable =
    comboboxProps.searchable !== undefined
      ? comboboxProps.searchable
      : comboboxProps.items.length > 6

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        disabled={comboboxProps.disabled}
        data-invalid={comboboxProps["data-invalid"]}
        className={cn(
          "relative flex h-14 w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-background px-4 text-base text-foreground shadow-2xs transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50 data-[invalid=true]:border-destructive",
          comboboxProps.className
        )}
      >
        <span className="truncate text-start">
          {selectedItem ? (
            selectedItem.label
          ) : (
            <span className="text-muted-foreground">{resolvedPlaceholder}</span>
          )}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>

      <Drawer
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o)
          if (!o) setSearch("")
        }}
      >
        <DrawerContent>
          {drawerTitle && (
            <DrawerHeader>
              <DrawerTitle>{drawerTitle}</DrawerTitle>
            </DrawerHeader>
          )}

          {isSearchable && (
            <div className="flex items-center border-b border-border px-4 py-2">
              <Search className="me-2 size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  props.searchPlaceholder ?? (isFa ? "جستجو..." : "Search...")
                }
                className="h-9 w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-1">
            {comboboxProps.clearable !== false && selectedItem && (
              <button
                type="button"
                onClick={handleClear}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
                <span>{isFa ? "پاک کردن" : "Clear"}</span>
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {props.emptyMessage ??
                  (isFa ? "موردی یافت نشد." : "No items found.")}
              </p>
            ) : (
              filtered.map((item) => {
                const isSelected = item.value === comboboxProps.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-3 text-sm disabled:opacity-50",
                      isSelected
                        ? "bg-muted font-semibold text-foreground"
                        : "text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {isSelected && <Check className="size-4" />}
                    </span>
                    {item.label}
                  </button>
                )
              })
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
