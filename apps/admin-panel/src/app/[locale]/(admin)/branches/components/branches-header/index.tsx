"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { PERMISSIONS } from "@workspace/types"
import { AdminPageHeader } from "@/components/admin-page-header"

export interface BranchesHeaderProps {
  onAddBranch: () => void
}

export function BranchesHeader({ onAddBranch }: BranchesHeaderProps) {
  const t = useTranslations("branches")

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("subtitle")}
      action={{
        label: t("addBranch"),
        onClick: onAddBranch,
        permission: PERMISSIONS.MANAGE_BRANCHES,
      }}
    />
  )
}
