"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Languages, Check } from "lucide-react"
import { LOCALES_LIST, type SupportedLocale } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter, usePathname } from "@/i18n/routing"

export function SettingLanguageCard() {
  const t = useTranslations("setting")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleSwitchLanguage = (newLocale: SupportedLocale) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale })
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Languages className="size-4 text-primary" />
          <span>{t("language.title")}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("language.description")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {LOCALES_LIST.map((lang) => {
          const isSelected = locale === lang.code

          return (
            <Button
              key={lang.code}
              type="button"
              variant="outline"
              onClick={() => handleSwitchLanguage(lang.code)}
              className={cn(
                "flex min-h-[56px] cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all",
                isSelected
                  ? "border-primary bg-primary/5 text-primary shadow-2xs"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  {lang.nativeName} ({lang.directionLabel})
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {lang.name}
                </span>
              </div>
              {isSelected && <Check className="size-3.5 text-primary" />}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
