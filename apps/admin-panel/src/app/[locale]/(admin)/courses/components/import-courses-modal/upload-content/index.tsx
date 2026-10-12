"use client"

import type { ChangeEvent, DragEvent, RefObject } from "react"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  UploadCloud,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import type { ExcelImportResult } from "@workspace/types"

interface UploadContentProps {
  selectedFile: File | null
  importResult: ExcelImportResult | null
  isDragging: boolean
  isDownloadingTemplate: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onDownloadTemplate: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onDragOver: (event: DragEvent) => void
  onDragLeave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}

export function UploadContent(props: UploadContentProps) {
  const {
    selectedFile,
    importResult,
    isDragging,
    isDownloadingTemplate,
    fileInputRef,
    onDownloadTemplate,
    onFileChange,
    onDragOver,
    onDragLeave,
    onDrop,
  } = props
  const t = useTranslations("courses.importModal")

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
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
          onClick={onDownloadTemplate}
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

      {importResult && importResult.failedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                {t("resultTitle")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-success">
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
            <div className="flex flex-col gap-1.5 text-xs">
              {importResult.errors.map((error, idx) => (
                <div
                  key={`err-${error.row}-${idx}`}
                  className="flex items-start gap-1.5 text-destructive"
                >
                  <span className="shrink-0 font-medium">
                    {t("rowNumber", { row: error.row })}:
                  </span>
                  <span>{error.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/80 bg-background hover:border-primary/50 hover:bg-muted/20"
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <UploadCloud className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-medium text-foreground">
            {selectedFile ? selectedFile.name : t("dragDropText")}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("uploadHint")}
          </span>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="size-4 text-success" />
          <span>
            {t("selectedFile")} {selectedFile.name}
          </span>
        </div>
      )}
    </>
  )
}
