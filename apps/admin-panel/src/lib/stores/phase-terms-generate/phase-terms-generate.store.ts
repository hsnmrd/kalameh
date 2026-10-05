import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import {
  gregorianToJalali,
  type GeneratedTermProposal,
  type CompensatorySession,
} from "@workspace/types"

export interface PhaseTermsGenerateState {
  selectedPhaseId: string
  jalaliYear: number
  sessionsPerTerm: number
  gapDays: number
  proposals: GeneratedTermProposal[]
  customTitles: Record<number, string>
  pinnedStartDates: Record<number, string>
  compensatorySessions: Record<number, CompensatorySession[]>
  localCustomOffDays: string[] | null
  dismissedHolidaysOverride: string[] | null
  viewMode: "calendar" | "table"

  setSelectedPhaseId: (phaseId: string) => void
  setJalaliYear: (year: number) => void
  setSessionsPerTerm: (sessions: number) => void
  setGapDays: (days: number) => void
  setProposals: (
    proposals:
      | GeneratedTermProposal[]
      | ((prev: GeneratedTermProposal[]) => GeneratedTermProposal[])
  ) => void
  setCustomTitles: (
    titles:
      | Record<number, string>
      | ((prev: Record<number, string>) => Record<number, string>)
  ) => void
  setPinnedStartDates: (
    dates:
      | Record<number, string>
      | ((prev: Record<number, string>) => Record<number, string>)
  ) => void
  setCompensatorySessions: (
    sessions:
      | Record<number, CompensatorySession[]>
      | ((
          prev: Record<number, CompensatorySession[]>
        ) => Record<number, CompensatorySession[]>)
  ) => void
  setLocalCustomOffDays: (
    days: string[] | null | ((prev: string[] | null) => string[] | null)
  ) => void
  setDismissedHolidaysOverride: (
    holidays: string[] | null | ((prev: string[] | null) => string[] | null)
  ) => void
  setViewMode: (mode: "calendar" | "table") => void
  reset: () => void
}

const getDefaultJalaliYear = () => {
  try {
    return gregorianToJalali(new Date()).year
  } catch {
    return 1403
  }
}

export const usePhaseTermsGenerateStore = create<PhaseTermsGenerateState>()(
  persist(
    (set) => ({
      selectedPhaseId: "",
      jalaliYear: getDefaultJalaliYear(),
      sessionsPerTerm: 18,
      gapDays: 2,
      proposals: [],
      customTitles: {},
      pinnedStartDates: {},
      compensatorySessions: {},
      localCustomOffDays: null,
      dismissedHolidaysOverride: null,
      viewMode: "calendar",

      setSelectedPhaseId: (selectedPhaseId) => set({ selectedPhaseId }),
      setJalaliYear: (jalaliYear) => set({ jalaliYear }),
      setSessionsPerTerm: (sessionsPerTerm) => set({ sessionsPerTerm }),
      setGapDays: (gapDays) => set({ gapDays }),
      setProposals: (proposals) =>
        set((state) => ({
          proposals:
            typeof proposals === "function"
              ? proposals(state.proposals)
              : proposals,
        })),
      setCustomTitles: (customTitles) =>
        set((state) => ({
          customTitles:
            typeof customTitles === "function"
              ? customTitles(state.customTitles)
              : customTitles,
        })),
      setPinnedStartDates: (pinnedStartDates) =>
        set((state) => ({
          pinnedStartDates:
            typeof pinnedStartDates === "function"
              ? pinnedStartDates(state.pinnedStartDates)
              : pinnedStartDates,
        })),
      setCompensatorySessions: (compensatorySessions) =>
        set((state) => ({
          compensatorySessions:
            typeof compensatorySessions === "function"
              ? compensatorySessions(state.compensatorySessions)
              : compensatorySessions,
        })),
      setLocalCustomOffDays: (localCustomOffDays) =>
        set((state) => ({
          localCustomOffDays:
            typeof localCustomOffDays === "function"
              ? localCustomOffDays(state.localCustomOffDays)
              : localCustomOffDays,
        })),
      setDismissedHolidaysOverride: (dismissedHolidaysOverride) =>
        set((state) => ({
          dismissedHolidaysOverride:
            typeof dismissedHolidaysOverride === "function"
              ? dismissedHolidaysOverride(state.dismissedHolidaysOverride)
              : dismissedHolidaysOverride,
        })),
      setViewMode: (viewMode) => set({ viewMode }),
      reset: () =>
        set({
          selectedPhaseId: "",
          jalaliYear: getDefaultJalaliYear(),
          sessionsPerTerm: 18,
          gapDays: 2,
          proposals: [],
          customTitles: {},
          pinnedStartDates: {},
          compensatorySessions: {},
          localCustomOffDays: null,
          dismissedHolidaysOverride: null,
          viewMode: "calendar",
        }),
    }),
    {
      name: "kalameh_phase_terms_generate_state",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
