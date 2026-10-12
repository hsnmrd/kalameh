import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface ModalStoreState {
  modalData: Record<string, any>
  setModalData: <T = any>(modalKey: string, data: T) => void
  getModalData: <T = any>(modalKey: string) => T | undefined
  clearModalData: (modalKey: string) => void
  clearAllModalData: () => void
}

export const useModalStore = create<ModalStoreState>()(
  persist(
    (set, get) => ({
      modalData: {},
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
      clearAllModalData: () => set({ modalData: {} }),
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
