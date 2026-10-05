import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface ModalStoreState {
  activeModals: string[]
  modalData: Record<string, any>
  setActiveModals: (modals: string[]) => void
  openModalInStore: (modalKey: string) => void
  closeModalInStore: (modalKeys?: string | string[]) => void
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
      setActiveModals: (modals) => set({ activeModals: modals }),
      openModalInStore: (modalKey) =>
        set((state) => {
          if (state.activeModals.includes(modalKey)) return state
          return { activeModals: [...state.activeModals, modalKey] }
        }),
      closeModalInStore: (modalKeys) =>
        set((state) => {
          if (!modalKeys) {
            return { activeModals: state.activeModals.slice(0, -1) }
          }
          const keysToClose = Array.isArray(modalKeys) ? modalKeys : [modalKeys]
          return {
            activeModals: state.activeModals.filter(
              (key) => !keysToClose.includes(key)
            ),
          }
        }),
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
      clearAllModalData: () => set({ activeModals: [], modalData: {} }),
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
