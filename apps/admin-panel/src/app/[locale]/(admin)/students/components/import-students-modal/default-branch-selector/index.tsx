"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Building2 } from "lucide-react"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"

interface DefaultBranchSelectorProps {
  branches: Array<{ id: string; name: string; isActive?: boolean }>
  value: string
  onChange: (value: string) => void
}

export function DefaultBranchSelector({
  branches,
  value,
  onChange,
}: DefaultBranchSelectorProps) {
  const t = useTranslations("students.importModal")

  const branchOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "ROOT", label: t("defaultBranchNone") },
      ...branches.map((b) => ({ value: b.id, label: b.name })),
    ],
    [branches, t]
  )

  if (branches.length === 0) {
    return null
  }

  const singleBranch = branches[0]
  if (branches.length === 1 && singleBranch) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <Building2 className="size-4 shrink-0 text-muted-foreground" />
        <span>{t("singleBranchNotice", { branch: singleBranch.name })}</span>
      </div>
    )
  }

  return (
    <Field>
      <FieldLabel>{t("defaultBranch")}</FieldLabel>
      <ResponsiveCombobox
        items={branchOptions}
        value={value || "ROOT"}
        onValueChange={(val) => onChange(val === "ROOT" ? "" : val || "")}
        placeholder={t("defaultBranchPlaceholder")}
        drawerTitle={t("defaultBranch")}
        searchable={false}
        clearable={false}
      />
      <FieldDescription>{t("defaultBranchHint")}</FieldDescription>
    </Field>
  )
}
