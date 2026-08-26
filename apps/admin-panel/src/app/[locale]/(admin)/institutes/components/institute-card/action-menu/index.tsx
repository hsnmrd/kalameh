"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Ban, Edit2, MoreVertical, ShieldCheck, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ResponsivePopover } from "@workspace/ui/components/popover"
import { Separator } from "@workspace/ui/components/separator"

interface InstituteActionMenuProps {
  isActive: boolean
  onEdit?: () => void
  onToggleBlock: () => void
  onDelete?: () => void
}

export function InstituteActionMenu({
  isActive,
  onEdit,
  onToggleBlock,
  onDelete,
}: InstituteActionMenuProps) {
  const t = useTranslations("institutes")
  const [open, setOpen] = React.useState(false)

  const runAction = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      drawerTitle={t("actions")}
      align="end"
      className="w-52 p-1"
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("actions")}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical aria-hidden />
        </Button>
      }
    >
      <div role="menu" className="flex flex-col gap-1">
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            role="menuitem"
            onClick={() => runAction(onEdit)}
            className="h-11 w-full justify-start gap-3 rounded-lg px-3 text-sm font-medium text-foreground lg:h-9 lg:text-xs"
          >
            <Edit2 data-icon="inline-start" className="text-foreground" />
            <span>{t("edit")}</span>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          role="menuitem"
          onClick={() => runAction(onToggleBlock)}
          className="h-11 w-full justify-start gap-3 rounded-lg px-3 text-sm font-medium text-foreground lg:h-9 lg:text-xs"
        >
          {isActive ? (
            <Ban data-icon="inline-start" className="text-foreground" />
          ) : (
            <ShieldCheck data-icon="inline-start" className="text-foreground" />
          )}
          <span>{isActive ? t("block") : t("unblock")}</span>
        </Button>

        {onDelete && (
          <>
            <Separator className="my-1" />
            <Button
              type="button"
              variant="ghost"
              role="menuitem"
              onClick={() => runAction(onDelete)}
              className="h-11 w-full justify-start gap-3 rounded-lg px-3 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive lg:h-9 lg:text-xs"
            >
              <Trash2 data-icon="inline-start" className="text-destructive" />
              <span>{t("delete")}</span>
            </Button>
          </>
        )}
      </div>
    </ResponsivePopover>
  )
}
