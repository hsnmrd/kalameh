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
  const t = useTranslations("users.importModal")
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
            <ul className="flex flex-col gap-1.5 text-xs text-destructive">
              {importResult.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="font-mono font-semibold">
                    {t("rowNumber", { row: error.row })}:
                  </span>
                  <span className="text-foreground/90">{error.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onFileChange}
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          selectedFile && "border-success/50 bg-success/5"
        )}
      >
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-2xl",
            selectedFile
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          )}
        >
          {selectedFile ? (
            <CheckCircle2 className="size-6 text-success" />
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
    </>
  )
}
