"use client"

import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { FormDialogFooter } from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import type { InstituteFormTab } from "../../institute-form-types"

interface FormFooterProps {
  activeTab: InstituteFormTab
  isPending: boolean
  onBack: () => void
  onClose: () => void
  onNext: () => void
}

export function FormFooter({
  activeTab,
  isPending,
  onBack,
  onClose,
  onNext,
}: FormFooterProps) {
  const t = useTranslations("institutes")
  return (
    <FormDialogFooter className="justify-between">
      <div className="flex items-center gap-2">
        {activeTab !== "general" && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium text-muted-foreground"
          >
            {t("createModal.prev")}
          </Button>
        )}
      </div>
      <div className="flex flex-1 items-center justify-end gap-3 sm:flex-initial [&>button]:w-full [&>button]:min-w-0 [&>button]:flex-1 [&>button]:px-3 sm:[&>button]:w-auto sm:[&>button]:flex-initial sm:[&>button]:px-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
        >
          {t("createModal.cancel")}
        </Button>
        {activeTab !== "banking" ? (
          <Button
            type="button"
            onClick={onNext}
            className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("createModal.next")}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isPending}
            className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <>
                <Spinner className="me-2 size-5 text-primary-foreground" />
                {t("createModal.submitting")}
              </>
            ) : (
              t("createModal.submit")
            )}
          </Button>
        )}
      </div>
    </FormDialogFooter>
  )
}
