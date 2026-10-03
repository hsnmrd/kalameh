"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { UseFormSetValue, UseFormWatch } from "react-hook-form"
import { useDebounce } from "@workspace/ui/hooks/use-debounce"
import { studentsResource } from "@/lib/api"
import type { CreateStudentInput } from "../use-student-schemas"

export interface UseStudentLookupProps {
  open: boolean
  watch: UseFormWatch<CreateStudentInput>
  setValue: UseFormSetValue<CreateStudentInput>
}

export function useStudentLookup({
  open,
  watch,
  setValue,
}: UseStudentLookupProps) {
  const nationalCodeValue = watch("nationalCode")
  const phoneValue = watch("phone")
  const debouncedNationalCode = useDebounce(
    nationalCodeValue?.trim() || "",
    400
  )
  const debouncedPhone = useDebounce(phoneValue?.trim() || "", 400)
  const lastAutoFilledIdRef = React.useRef<string | null>(null)

  const shouldQuery =
    open && (debouncedNationalCode.length >= 8 || debouncedPhone.length === 11)

  const hasInput =
    open &&
    ((nationalCodeValue?.trim().length ?? 0) >= 8 ||
      (phoneValue?.trim().length ?? 0) === 11)

  const isDebouncing =
    hasInput &&
    (debouncedNationalCode !== (nationalCodeValue?.trim() || "") ||
      debouncedPhone !== (phoneValue?.trim() || ""))

  const { data: lookupData, isFetching: isQueryFetching } = useQuery({
    ...studentsResource.lookup.toQuery({
      nationalCode:
        debouncedNationalCode.length >= 8 ? debouncedNationalCode : undefined,
      phone: debouncedPhone.length === 11 ? debouncedPhone : undefined,
    }),
    enabled: shouldQuery,
  })

  const isLookingUp = isQueryFetching || isDebouncing

  React.useEffect(() => {
    if (!open) {
      lastAutoFilledIdRef.current = null
      return
    }

    if (lookupData?.found && lookupData?.student) {
      const student = lookupData.student
      if (lastAutoFilledIdRef.current !== student.id) {
        lastAutoFilledIdRef.current = student.id
        setValue("firstName", student.firstName, { shouldValidate: true })
        setValue("lastName", student.lastName, { shouldValidate: true })
        if (student.phone) {
          setValue("phone", student.phone, { shouldValidate: true })
        }
        if (student.nationalCode) {
          setValue("nationalCode", student.nationalCode, {
            shouldValidate: true,
          })
        }
        if (student.fatherName) {
          setValue("fatherName", student.fatherName, { shouldValidate: true })
        }
        if (student.birthDate) {
          setValue("birthDate", student.birthDate.slice(0, 10), {
            shouldValidate: true,
          })
        }
        if (student.gender) {
          setValue("gender", student.gender, { shouldValidate: true })
        }
        if (student.emergencyPhone) {
          setValue("emergencyPhone", student.emergencyPhone, {
            shouldValidate: true,
          })
        }
        if (student.address) {
          setValue("address", student.address, { shouldValidate: true })
        }
        if (student.currentAllowedCourseId) {
          setValue("currentAllowedCourseId", student.currentAllowedCourseId, {
            shouldValidate: true,
          })
        }
      }
    }
  }, [open, lookupData, setValue])

  const resetLookup = React.useCallback(() => {
    lastAutoFilledIdRef.current = null
  }, [])

  return {
    lookupData,
    isLookingUp,
    shouldQuery,
    resetLookup,
  }
}
