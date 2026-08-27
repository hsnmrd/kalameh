"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@workspace/ui/components/password-input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import type { AuthUser } from "@workspace/types"
import { usersResource } from "@/lib/api"

export interface ResetPasswordModalProps {
  user: AuthUser | null
  open: boolean
  onClose: () => void
}

export function ResetPasswordModal({
  user,
  open,
  onClose,
}: ResetPasswordModalProps) {
  const t = useTranslations("users")
  const [newPassword, setNewPassword] = React.useState("")

  const resetPasswordMutation = useMutation({
    ...usersResource.resetPassword.toMutation(),
    onSuccess: () => {
      toast.success(t("resetPasswordModal.success"))
      setNewPassword("")
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    resetPasswordMutation.mutate({
      id: user.id,
      newPassword: newPassword.trim() || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewPassword("")
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("resetPasswordModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 sm:px-0 sm:py-0">
            {user && (
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
                <span className="text-muted-foreground">
                  {t("deleteModal.userName")}:{" "}
                </span>
                <strong className="text-foreground">
                  {user.firstName} {user.lastName}
                </strong>
              </div>
            )}
            <Field>
              <FieldLabel>{t("resetPasswordModal.newPassword")}</FieldLabel>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("resetPasswordModal.passwordPlaceholder")}
              />
            </Field>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-xl"
            >
              {t("resetPasswordModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {resetPasswordMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              <span>{t("resetPasswordModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
