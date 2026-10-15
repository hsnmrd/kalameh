import * as React from "react"
import { TeacherProfileContent } from "./components/teacher-profile-content"

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TeacherProfileContent teacherId={id} />
}
