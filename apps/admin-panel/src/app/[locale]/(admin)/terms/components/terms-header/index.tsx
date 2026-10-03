"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { PERMISSIONS } from "@workspace/types"
import { AdminPageHeader } from "@/components/admin-page-header"

export interface TermsHeaderProps {
  onAddTerm: () => void
}

export function TermsHeader({ onAddTerm }: TermsHeaderProps) {
  const t = useTranslations("terms")

  return (
    <AdminPageHeader
      title={t("title")}
      subtitle={t("subtitle")}
      action={{
        label: t("addTerm"),
        onClick: onAddTerm,
        permission: PERMISSIONS.MANAGE_TERMS,
      }}
    />
  )
}
