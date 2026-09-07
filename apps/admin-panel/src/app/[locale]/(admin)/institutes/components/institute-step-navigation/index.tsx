"use client"

import { useTranslations } from "next-intl"
import { Building2, CreditCard, Package, Phone } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { InstituteFormTab } from "../institute-form-types"

interface InstituteStepNavigationProps {
  activeTab: InstituteFormTab
  onChange: (tab: InstituteFormTab) => void
}

const STEPS = [
  { id: "general", icon: Building2, label: "sectionGeneral" },
  { id: "modules", icon: Package, label: "sectionModules" },
  { id: "contact", icon: Phone, label: "sectionContact" },
  { id: "banking", icon: CreditCard, label: "sectionBanking" },
] as const

export function InstituteStepNavigation({
  activeTab,
  onChange,
}: InstituteStepNavigationProps) {
  const t = useTranslations("institutes")
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted/60 p-1 sm:grid-cols-4">
      {STEPS.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          type="button"
          variant={activeTab === id ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(id)}
          className={cn(
            "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
            activeTab === id
              ? "bg-background text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{t(`createModal.${label}`)}</span>
        </Button>
      ))}
    </div>
  )
}
