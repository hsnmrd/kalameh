"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowDown, Copy, Check, Info } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Price } from "@workspace/ui/components/price"
import { toast } from "@workspace/ui/components/sonner"
import type { BankInfoDto } from "@workspace/types"

export interface BankInfoCardProps {
  bankInfo?: BankInfoDto | null
  tuition?: number
  onScrollToPayment?: () => void
}

export function BankInfoCard({
  bankInfo,
  tuition,
  onScrollToPayment,
}: BankInfoCardProps) {
  const t = useTranslations("enrollments.payment")
  const locale = useLocale()
  const [copied, setCopied] = React.useState(false)

  const handleScrollToPayment = () => {
    if (onScrollToPayment) {
      onScrollToPayment()
      return
    }
    const section = document.getElementById("upload-receipt-section")
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const cleanCard =
    bankInfo?.bankCardNumber &&
    bankInfo.bankCardNumber !== "null" &&
    bankInfo.bankCardNumber !== "undefined"
      ? bankInfo.bankCardNumber
      : ""
  const cleanAccountName =
    bankInfo?.bankAccountName &&
    bankInfo.bankAccountName !== "null" &&
    bankInfo.bankAccountName !== "undefined"
      ? bankInfo.bankAccountName
      : ""
  const cleanShaba =
    bankInfo?.bankShaba &&
    bankInfo.bankShaba !== "null" &&
    bankInfo.bankShaba !== "undefined"
      ? bankInfo.bankShaba
      : ""

  const handleCopyCard = () => {
    if (!cleanCard) return
    navigator.clipboard.writeText(cleanCard)
    setCopied(true)
    toast.success(t("cardCopied"))
    setTimeout(() => setCopied(false), 2000)
  }

  // Format 16-digit card into 4-digit chunks
  const formattedCard = cleanCard
    ? cleanCard.replace(/(\d{4})/g, "$1 ").trim()
    : "—"

  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pt-1 pb-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <Button
          type="button"
          size="sm"
          onClick={handleScrollToPayment}
          className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold"
        >
          <span>{t("depositAction")}</span>
          <ArrowDown className="size-3.5" />
        </Button>

        {tuition !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {t("tuition")}
            </span>
            <Price
              amount={tuition}
              locale={locale}
              className="text-base font-extrabold text-foreground"
            />
          </div>
        )}
      </div>

      <Card className="rounded-2xl border-border/70 bg-card shadow-2xs">
        <CardContent className="flex flex-col gap-3.5 p-4 sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t("bankCard")}
              </span>
              {cleanCard && (
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

            <div className="mt-1.5 flex items-center justify-start">
              <span
                dir="ltr"
                className="font-sans text-base font-bold tracking-wider text-foreground tabular-nums sm:text-lg sm:tracking-widest"
              >
                {formattedCard}
              </span>
            </div>
          </div>

          {(cleanAccountName || cleanShaba) && (
            <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
              {cleanAccountName && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {t("bankAccount")}
                  </span>
                  <span className="font-semibold text-foreground">
                    {cleanAccountName}
                  </span>
                </div>
              )}

              {cleanShaba && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {t("bankShaba")}
                  </span>
                  <span
                    dir="ltr"
                    className="font-sans font-medium text-foreground select-all"
                  >
                    {cleanShaba}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 pt-1 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <span>{t("fullPaymentRule")}</span>
      </div>
    </div>
  )
}
