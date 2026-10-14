"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react"

import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { useDirection } from "@workspace/ui/components/direction-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

// ─── Primitive Pagination Sub-components ──────────────────────────────────────

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & React.ComponentProps<typeof Button>

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      aria-current={isActive ? "page" : undefined}
      variant={isActive ? "default" : "outline"}
      size={size}
      className={cn(
        "size-8 rounded-lg text-xs font-medium transition-colors",
        isActive
          ? "border-primary bg-primary text-primary-foreground shadow-2xs"
          : "border-border/70 text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 items-center justify-center text-muted-foreground",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

// ─── High-Level DataPagination Component ──────────────────────────────────────

export interface DataPaginationLabels {
  page?: string
  of?: string
  rowsPerPage?: string
  showing?: string
  to?: string
  items?: string
  previous?: string
  next?: string
  first?: string
  last?: string
}

export interface DataPaginationProps extends React.ComponentProps<"div"> {
  pageIndex: number // 0-based
  pageSize: number
  totalItems: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  locale?: string
  labels?: DataPaginationLabels
  showPageSize?: boolean
  showTotal?: boolean
  showFirstLast?: boolean
  compact?: boolean
}

export function DataPagination({
  pageIndex,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  locale,
  labels: customLabels,
  showPageSize = true,
  showTotal = true,
  showFirstLast = true,
  compact = false,
  className,
  ...props
}: DataPaginationProps) {
  const dir = useDirection()
  const isRtl = dir === "rtl"

  const currentLocale =
    locale ??
    (typeof document !== "undefined" && document.documentElement.lang
      ? document.documentElement.lang
      : "fa")
  const isFa = currentLocale.toLowerCase().startsWith("fa")

  const labels: Required<DataPaginationLabels> = React.useMemo(() => {
    if (isFa) {
      return {
        page: customLabels?.page ?? "صفحه",
        of: customLabels?.of ?? "از",
        rowsPerPage: customLabels?.rowsPerPage ?? "سطر در صفحه",
        showing: customLabels?.showing ?? "نمایش",
        to: customLabels?.to ?? "تا",
        items: customLabels?.items ?? "مورد",
        previous: customLabels?.previous ?? "قبلی",
        next: customLabels?.next ?? "بعدی",
        first: customLabels?.first ?? "ابتدا",
        last: customLabels?.last ?? "انتها",
      }
    }
    return {
      page: customLabels?.page ?? "Page",
      of: customLabels?.of ?? "of",
      rowsPerPage: customLabels?.rowsPerPage ?? "Rows per page",
      showing: customLabels?.showing ?? "Showing",
      to: customLabels?.to ?? "to",
      items: customLabels?.items ?? "items",
      previous: customLabels?.previous ?? "Previous",
      next: customLabels?.next ?? "Next",
      first: customLabels?.first ?? "First",
      last: customLabels?.last ?? "Last",
    }
  }, [isFa, customLabels])

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const canPrevious = pageIndex > 0
  const canNext = pageIndex < pageCount - 1

  const startItem = totalItems === 0 ? 0 : pageIndex * pageSize + 1
  const endItem = Math.min(totalItems, (pageIndex + 1) * pageSize)

  // Compute visible page numbers with ellipsis
  const visiblePages = React.useMemo<(number | "ellipsis")[]>(() => {
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i)
    }

    const pages: (number | "ellipsis")[] = []
    const current = pageIndex

    if (current <= 2) {
      // Near beginning: 0, 1, 2, 3, ellipsis, pageCount - 1
      pages.push(0, 1, 2, 3, "ellipsis", pageCount - 1)
    } else if (current >= pageCount - 3) {
      // Near end: 0, ellipsis, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1
      pages.push(
        0,
        "ellipsis",
        pageCount - 4,
        pageCount - 3,
        pageCount - 2,
        pageCount - 1
      )
    } else {
      // Middle: 0, ellipsis, current - 1, current, current + 1, ellipsis, pageCount - 1
      pages.push(
        0,
        "ellipsis",
        current - 1,
        current,
        current + 1,
        "ellipsis",
        pageCount - 1
      )
    }

    return pages
  }, [pageCount, pageIndex])

  // RTL-aware navigation icons
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight
  const FirstIcon = isRtl ? ChevronsRight : ChevronsLeft
  const LastIcon = isRtl ? ChevronsLeft : ChevronsRight

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 text-xs text-muted-foreground",
          className
        )}
        {...props}
      >
        <div>
          {totalItems > 0 && (
            <span>
              {formatNumber(startItem, currentLocale)} -{" "}
              {formatNumber(endItem, currentLocale)} {labels.of}{" "}
              {formatNumber(totalItems, currentLocale)} {labels.items}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPrevious}
            aria-label={labels.previous}
            className="h-8 gap-1 rounded-lg px-2 text-xs"
          >
            <PrevIcon className="size-3.5" />
            <span className="xs:inline hidden">{labels.previous}</span>
          </Button>

          <span className="px-1 font-medium text-foreground">
            {formatNumber(pageIndex + 1, currentLocale)} /{" "}
            {formatNumber(pageCount, currentLocale)}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNext}
            aria-label={labels.next}
            className="h-8 gap-1 rounded-lg px-2 text-xs"
          >
            <span className="xs:inline hidden">{labels.next}</span>
            <NextIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row",
        className
      )}
      {...props}
    >
      {/* Left side: Range and page size */}
      <div className="flex flex-wrap items-center gap-3">
        {showTotal && (
          <span className="whitespace-nowrap">
            {labels.showing}{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(startItem, currentLocale)}
            </span>{" "}
            {labels.to}{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(endItem, currentLocale)}
            </span>{" "}
            {labels.of}{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(totalItems, currentLocale)}
            </span>{" "}
            {labels.items}
          </span>
        )}

        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">{labels.rowsPerPage}:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                if (val) {
                  onPageSizeChange(Number(val))
                }
              }}
            >
              <SelectTrigger className="h-8 w-auto min-w-[4.25rem] rounded-lg px-2.5 py-1 text-xs font-normal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {formatNumber(opt, currentLocale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right side: Navigation buttons */}
      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(0)}
            disabled={!canPrevious}
            title={labels.first}
            aria-label={labels.first}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <FirstIcon className="size-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPrevious}
          title={labels.previous}
          aria-label={labels.previous}
          className="h-8 gap-1 rounded-lg px-2.5 text-xs text-foreground"
        >
          <PrevIcon className="size-3.5" />
          <span className="hidden sm:inline">{labels.previous}</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 px-1">
          {visiblePages.map((page, idx) => {
            if (page === "ellipsis") {
              return <PaginationEllipsis key={`ellipsis-${idx}`} />
            }
            const isActive = page === pageIndex
            return (
              <PaginationLink
                key={page}
                type="button"
                isActive={isActive}
                onClick={() => onPageChange(page)}
              >
                {formatNumber(page + 1, currentLocale)}
              </PaginationLink>
            )
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNext}
          title={labels.next}
          aria-label={labels.next}
          className="h-8 gap-1 rounded-lg px-2.5 text-xs text-foreground"
        >
          <span className="hidden sm:inline">{labels.next}</span>
          <NextIcon className="size-3.5" />
        </Button>

        {showFirstLast && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={!canNext}
            title={labels.last}
            aria-label={labels.last}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <LastIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
}
