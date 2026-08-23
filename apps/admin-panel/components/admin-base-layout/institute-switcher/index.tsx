"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter, useIsRtl } from "@/i18n/routing"

export interface InstituteSwitcherProps {
  className?: string
}

export function InstituteSwitcher({ className }: InstituteSwitcherProps) {
  const t = useTranslations("institutes")
  const isRtl = useIsRtl()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 max-w-[220px] cursor-pointer items-center justify-between gap-2 rounded-xl border-border bg-background px-3 text-xs font-semibold text-foreground transition-all hover:bg-muted sm:max-w-[280px]",
              activeInstitute &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
              className
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5 truncate">
              {activeInstitute ? (
                <Building2 className="size-3.5 shrink-0 text-emerald-600" />
              ) : (
                <Globe className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">
                {activeInstitute
                  ? activeInstitute.name
                  : t("switcher.allInstitutes")}
              </span>
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        }
      />

      <DialogPopup className="max-w-md p-0">
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle>{t("switcher.title")}</DialogTitle>
            <DialogDescription>{t("switcher.description")}</DialogDescription>
          </DialogHeader>
          <DialogCloseButton />

          <div className="relative mt-4">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("switcher.searchPlaceholder")}
              className="h-11 border-border bg-background ps-9 text-sm text-foreground"
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
                        {inst.classesCount} {t("switcher.classes")}
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
      </DialogPopup>
    </Dialog>
  )
}
