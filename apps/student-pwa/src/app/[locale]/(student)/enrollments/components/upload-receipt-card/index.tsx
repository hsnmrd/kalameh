"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Upload } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface UploadReceiptCardProps {
  onSelectImage?: () => void
}

export function UploadReceiptCard({ onSelectImage }: UploadReceiptCardProps) {
  const t = useTranslations("enrollments")

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-xs">
      <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
        <Upload className="size-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">
        {t("uploadTitle")}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("uploadSubtitle")}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onSelectImage}
        className="mt-4 w-full cursor-pointer border-border hover:bg-muted"
      >
        {t("selectImageButton")}
      </Button>
    </div>
  )
}
