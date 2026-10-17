"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Copy, Check, Eye } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

export interface FinancialPreviewCardProps {
  bankCardNumber?: string | null
  bankAccountName?: string | null
  bankShaba?: string | null
}

export function FinancialPreviewCard({
  bankCardNumber,
  bankAccountName,
  bankShaba,
}: FinancialPreviewCardProps) {
  const t = useTranslations("transactions.settings")
  const [copiedCard, setCopiedCard] = React.useState(false)
  const [copiedShaba, setCopiedShaba] = React.useState(false)

  const cleanCard =
    bankCardNumber &&
    bankCardNumber !== "null" &&
    bankCardNumber !== "undefined"
      ? bankCardNumber
      : ""
  const cleanName =
    bankAccountName &&
    bankAccountName !== "null" &&
    bankAccountName !== "undefined"
      ? bankAccountName
      : ""
  const cleanShaba =
    bankShaba && bankShaba !== "null" && bankShaba !== "undefined"
      ? bankShaba
      : ""

  const handleCopyCard = () => {
    if (!cleanCard) return
    void navigator.clipboard.writeText(cleanCard)
    setCopiedCard(true)
    toast.success(t("cardCopied"))
    setTimeout(() => setCopiedCard(false), 2000)
  }

  const handleCopyShaba = () => {
    if (!cleanShaba) return
    void navigator.clipboard.writeText(cleanShaba)
    setCopiedShaba(true)
    toast.success(t("shabaCopied"))
    setTimeout(() => setCopiedShaba(false), 2000)
  }

  const rawCard = cleanCard.replace(/\s+/g, "")
  const formattedCard = rawCard
    ? rawCard.replace(/(\d{4})/g, "$1 ").trim()
    : "— — — —"

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            {t("previewTitle")}
          </h3>
        </div>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          {t("previewDescription")}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/50 p-4 shadow-xs sm:rounded-3xl sm:p-5">
        {/* Ambient subtle glow in corners */}
        <div className="pointer-events-none absolute -end-10 -top-10 size-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="pointer-events-none absolute -start-10 -bottom-10 size-32 rounded-full bg-primary/5 blur-2xl" />

        {/* Card Header: Chip, Contactless symbol & Copy Card button */}
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Realistic EMV chip graphic */}
            <div className="relative h-7 w-9 rounded-md border border-amber-500/40 bg-gradient-to-br from-amber-300/40 via-amber-400/25 to-amber-600/40 p-1 shadow-2xs">
              <div className="grid h-full w-full grid-cols-2 gap-0.5 rounded-[2px] border border-amber-600/30 opacity-70">
                <div className="border-b border-amber-700/40" />
                <div className="border-b border-amber-700/40" />
                <div />
                <div />
              </div>
            </div>
            {/* Contactless symbol */}
            <svg
              className="size-4 rotate-90 text-muted-foreground/70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a8.5 8.5 0 0 0 0-14" />
              <path d="M15.5 21.5a12 12 0 0 0 0-19" />
            </svg>
          </div>

          {rawCard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCard}
              className="h-8 gap-1.5 rounded-xl border-border/70 bg-card/90 px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-muted"
            >
              {copiedCard ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Copy className="size-3.5 text-muted-foreground" />
              )}
              <span>{t("copyCard")}</span>
            </Button>
          )}
        </div>

        {/* Card Number: Full-width prominent display that never wraps */}
        <div className="relative my-4 flex flex-col items-center justify-center text-center sm:my-5">
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground sm:text-xs">
            {t("bankCardNumber")}
          </span>
          <span
            dir="ltr"
            onClick={rawCard ? handleCopyCard : undefined}
            className={cn(
              "xs:text-lg mt-1 font-sans text-base font-bold tracking-wider text-foreground tabular-nums select-all sm:text-xl sm:tracking-widest md:text-2xl",
              rawCard && "cursor-pointer transition-opacity hover:opacity-80"
            )}
            title={rawCard ? t("copyCard") : undefined}
          >
            {formattedCard}
          </span>
        </div>

        {/* Card Footer: Account Holder Name & IBAN */}
        <div className="relative flex flex-col gap-2.5 border-t border-border/60 pt-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="shrink-0 text-muted-foreground">
              {t("bankAccountName")}:
            </span>
            <span className="truncate text-end font-bold text-foreground">
              {cleanName || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("bankShaba")}:</span>
              {cleanShaba && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyShaba}
                  className="h-6 gap-1 px-1.5 text-[11px] font-normal text-muted-foreground hover:text-foreground"
                >
                  {copiedShaba ? (
                    <Check className="size-3 text-success" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedShaba ? t("shabaCopied") : t("copyShaba")}</span>
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-1.5">
              <span
                dir="ltr"
                className="font-sans text-[11px] font-semibold tracking-wider text-foreground tabular-nums select-all sm:text-xs"
              >
                {cleanShaba || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
