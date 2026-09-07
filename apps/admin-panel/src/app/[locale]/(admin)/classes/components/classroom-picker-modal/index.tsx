"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Search, X, School, Laptop, Inbox } from "lucide-react"
import type { ClassroomDto } from "@workspace/types"
import { ClassroomPickerItem } from "./classroom-picker-item"

export interface ClassroomPickerModalProps {
  open: boolean
  onClose: () => void
  classrooms: ClassroomDto[]
  selectedClassroomId?: string | null
  classCapacity?: number
  onSelectClassroom: (classroomId: string | null) => void
}

export function ClassroomPickerModal({
  open,
  onClose,
  classrooms,
  selectedClassroomId,
  classCapacity,
  onSelectClassroom,
}: ClassroomPickerModalProps) {
  const t = useTranslations("classes")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Reset search when modal opens
  React.useEffect(() => {
    if (open) {
      setSearchQuery("")
    }
  }, [open])

  const filteredClassrooms = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return classrooms

    return classrooms.filter((room) => {
      const matchName = room.name.toLowerCase().includes(query)
      const matchDesc = room.description
        ? room.description.toLowerCase().includes(query)
        : false
      const matchBranch = room.branch?.name
        ? room.branch.name.toLowerCase().includes(query)
        : false
      return matchName || matchDesc || matchBranch
    })
  }, [classrooms, searchQuery])

  const handleSelect = (id: string | null) => {
    onSelectClassroom(id)
    onClose()
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>{t("classroomPicker.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
          {/* Search Header */}
          <div className="border-b border-border/50 px-4 py-3 sm:px-6">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute start-3 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("classroomPicker.searchPlaceholder")}
                className="h-11 ps-9 pe-9 text-sm"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className="absolute end-1 size-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4 text-muted-foreground" />
                  <span className="sr-only">
                    {t("classroomPicker.clearSearch")}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* List of Classrooms */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            {/* Online / No classroom option */}
            <ClassroomPickerItem
              title={t("classroomPicker.noClassroom")}
              description={t("classroomPicker.noClassroomDesc")}
              isSelected={
                selectedClassroomId === "REMOTE" ||
                selectedClassroomId === "NONE"
              }
              icon={<Laptop className="size-5 text-current" />}
              onClick={() => handleSelect("REMOTE")}
            />

            {/* Filtered Classrooms */}
            {filteredClassrooms.map((room) => {
              const isSelected = selectedClassroomId === room.id
              const isWarning = Boolean(
                classCapacity && classCapacity > room.capacity
              )

              return (
                <ClassroomPickerItem
                  key={room.id}
                  title={room.name}
                  description={room.description}
                  capacity={room.capacity}
                  capacityLabel={t("classroomPicker.capacity", {
                    count: room.capacity,
                  })}
                  branchName={room.branch?.name}
                  isSelected={isSelected}
                  isWarning={isWarning}
                  warningText={t("classroomPicker.capacityWarning")}
                  icon={<School className="size-5 text-current" />}
                  onClick={() => handleSelect(room.id)}
                />
              )
            })}

            {/* Empty state if search returns no results */}
            {filteredClassrooms.length === 0 && classrooms.length > 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="size-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  {t("classroomPicker.noResults")}
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-1 text-xs text-primary"
                >
                  {t("classroomPicker.clearSearch")}
                </Button>
              </div>
            )}

            {/* Empty state if no classrooms available at all */}
            {classrooms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="size-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {t("classroomPicker.empty")}
                </p>
              </div>
            )}
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 w-full rounded-xl text-sm font-medium sm:h-12 sm:w-auto"
            >
              {t("createModal.cancel")}
            </Button>
          </FormDialogFooter>
        </div>
      </FormDialogContent>
    </FormDialog>
  )
}
