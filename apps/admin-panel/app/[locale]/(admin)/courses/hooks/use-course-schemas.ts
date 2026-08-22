"use client"

import * as React from "react"
import {
  createCreateCourseSchema,
  createUpdateCourseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "@workspace/types"

export type { CreateCourseInput, UpdateCourseInput }

export function useCreateCourseSchema() {
  return React.useMemo(() => {
    return createCreateCourseSchema()
  }, [])
}

export function useUpdateCourseSchema() {
  return React.useMemo(() => {
    return createUpdateCourseSchema()
  }, [])
}
