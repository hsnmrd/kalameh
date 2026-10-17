"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Layers } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { ENROLLMENT_STATUSES, type ClassDto } from "@workspace/types"
import { classesResource, enrollmentsResource } from "@/lib/api"
import { StudentLevelHeader } from "./components/student-level-header"
import { StudentClassCard } from "./components/student-class-card"

export default function StudentClassesPage() {
  const t = useTranslations("classes")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeClassId, setActiveClassId] = React.useState<string | null>(null)

  const { data, isLoading } = useQuery({
    ...classesResource.available.toQuery(),
    staleTime: 0,
    refetchOnMount: "always",
  })

  const { data: myEnrollments } = useQuery({
    ...enrollmentsResource.my.toQuery(),
    staleTime: 0,
    refetchOnMount: "always",
  })

  const reserveMutation = useMutation({
    ...enrollmentsResource.reserve.toMutation(),
    onSuccess: (res) => {
      toast.success(t("reserveSuccess"))
      void queryClient.invalidateQueries({
        queryKey: classesResource.available.baseKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: enrollmentsResource.my.baseKey(),
      })
      router.push(`/enrollments?classId=${res.classId}`)
    },
    onSettled: () => setActiveClassId(null),
  })

  const waitlistMutation = useMutation({
    ...enrollmentsResource.waitlist.toMutation(),
    onSuccess: () => {
      toast.success(t("waitlistSuccess"))
      void queryClient.invalidateQueries({
        queryKey: classesResource.available.baseKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: enrollmentsResource.my.baseKey(),
      })
      router.push("/enrollments")
    },
    onSettled: () => setActiveClassId(null),
  })

  const handleEnroll = (cls: ClassDto) => {
    if (cls.studentEnrollmentStatus === ENROLLMENT_STATUSES.PENDING_PAYMENT) {
      router.push(`/enrollments?classId=${cls.id}`)
      return
    }
    if (cls.studentEnrollmentStatus) {
      toast.info(t("alreadyRequested"))
      router.push("/enrollments")
      return
    }
    setActiveClassId(cls.id)
    reserveMutation.mutate({ classId: cls.id })
  }

  const handleWaitlist = (cls: ClassDto) => {
    if (cls.studentEnrollmentStatus) {
      toast.info(t("alreadyRequested"))
      router.push("/enrollments")
      return
    }
    setActiveClassId(cls.id)
    waitlistMutation.mutate({ classId: cls.id })
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <StudentLevelHeader allowedCourseTitle={data?.allowedCourseTitle} />

      {isLoading ? (
        <div className="flex h-56 w-full items-center justify-center">
          <Spinner className="size-8 text-foreground" />
        </div>
      ) : !data?.classes || data.classes.length === 0 ? (
        <div className="flex h-56 w-full flex-col items-center justify-center border-y border-border/60 p-6 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Layers className="size-6" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {data.classes.map((cls) => {
            const myEnrollment = myEnrollments?.find(
              (e) => e.classId === cls.id
            )
            const effectiveStatus =
              myEnrollment?.status ?? cls.studentEnrollmentStatus ?? null
            const effectiveCls: ClassDto = {
              ...cls,
              studentEnrollmentStatus: effectiveStatus,
            }

            return (
              <StudentClassCard
                key={cls.id}
                cls={effectiveCls}
                onEnroll={handleEnroll}
                onWaitlist={handleWaitlist}
                isPending={
                  activeClassId === cls.id &&
                  (reserveMutation.isPending || waitlistMutation.isPending)
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
