"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  Phone,
  GraduationCap,
  Clock,
  BookOpen,
  Calendar,
  FileText,
  MoreVertical,
  KeyRound,
  Edit2,
} from "lucide-react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS, type TeacherDto, type WeekDay } from "@workspace/types"
import { teachersResource } from "@/lib/api"

export interface TeacherProfileModalProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
  onEdit?: (teacher: TeacherDto) => void
  onResetPassword?: (teacher: TeacherDto) => void
}

export function TeacherProfileModal({
  teacher,
  open,
  onClose,
  onEdit,
  onResetPassword,
}: TeacherProfileModalProps) {
  const t = useTranslations("teachers")

  const { data: detailedTeacher, isLoading } = useQuery({
    ...teachersResource.detail.toQuery(teacher?.id || ""),
    enabled: open && !!teacher?.id,
  })

  const currentTeacher = detailedTeacher || teacher

  if (!currentTeacher) return null

  const fullName = `${currentTeacher.firstName} ${currentTeacher.lastName}`
  const initials = (
    currentTeacher.firstName?.[0] ||
    currentTeacher.lastName?.[0] ||
    "T"
  ).toUpperCase()

  const availabilities = currentTeacher.teacherProfile?.availabilities || []
  const teachingClasses = currentTeacher.teachingClasses || []

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <div className="flex items-center gap-2">
            {(onEdit || onResetPassword) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden"
                  aria-label={t("actions.viewProfile")}
                >
                  <MoreVertical className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  drawerTitle={fullName}
                  className="min-w-48"
                >
                  {onResetPassword && (
                    <PermissionGuard
                      permission={PERMISSIONS.MANAGE_TEACHERS}
                      mode="hide"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          onClose()
                          onResetPassword(currentTeacher)
                        }}
                      >
                        <KeyRound className="size-4 text-muted-foreground" />
                        <span>{t("actions.resetPassword")}</span>
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}

                  {onEdit && (
                    <PermissionGuard
                      permission={PERMISSIONS.MANAGE_TEACHERS}
                      mode="hide"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          onClose()
                          onEdit(currentTeacher)
                        }}
                      >
                        <Edit2 className="size-4 text-muted-foreground" />
                        <span>{t("actions.edit")}</span>
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <FormDialogTitle>{t("profileModal.title")}</FormDialogTitle>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-8 text-foreground" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Dossier Header Card */}
            <div className="flex flex-row items-center gap-4 rounded-2xl border border-border/80 bg-muted/30 p-4 sm:p-5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary sm:size-16 sm:text-xl">
                {currentTeacher.avatarUrl ? (
                  <Image
                    src={getAssetUrl(currentTeacher.avatarUrl)}
                    alt={fullName}
                    width={64}
                    height={64}
                    className="size-14 rounded-2xl object-cover sm:size-16"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground sm:text-lg">
                    {fullName}
                  </h3>
                  <Badge
                    variant={currentTeacher.isActive ? "outline" : "secondary"}
                    className={
                      currentTeacher.isActive
                        ? "border-success/30 bg-success/10 text-success"
                        : "text-muted-foreground"
                    }
                  >
                    {currentTeacher.isActive
                      ? t("status.active")
                      : t("status.inactive")}
                  </Badge>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:gap-4">
                  <span
                    className="flex items-center gap-1.5 font-mono"
                    dir="ltr"
                  >
                    <Phone className="size-3.5 text-muted-foreground" />
                    {currentTeacher.phone}
                  </span>
                  {currentTeacher.nationalCode && (
                    <span
                      className="flex items-center gap-1.5 font-mono"
                      dir="ltr"
                    >
                      <FileText className="size-3.5 text-muted-foreground" />
                      {currentTeacher.nationalCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Academic & Bio */}
            <div className="flex flex-col gap-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <GraduationCap className="size-4 text-muted-foreground" />
                <span>{t("profileModal.academicInfo")}</span>
              </h4>

              <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 text-xs">
                <div>
                  <span className="mb-1 block text-muted-foreground">
                    {t("createModal.degree")}:
                  </span>
                  <p className="font-medium text-foreground">
                    {currentTeacher.teacherProfile?.degree || "—"}
                  </p>
                </div>

                {currentTeacher.teacherProfile?.bio && (
                  <div>
                    <span className="mb-1 block text-muted-foreground">
                      {t("createModal.bio")}:
                    </span>
                    <p className="leading-relaxed whitespace-pre-wrap text-foreground">
                      {currentTeacher.teacherProfile.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Free-time schedule */}
            <div className="flex flex-col gap-3">
              {availabilities.length === 0 ? (
                <>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>{t("profileModal.freeTimeSchedule")}</span>
                  </h4>
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    {t("availabilities.noSlots")}
                  </div>
                </>
              ) : (
                <Carousel
                  opts={{
                    align: "start",
                    dragFree: true,
                    containScroll: "trimSnaps",
                  }}
                  className="flex w-full flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>{t("profileModal.freeTimeSchedule")}</span>
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <CarouselPrevious className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
                      <CarouselNext className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
                    </div>
                  </div>

                  <CarouselContent className="-ms-2.5">
                    {availabilities.map((slot, index) => {
                      const dayLabel = t(`days.${slot.dayOfWeek as WeekDay}`)
                      return (
                        <CarouselItem
                          key={slot.id || index}
                          className="basis-[80%] ps-2.5 sm:basis-1/2"
                        >
                          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs transition-colors hover:border-border">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Calendar className="size-4 text-muted-foreground" />
                              </div>
                              <span className="text-xs font-semibold text-foreground">
                                {dayLabel}
                              </span>
                            </div>
                            <span
                              className="font-mono text-xs font-medium text-muted-foreground"
                              dir="ltr"
                            >
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        </CarouselItem>
                      )
                    })}
                  </CarouselContent>
                </Carousel>
              )}
            </div>

            {/* Classes Taught */}
            <div className="flex flex-col gap-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="size-4 text-muted-foreground" />
                <span>{t("profileModal.classesTaught")}</span>
              </h4>

              {teachingClasses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  {t("profileModal.noClasses")}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {teachingClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {cls.title}
                        </p>
                        {cls.term && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {cls.term.title}
                          </p>
                        )}
                      </div>
                      {cls.schedule && (
                        <span className="text-[11px] text-muted-foreground">
                          {cls.schedule}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 min-w-28 rounded-xl text-sm font-medium"
          >
            {t("profileModal.close")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
