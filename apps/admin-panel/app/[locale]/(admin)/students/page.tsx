"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { StudentDto } from "@workspace/types"
import { coursesResource, studentsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { StudentsHeader } from "./components/students-header"
import { StudentsFilter } from "./components/students-filter"
import { StudentsTable } from "./components/students-table"
import { CreateStudentModal } from "./components/create-student-modal"
import { EditStudentModal } from "./components/edit-student-modal"
import { StudentProfileModal } from "./components/student-profile-modal"
import { ResetPasswordModal } from "./components/reset-password-modal"

export default function StudentsPage() {
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedCourseId, setSelectedCourseId] = React.useState("ALL")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editStudent, setEditStudent] = React.useState<StudentDto | null>(null)
  const [profileStudent, setProfileStudent] = React.useState<StudentDto | null>(
    null
  )
  const [resetPasswordStudent, setResetPasswordStudent] =
    React.useState<StudentDto | null>(null)

  const { activeInstituteId } = useActiveInstitute()

  // Fetch list of courses for course filter & modal selection
  const { data: courses = [] } = useQuery(
    coursesResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    )
  )

  // Query students
  const isActiveFilter =
    selectedStatus === "ACTIVE"
      ? true
      : selectedStatus === "INACTIVE"
        ? false
        : undefined

  const { data: students, isLoading } = useQuery(
    studentsResource.list.toQuery({
      search: searchValue.trim() || undefined,
      courseId: selectedCourseId !== "ALL" ? selectedCourseId : undefined,
      isActive: isActiveFilter,
      instituteId: activeInstituteId,
    })
  )

  const totalCount = students?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <StudentsHeader
        totalCount={totalCount}
        onAddStudentClick={() => setCreateModalOpen(true)}
      />

      {/* Search & Filters */}
      <StudentsFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        selectedCourseId={selectedCourseId}
        onCourseChange={setSelectedCourseId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        courses={courses}
      />

      {/* Students Data Table / Mobile Cards */}
      <StudentsTable
        students={students}
        isLoading={isLoading}
        onViewProfile={(student) => setProfileStudent(student)}
        onEdit={(student) => setEditStudent(student)}
        onResetPassword={(student) => setResetPasswordStudent(student)}
      />

      {/* Create Student Modal */}
      <CreateStudentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        instituteId={activeInstituteId}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        student={editStudent}
        open={Boolean(editStudent)}
        onClose={() => setEditStudent(null)}
      />

      {/* View Student Dossier / Profile Modal */}
      <StudentProfileModal
        student={profileStudent}
        open={Boolean(profileStudent)}
        onClose={() => setProfileStudent(null)}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        student={resetPasswordStudent}
        open={Boolean(resetPasswordStudent)}
        onClose={() => setResetPasswordStudent(null)}
      />
    </div>
  )
}
