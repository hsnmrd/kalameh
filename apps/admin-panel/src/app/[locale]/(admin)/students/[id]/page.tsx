import * as React from "react"
import { StudentProfileContent } from "./components/student-profile-content"

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <StudentProfileContent studentId={id} />
}
