import { WEEK_DAYS, type WeekDay } from "../class/class.schema.js"

export interface JalaliHoliday {
  date: string // "YYYY-MM-DD"
  titleFa: string
  titleEn: string
  isSolarFixed?: boolean
}

// ─── Jalali / Gregorian Conversion Algorithms (Pure TS) ──────────────────────

/**
 * Converts a Gregorian date to Jalali { year, month, day }.
 */
export function gregorianToJalali(gDate: Date): {
  year: number
  month: number
  day: number
} {
  const gy = gDate.getFullYear()
  const gm = gDate.getMonth() + 1
  const gd = gDate.getDate()

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let gy2 = gm > 2 ? gy + 1 : gy
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    (g_d_m[gm - 1] ?? 0)
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let jm: number
  let jd: number
  if (days < 186) {
    jm = 1 + Math.floor(days / 31)
    jd = 1 + (days % 31)
  } else {
    jm = 7 + Math.floor((days - 186) / 30)
    jd = 1 + ((days - 186) % 30)
  }
  return { year: jy, month: jm, day: jd }
}

/**
 * Converts a Jalali date to Gregorian Date.
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  jy += 1595
  let days =
    -355668 +
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186)
  let gy = 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    gy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let gd = days + 1
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  let gm: number
  for (gm = 0; gm < 13 && gd > (sal_a[gm] ?? 0); gm++) gd -= sal_a[gm] ?? 0
  return new Date(gy, gm - 1, gd, 12, 0, 0, 0)
}

export function formatJalali(year: number, month: number, day: number): string {
  const mm = month.toString().padStart(2, "0")
  const dd = day.toString().padStart(2, "0")
  return `${year}/${mm}/${dd}`
}

export function parseJalaliString(str: string): {
  year: number
  month: number
  day: number
} | null {
  const clean = str.replace(/[–—−]/g, "-").replace(/\//g, "-").trim()
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(clean)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year, month, day }
}

export function getWeekDay(date: Date): WeekDay {
  const dayIndex = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const map: Record<number, WeekDay> = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  }
  return map[dayIndex] ?? "SATURDAY"
}

// ─── Fixed Solar Holidays (Every Jalali Year) ────────────────────────────────

export const FIXED_SOLAR_HOLIDAYS: {
  month: number
  day: number
  titleFa: string
  titleEn: string
}[] = [
  { month: 1, day: 1, titleFa: "عید نوروز", titleEn: "Nowruz Holiday" },
  { month: 1, day: 2, titleFa: "عید نوروز", titleEn: "Nowruz Holiday" },
  { month: 1, day: 3, titleFa: "عید نوروز", titleEn: "Nowruz Holiday" },
  { month: 1, day: 4, titleFa: "عید نوروز", titleEn: "Nowruz Holiday" },
  {
    month: 1,
    day: 12,
    titleFa: "روز جمهوری اسلامی",
    titleEn: "Islamic Republic Day",
  },
  {
    month: 1,
    day: 13,
    titleFa: "روز طبیعت (سیزده‌بدر)",
    titleEn: "Nature Day",
  },
  {
    month: 3,
    day: 14,
    titleFa: "رحلت امام خمینی",
    titleEn: "Demise of Imam Khomeini",
  },
  {
    month: 3,
    day: 15,
    titleFa: "قیام خونین ۱۵ خرداد",
    titleEn: "Revolt of Khordad 15",
  },
  {
    month: 11,
    day: 22,
    titleFa: "پیروزی انقلاب اسلامی",
    titleEn: "Islamic Revolution Victory",
  },
  {
    month: 12,
    day: 29,
    titleFa: "روز ملی شدن صنعت نفت",
    titleEn: "Oil Industry Nationalization Day",
  },
]

// ─── Lunar-Based Variable Official Holidays By Year (Iran Official) ──────────

export const VARIABLE_LUNAR_HOLIDAYS: Record<
  number,
  { month: number; day: number; titleFa: string; titleEn: string }[]
> = {
  1402: [
    {
      month: 1,
      day: 23,
      titleFa: "شهادت حضرت علی (ع)",
      titleEn: "Martyrdom of Imam Ali",
    },
    { month: 2, day: 2, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr" },
    {
      month: 2,
      day: 3,
      titleFa: "تعطیل به مناسبت عید سعید فطر",
      titleEn: "Eid al-Fitr Holiday",
    },
    {
      month: 2,
      day: 26,
      titleFa: "شهادت امام جعفر صادق (ع)",
      titleEn: "Martyrdom of Imam Jafar Sadiq",
    },
    { month: 4, day: 8, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha" },
    {
      month: 4,
      day: 16,
      titleFa: "عید سعید غدیر خم",
      titleEn: "Eid al-Ghadir",
    },
    { month: 5, day: 5, titleFa: "تاسوعای حسینی", titleEn: "Tasu'a" },
    { month: 5, day: 6, titleFa: "عاشورای حسینی", titleEn: "Ashura" },
    { month: 6, day: 15, titleFa: "اربعین حسینی", titleEn: "Arbaeen" },
    {
      month: 6,
      day: 23,
      titleFa: "رحلت رسول اکرم و شهادت امام حسن مجتبی (ع)",
      titleEn: "Demise of Prophet & Martyrdom of Imam Hassan",
    },
    {
      month: 6,
      day: 25,
      titleFa: "شهادت امام رضا (ع)",
      titleEn: "Martyrdom of Imam Reza",
    },
    {
      month: 7,
      day: 2,
      titleFa: "شهادت امام حسن عسکری (ع)",
      titleEn: "Martyrdom of Imam Hassan Askari",
    },
    {
      month: 7,
      day: 11,
      titleFa: "ولادت رسول اکرم و امام جعفر صادق (ع)",
      titleEn: "Birthday of Prophet & Imam Jafar Sadiq",
    },
    {
      month: 9,
      day: 26,
      titleFa: "شهادت حضرت فاطمه زهرا (س)",
      titleEn: "Martyrdom of Hazrat Fatemeh",
    },
    {
      month: 11,
      day: 5,
      titleFa: "ولادت حضرت علی (ع)",
      titleEn: "Birthday of Imam Ali",
    },
    {
      month: 11,
      day: 19,
      titleFa: "مبعث حضرت رسول اکرم (ص)",
      titleEn: "Mab'as",
    },
    {
      month: 12,
      day: 6,
      titleFa: "ولادت حضرت قائم (عج) و نیمه شعبان",
      titleEn: "Mid-Sha'ban",
    },
  ],
  1403: [
    {
      month: 1,
      day: 12,
      titleFa: "شهادت حضرت علی (ع)",
      titleEn: "Martyrdom of Imam Ali",
    },
    { month: 1, day: 22, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr" },
    {
      month: 1,
      day: 23,
      titleFa: "تعطیل به مناسبت عید سعید فطر",
      titleEn: "Eid al-Fitr Holiday",
    },
    {
      month: 2,
      day: 15,
      titleFa: "شهادت امام جعفر صادق (ع)",
      titleEn: "Martyrdom of Imam Jafar Sadiq",
    },
    { month: 3, day: 28, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha" },
    { month: 4, day: 5, titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir" },
    { month: 4, day: 25, titleFa: "تاسوعای حسینی", titleEn: "Tasu'a" },
    { month: 4, day: 26, titleFa: "عاشورای حسینی", titleEn: "Ashura" },
    { month: 6, day: 4, titleFa: "اربعین حسینی", titleEn: "Arbaeen" },
    {
      month: 6,
      day: 12,
      titleFa: "رحلت رسول اکرم و شهادت امام حسن مجتبی (ع)",
      titleEn: "Demise of Prophet & Martyrdom of Imam Hassan",
    },
    {
      month: 6,
      day: 14,
      titleFa: "شهادت امام رضا (ع)",
      titleEn: "Martyrdom of Imam Reza",
    },
    {
      month: 6,
      day: 22,
      titleFa: "شهادت امام حسن عسکری (ع)",
      titleEn: "Martyrdom of Imam Hassan Askari",
    },
    {
      month: 6,
      day: 31,
      titleFa: "ولادت رسول اکرم و امام جعفر صادق (ع)",
      titleEn: "Birthday of Prophet & Imam Jafar Sadiq",
    },
    {
      month: 9,
      day: 15,
      titleFa: "شهادت حضرت فاطمه زهرا (س)",
      titleEn: "Martyrdom of Hazrat Fatemeh",
    },
    {
      month: 10,
      day: 25,
      titleFa: "ولادت حضرت علی (ع)",
      titleEn: "Birthday of Imam Ali",
    },
    {
      month: 11,
      day: 9,
      titleFa: "مبعث حضرت رسول اکرم (ص)",
      titleEn: "Mab'as",
    },
    {
      month: 11,
      day: 26,
      titleFa: "ولادت حضرت قائم (عج) و نیمه شعبان",
      titleEn: "Mid-Sha'ban",
    },
    {
      month: 12,
      day: 30,
      titleFa: "شهادت حضرت علی (ع)",
      titleEn: "Martyrdom of Imam Ali",
    },
  ],
  1404: [
    { month: 1, day: 11, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr" },
    {
      month: 1,
      day: 12,
      titleFa: "تعطیل به مناسبت عید سعید فطر",
      titleEn: "Eid al-Fitr Holiday",
    },
    {
      month: 2,
      day: 4,
      titleFa: "شهادت امام جعفر صادق (ع)",
      titleEn: "Martyrdom of Imam Jafar Sadiq",
    },
    { month: 3, day: 17, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha" },
    {
      month: 3,
      day: 25,
      titleFa: "عید سعید غدیر خم",
      titleEn: "Eid al-Ghadir",
    },
    { month: 4, day: 14, titleFa: "تاسوعای حسینی", titleEn: "Tasu'a" },
    { month: 4, day: 15, titleFa: "عاشورای حسینی", titleEn: "Ashura" },
    { month: 5, day: 24, titleFa: "اربعین حسینی", titleEn: "Arbaeen" },
    {
      month: 6,
      day: 1,
      titleFa: "رحلت رسول اکرم و شهادت امام حسن مجتبی (ع)",
      titleEn: "Demise of Prophet & Martyrdom of Imam Hassan",
    },
    {
      month: 6,
      day: 3,
      titleFa: "شهادت امام رضا (ع)",
      titleEn: "Martyrdom of Imam Reza",
    },
    {
      month: 6,
      day: 11,
      titleFa: "شهادت امام حسن عسکری (ع)",
      titleEn: "Martyrdom of Imam Hassan Askari",
    },
    {
      month: 6,
      day: 20,
      titleFa: "ولادت رسول اکرم و امام جعفر صادق (ع)",
      titleEn: "Birthday of Prophet & Imam Jafar Sadiq",
    },
    {
      month: 9,
      day: 4,
      titleFa: "شهادت حضرت فاطمه زهرا (س)",
      titleEn: "Martyrdom of Hazrat Fatemeh",
    },
    {
      month: 10,
      day: 14,
      titleFa: "ولادت حضرت علی (ع)",
      titleEn: "Birthday of Imam Ali",
    },
    {
      month: 10,
      day: 28,
      titleFa: "مبعث حضرت رسول اکرم (ص)",
      titleEn: "Mab'as",
    },
    {
      month: 11,
      day: 15,
      titleFa: "ولادت حضرت قائم (عج) و نیمه شعبان",
      titleEn: "Mid-Sha'ban",
    },
    {
      month: 12,
      day: 20,
      titleFa: "شهادت حضرت علی (ع)",
      titleEn: "Martyrdom of Imam Ali",
    },
  ],
  1405: [
    { month: 1, day: 1, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr" },
    {
      month: 1,
      day: 2,
      titleFa: "تعطیل به مناسبت عید سعید فطر",
      titleEn: "Eid al-Fitr Holiday",
    },
    {
      month: 1,
      day: 24,
      titleFa: "شهادت امام جعفر صادق (ع)",
      titleEn: "Martyrdom of Imam Jafar Sadiq",
    },
    { month: 3, day: 6, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha" },
    {
      month: 3,
      day: 14,
      titleFa: "عید سعید غدیر خم",
      titleEn: "Eid al-Ghadir",
    },
    { month: 4, day: 4, titleFa: "تاسوعای حسینی", titleEn: "Tasu'a" },
    { month: 4, day: 5, titleFa: "عاشورای حسینی", titleEn: "Ashura" },
    { month: 5, day: 13, titleFa: "اربعین حسینی", titleEn: "Arbaeen" },
    {
      month: 5,
      day: 21,
      titleFa: "رحلت رسول اکرم و شهادت امام حسن مجتبی (ع)",
      titleEn: "Demise of Prophet & Martyrdom of Imam Hassan",
    },
    {
      month: 5,
      day: 23,
      titleFa: "شهادت امام رضا (ع)",
      titleEn: "Martyrdom of Imam Reza",
    },
    {
      month: 5,
      day: 31,
      titleFa: "شهادت امام حسن عسکری (ع)",
      titleEn: "Martyrdom of Imam Hassan Askari",
    },
    {
      month: 6,
      day: 9,
      titleFa: "ولادت رسول اکرم و امام جعفر صادق (ع)",
      titleEn: "Birthday of Prophet & Imam Jafar Sadiq",
    },
    {
      month: 8,
      day: 24,
      titleFa: "شهادت حضرت فاطمه زهرا (س)",
      titleEn: "Martyrdom of Hazrat Fatemeh",
    },
    {
      month: 10,
      day: 4,
      titleFa: "ولادت حضرت علی (ع)",
      titleEn: "Birthday of Imam Ali",
    },
    {
      month: 10,
      day: 18,
      titleFa: "مبعث حضرت رسول اکرم (ص)",
      titleEn: "Mab'as",
    },
    {
      month: 11,
      day: 5,
      titleFa: "ولادت حضرت قائم (عج) و نیمه شعبان",
      titleEn: "Mid-Sha'ban",
    },
    {
      month: 12,
      day: 10,
      titleFa: "شهادت حضرت علی (ع)",
      titleEn: "Martyrdom of Imam Ali",
    },
    { month: 12, day: 20, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr" },
    {
      month: 12,
      day: 21,
      titleFa: "تعطیل به مناسبت عید سعید فطر",
      titleEn: "Eid al-Fitr Holiday",
    },
  ],
  1406: [
    {
      month: 1,
      day: 13,
      titleFa: "شهادت امام جعفر صادق (ع)",
      titleEn: "Martyrdom of Imam Jafar Sadiq",
    },
    { month: 2, day: 27, titleFa: "عید سعید قربان", titleEn: "Eid al-Adha" },
    { month: 3, day: 4, titleFa: "عید سعید غدیر خم", titleEn: "Eid al-Ghadir" },
    { month: 3, day: 24, titleFa: "تاسوعای حسینی", titleEn: "Tasu'a" },
    { month: 3, day: 25, titleFa: "عاشورای حسینی", titleEn: "Ashura" },
    { month: 5, day: 2, titleFa: "اربعین حسینی", titleEn: "Arbaeen" },
    {
      month: 5,
      day: 10,
      titleFa: "رحلت رسول اکرم و شهادت امام حسن مجتبی (ع)",
      titleEn: "Demise of Prophet & Martyrdom of Imam Hassan",
    },
    {
      month: 5,
      day: 12,
      titleFa: "شهادت امام رضا (ع)",
      titleEn: "Martyrdom of Imam Reza",
    },
    {
      month: 5,
      day: 20,
      titleFa: "شهادت امام حسن عسکری (ع)",
      titleEn: "Martyrdom of Imam Hassan Askari",
    },
    {
      month: 5,
      day: 29,
      titleFa: "ولادت رسول اکرم و امام جعفر صادق (ع)",
      titleEn: "Birthday of Prophet & Imam Jafar Sadiq",
    },
    {
      month: 8,
      day: 13,
      titleFa: "شهادت حضرت فاطمه زهرا (س)",
      titleEn: "Martyrdom of Hazrat Fatemeh",
    },
    {
      month: 9,
      day: 23,
      titleFa: "ولادت حضرت علی (ع)",
      titleEn: "Birthday of Imam Ali",
    },
    {
      month: 10,
      day: 7,
      titleFa: "مبعث حضرت رسول اکرم (ص)",
      titleEn: "Mab'as",
    },
    {
      month: 10,
      day: 24,
      titleFa: "ولادت حضرت قائم (عج) و نیمه شعبان",
      titleEn: "Mid-Sha'ban",
    },
    {
      month: 11,
      day: 29,
      titleFa: "شهادت حضرت علی (ع)",
      titleEn: "Martyrdom of Imam Ali",
    },
    { month: 12, day: 10, titleFa: "عید سعید فطر", titleEn: "Eid al-Fitr" },
    {
      month: 12,
      day: 11,
      titleFa: "تعطیل به مناسبت عید سعید فطر",
      titleEn: "Eid al-Fitr Holiday",
    },
  ],
}

/**
 * Returns all holidays for a given Jalali year (combines fixed solar and variable lunar).
 */
