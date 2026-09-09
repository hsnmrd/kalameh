import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "../../../../../test/test-utils"
import type { SchedulingRunDto, SchedulingRunStatusDto } from "@workspace/types"
import { schedulingResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingRunStatusPanel } from "../components/scheduling-run-status-panel"
import {
  getSchedulingRunPollInterval,
  SCHEDULING_RUN_POLL_INTERVAL,
} from "../hooks/use-scheduling-run-status"

const instituteId = "11111111-1111-4111-8111-111111111111"
const runId = "22222222-2222-4222-8222-222222222222"
const planId = "33333333-3333-4333-8333-333333333333"
const timestamp = "2026-09-09T10:00:00.000Z"

const queuedRun: SchedulingRunDto = {
  id: runId,
  instituteId,
  termId: "44444444-4444-4444-8444-444444444444",
  requestedByUserId: "55555555-5555-4555-8555-555555555555",
  status: "QUEUED",
  inputSnapshot: {},
  settingsSnapshot: {},
  plans: [],
  createdAt: timestamp,
  updatedAt: timestamp,
}

const completedStatus: SchedulingRunStatusDto = {
  runId,
  status: "COMPLETED",
  isTerminal: true,
  result: { planIds: [planId], recommendedPlanId: planId },
  preflightReport: null,
  failureCode: null,
  failureMessage: null,
  startedAt: timestamp,
  completedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
}

describe("MVP-035 scheduling run status panel", () => {
  afterEach(() => vi.restoreAllMocks())

  it("polls active runs and stops for terminal or failed queries", () => {
    expect(getSchedulingRunPollInterval({})).toBe(SCHEDULING_RUN_POLL_INTERVAL)
    expect(getSchedulingRunPollInterval({ data: completedStatus })).toBe(false)
    expect(getSchedulingRunPollInterval({ error: new Error("offline") })).toBe(
      false
    )
  })

  it("shows the completed result and allows starting another run", async () => {
    const queryFn = vi.fn().mockResolvedValue(completedStatus)
    const onReset = vi.fn()

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    const statusQuerySpy = vi
      .spyOn(schedulingResource.runStatus, "toQuery")
      .mockReturnValue({
        queryKey: ["scheduling", "run-status", runId],
        queryFn,
      } as never)

    render(<SchedulingRunStatusPanel run={queuedRun} onReset={onReset} />)

    expect(
      await screen.findByRole("heading", { name: "پیشنهادها آماده‌اند" })
    ).toBeInTheDocument()
    expect(screen.getByText("۱ پیشنهاد زمان‌بندی ساخته شد")).toBeInTheDocument()
    expect(statusQuerySpy).toHaveBeenCalledWith({ runId, instituteId })

    fireEvent.click(screen.getByRole("button", { name: "ساخت اجرای دیگر" }))
    expect(onReset).toHaveBeenCalledOnce()
    await waitFor(() => expect(queryFn).toHaveBeenCalledOnce())
  })

  it("shows the engine message when preflight blocks generation", async () => {
    const preflightFailure: SchedulingRunStatusDto = {
      ...completedStatus,
      status: "PREFLIGHT_FAILED",
      isTerminal: true,
      result: null,
      failureCode: "PREFLIGHT_BLOCKED",
      failureMessage: "هیچ استاد واجد شرایطی برای این دوره ثبت نشده است.",
    }

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
    } as ReturnType<typeof stores.useActiveInstitute>)
    vi.spyOn(schedulingResource.runStatus, "toQuery").mockReturnValue({
      queryKey: ["scheduling", "run-status", runId, "failed"],
      queryFn: async () => preflightFailure,
    } as never)

    render(<SchedulingRunStatusPanel run={queuedRun} onReset={vi.fn()} />)

    expect(
      await screen.findByRole("heading", {
        name: "داده‌های ورودی نیاز به بررسی دارند",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText("هیچ استاد واجد شرایطی برای این دوره ثبت نشده است.")
    ).toBeInTheDocument()
  })
})
