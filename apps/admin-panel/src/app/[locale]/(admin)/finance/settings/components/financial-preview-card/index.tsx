"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CreditCard, Copy, Check, Eye } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { toast } from "@workspace/ui/components/sonner"

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
  const [copied, setCopied] = React.useState(false)

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
    setCopied(true)
    toast.success(t("cardCopied"))
    setTimeout(() => setCopied(false), 2000)
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
        <span className="text-[11px] text-muted-foreground">
          {t("previewDescription")}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/50 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="size-6 text-primary" />
            <span className="text-xs font-semibold">{t("bankCardNumber")}</span>
          </div>
          <div className="size-8 rounded-full border border-border/50 bg-primary/10" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            dir="ltr"
            className="font-mono text-xl font-bold tracking-widest text-foreground sm:text-2xl"
          >
            {formattedCard}
          </span>
          {rawCard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCard}
              className="h-8 gap-1.5 rounded-lg border-border px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              {copied ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Copy className="size-3.5 text-muted-foreground" />
              )}
              <span>{t("copyCard")}</span>
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-1.5 border-t border-border/50 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              {t("bankAccountName")}:
            </span>
            <span className="font-semibold text-foreground">
              {cleanName || "—"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{t("bankShaba")}:</span>
            <span dir="ltr" className="font-mono text-foreground">
              {cleanShaba || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
