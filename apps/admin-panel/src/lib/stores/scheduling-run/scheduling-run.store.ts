import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { SchedulingRunDto } from "@workspace/types"

export interface SchedulingRunState {
  activeRun: SchedulingRunDto | null
  setActiveRun: (run: SchedulingRunDto | null) => void
  clearActiveRun: () => void
}

export const useSchedulingRunStore = create<SchedulingRunState>()(
  persist(
    (set) => ({
      activeRun: null,
      setActiveRun: (run) => set({ activeRun: run }),
      clearActiveRun: () => set({ activeRun: null }),
    }),
    {
      name: "kalameh_active_scheduling_run",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
