"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  Building2,
  ChevronsUpDown,
  Check,
  Search,
  Globe,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogCloseButton,
  ResponsiveDialogFooter,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter, useIsRtl } from "@/i18n/routing"

export interface InstituteSwitcherProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  className?: string
}

export function InstituteSwitcher({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  className,
}: InstituteSwitcherProps) {
  const t = useTranslations("institutes")
  const locale = useLocale()
  const isRtl = useIsRtl()
  const router = useRouter()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        setControlledOpen?.(nextOpen)
      } else {
        setInternalOpen(nextOpen)
      }
    },
    [isControlled, setControlledOpen]
  )

  const {
    activeInstitute,
    institutes,
    isLoadingInstitutes,
    selectInstitute,
    clearActiveInstitute,
  } = useActiveInstitute()

  const filteredInstitutes = React.useMemo(() => {
    if (!search.trim()) return institutes
    const q = search.toLowerCase()
    return institutes.filter(
      (inst) =>
        inst.name.toLowerCase().includes(q) ||
        inst.subdomain.toLowerCase().includes(q)
    )
  }, [institutes, search])

  const handleSelect = (institute: (typeof institutes)[0]) => {
    selectInstitute(institute)
    setOpen(false)
    router.push("/")
  }

  const handleClear = () => {
    clearActiveInstitute()
    setOpen(false)
    router.push("/institutes")
  }

  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      {trigger}

      <ResponsiveDialogContent
        className={cn("max-w-md overflow-hidden p-0", className)}
      >
        <div className="p-6 pb-3">
          <ResponsiveDialogHeader className="flex flex-row items-center justify-between">
            <ResponsiveDialogTitle>{t("switcher.title")}</ResponsiveDialogTitle>
            <ResponsiveDialogCloseButton />
          </ResponsiveDialogHeader>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("switcher.searchPlaceholder")}
              className="ps-11"
            />
          </div>
        </div>

        {/* Global Overview Option */}
        <div className="border-t border-border/60 px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className={cn(
              "h-11 w-full cursor-pointer justify-between rounded-xl px-3 text-start text-sm transition-colors",
              !activeInstitute
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
                <Globe className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {t("switcher.allInstitutes")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("switcher.globalView")}
                </p>
              </div>
            </div>
            {!activeInstitute && <Check className="size-4 text-foreground" />}
          </Button>
        </div>

        {/* Institutes List */}
        <div className="max-h-64 overflow-y-auto border-t border-border/60 px-3 py-2">
          {isLoadingInstitutes ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="size-6 text-foreground" />
            </div>
          ) : filteredInstitutes.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              {t("switcher.noResults")}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredInstitutes.map((inst) => {
                const isSelected = activeInstitute?.id === inst.id
                return (
                  <Button
                    key={inst.id}
                    type="button"
                    variant="ghost"
                    onClick={() => handleSelect(inst)}
                    className={cn(
                      "h-auto w-full cursor-pointer justify-between rounded-xl p-2.5 text-start transition-colors",
                      isSelected
                        ? "bg-emerald-500/10 font-semibold text-emerald-600"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {inst.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {inst.name}
                        </p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          {inst.subdomain}.kalameh.ir
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isSelected ? "success" : "secondary"}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {formatNumber(inst.classesCount, locale)}{" "}
                        {t("switcher.classes")}
                      </Badge>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <ActionArrow className="size-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>
          )}
        </div>

        <ResponsiveDialogFooter className="p-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-11 w-full rounded-xl"
          >
            {t("switcher.close") || "بستن"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
