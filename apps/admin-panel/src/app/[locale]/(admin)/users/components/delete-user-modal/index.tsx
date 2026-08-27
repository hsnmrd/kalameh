"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogCloseButton,
  ResponsiveDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import type { AuthUser } from "@workspace/types"
import { usersResource } from "@/lib/api"
import { UserRoleBadge } from "../user-role-badge"

export interface DeleteUserModalProps {
  open: boolean
  onClose: () => void
  user: AuthUser | null
}

export function DeleteUserModal({ open, onClose, user }: DeleteUserModalProps) {
  const t = useTranslations("users")
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    ...usersResource.delete.toMutation(),
    onSuccess: () => {
      toast.success(t("deleteModal.success"))
      queryClient.invalidateQueries({
        queryKey: usersResource.list.baseKey(),
      })
      onClose()
    },
  })

  const handleDelete = () => {
    if (!user) return
    deleteMutation.mutate(user.id)
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <ResponsiveDialogContent className="max-w-md p-6">
        <ResponsiveDialogCloseButton />

        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>

          <div className="space-y-1">
            <ResponsiveDialogHeader className="text-start">
              <ResponsiveDialogTitle>
                {t("deleteModal.title")}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="text-xs leading-relaxed">
                {t("deleteModal.description")}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
          </div>
        </div>

        {user && (
          <div className="mt-5 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">
                {t("deleteModal.userName")}
              </span>
              <strong className="text-foreground">
                {user.firstName} {user.lastName}
              </strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">
                {t("deleteModal.phone")}
              </span>
              <span className="font-mono text-foreground" dir="ltr">
                {user.phone}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">
                {t("deleteModal.role")}
              </span>
              <UserRoleBadge role={user.role} />
            </div>
          </div>
        )}

        <ResponsiveDialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 sm:border-t sm:border-border/60 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="h-11 w-full rounded-xl text-xs font-semibold sm:h-10 sm:w-auto sm:px-4"
          >
            {t("deleteModal.cancel")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-11 w-full rounded-xl text-xs font-semibold sm:h-10 sm:w-auto sm:px-5"
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner className="text-destructive-foreground me-2 size-4" />
                {t("deleteModal.deleting")}
              </>
            ) : (
              t("deleteModal.confirm")
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
