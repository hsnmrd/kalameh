import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface ModalStoreState {
  activeModals: string[]
  modalData: Record<string, any>
  setActiveModals: (keys: string[]) => void
  setModalData: <T = any>(modalKey: string, data: T) => void
  getModalData: <T = any>(modalKey: string) => T | undefined
  clearModalData: (modalKey: string) => void
  clearAllModalData: () => void
}

export const useModalStore = create<ModalStoreState>()(
  persist(
    (set, get) => ({
      activeModals: [],
      modalData: {},
      setActiveModals: (keys) => set({ activeModals: keys }),
      setModalData: (modalKey, data) =>
        set((state) => ({
          modalData: {
            ...state.modalData,
            [modalKey]: data,
          },
        })),
      getModalData: (modalKey) => get().modalData[modalKey],
      clearModalData: (modalKey) =>
        set((state) => {
          if (!(modalKey in state.modalData)) return state
          const next = { ...state.modalData }
          delete next[modalKey]
          return { modalData: next }
        }),
      clearAllModalData: () => set({ modalData: {}, activeModals: [] }),
    }),
    {
      name: "kalameh_modal_state",
      partialize: (state) => ({ modalData: state.modalData }),
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
)
