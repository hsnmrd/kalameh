"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ShieldAlert } from "lucide-react"
import { Link } from "@/i18n/routing"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { Badge } from "@workspace/ui/components/badge"
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
        "flex min-h-[50vh] items-center justify-center p-4",
        className
      )}
    >
      <Empty className="w-full max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="destructive">
            <ShieldAlert className="size-8 stroke-[1.5]" />
          </EmptyMedia>
          <Badge variant="destructive" className="font-mono">
            {t("badge")}
          </Badge>
          <EmptyTitle className="text-xl sm:text-2xl">
            {title || t("title")}
          </EmptyTitle>
          <EmptyDescription>{description || t("description")}</EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Link
            href={backUrl}
            className={cn(
              buttonVariants({ size: "default" }),
              "rounded-xl px-6"
            )}
          >
            <span>{t("backHome")}</span>
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
