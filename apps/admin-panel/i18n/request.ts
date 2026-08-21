import { getRequestConfig } from "next-intl/server"
import { routing, type Locale } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }

  const [common, auth, institutes, classes, dashboard] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/institutes.json`),
    import(`../messages/${locale}/classes.json`),
    import(`../messages/${locale}/dashboard.json`),
  ])

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      institutes: institutes.default,
      classes: classes.default,
      dashboard: dashboard.default,
    },
  }
})
