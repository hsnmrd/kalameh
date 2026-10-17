"use client"

import Image from "next/image"
import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Upload, X, Check, Ban, Crop } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { ImageCropperDialog } from "@workspace/ui/components/image-cropper"

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
  const locale = useLocale()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [cropFile, setCropFile] = React.useState<File | null>(null)
  const [isCropperOpen, setIsCropperOpen] = React.useState(false)
  const [trackingCode, setTrackingCode] = React.useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCropFile(file)
      setIsCropperOpen(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    setSelectedFile(croppedFile)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const url = URL.createObjectURL(croppedFile)
    setPreviewUrl(url)
    setIsCropperOpen(false)
    setCropFile(null)
  }

  const handleCropCancel = () => {
    setIsCropperOpen(false)
    setCropFile(null)
    if (!selectedFile && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRecrop = () => {
    if (selectedFile) {
      setCropFile(selectedFile)
      setIsCropperOpen(true)
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
      id="upload-receipt-section"
      onSubmit={handleSubmit}
      className="flex scroll-mt-20 flex-col gap-4 border-b border-border/60 pt-1 pb-6"
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
        <div className="flex flex-col gap-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
            <Image
              src={previewUrl}
              alt="Receipt preview"
              fill
              className="object-contain"
              unoptimized
            />
            <div className="absolute end-2.5 top-2.5 flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRecrop}
                className="h-8 gap-1 rounded-full border-border/80 bg-background/85 px-2.5 text-xs font-semibold backdrop-blur-xs hover:bg-background"
                aria-label={t("recrop")}
              >
                <Crop className="size-3.5" />
                <span>{t("recrop")}</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClearFile}
                className="size-8 rounded-full p-0 shadow-md"
                aria-label="Remove image"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span className="truncate">{selectedFile.name}</span>
              <span className="shrink-0 font-medium text-foreground">
                {(selectedFile.size / 1024).toFixed(0)}{" "}
                {locale === "fa" ? "کیلوبایت" : "KB"}
              </span>
            </div>
          )}
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

      {/* Image Cropper Dialog */}
      <ImageCropperDialog
        open={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        imageFile={cropFile}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        cropShape="rect"
        aspectRatio={3 / 4}
        allowAspectRatioSelection
        aspectRatioOptions={[
          { label: t("aspectRatios.portrait"), value: 3 / 4, id: "3:4" },
          { label: t("aspectRatios.landscape"), value: 4 / 3, id: "4:3" },
          { label: t("aspectRatios.wide"), value: 16 / 9, id: "16:9" },
          { label: t("aspectRatios.square"), value: 1, id: "1:1" },
          { label: t("aspectRatios.original"), value: -1, id: "original" },
        ]}
        maxWidth={1200}
        maxHeight={1600}
        quality={0.82}
        format="image/webp"
        title={t("cropTitle")}
        confirmLabel={t("cropConfirm")}
        cancelLabel={t("cropCancel")}
      />

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
