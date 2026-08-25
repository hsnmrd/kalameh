"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import type { ExcelImportResult } from "@workspace/types"
import { usersResource } from "@/lib/api"

export interface ImportUsersModalProps {
  open: boolean
  onClose: () => void
  instituteId?: string
}

export function ImportUsersModal({
  open,
  onClose,
  instituteId,
}: ImportUsersModalProps) {
  const t = useTranslations("users.importModal")
  const locale = useLocale()
  const queryClient = useQueryClient()

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [importResult, setImportResult] =
    React.useState<ExcelImportResult | null>(null)
  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const importMutation = useMutation({
    ...usersResource.importExcel.toMutation(),
    onSuccess: (result) => {
      setImportResult(result)
      if (result.importedCount > 0) {
        queryClient.invalidateQueries({
          queryKey: usersResource.list.baseKey(),
        })
      }
      if (result.failedCount === 0 && result.importedCount > 0) {
        toast.success(t("successMessage", { count: result.importedCount }))
        handleClose()
      }
    },
  })

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true)
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const response = await fetch(`${baseUrl}/users/excel-template`, {
        headers: {
          "Accept-Language": locale,
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to download template")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "users-import-template.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error("خطا در دانلود فایل نمونه")
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    const formData = new FormData()
    formData.append("file", selectedFile)
    if (instituteId) {
      formData.append("instituteId", instituteId)
    }

    importMutation.mutate({ formData, instituteId })
  }

  const handleClose = () => {
    if (importResult?.importedCount && importResult.importedCount > 0) {
      queryClient.invalidateQueries({
        queryKey: usersResource.list.baseKey(),
      })
    }
    setSelectedFile(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogPopup className="max-w-lg">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {/* Download Template Banner */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {t("downloadTemplate")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("uploadHint")}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="cursor-pointer gap-1.5 rounded-xl text-xs font-medium"
          >
            {isDownloadingTemplate ? (
              <Spinner className="size-3.5" />
            ) : (
              <Download className="size-3.5 text-foreground" />
            )}
            <span>{t("downloadTemplate")}</span>
          </Button>
        </div>

        {/* Import Results if any failed */}
        {importResult && importResult.failedCount > 0 && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">
                  {t("resultTitle")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-emerald-600">
                  {t("importedRows", { count: importResult.importedCount })}
                </span>
                <span className="text-destructive">
                  {t("failedRows", { count: importResult.failedCount })}
                </span>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-card p-3">
              <span className="mb-2 block text-xs font-semibold text-foreground">
                {t("errorListTitle")}
              </span>
              <ul className="flex flex-col gap-1.5 text-xs text-destructive">
                {importResult.errors.map((err, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-mono font-semibold">
                      {t("rowNumber", { row: err.row })}:
                    </span>
                    <span className="text-foreground/90">{err.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30",
              selectedFile && "border-emerald-500/50 bg-emerald-500/5"
            )}
          >
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                selectedFile
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {selectedFile ? (
                <CheckCircle2 className="size-6 text-emerald-600" />
              ) : (
                <UploadCloud className="size-6 text-muted-foreground" />
              )}
            </div>

            {selectedFile ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {selectedFile.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {t("dragDropText")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("uploadHint")}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-10 rounded-xl"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || importMutation.isPending}
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {importMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              <span>{t("submit")}</span>
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
