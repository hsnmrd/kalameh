import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { InstituteWithStats } from "@workspace/types"

export interface ActiveInstituteState {
  activeInstitute: InstituteWithStats | null
  selectInstitute: (institute: InstituteWithStats) => void
  clearActiveInstitute: () => void
  setActiveInstitute: (institute: InstituteWithStats | null) => void
}

export const useActiveInstituteStore = create<ActiveInstituteState>()(
  persist(
    (set) => ({
      activeInstitute: null,
      selectInstitute: (institute) => set({ activeInstitute: institute }),
      clearActiveInstitute: () => set({ activeInstitute: null }),
      setActiveInstitute: (institute) => set({ activeInstitute: institute }),
    }),
    {
      name: "kalameh_active_institute",
    }
  )
)
