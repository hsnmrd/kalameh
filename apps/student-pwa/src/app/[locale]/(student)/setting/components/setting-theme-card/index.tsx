"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function SettingThemeCard() {
  const t = useTranslations("setting")
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const options = [
    {
      id: "light",
      label: t("theme.light"),
      icon: Sun,
    },
    {
      id: "dark",
      label: t("theme.dark"),
      icon: Moon,
    },
    {
      id: "system",
      label: t("theme.system"),
      icon: Laptop,
    },
  ] as const

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t("theme.title")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("theme.description")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = mounted && theme === option.id

          return (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              onClick={() => setTheme(option.id)}
              className={cn(
                "flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all",
                isSelected
                  ? "border-primary bg-primary/5 text-primary shadow-2xs"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-foreground">
                  {option.label}
                </span>
                {isSelected && <Check className="size-3 text-primary" />}
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
