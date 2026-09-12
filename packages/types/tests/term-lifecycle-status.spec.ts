import { describe, it, expect } from "vitest"
import {
  calculateTermLifecycleStatus,
  isTermDeletable,
  type TermLifecycleSubject,
} from "../src/term/term-lifecycle-status"

describe("Term Lifecycle Status and Deletability", () => {
  describe("calculateTermLifecycleStatus", () => {
    it("returns INACTIVE when term.isActive is false regardless of dates", () => {
      const term: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        isActive: false,
      }
      // Date inside range
      expect(
        calculateTermLifecycleStatus(term, [], new Date("2026-05-15"))
      ).toBe("INACTIVE")
      // Date before range
      expect(
        calculateTermLifecycleStatus(term, [], new Date("2026-04-15"))
      ).toBe("INACTIVE")
      // Date after range
      expect(
        calculateTermLifecycleStatus(term, [], new Date("2026-07-15"))
      ).toBe("INACTIVE")
    })

    it("returns COMPLETED when currentDate is strictly after term endDate", () => {
      const term: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-01-01",
        endDate: "2026-02-28",
        isActive: true,
      }
      expect(
        calculateTermLifecycleStatus(term, [], new Date("2026-03-01"))
      ).toBe("COMPLETED")
    })

    it("returns ACTIVE when currentDate is within [startDate, endDate]", () => {
      const term: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-04-01",
        endDate: "2026-05-31",
        isActive: true,
      }
      expect(
        calculateTermLifecycleStatus(term, [], new Date("2026-04-01"))
      ).toBe("ACTIVE")
      expect(
        calculateTermLifecycleStatus(term, [], new Date("2026-05-01"))
      ).toBe("ACTIVE")
      expect(
        calculateTermLifecycleStatus(term, [], new Date("2026-05-31"))
      ).toBe("ACTIVE")
    })

    describe("Future terms (currentDate < startDate)", () => {
      it("returns REGISTERING during the inter-term gap when a previous term exists", () => {
        const term1: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-05-01",
          endDate: "2026-06-15",
          isActive: true,
        }
        const term2: TermLifecycleSubject = {
          id: "t2",
          startDate: "2026-07-01",
          endDate: "2026-08-15",
          isActive: true,
        }
        const siblings = [term1, term2]

        // On 2026-06-20: Term 1 has ended, Term 2 starts in 11 days (we are inside the 15-day gap)
        const now = new Date("2026-06-20")
        expect(calculateTermLifecycleStatus(term1, siblings, now)).toBe(
          "COMPLETED"
        )
        expect(calculateTermLifecycleStatus(term2, siblings, now)).toBe(
          "REGISTERING"
        )
      })

      it("returns UPCOMING before previous term ends if more than 7 days before start", () => {
        const term1: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-05-01",
          endDate: "2026-06-15",
          isActive: true,
        }
        const term2: TermLifecycleSubject = {
          id: "t2",
          startDate: "2026-07-01",
          endDate: "2026-08-15",
          isActive: true,
        }
        const siblings = [term1, term2]

        // On 2026-06-01: Term 1 is ACTIVE, Term 2 is 30 days away (not in gap, not within 7 days)
        const now = new Date("2026-06-01")
        expect(calculateTermLifecycleStatus(term1, siblings, now)).toBe(
          "ACTIVE"
        )
        expect(calculateTermLifecycleStatus(term2, siblings, now)).toBe(
          "UPCOMING"
        )
      })

      it("returns REGISTERING within 1 week before start when there is NO gap between terms", () => {
        const term1: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-05-01",
          endDate: "2026-06-30",
          isActive: true,
        }
        const term2: TermLifecycleSubject = {
          id: "t2",
          startDate: "2026-07-01",
          endDate: "2026-08-31",
          isActive: true,
        }
        const siblings = [term1, term2]

        // On 2026-06-20: 11 days before Term 2 start (> 7 days)
        expect(
          calculateTermLifecycleStatus(term2, siblings, new Date("2026-06-20"))
        ).toBe("UPCOMING")

        // On 2026-06-25: 6 days before Term 2 start (<= 7 days)
        expect(
          calculateTermLifecycleStatus(term2, siblings, new Date("2026-06-25"))
        ).toBe("REGISTERING")
      })

      it("marks only the immediate next term as REGISTERING and subsequent terms as UPCOMING", () => {
        const term1: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-05-01",
          endDate: "2026-06-15",
          isActive: true,
        }
        const term2: TermLifecycleSubject = {
          id: "t2",
          startDate: "2026-07-01",
          endDate: "2026-08-15",
          isActive: true,
        }
        const term3: TermLifecycleSubject = {
          id: "t3",
          startDate: "2026-09-01",
          endDate: "2026-10-15",
          isActive: true,
        }
        const siblings = [term1, term2, term3]

        // On 2026-06-20: inside gap between term1 and term2
        const now = new Date("2026-06-20")
        expect(calculateTermLifecycleStatus(term2, siblings, now)).toBe(
          "REGISTERING"
        )
        expect(calculateTermLifecycleStatus(term3, siblings, now)).toBe(
          "UPCOMING"
        )
      })

      it("uses 1-week rule when no sibling terms are passed", () => {
        const term: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-08-01",
          endDate: "2026-09-15",
          isActive: true,
        }

        // 10 days before start
        expect(
          calculateTermLifecycleStatus(term, undefined, new Date("2026-07-22"))
        ).toBe("UPCOMING")

        // 5 days before start
        expect(
          calculateTermLifecycleStatus(term, undefined, new Date("2026-07-27"))
        ).toBe("REGISTERING")
      })
    })
  })

  describe("isTermDeletable", () => {
    it("returns true when term is upcoming and its start date has not reached yet", () => {
      const term: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-08-01",
        endDate: "2026-09-30",
        isActive: true,
      }
      expect(isTermDeletable(term, undefined, new Date("2026-07-01"))).toBe(
        true
      )
    })

    it("returns false when term is active and ongoing", () => {
      const term: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-05-01",
        endDate: "2026-06-30",
        isActive: true,
      }
      expect(isTermDeletable(term, undefined, new Date("2026-05-15"))).toBe(
        false
      )
    })

    it("returns false when term endDate and startDate are in the past", () => {
      const term: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-01-01",
        endDate: "2026-02-28",
        isActive: true,
      }
      expect(isTermDeletable(term, undefined, new Date("2026-03-01"))).toBe(
        false
      )
    })

    it("returns false when term is in REGISTERING status among siblings", () => {
      const term1: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-08-01",
        endDate: "2026-09-15",
        isActive: true,
      }
      const term2: TermLifecycleSubject = {
        id: "t2",
        startDate: "2026-10-01",
        endDate: "2026-11-15",
        isActive: true,
      }
      const siblings = [term1, term2]
      // 5 days before term1 start: term1 is REGISTERING, term2 is UPCOMING
      expect(isTermDeletable(term1, siblings, new Date("2026-07-27"))).toBe(
        false
      )
      expect(isTermDeletable(term2, siblings, new Date("2026-07-27"))).toBe(
        true
      )
    })

    it("returns false when term is inactive and in the past", () => {
      const term: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-01-01",
        endDate: "2026-02-28",
        isActive: false,
      }
      expect(isTermDeletable(term, undefined, new Date("2026-03-01"))).toBe(
        false
      )
    })
  })
})
