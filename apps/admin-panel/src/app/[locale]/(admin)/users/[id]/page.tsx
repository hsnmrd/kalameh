import * as React from "react"
import { UserProfileContent } from "./components/user-profile-content"

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <UserProfileContent userId={id} />
}
