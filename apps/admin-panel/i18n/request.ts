import { getRequestConfig } from "next-intl/server"
import { routing, type Locale } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }

  const [
    common,
    auth,
    dashboard,
    institutes,
    users,
    terms,
    branches,
    courses,
    classes,
    grades,
  ] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/dashboard.json`),
    import(`../messages/${locale}/institutes.json`),
    import(`../messages/${locale}/users.json`),
    import(`../messages/${locale}/terms.json`),
    import(`../messages/${locale}/branches.json`),
    import(`../messages/${locale}/courses.json`),
    import(`../messages/${locale}/classes.json`),
    import(`../messages/${locale}/grades.json`),
  ])

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      dashboard: dashboard.default,
      institutes: institutes.default,
      users: users.default,
      terms: terms.default,
      branches: branches.default,
      courses: courses.default,
      classes: classes.default,
      grades: grades.default,
    },
  }
})
