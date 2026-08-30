"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { UseFormSetValue, UseFormWatch } from "react-hook-form"
import { ROLES } from "@workspace/types"
import { useDebounce } from "@workspace/ui/hooks/use-debounce"
import { usersResource } from "@/lib/api"
import type { CreateUserInput } from "../use-user-schemas"

export interface UseUserLookupProps {
  open: boolean
  watch: UseFormWatch<CreateUserInput>
  setValue: UseFormSetValue<CreateUserInput>
}

export function useUserLookup({ open, watch, setValue }: UseUserLookupProps) {
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
    ...usersResource.lookup.toQuery({
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

    if (lookupData?.found && lookupData?.user) {
      const user = lookupData.user
      if (lastAutoFilledIdRef.current !== user.id) {
        lastAutoFilledIdRef.current = user.id
        setValue("firstName", user.firstName, { shouldValidate: true })
        setValue("lastName", user.lastName, { shouldValidate: true })
        if (user.phone) {
          setValue("phone", user.phone, { shouldValidate: true })
        }
        if (user.nationalCode) {
          setValue("nationalCode", user.nationalCode, { shouldValidate: true })
        }
        if (
          user.role &&
          user.role !== ROLES.STUDENT &&
          user.role !== ROLES.SUPER_STUDENT
        ) {
          setValue("role", user.role, { shouldValidate: true })
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
