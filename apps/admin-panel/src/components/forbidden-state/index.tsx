"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ShieldAlert } from "lucide-react"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface ForbiddenStateProps {
  title?: string
  description?: string
  backUrl?: string
  className?: string
}

export function ForbiddenState({
  title,
  description,
  backUrl = "/",
  className,
}: ForbiddenStateProps) {
  const t = useTranslations("common.forbidden")

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center p-4 text-foreground",
        className
      )}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive shadow-xs">
          <ShieldAlert className="size-10 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-destructive/10 px-3 py-1 font-mono text-xs font-bold tracking-wider text-destructive">
            {t("badge")}
          </span>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {title || t("title")}
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description || t("description")}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={backUrl}
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-6")}
          >
            <span>{t("backHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
