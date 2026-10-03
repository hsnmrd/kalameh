"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import Image from "next/image"
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
import { Phone } from "lucide-react"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import type { TeacherDto } from "@workspace/types"
import { teachersResource } from "@/lib/api"

export interface ResetPasswordModalProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
}

export function ResetPasswordModal({
  teacher,
  open,
  onClose,
}: ResetPasswordModalProps) {
  const t = useTranslations("teachers")
  const [newPassword, setNewPassword] = React.useState("")

  const resetPasswordMutation = useMutation({
    ...teachersResource.resetPassword.toMutation(),
    onSuccess: () => {
      toast.success(t("resetPasswordModal.success"))
      setNewPassword("")
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return

    resetPasswordMutation.mutate({
      id: teacher.id,
      password: newPassword.trim() || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewPassword("")
      onClose()
    }
  }

  const fullName = teacher ? `${teacher.firstName} ${teacher.lastName}` : ""
  const initials = (
    teacher?.firstName?.[0] ||
    teacher?.lastName?.[0] ||
    "T"
  ).toUpperCase()

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("resetPasswordModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {teacher && (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {teacher.avatarUrl ? (
                      <Image
                        src={getAssetUrl(teacher.avatarUrl)}
                        alt={fullName}
                        width={48}
                        height={48}
                        className="size-12 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {fullName}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3.5 text-muted-foreground" />
                      <span className="font-mono">{teacher.phone}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge
                      variant={teacher.isActive ? "outline" : "secondary"}
                      className={
                        teacher.isActive
                          ? "border-success/30 bg-success/10 text-success"
                          : "text-muted-foreground"
                      }
                    >
                      {teacher.isActive
                        ? t("status.active")
                        : t("status.inactive")}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            {teacher ? (
              <p className="text-xs text-muted-foreground">
                {t("resetPasswordModal.description", { name: fullName })}
              </p>
            ) : null}
            <Field>
              <FieldLabel>{t("resetPasswordModal.newPassword")}</FieldLabel>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("resetPasswordModal.newPasswordPlaceholder")}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </Field>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("resetPasswordModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {resetPasswordMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              <span>{t("resetPasswordModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
