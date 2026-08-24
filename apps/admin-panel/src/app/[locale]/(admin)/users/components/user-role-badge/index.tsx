"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"
import { ROLES, type Role } from "@workspace/types"

export interface UserRoleBadgeProps {
  role: Role
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const t = useTranslations("users.roles")

  switch (role) {
    case ROLES.SUPER_ADMIN:
      return (
        <Badge
          variant="outline"
          className="border-purple-500/30 bg-purple-500/10 text-purple-600"
        >
          {t("SUPER_ADMIN")}
        </Badge>
      )
    case ROLES.ADMIN:
      return <Badge variant="default">{t("ADMIN")}</Badge>
    case ROLES.ASSISTANT:
      return <Badge variant="default">{t("ASSISTANT")}</Badge>
    case ROLES.SUPERVISOR:
      return <Badge variant="secondary">{t("SUPERVISOR")}</Badge>
    case ROLES.SUPER_CLERK:
      return <Badge variant="secondary">{t("SUPER_CLERK")}</Badge>
    case ROLES.TEACHER:
      return <Badge variant="secondary">{t("TEACHER")}</Badge>
    case ROLES.CLERK:
      return <Badge variant="outline">{t("CLERK")}</Badge>
    case ROLES.SUPER_STUDENT:
      return <Badge variant="outline">{t("SUPER_STUDENT")}</Badge>
    case ROLES.STUDENT:
    default:
      return <Badge variant="outline">{t("STUDENT")}</Badge>
  }
}