export function getJalaliHolidaysForYear(year: number): JalaliHoliday[] {
  const result: JalaliHoliday[] = []

  // Add solar fixed
  for (const solar of FIXED_SOLAR_HOLIDAYS) {
    result.push({
      date: formatJalali(year, solar.month, solar.day),
      titleFa: solar.titleFa,
      titleEn: solar.titleEn,
      isSolarFixed: true,
    })
  }

  // Add lunar variable if available for this year
  const lunarList = VARIABLE_LUNAR_HOLIDAYS[year] || []
  for (const lunar of lunarList) {
    const dStr = formatJalali(year, lunar.month, lunar.day)
    // Don't duplicate if already exists on the same day
    const existing = result.find((r) => r.date === dStr)
    if (existing) {
      existing.titleFa += ` / ${lunar.titleFa}`
      existing.titleEn += ` / ${lunar.titleEn}`
    } else {
      result.push({
        date: dStr,
        titleFa: lunar.titleFa,
        titleEn: lunar.titleEn,
        isSolarFixed: false,
      })
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Checks if a given date (Jalali string "YYYY/MM/DD" or "YYYY-MM-DD" or Date object) is an official holiday.
 */
export function isJalaliHoliday(date: Date | string): {
  isHoliday: boolean
  holiday?: JalaliHoliday
} {
  let jYear: number
  let jMonth: number
  let jDay: number

  if (date instanceof Date) {
    const j = gregorianToJalali(date)
    jYear = j.year
    jMonth = j.month
    jDay = j.day
  } else {
    // string could be Jalali or Gregorian ISO
    const parsedJalali = parseJalaliString(date)
    if (
      parsedJalali &&
      parsedJalali.year >= 1300 &&
      parsedJalali.year <= 1500
    ) {
      jYear = parsedJalali.year
      jMonth = parsedJalali.month
      jDay = parsedJalali.day
    } else {
      // Treat as Gregorian ISO string
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return { isHoliday: false }
      }
      const j = gregorianToJalali(parsedDate)
      jYear = j.year
      jMonth = j.month
      jDay = j.day
    }
  }

  const targetDateStr = formatJalali(jYear, jMonth, jDay)
  const holidays = getJalaliHolidaysForYear(jYear)
  const found = holidays.find((h) => h.date === targetDateStr)

  if (found) {
    return { isHoliday: true, holiday: found }
  }

  return { isHoliday: false }
}

/**
 * Returns all holidays within a date range [startDate, endDate].
 */
export function getJalaliHolidaysInRange(
  startDate: Date | string,
  endDate: Date | string
): JalaliHoliday[] {
  const gStart =
    startDate instanceof Date ? startDate : parseDateFlexible(startDate)
  const gEnd = endDate instanceof Date ? endDate : parseDateFlexible(endDate)

  if (!gStart || !gEnd || gEnd < gStart) {
    return []
  }

  const jStart = gregorianToJalali(gStart)
  const jEnd = gregorianToJalali(gEnd)

  const holidays: JalaliHoliday[] = []

  for (let y = jStart.year; y <= jEnd.year; y++) {
    const yearHolidays = getJalaliHolidaysForYear(y)
    for (const h of yearHolidays) {
      const parsed = parseJalaliString(h.date)
      if (!parsed) continue
      const gDate = jalaliToGregorian(parsed.year, parsed.month, parsed.day)
      if (gDate >= gStart && gDate <= gEnd) {
        holidays.push(h)
      }
    }
  }

  return holidays
}

function parseDateFlexible(dateStr: string): Date | null {
  const parsedJalali = parseJalaliString(dateStr)
  if (parsedJalali && parsedJalali.year >= 1300 && parsedJalali.year <= 1500) {
    return jalaliToGregorian(
      parsedJalali.year,
      parsedJalali.month,
      parsedJalali.day
    )
  }
  const g = new Date(dateStr)
  return isNaN(g.getTime()) ? null : g
}
