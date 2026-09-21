"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { GraduationCap, Clock, BookOpen, Calendar, Edit2 } from "lucide-react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { type TeacherDto, type WeekDay } from "@workspace/types"
import { teachersResource } from "@/lib/api"
import { ProfileActions } from "./profile-actions"
import { ProfileSummary } from "./profile-summary"
import { TeachableCourses } from "./teachable-courses"

export interface TeacherProfileModalProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
  onEdit?: (teacher: TeacherDto) => void
  onManageAvailability?: (teacher: TeacherDto) => void
  onResetPassword?: (teacher: TeacherDto) => void
}

export function TeacherProfileModal({
  teacher,
  open,
  onClose,
  onEdit,
  onManageAvailability,
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
            <ProfileActions
              teacher={currentTeacher}
              fullName={fullName}
              onClose={onClose}
              onEdit={onEdit}
              onManageAvailability={onManageAvailability}
              onResetPassword={onResetPassword}
            />
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
            <ProfileSummary
              teacher={currentTeacher}
              fullName={fullName}
              initials={initials}
            />

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

            <TeachableCourses
              qualifications={
                currentTeacher.teacherProfile?.teachableCourses || []
              }
            />

            {/* Free-time schedule */}
            <div className="flex flex-col gap-3">
              {availabilities.length === 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Clock className="size-4 text-muted-foreground" />
                      <span>{t("profileModal.freeTimeSchedule")}</span>
                    </h4>
                    {onManageAvailability && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onClose()
                          onManageAvailability(currentTeacher)
                        }}
                        className="h-8 gap-1.5 px-2 text-xs text-primary hover:text-primary"
                      >
                        <Clock className="size-3.5 text-primary" />
                        <span>{t("table.setAvailability")}</span>
                      </Button>
                    )}
                  </div>
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
                    <div className="flex items-center gap-2">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Clock className="size-4 text-muted-foreground" />
                        <span>{t("profileModal.freeTimeSchedule")}</span>
                      </h4>
                      {onManageAvailability && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            onClose()
                            onManageAvailability(currentTeacher)
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          title={t("actions.manageAvailability")}
                          aria-label={t("actions.manageAvailability")}
                        >
                          <Edit2 className="size-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
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
