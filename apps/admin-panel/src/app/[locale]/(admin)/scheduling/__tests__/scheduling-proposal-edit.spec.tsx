import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import type {
  BranchWithStats,
  ClassroomDto,
  SchedulingPlanDetailsDto,
  SchedulingProposalDto,
  TeacherDto,
} from "@workspace/types"
import {
  branchesResource,
  classroomsResource,
  schedulingResource,
  teachersResource,
} from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingPlanComparison } from "../components/scheduling-plan-comparison"

const instituteId = "11111111-1111-4111-8111-111111111111"
const planId = "22222222-2222-4222-8222-222222222222"
const proposalId = "33333333-3333-4333-8333-333333333333"
const teacherId = "44444444-4444-4444-8444-444444444444"
const nextTeacherId = "99999999-9999-4999-8999-999999999999"
const courseId = "55555555-5555-4555-8555-555555555555"
const branchId = "66666666-6666-4666-8666-666666666666"
const nextBranchId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const classroomId = "77777777-7777-4777-8777-777777777777"
const timestamp = "2026-09-09T10:00:00.000Z"

const selectedPlan = {
  id: planId,
  instituteId,
  runId: "88888888-8888-4888-8888-888888888888",
  status: "SELECTED",
  rank: 1,
  isRecommended: true,
  qualityIndex: 90,
  earnedWeightedPoints: 68,
  applicableWeightedPoints: 75,
  coveragePercent: 95,
  minimumCourseCoveragePercent: 90,
  scoreBreakdown: { criteria: [] },
  generatedAt: timestamp,
  warnings: [],
  unresolvedRequirements: [],
  proposals: [
    {
      id: proposalId,
      instituteId,
      planId,
      courseId,
      teacherId,
      branchId,
      classroomId: null,
      title: "کلاس سطح A2",
      capacity: 12,
      deliveryMode: "ONLINE",
      daysOfWeek: ["SATURDAY", "MONDAY"],
      startTime: "09:00",
      endTime: "10:30",
      course: { id: courseId, title: "A2" },
      teacher: { id: teacherId, firstName: "سارا", lastName: "احمدی" },
      branch: { id: branchId, name: "مرکزی" },
      classroom: null,
      sessions: [],
      warnings: [],
      selectionReasons: [],
      isLocked: false,
      isManuallyEdited: false,
      publishedClassId: null,
    },
  ],
  run: {
    term: { title: "پاییز" },
    branch: null,
  },
} as SchedulingPlanDetailsDto

describe("MVP-039 scheduling proposal editing", () => {
  afterEach(() => vi.restoreAllMocks())

  it("edits every reviewable proposal field and refreshes the plan", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    const planDetailQuery = vi.fn(async () => selectedPlan)
    vi.spyOn(schedulingResource.planDetail, "toQuery").mockReturnValue({
      queryKey: schedulingResource.planDetail.key({ planId, instituteId }),
      queryFn: planDetailQuery,
    })
    vi.spyOn(teachersResource.list, "toQuery").mockReturnValue({
      queryKey: ["teachers", "qualified"],
      queryFn: async () =>
        [
          {
            id: teacherId,
            firstName: "سارا",
            lastName: "احمدی",
            teacherProfile: { teachableCourses: [{ courseId }] },
          },
          {
            id: nextTeacherId,
            firstName: "علی",
            lastName: "رضایی",
            teacherProfile: { teachableCourses: [{ courseId }] },
          },
        ] as TeacherDto[],
    } as never)
    vi.spyOn(branchesResource.list, "toQuery").mockReturnValue({
      queryKey: ["branches", "active"],
      queryFn: async () =>
        [
          { id: branchId, name: "مرکزی" },
          { id: nextBranchId, name: "شمال" },
        ] as BranchWithStats[],
    } as never)
    vi.spyOn(classroomsResource.list, "toQuery").mockReturnValue({
      queryKey: ["classrooms", "active"],
      queryFn: async () =>
        [
          {
            id: classroomId,
            branchId: nextBranchId,
            name: "کلاس ۵",
            capacity: 20,
          },
        ] as ClassroomDto[],
    } as never)
    const update = vi.fn(async () =>
      Promise.resolve(selectedPlan.proposals[0] as SchedulingProposalDto)
    )
    vi.spyOn(schedulingResource.updateProposal, "toMutation").mockReturnValue({
      mutationFn: update,
    })

    render(
      <SchedulingPlanComparison planIds={[planId]} recommendedPlanId={planId} />
    )

    fireEvent.click(
      await screen.findByRole("button", { name: "مشاهده جزئیات" })
    )
    fireEvent.click(
      screen.getByRole("button", { name: "ویرایش کلاس پیشنهادی" })
    )

    expect(
      screen.getByRole("heading", { name: "ویرایش کلاس پیشنهادی" })
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("عنوان کلاس"), {
      target: { value: "کلاس مکالمه A2" },
    })
    const teacherCombobox = screen.getByRole("combobox", { name: "استاد" })
    await waitFor(() => expect(teacherCombobox).toBeEnabled())
    fireEvent.click(teacherCombobox)
    fireEvent.click(await screen.findByRole("option", { name: "علی رضایی" }))
    fireEvent.change(screen.getByLabelText("ظرفیت"), {
      target: { value: "14" },
    })
    fireEvent.click(screen.getByRole("button", { name: "حضوری" }))
    const branchCombobox = screen.getByRole("combobox", { name: "شعبه" })
    fireEvent.click(branchCombobox)
    fireEvent.click(await screen.findByRole("option", { name: "شمال" }))
    await waitFor(() => expect(branchCombobox).toHaveTextContent("شمال"))
    const classroomCombobox = screen.getByRole("combobox", {
      name: "کلاس‌درس",
    })
    await waitFor(() => expect(classroomCombobox).toBeEnabled())
    fireEvent.click(classroomCombobox)
    fireEvent.click(
      await screen.findByRole("option", { name: /کلاس ۵، ظرفیت/ })
    )
    fireEvent.click(screen.getByRole("button", { name: "دوشنبه" }))
    fireEvent.click(screen.getByRole("button", { name: "یکشنبه" }))
    fireEvent.change(screen.getByLabelText("ساعت شروع"), {
      target: { value: "13:00" },
    })
    fireEvent.change(screen.getByLabelText("ساعت پایان"), {
      target: { value: "14:30" },
    })
    const saveButton = await screen.findByRole("button", {
      name: "ذخیره تغییرات",
    })
    await waitFor(() => expect(saveButton).toBeEnabled())
    fireEvent.click(saveButton)

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1))
    expect(update).toHaveBeenCalledWith(
      {
        planId,
        proposalId,
        instituteId,
        body: {
          title: "کلاس مکالمه A2",
          teacherId: nextTeacherId,
          branchId: nextBranchId,
          classroomId,
          capacity: 14,
          deliveryMode: "IN_PERSON",
          daysOfWeek: ["SATURDAY", "SUNDAY"],
          startTime: "13:00",
          endTime: "14:30",
        },
      },
      expect.any(Object)
    )
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "ویرایش کلاس پیشنهادی" })
      ).not.toBeInTheDocument()
    )
    expect(planDetailQuery).toHaveBeenCalledTimes(2)
  })
})
