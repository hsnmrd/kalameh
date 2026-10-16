import type {
  EnrollmentDto,
  ReservationResponseDto,
  ReserveClassInput,
  WaitlistClassInput,
} from "@workspace/types"
import { api } from "../client"

export const enrollmentsResource = api.resource("enrollments", {
  my: api.get<EnrollmentDto[]>("/enrollments/my"),
  reserve: api.post<ReservationResponseDto, ReserveClassInput>(
    "/enrollments/reserve",
    { body: (params) => params }
  ),
  cancelReservation: api.delete<{ success: boolean }, string>(
    (classId) => `/enrollments/reserve/${classId}`
  ),
  waitlist: api.post<EnrollmentDto, WaitlistClassInput>(
    "/enrollments/waitlist",
    { body: (params) => params }
  ),
})
