"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus, Sparkles } from "lucide-react"
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

export interface CoursesFabDrawerProps {
  onAddClick: () => void
  onBatchClick: () => void
}

export function CoursesFabDrawer({
  onAddClick,
  onBatchClick,
}: CoursesFabDrawerProps) {
  const t = useTranslations("courses")
  const [open, setOpen] = React.useState(false)

  const handleSelect = (callback: () => void) => {
    setOpen(false)
    callback()
  }

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_COURSES} mode="hide">
      <FABMenuTrigger onClick={() => setOpen(true)} aria-label={t("actions")}>
        <Sparkles className="size-6" aria-hidden />
      </FABMenuTrigger>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("actions")}</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-3 p-4">
            <Button
              type="button"
              onClick={() => handleSelect(onBatchClick)}
              className="h-14 w-full cursor-pointer justify-start gap-3 rounded-2xl px-5 text-base font-semibold"
            >
              <Sparkles className="size-5" />
              <span>{t("createGroupCourses")}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelect(onAddClick)}
              className="h-14 w-full cursor-pointer justify-start gap-3 rounded-2xl border-border px-5 text-base font-semibold"
            >
              <Plus className="size-5 text-foreground" />
              <span>{t("addSingleCourse")}</span>
            </Button>
          </div>

          <DrawerFooter className="pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-14 w-full cursor-pointer rounded-2xl text-base font-medium"
            >
              {t("cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PermissionGuard>
  )
}
