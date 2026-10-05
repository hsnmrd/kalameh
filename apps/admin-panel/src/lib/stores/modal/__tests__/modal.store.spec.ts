import { describe, it, expect, beforeEach } from "vitest"
import { useModalStore } from "../modal.store"

describe("useModalStore", () => {
  beforeEach(() => {
    useModalStore.getState().clearAllModalData()
  })

  it("initializes with empty modalData", () => {
    expect(useModalStore.getState().modalData).toEqual({})
  })

  it("sets and gets modal data for a given key", () => {
    const payload = { id: "class-123", name: "Mathematics" }
    useModalStore.getState().setModalData("editClass", payload)

    expect(useModalStore.getState().getModalData("editClass")).toEqual(payload)
    expect(useModalStore.getState().modalData["editClass"]).toEqual(payload)
  })

  it("handles multiple separate modal keys independently", () => {
    useModalStore.getState().setModalData("createClass", { step: 1 })
    useModalStore.getState().setModalData("deleteClass", { id: "99" })

    expect(useModalStore.getState().getModalData("createClass")).toEqual({
      step: 1,
    })
    expect(useModalStore.getState().getModalData("deleteClass")).toEqual({
      id: "99",
    })
  })

  it("clears data for a specific modal key without affecting others", () => {
    useModalStore.getState().setModalData("modalA", "dataA")
    useModalStore.getState().setModalData("modalB", "dataB")

    useModalStore.getState().clearModalData("modalA")

    expect(useModalStore.getState().getModalData("modalA")).toBeUndefined()
    expect(useModalStore.getState().getModalData("modalB")).toBe("dataB")
  })

  it("clears all modal data on clearAllModalData", () => {
    useModalStore.getState().setModalData("modalA", 1)
    useModalStore.getState().setModalData("modalB", 2)

    useModalStore.getState().clearAllModalData()

    expect(useModalStore.getState().modalData).toEqual({})
  })
})
