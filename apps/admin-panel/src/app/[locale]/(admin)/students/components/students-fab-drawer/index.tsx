"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Plus } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { FABMenuTrigger } from "@workspace/ui/components/fab"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@workspace/ui/components/drawer"
import { PermissionGuard } from "@/components/permission-guard"

export interface StudentsFabDrawerProps {
  onAddClick: () => void
  onSetAllAvailableClick: () => void
  disabled?: boolean
}

export function StudentsFabDrawer({
  onAddClick,
  onSetAllAvailableClick,
  disabled = false,
}: StudentsFabDrawerProps) {
  const t = useTranslations("students")
  const [open, setOpen] = React.useState(false)

  const handleSelect = (callback: () => void) => {
    setOpen(false)
    callback()
  }

  if (disabled) return null

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_STUDENTS} mode="hide">
      <FABMenuTrigger
        onClick={() => setOpen(true)}
        aria-label={t("table.actions")}
      >
        <Plus className="size-6" aria-hidden />
      </FABMenuTrigger>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("table.actions")}</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-3 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelect(onAddClick)}
              className="h-14 w-full cursor-pointer justify-start gap-3 rounded-2xl border-border px-5 text-base font-semibold"
            >
              <Plus className="size-5 text-foreground" />
              <span>{t("addStudent")}</span>
            </Button>

            <Button
              type="button"
              onClick={() => handleSelect(onSetAllAvailableClick)}
              className="h-14 w-full cursor-pointer justify-start gap-3 rounded-2xl px-5 text-base font-semibold"
            >
              <Clock className="size-5" />
              <span>{t("setAllAvailable")}</span>
            </Button>
          </div>

          <DrawerFooter className="pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-14 w-full cursor-pointer rounded-2xl text-base font-medium"
            >
              {t("createModal.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PermissionGuard>
  )
}
