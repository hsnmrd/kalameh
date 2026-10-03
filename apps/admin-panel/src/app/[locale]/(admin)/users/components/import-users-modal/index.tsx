"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import type { ExcelImportResult } from "@workspace/types"
import { usersResource } from "@/lib/api"
import { UploadContent } from "./upload-content"

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

  const handleClose = () => {
    if (importResult?.importedCount)
      queryClient.invalidateQueries({ queryKey: usersResource.list.baseKey() })
    setSelectedFile(null)
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onClose()
  }
  const importMutation = useMutation({
    ...usersResource.importExcel.toMutation(),
    onSuccess: (result) => {
      setImportResult(result)
      if (result.importedCount > 0)
        queryClient.invalidateQueries({
          queryKey: usersResource.list.baseKey(),
        })
      if (result.failedCount === 0 && result.importedCount > 0) {
        toast.success(t("successMessage", { count: result.importedCount }))
        handleClose()
      }
    },
  })
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/users/excel-template`,
        { headers: { "Accept-Language": locale }, credentials: "include" }
      )
      if (!response.ok) throw new Error("Failed to download template")
      const url = window.URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = url
      link.download = "users-import-template.xlsx"
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch {
      toast.error(t("templateDownloadError"))
    } finally {
      setIsDownloadingTemplate(false)
    }
  }
  const selectFile = (file?: File) => {
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile) return
    const formData = new FormData()
    formData.append("file", selectedFile)
    if (instituteId) formData.append("instituteId", instituteId)
    importMutation.mutate({ formData, instituteId })
  }

  return (
    <FormDialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>{t("title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <UploadContent
              selectedFile={selectedFile}
              importResult={importResult}
              isDragging={isDragging}
              isDownloadingTemplate={isDownloadingTemplate}
              fileInputRef={fileInputRef}
              onDownloadTemplate={handleDownloadTemplate}
              onFileChange={(event) => selectFile(event.target.files?.[0])}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                selectFile(event.dataTransfer.files?.[0])
              }}
            />
          </div>
          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || importMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {importMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              <span>{t("submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
