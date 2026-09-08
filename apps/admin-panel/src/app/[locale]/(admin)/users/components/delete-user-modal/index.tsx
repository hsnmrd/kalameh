"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
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
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteModal.title")}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("deleteModal.description")}
          </AlertDialogDescription>
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

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="h-14 flex-1 rounded-2xl text-base font-medium sm:h-10 sm:w-auto sm:flex-initial sm:rounded-xl sm:px-4 sm:text-sm"
          >
            {t("deleteModal.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-14 flex-1 rounded-2xl text-base font-medium sm:h-10 sm:w-auto sm:flex-initial sm:rounded-xl sm:px-5 sm:text-sm"
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                <span>{t("deleteModal.deleting")}</span>
              </>
            ) : (
              t("deleteModal.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
