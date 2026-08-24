import * as React from "react"
import { useTranslations } from "next-intl"
import {
  createLoginSchema,
  createChangePasswordSchema,
  type LoginInput,
  type ChangePasswordInput,
} from "@workspace/types"

export function useLoginSchema() {
  const t = useTranslations("auth")

  return React.useMemo(
    () =>
      createLoginSchema({
        phoneRegex: t("validation.phoneRegex"),
        passwordMin: t("validation.passwordMin"),
      }),
    [t]
  )
}

export function useChangePasswordSchema() {
  const t = useTranslations("auth")

  return React.useMemo(
    () =>
      createChangePasswordSchema({
        currentPasswordRequired: t("validation.currentPasswordRequired"),
        newPasswordMin: t("validation.newPasswordMin"),
      }),
    [t]
  )
}

export type { LoginInput, ChangePasswordInput }
