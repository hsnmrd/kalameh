"use client"

import Image from "next/image"
import * as React from "react"
import { useTranslations } from "next-intl"
import { Upload, X, Check, Ban } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"

export interface UploadReceiptCardProps {
  classId: string
  tuition: number
  onSubmitReceipt: (data: { trackingCode: string; file: File }) => void
  onCancelReservation: () => void
  isSubmitting?: boolean
  isCancelling?: boolean
}

export function UploadReceiptCard({
  onSubmitReceipt,
  onCancelReservation,
  isSubmitting,
  isCancelling,
}: UploadReceiptCardProps) {
  const t = useTranslations("enrollments.upload")
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [trackingCode, setTrackingCode] = React.useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingCode.trim()) {
      toast.error(t("trackingCodeRequired"))
      return
    }
    if (!selectedFile) {
      toast.error(t("receiptRequired"))
      return
    }

    onSubmitReceipt({ trackingCode: trackingCode.trim(), file: selectedFile })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xs"
    >
      <div className="flex flex-col gap-1 border-b border-border/60 pb-3">
        <h3 className="text-sm font-bold text-foreground">{t("title")}</h3>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image Preview / Select Box */}
      {previewUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <Image
            src={previewUrl}
            alt="Receipt preview"
            fill
            className="object-contain"
            unoptimized
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleClearFile}
            className="absolute end-2.5 top-2.5 size-8 rounded-full p-0 shadow-md"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              fileInputRef.current?.click()
            }
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:bg-muted/60"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Upload className="size-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            {t("selectImage")}
          </span>
          <span className="text-[11px] text-muted-foreground">
            PNG, JPG, WebP
          </span>
        </div>
      )}

      {/* Tracking Code Input */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="trackingCode"
          className="text-xs font-medium text-foreground"
        >
          {t("trackingCode")}
        </label>
        <Input
          id="trackingCode"
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder={t("trackingCodePlaceholder")}
          className="h-14 rounded-2xl text-base"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !selectedFile || !trackingCode.trim()}
          className="w-full cursor-pointer gap-2 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Spinner className="size-4" />
              <span>{t("submitting")}</span>
            </>
          ) : (
            <>
              <Check className="size-4" />
              <span>{t("submit")}</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancelReservation}
          disabled={isCancelling || isSubmitting}
          className="w-full cursor-pointer gap-2 font-semibold text-muted-foreground hover:text-destructive"
        >
          {isCancelling ? (
            <Spinner className="size-4" />
          ) : (
            <Ban className="size-4" />
          )}
          <span>{t("cancelReservation")}</span>
        </Button>
      </div>
    </form>
  )
}
