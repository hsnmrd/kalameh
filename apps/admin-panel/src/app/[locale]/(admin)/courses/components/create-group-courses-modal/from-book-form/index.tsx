"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search, Globe, BookOpen, Layers } from "lucide-react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Counter } from "@workspace/ui/components/counter"
import { PriceInput } from "@workspace/ui/components/price-input"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { BookDto, CourseDto } from "@workspace/types"

export interface SelectedBookConfig {
  termsCount: number
  baseFee?: number | null
  startingPrerequisiteId?: string | null
}

export interface FromBookFormProps {
  books: BookDto[]
  courses: CourseDto[]
  selectedBooks: Record<string, SelectedBookConfig>
  onToggleBook: (bookId: string) => void
  onUpdateBook: (bookId: string, patch: Partial<SelectedBookConfig>) => void
  onSelectAll?: () => void
  onClearAll?: () => void
}

export function FromBookForm({
  books,
  courses: _courses,
  selectedBooks,
  onToggleBook,
  onUpdateBook,
  onSelectAll,
  onClearAll,
}: FromBookFormProps) {
  const t = useTranslations("courses")
  const tb = useTranslations("books")

  const [search, setSearch] = React.useState("")
  const [filterMode, setFilterMode] = React.useState<"all" | "selected">("all")

  const selectedCount = Object.keys(selectedBooks).length

  // Filter books by search and filterMode
  const filteredBooks = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return books.filter((book) => {
      if (filterMode === "selected" && !selectedBooks[book.id]) {
        return false
      }
      if (!q) return true
      return (
        book.title.toLowerCase().includes(q) ||
        book.author?.toLowerCase().includes(q) ||
        book.publisher?.toLowerCase().includes(q)
      )
    })
  }, [books, search, filterMode, selectedBooks])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
      {/* Search & Filter Header */}
      <div className="flex flex-col gap-2">
        <div className="relative w-full">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("createGroupModal.searchBooks")}
            className="ps-11"
          />
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Filter chips & bulk actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={filterMode === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("all")}
              className="h-8 rounded-lg px-2.5 text-xs"
            >
              <BookOpen className="me-1 size-3.5 text-muted-foreground" />
              <span>{t("createGroupModal.filterAll")}</span>
              <span className="ms-1 font-mono text-muted-foreground">
                ({formatNumber(books.length)})
              </span>
            </Button>
            <Button
              type="button"
              variant={filterMode === "selected" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterMode("selected")}
              className="h-8 rounded-lg px-2.5 text-xs"
            >
              <Layers className="me-1 size-3.5 text-muted-foreground" />
              <span>{t("createGroupModal.filterSelected")}</span>
              <span className="ms-1 font-mono text-muted-foreground">
                ({formatNumber(selectedCount)})
              </span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {onSelectAll && filteredBooks.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="h-8 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("createGroupModal.selectAll")}
              </Button>
            )}
            {onClearAll && selectedCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-8 rounded-lg px-2 text-xs text-destructive hover:bg-destructive/10"
              >
                {t("createGroupModal.clearSelection")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Books List */}
      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
          <BookOpen className="mb-2 size-8 text-muted-foreground/60" />
          <span className="text-sm font-medium">
            {t("createGroupModal.noBooksFound")}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredBooks.map((book) => {
            const isChecked = Boolean(selectedBooks[book.id])
            const bookConfig = selectedBooks[book.id]

            // Generate preview for this book
            const termsCount = bookConfig?.termsCount ?? 3
            const previewTitles: string[] = []
            for (let i = 1; i <= termsCount; i++) {
              previewTitles.push(`${book.title} - ${i}`)
            }

            return (
              <div
                key={book.id}
                className={`flex flex-col rounded-2xl border transition-all ${
                  isChecked
                    ? "border-primary/50 bg-primary/5 shadow-2xs"
                    : "border-border/70 bg-card hover:border-border"
                } p-3 sm:p-4`}
              >
                {/* Book Header Row */}
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => onToggleBook(book.id)}
                      id={`book-check-${book.id}`}
                      aria-label={book.title}
                    />
                  </div>

                  <label
                    htmlFor={`book-check-${book.id}`}
                    className="flex flex-1 cursor-pointer flex-col gap-1.5 select-none"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {book.title}
                      </span>
                      {book.isGlobal && (
                        <Badge
                          variant="secondary"
                          className="h-5 gap-1 rounded-md px-1.5 text-[10px]"
                        >
                          <Globe className="size-2.5 text-muted-foreground" />
                          <span>{tb("globalBadge")}</span>
                        </Badge>
                      )}
                    </div>
                    {book.publisher && (
                      <span className="text-xs text-muted-foreground">
                        {book.publisher}
                      </span>
                    )}
                  </label>
                </div>

                {/* Expanded configuration for checked book */}
                {isChecked && bookConfig && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Counter for terms count */}
                      <Field>
                        <FieldLabel className="text-xs font-medium text-muted-foreground">
                          {t("createGroupModal.termsCountForBook")}
                        </FieldLabel>
                        <Counter
                          min={1}
                          max={20}
                          value={bookConfig.termsCount}
                          onValueChange={(val) =>
                            onUpdateBook(book.id, { termsCount: val })
                          }
                          size="default"
                          className="w-full"
                        />
                      </Field>

                      {/* Price input for base fee */}
                      <Field>
                        <FieldLabel className="text-xs font-medium text-muted-foreground">
                          {t("createGroupModal.feeForBook")}
                        </FieldLabel>
                        <PriceInput
                          value={bookConfig.baseFee}
                          onValueChange={(val) =>
                            onUpdateBook(book.id, { baseFee: val })
                          }
                          placeholder={t("createGroupModal.feePlaceholder")}
                        />
                      </Field>
                    </div>

                    {/* Live Preview for this book */}
                    <div className="flex flex-col gap-1.5 rounded-xl bg-background/60 p-2.5 text-xs">
                      <span className="font-semibold text-muted-foreground">
                        {t("createGroupModal.previewCourses")}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {previewTitles.map((title) => (
                          <Badge
                            key={title}
                            variant="outline"
                            className="h-6 rounded-lg bg-background font-normal text-foreground"
                          >
                            {title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
