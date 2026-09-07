"use client"

import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { FormDialogFooter } from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"

interface ClassFormFooterProps {
  mode: "create" | "edit"
  isPending: boolean
  onClose: () => void
}

export function ClassFormFooter({
  mode,
  isPending,
  onClose,
}: ClassFormFooterProps) {
  const t = useTranslations("classes")
  const namespace = mode === "create" ? "createModal" : "editModal"

  return (
    <FormDialogFooter>
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
      >
        {t(`${namespace}.cancel`)}
      </Button>
      <Button
        type="submit"
        disabled={isPending}
        className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
      >
        {isPending && (
          <Spinner className="me-2 size-5 text-primary-foreground" />
        )}
        {t(`${namespace}.submit`)}
      </Button>
    </FormDialogFooter>
  )
}
