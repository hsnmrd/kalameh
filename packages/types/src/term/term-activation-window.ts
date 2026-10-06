/**
 * Term Activation Window & Critical Lifecycle Anchor Dates
 *
 * Core Business Rule:
 * A term activates exactly 7 days before its instructional start date (`startDate - 7 days`).
 * Upon activation, dependent modules (classes, course requirements, automatic scheduling,
 * enrollments, teacher assignments) become creatable and manageable.
 *
 * The critical activation/transition window spans from 7 days before `startDate`
 * to 7 days after `startDate` (`[startDate - 7 days, startDate + 7 days]`).
 */

export const TERM_PRE_ACTIVATION_DAYS = 7
export const TERM_POST_ACTIVATION_DAYS = 7

// Aliases for convenience across modules
export const TERM_ACTIVATION_DAYS_BEFORE = TERM_PRE_ACTIVATION_DAYS
export const TERM_ACTIVATION_DAYS_AFTER = TERM_POST_ACTIVATION_DAYS

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function toStartOfDay(date: Date | string): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function toEndOfDay(date: Date | string): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export interface TermActivationWindow {
  /** 7 days before startDate at 00:00:00 — the moment the term activates and dependent items become creatable */
  activationDate: Date
  /** The official instructional term start date at 00:00:00 */
  startDate: Date
  /** 7 days after startDate at 23:59:59 — the conclusion of the initial term activation/transition window */
  postActivationDate: Date
}

/**
 * Returns the exact term activation date (7 days before startDate at 00:00:00).
 * Dependent modules become creatable from this date onward.
 */
export function getTermActivationDate(startDate: Date | string): Date {
  const start = toStartOfDay(startDate)
  return new Date(start.getTime() - TERM_PRE_ACTIVATION_DAYS * ONE_DAY_MS)
}

/**
 * Returns the post-activation boundary date (7 days after startDate at 23:59:59).
 */
export function getTermPostActivationDate(startDate: Date | string): Date {
  const start = toStartOfDay(startDate)
  const postDate = new Date(
    start.getTime() + TERM_POST_ACTIVATION_DAYS * ONE_DAY_MS
  )
  return toEndOfDay(postDate)
}

/**
 * Returns the full activation window containing activationDate, startDate, and postActivationDate.
 */
export function getTermActivationWindow(
  startDate: Date | string
): TermActivationWindow {
  return {
    activationDate: getTermActivationDate(startDate),
    startDate: toStartOfDay(startDate),
    postActivationDate: getTermPostActivationDate(startDate),
  }
}

/**
 * Checks if a term is activated (now >= startDate - 7 days).
 * When activated, dependent modules are eligible to be created and managed.
 */
export function isTermActivated(
  startDate: Date | string,
  now: Date = new Date()
): boolean {
  const nowMs = now.getTime()
  const activationMs = getTermActivationDate(startDate).getTime()

  return nowMs >= activationMs
}

/**
 * Checks if current time is within the active 14-day activation window:
 * [startDate - 7 days, startDate + 7 days].
 */
export function isTermInActivationWindow(
  startDate: Date | string,
  now: Date = new Date()
): boolean {
  const nowMs = now.getTime()
  const activationMs = getTermActivationDate(startDate).getTime()
  const postActivationMs = getTermPostActivationDate(startDate).getTime()

  return nowMs >= activationMs && nowMs <= postActivationMs
}

/**
 * Checks if the term activation period has passed (now > startDate + 7 days).
 */
export function isTermPostActivationPassed(
  startDate: Date | string,
  now: Date = new Date()
): boolean {
  const nowMs = now.getTime()
  const postActivationMs = getTermPostActivationDate(startDate).getTime()

  return nowMs > postActivationMs
}

// Aliases for "Opening" terminology
export type TermOpeningWindow = TermActivationWindow
export const getTermOpeningDate = getTermActivationDate
export const getTermPostOpeningDate = getTermPostActivationDate
export const getTermOpeningWindow = getTermActivationWindow
export const isTermOpened = isTermActivated
export const isTermInOpeningWindow = isTermInActivationWindow
