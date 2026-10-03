"use client"

import { useTranslations } from "next-intl"
import { UserCheck } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export function TeachersTableEmptyState() {
  const t = useTranslations("teachers")

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserCheck className="size-8 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>{t("table.empty")}</EmptyTitle>
        <EmptyDescription>{t("subtitle")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
