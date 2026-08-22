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
  const t = useTranslations("institutes.switcher")
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
              "h-9 max-w-[220px] cursor-pointer items-center justify-between gap-2 rounded-xl border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 transition-all hover:border-slate-300 hover:bg-slate-100 sm:max-w-[280px]",
              activeInstitute &&
                "border-emerald-200 bg-emerald-50/70 text-emerald-900",
              className
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5 truncate">
              {activeInstitute ? (
                <Building2 className="size-3.5 shrink-0 text-emerald-600" />
              ) : (
                <Globe className="size-3.5 shrink-0 text-slate-500" />
              )}
              <span className="truncate">
                {activeInstitute ? activeInstitute.name : t("allInstitutes")}
              </span>
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
          </Button>
        }
      />

      <DialogPopup className="max-w-md p-0">
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <DialogCloseButton />

          <div className="relative mt-4">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 ps-9 text-sm"
            />
          </div>
        </div>

        {/* Global Overview Option */}
        <div className="border-t border-slate-100 px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className={cn(
              "h-11 w-full cursor-pointer justify-between rounded-xl px-3 text-start text-sm transition-colors",
              !activeInstitute
                ? "bg-slate-100 font-semibold text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                <Globe className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">{t("allInstitutes")}</p>
                <p className="text-[11px] text-slate-400">{t("globalView")}</p>
              </div>
            </div>
            {!activeInstitute && <Check className="size-4 text-slate-900" />}
          </Button>
        </div>

        {/* Institutes List */}
        <div className="max-h-64 overflow-y-auto border-t border-slate-100 px-3 py-2">
          {isLoadingInstitutes ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="size-6 text-slate-600" />
            </div>
          ) : filteredInstitutes.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              {t("noResults")}
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
                        ? "bg-emerald-50 font-semibold text-emerald-950"
                        : "text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {inst.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {inst.name}
                        </p>
                        <p className="truncate font-mono text-[10px] text-slate-400">
                          {inst.subdomain}.kalameh.ir
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isSelected ? "success" : "secondary"}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {inst.classesCount} {t("classes")}
                      </Badge>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <ActionArrow className="size-3 shrink-0 text-slate-400" />
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
