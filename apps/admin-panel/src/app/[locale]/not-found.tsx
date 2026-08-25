import { getTranslations } from "next-intl/server"
import { FileQuestion } from "lucide-react"
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

export default async function LocalizedNotFound() {
  const t = await getTranslations("common.notFound")

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <Empty className="w-full max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <FileQuestion className="size-8 stroke-[1.5]" />
          </EmptyMedia>
          <Badge variant="secondary" className="font-mono">
            404 ERROR
          </Badge>
          <EmptyTitle className="text-xl sm:text-2xl">{t("title")}</EmptyTitle>
          <EmptyDescription>{t("description")}</EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Link
            href="/"
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
