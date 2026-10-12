import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface OperatingPhasesReviewState {
  reviewedInstituteIds: Record<string, boolean>
  markAsReviewed: (instituteId: string) => void
  isReviewed: (instituteId?: string | null) => boolean
}

export const useOperatingPhasesReviewStore =
  create<OperatingPhasesReviewState>()(
    persist(
      (set, get) => ({
        reviewedInstituteIds: {},
        markAsReviewed: (instituteId) => {
          if (!instituteId) return
          set((state) => ({
            reviewedInstituteIds: {
              ...state.reviewedInstituteIds,
              [instituteId]: true,
            },
          }))
        },
        isReviewed: (instituteId) => {
          if (!instituteId) return false
          return Boolean(get().reviewedInstituteIds[instituteId])
        },
      }),
      {
        name: "kalameh_operating_phases_review",
      }
    )
  )
