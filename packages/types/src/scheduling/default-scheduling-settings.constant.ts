export const DEFAULT_SCHEDULING_SETTINGS = {
  formulaVersion: "1",
  weights: {
    studentCoverage: 50,
    timeDiversity: 25,
    teacherCourseDiversity: 10,
    teacherLoadBalance: 10,
    studentTimePreference: 5,
  },
  timeGroups: {
    oddDays: ["SUNDAY", "TUESDAY"],
    evenDays: ["SATURDAY", "MONDAY", "WEDNESDAY"],
    neutralDays: ["THURSDAY", "FRIDAY"],
    eveningStartsAt: "14:00",
    timeZone: "Asia/Tehran",
  },
} as const
