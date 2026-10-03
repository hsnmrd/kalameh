export function formatDisplayDate(isoDate: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(
      locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    ).format(new Date(`${isoDate}T12:00:00`))
  } catch {
    return isoDate
  }
}
