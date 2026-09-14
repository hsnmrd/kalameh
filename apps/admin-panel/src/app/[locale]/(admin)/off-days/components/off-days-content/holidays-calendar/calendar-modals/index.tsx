"use client"

import * as React from "react"
import type { InstituteCustomOffDay } from "@workspace/types"
import { AddOffDayModal } from "../../../add-off-day-modal"
import { DeleteOffDayModal } from "../../../delete-off-day-modal"

export interface CalendarModalsProps {
  instituteId: string
  observeOfficialHolidays: boolean
  existingOffDays: string[]
  addModalOpen: boolean
  onAddModalClose: () => void
  selectedDateForAdd?: string
  deleteModalOpen: boolean
  onDeleteModalClose: () => void
  selectedOffDayForDelete: InstituteCustomOffDay | null
}

export function CalendarModals({
  instituteId,
  observeOfficialHolidays,
  existingOffDays,
  addModalOpen,
  onAddModalClose,
  selectedDateForAdd,
  deleteModalOpen,
  onDeleteModalClose,
  selectedOffDayForDelete,
}: CalendarModalsProps) {
  return (
    <>
      <AddOffDayModal
        open={addModalOpen}
        onClose={onAddModalClose}
        instituteId={instituteId}
        observeOfficialHolidays={observeOfficialHolidays}
        existingOffDays={existingOffDays}
        defaultDate={selectedDateForAdd}
      />

      <DeleteOffDayModal
        open={deleteModalOpen}
        onClose={onDeleteModalClose}
        offDay={selectedOffDayForDelete}
        instituteId={instituteId}
      />
    </>
  )
}
