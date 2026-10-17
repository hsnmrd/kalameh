"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { CreditCard, Copy, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Price } from "@workspace/ui/components/price"
import { toast } from "@workspace/ui/components/sonner"
import type { BankInfoDto } from "@workspace/types"

export interface BankInfoCardProps {
  bankInfo?: BankInfoDto | null
  tuition?: number
}

export function BankInfoCard({ bankInfo, tuition }: BankInfoCardProps) {
  const t = useTranslations("enrollments.payment")
  const locale = useLocale()
  const [copied, setCopied] = React.useState(false)

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
        <div className="flex items-center gap-2">
          <CreditCard className="size-4.5 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">{t("title")}</h3>
        </div>

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

      <div className="flex flex-col gap-3 py-1">
        <div>
          <span className="text-[11px] text-muted-foreground">
            {t("bankCard")}
          </span>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              dir="ltr"
              className="text-lg font-bold tracking-widest text-foreground"
            >
              {formattedCard}
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
        </div>

        {cleanAccountName && (
          <p className="text-xs text-muted-foreground">
            <span>{t("bankAccount")}</span>{" "}
            <span className="font-semibold text-foreground">
              {cleanAccountName}
            </span>
          </p>
        )}

        {cleanShaba && (
          <p className="text-xs text-muted-foreground">
            <span>{t("bankShaba")}</span>{" "}
            <span dir="ltr" className="font-medium text-foreground">
              {cleanShaba}
            </span>
          </p>
        )}
      </div>

      <p className="border-t border-border/40 pt-3 text-xs leading-relaxed text-muted-foreground">
        ℹ️ {t("fullPaymentRule")}
      </p>
    </div>
  )
}
