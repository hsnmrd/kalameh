"use client"

import { useTranslations } from "next-intl"
import { CircleAlert, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

interface ConnectionErrorProps {
  error: unknown
  isFetching: boolean
  onRetry: () => void
}

export function ConnectionError({
  error,
  isFetching,
  onRetry,
}: ConnectionErrorProps) {
  const t = useTranslations("scheduling.runStatus")

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {t("connectionError.title")}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("connectionError.description")}
            </p>
            {error != null && (
              <p className="mt-2 font-mono text-xs text-destructive">
                {t("exactError", {
                  error: error instanceof Error ? error.message : String(error),
                })}
              </p>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isFetching}
          className="shrink-0"
        >
          {isFetching ? (
            <Spinner data-icon="inline-start" size="sm" />
          ) : (
            <RotateCcw data-icon="inline-start" className="size-4" />
          )}
          {t("retry")}
        </Button>
      </div>
    </div>
  )
}
