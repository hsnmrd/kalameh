import { describe, it, expect } from "vitest"
import {
  calculateTermLifecycleStatus,
  calculateTermLifecycleStatuses,
  isTermRegistrationOpen,
  isTermOngoing,
  isTermInCommencement,
  isTermInFinalExams,
  isTermInGrading,
  isTermCompleted,
  findCurrentActiveTerm,
  findClosestSignupTerm,
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

      it("uses registrationDaysBeforeStart rule (default 10 days) when no sibling terms are passed", () => {
        const term: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-08-01",
          endDate: "2026-09-15",
          isActive: true,
        }

        // 12 days before start: UPCOMING
        expect(
          calculateTermLifecycleStatus(term, undefined, new Date("2026-07-20"))
        ).toBe("UPCOMING")

        // 10 days before start: REGISTERING
        expect(
          calculateTermLifecycleStatus(term, undefined, new Date("2026-07-22"))
        ).toBe("REGISTERING")

        // 5 days before start: REGISTERING
        expect(
          calculateTermLifecycleStatus(term, undefined, new Date("2026-07-27"))
        ).toBe("REGISTERING")

        // With custom settings (7 days rule)
        expect(
          calculateTermLifecycleStatus(
            term,
            undefined,
            { registrationDaysBeforeStart: 7 },
            new Date("2026-07-22")
          )
        ).toBe("UPCOMING")
      })
    })

    describe("GRADING vs COMPLETED post-term status", () => {
      it("returns GRADING when term ended but students have pending scores", () => {
        const term: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-01-01",
          endDate: "2026-02-28",
          isActive: true,
          studentsCount: 15,
          allScoresSet: false,
        }
        const now = new Date("2026-03-05")
        expect(calculateTermLifecycleStatus(term, [], now)).toBe("GRADING")
        expect(isTermInGrading(term, now)).toBe(true)
        expect(isTermCompleted(term, now)).toBe(false)
      })

      it("returns COMPLETED when term ended and all scores are finalized", () => {
        const term: TermLifecycleSubject = {
          id: "t1",
          startDate: "2026-01-01",
          endDate: "2026-02-28",
          isActive: true,
          studentsCount: 15,
          allScoresSet: true,
          scoresFinalizedAt: new Date("2026-03-02"),
        }
        const now = new Date("2026-03-05")
        expect(calculateTermLifecycleStatus(term, [], now)).toBe("COMPLETED")
        expect(isTermInGrading(term, now)).toBe(false)
        expect(isTermCompleted(term, now)).toBe(true)
      })
    })

    describe("calculateTermLifecycleStatuses (Multiple Statuses & Flags)", () => {
      const term: TermLifecycleSubject = {
        id: "t-current",
        startDate: "2026-05-01",
        endDate: "2026-06-15",
        isActive: true,
        studentsCount: 20,
      }

      it("returns INACTIVE when term.isActive is false", () => {
        const inactiveTerm = { ...term, isActive: false }
        expect(calculateTermLifecycleStatuses(inactiveTerm)).toEqual([
          "INACTIVE",
        ])
      })

      it("returns [ACTIVE, ONGOING, CLASSES_STARTED, REGISTERING] in the first 7 days of term", () => {
        // Day 3 of term
        const now = new Date("2026-05-03")
        const statuses = calculateTermLifecycleStatuses(
          term,
          [],
          undefined,
          now
        )
        expect(statuses).toContain("ACTIVE")
        expect(statuses).toContain("ONGOING")
        expect(statuses).toContain("CLASSES_STARTED")
        expect(statuses).toContain("REGISTERING")
        expect(isTermOngoing(term, now)).toBe(true)
        expect(isTermInCommencement(term, undefined, now)).toBe(true)
        expect(isTermRegistrationOpen(term, [], undefined, now)).toBe(true)
      })

      it("returns [ACTIVE, ONGOING] in the middle of term after commencement window when classes exist", () => {
        // Day 20 of term with existing classes
        const now = new Date("2026-05-20")
        const termWithClasses = { ...term, classesCount: 3 }
        const statuses = calculateTermLifecycleStatuses(
          termWithClasses,
          [],
          undefined,
          now
        )
        expect(statuses).toContain("ACTIVE")
        expect(statuses).toContain("ONGOING")
        expect(statuses).not.toContain("CLASSES_STARTED")
        expect(statuses).not.toContain("REGISTERING")
        expect(statuses).not.toContain("FINAL_EXAMS")
        expect(isTermOngoing(termWithClasses, now)).toBe(true)
        expect(isTermInCommencement(termWithClasses, undefined, now)).toBe(
          false
        )
        expect(
          isTermRegistrationOpen(termWithClasses, [], undefined, now)
        ).toBe(false)
      })

      it("retains REGISTERING status when term start date and registration window passed but term has NO classes (classesCount: 0)", () => {
        // Day 20 of term (registration time passed, start date passed) but NO classes in term
        const now = new Date("2026-05-20")
        const termNoClasses = { ...term, classesCount: 0 }
        const statuses = calculateTermLifecycleStatuses(
          termNoClasses,
          [],
          undefined,
          now
        )
        expect(statuses).toContain("ACTIVE")
        expect(statuses).toContain("ONGOING")
        expect(statuses).toContain("REGISTERING")
        expect(statuses).not.toContain("CLASSES_STARTED")
        expect(isTermOngoing(termNoClasses, now)).toBe(true)
        expect(isTermInCommencement(termNoClasses, undefined, now)).toBe(false)
        expect(isTermRegistrationOpen(termNoClasses, [], undefined, now)).toBe(
          true
        )
      })

      it("does NOT contain CLASSES_STARTED during commencement window when term has NO classes yet (classesCount: 0)", () => {
        // Day 3 of term with NO classes
        const now = new Date("2026-05-03")
        const termNoClasses = { ...term, classesCount: 0 }
        const statuses = calculateTermLifecycleStatuses(
          termNoClasses,
          [],
          undefined,
          now
        )
        expect(statuses).toContain("ACTIVE")
        expect(statuses).toContain("ONGOING")
        expect(statuses).toContain("REGISTERING")
        expect(statuses).not.toContain("CLASSES_STARTED")
        expect(isTermInCommencement(termNoClasses, undefined, now)).toBe(false)
        expect(isTermRegistrationOpen(termNoClasses, [], undefined, now)).toBe(
          true
        )
      })

      it("returns [ACTIVE, ONGOING, FINAL_EXAMS] in the last 2 days of term", () => {
        // Last 2 days: 2026-06-14 and 2026-06-15
        const now = new Date("2026-06-14")
        const statuses = calculateTermLifecycleStatuses(
          term,
          [],
          undefined,
          now
        )
        expect(statuses).toContain("ACTIVE")
        expect(statuses).toContain("ONGOING")
        expect(statuses).toContain("FINAL_EXAMS")
        expect(isTermInFinalExams(term, undefined, now)).toBe(true)
      })

      it("returns [GRADING] when term ended but scores not finalized", () => {
        const now = new Date("2026-06-20")
        const statuses = calculateTermLifecycleStatuses(
          term,
          [],
          undefined,
          now
        )
        expect(statuses).toEqual(["GRADING"])
      })

      it("returns [COMPLETED] when term ended and scores are finalized", () => {
        const finalizedTerm = { ...term, allScoresSet: true }
        const now = new Date("2026-06-20")
        const statuses = calculateTermLifecycleStatuses(
          finalizedTerm,
          [],
          undefined,
          now
        )
        expect(statuses).toEqual(["COMPLETED"])
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

    it("returns true when term is in REGISTERING status before start date and has no students yet", () => {
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
      // 5 days before term1 start: term1 has no students yet -> deletable
      expect(isTermDeletable(term1, siblings, new Date("2026-07-27"))).toBe(
        true
      )
      expect(isTermDeletable(term2, siblings, new Date("2026-07-27"))).toBe(
        true
      )
    })

    it("returns false when term has students enrolled (studentsCount > 0 or hasStudents is true)", () => {
      const termWithStudents: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-08-01",
        endDate: "2026-09-15",
        isActive: true,
        studentsCount: 3,
      }
      expect(
        isTermDeletable(termWithStudents, undefined, new Date("2026-07-27"))
      ).toBe(false)

      const termWithStudentCount: TermLifecycleSubject = {
        id: "t2",
        startDate: "2026-08-01",
        endDate: "2026-09-15",
        isActive: true,
        studentCount: 1,
      }
      expect(
        isTermDeletable(termWithStudentCount, undefined, new Date("2026-07-27"))
      ).toBe(false)

      const termWithHasStudents: TermLifecycleSubject = {
        id: "t3",
        startDate: "2026-08-01",
        endDate: "2026-09-15",
        isActive: true,
        hasStudents: true,
      }
      expect(
        isTermDeletable(termWithHasStudents, undefined, new Date("2026-07-27"))
      ).toBe(false)
    })

    it("returns true when term explicitly has 0 students", () => {
      const termZeroStudents: TermLifecycleSubject = {
        id: "t1",
        startDate: "2026-08-01",
        endDate: "2026-09-15",
        isActive: true,
        studentsCount: 0,
      }
      expect(
        isTermDeletable(termZeroStudents, undefined, new Date("2026-07-27"))
      ).toBe(true)
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

  describe("findCurrentActiveTerm", () => {
    it("returns null when terms array is null, undefined, or empty", () => {
      expect(findCurrentActiveTerm(null)).toBeNull()
      expect(findCurrentActiveTerm(undefined)).toBeNull()
      expect(findCurrentActiveTerm([])).toBeNull()
    })

    it("returns null when all terms have isActive false", () => {
      const terms: TermLifecycleSubject[] = [
        {
          id: "t1",
          startDate: "2026-10-01",
          endDate: "2026-11-30",
          isActive: false,
        },
      ]
      expect(findCurrentActiveTerm(terms, new Date("2026-10-15"))).toBeNull()
    })

    it("returns the ongoing active term (ACTIVE) when current date is within term range", () => {
      const pastTerm: TermLifecycleSubject = {
        id: "t-past",
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        isActive: false,
      }
      const activeTerm: TermLifecycleSubject = {
        id: "t-active",
        startDate: "2026-10-01",
        endDate: "2026-11-30",
        isActive: true,
      }
      const futureTerm: TermLifecycleSubject = {
        id: "t-future",
        startDate: "2026-12-01",
        endDate: "2027-01-31",
        isActive: true,
      }
      const result = findCurrentActiveTerm(
        [pastTerm, activeTerm, futureTerm],
        new Date("2026-10-15")
      )
      expect(result?.id).toBe("t-active")
    })

    it("returns the registering term (REGISTERING) when in registration gap or within 7 days before start", () => {
      const upcomingTerm: TermLifecycleSubject = {
        id: "t-reg",
        startDate: "2026-10-10",
        endDate: "2026-11-30",
        isActive: true,
      }
      const futureTerm: TermLifecycleSubject = {
        id: "t-later",
        startDate: "2026-12-15",
        endDate: "2027-02-15",
        isActive: true,
      }
      // 5 days before start date (October 5th)
      const result = findCurrentActiveTerm(
        [upcomingTerm, futureTerm],
        new Date("2026-10-05")
      )
      expect(result?.id).toBe("t-reg")
    })

    it("returns the earliest upcoming term when terms are in the future", () => {
      const term1: TermLifecycleSubject = {
        id: "t-soon",
        startDate: "2026-11-01",
        endDate: "2026-12-31",
        isActive: true,
      }
      const term2: TermLifecycleSubject = {
        id: "t-later",
        startDate: "2027-01-01",
        endDate: "2027-02-28",
        isActive: true,
      }
      const result = findCurrentActiveTerm(
        [term2, term1],
        new Date("2026-09-01")
      )
      expect(result?.id).toBe("t-soon")
    })

    it("returns null when all active terms have completed", () => {
      const term1: TermLifecycleSubject = {
        id: "t-completed",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        isActive: true,
      }
      const result = findCurrentActiveTerm([term1], new Date("2026-05-01"))
      expect(result).toBeNull()
    })
  })

  describe("findClosestSignupTerm", () => {
    it("returns null when no terms provided", () => {
      expect(findClosestSignupTerm(null)).toEqual({
        term: null,
        isRegistrationOpen: false,
      })
      expect(findClosestSignupTerm([])).toEqual({
        term: null,
        isRegistrationOpen: false,
      })
    })

    it("returns active registering term with remaining days when registration is open", () => {
      const termReg: TermLifecycleSubject = {
        id: "t-reg",
        startDate: "2026-10-10",
        endDate: "2026-11-30",
        isActive: true,
      }
      const termNext: TermLifecycleSubject = {
        id: "t-next",
        startDate: "2026-12-15",
        endDate: "2027-02-15",
        isActive: true,
      }
      // Registration open (e.g. Oct 5 is 5 days before start)
      const res = findClosestSignupTerm(
        [termReg, termNext],
        undefined,
        new Date("2026-10-05")
      )
      expect(res.isRegistrationOpen).toBe(true)
      expect(res.term?.id).toBe("t-reg")
      expect(res.daysUntilEndRegistration).toBeGreaterThan(0)
    })

    it("returns upcoming term with days until registration when registration has passed for active term", () => {
      const termOngoing: TermLifecycleSubject = {
        id: "t-ongoing",
        startDate: "2026-09-01",
        endDate: "2026-10-25",
        isActive: true,
      }
      const termNext: TermLifecycleSubject = {
        id: "t-next",
        startDate: "2026-11-15",
        endDate: "2026-12-30",
        isActive: true,
      }
      // Oct 17: Ongoing term's registration is closed (startDate + 7d was Sep 8).
      // Next term starts Nov 15, reg opens Nov 5.
      const res = findClosestSignupTerm(
        [termOngoing, termNext],
        undefined,
        new Date("2026-10-17")
      )
      expect(res.isRegistrationOpen).toBe(false)
      expect(res.term?.id).toBe("t-next")
      expect(res.daysUntilRegistration).toBeGreaterThan(0)
    })
  })
})
