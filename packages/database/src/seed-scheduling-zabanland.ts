import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import {
  prisma,
  Role,
  StudentScheduleStatus,
  StudentSchoolShift,
  StudentDayPreference,
  ClassDeliveryMode,
  EnrollmentStatus,
} from "./index.js"

dotenv.config({ path: "../../.env" })
dotenv.config()

async function main() {
  console.log(
    "🚀 Starting comprehensive stress-test seed for Zaban Land with AME 1-1 to AME 5-5..."
  )

  const defaultPassword = "Password123!"
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  // 1. Fetch or Create Target Institute & Central Branch
  const institute = await prisma.institute.upsert({
    where: { subdomain: "zabanland" },
    update: {
      name: "آموزشگاه زبان‌لند",
      isActive: true,
    },
    create: {
      name: "آموزشگاه زبان‌لند",
      subdomain: "zabanland",
      isActive: true,
      bankCardNumber: "6037991899990000",
      bankAccountName: "آموزشگاه زبان‌لند",
      bankShaba: "IR120170000000999900000000",
    },
    include: {
      branches: true,
      terms: true,
      courses: true,
    },
  })

  let centralBranch =
    institute.branches.find((b) => b.name === "شعبه مرکزی") ??
    institute.branches[0]

  if (!centralBranch) {
    centralBranch = await prisma.branch.create({
      data: {
        instituteId: institute.id,
        name: "شعبه مرکزی",
        address: "تهران، میدان ونک",
        phones: ["02188001122"],
        isActive: true,
      },
    })
  }

  const instituteId = institute.id
  const centralBranchId = centralBranch.id

  console.log(`✅ Target Institute: ${institute.name} (${instituteId})`)
  console.log(`✅ Central Branch: ${centralBranch.name} (${centralBranchId})`)

  // 1.1 Ensure Admin User for Zabanland
  await prisma.user.upsert({
    where: {
      phone_instituteId: {
        phone: "09127770000",
        instituteId,
      },
    },
    update: {
      firstName: "مدیر",
      lastName: "زبان‌لند",
      role: Role.ADMIN,
      branchId: centralBranchId,
      isActive: true,
    },
    create: {
      instituteId,
      branchId: centralBranchId,
      phone: "09127770000",
      firstName: "مدیر",
      lastName: "زبان‌لند",
      role: Role.ADMIN,
      password: hashedPassword,
      isActive: true,
    },
  })
  console.log(
    `👤 Admin seeded: 09127770000 (ADMIN) - Password: ${defaultPassword}`
  )

  // 2. Upsert 25 Sequential Courses: AME 1-1 to AME 5-5
  // American English File 1 (1-1 to 1-5), 2 (2-1 to 2-5), 3 (3-1 to 3-5), 4 (4-1 to 4-5), 5 (5-1 to 5-5)
  async function ensureCourse(
    title: string,
    baseFee: number,
    prerequisiteId: string | null = null
  ) {
    const existing = await prisma.course.findFirst({
      where: { instituteId, title },
    })
    if (existing) {
      return prisma.course.update({
        where: { id: existing.id },
        data: { baseFee, prerequisiteId },
      })
    }
    return prisma.course.create({
      data: {
        instituteId,
        title,
        baseFee,
        prerequisiteId,
      },
    })
  }

  const activeCourses: Record<
    string,
    {
      id: string
      title: string
      baseFee: number
      prerequisiteId: string | null
    }
  > = {}
  let prevCourseId: string | null = null

  for (let book = 1; book <= 5; book++) {
    for (let term = 1; term <= 5; term++) {
      const title = `AME ${book}-${term}`
      const baseFee = 1500000 + (book - 1) * 300000 + (term - 1) * 50000
      const course = await ensureCourse(title, baseFee, prevCourseId)
      activeCourses[title] = course
      prevCourseId = course.id
    }
  }

  function getCourse(title: string) {
    const course = activeCourses[title]
    if (!course) {
      throw new Error(`Course '${title}' was not found in activeCourses map.`)
    }
    return course
  }

  const activeCourseTitles = Object.keys(activeCourses)
  console.log(
    `✅ Seeded 25 Progressive Courses from ${activeCourseTitles[0]} to ${activeCourseTitles[activeCourseTitles.length - 1]}`
  )

  // Clean up legacy courses that don't match the AME 1-1 -> AME 5-5 curriculum
  const allExistingCourses = await prisma.course.findMany({
    where: { instituteId },
  })
  const legacyCourses = allExistingCourses.filter(
    (c) => !activeCourseTitles.includes(c.title)
  )

  for (const legacy of legacyCourses) {
    try {
      await prisma.enrollment.deleteMany({
        where: { class: { courseId: legacy.id } },
      })
      await prisma.class.deleteMany({ where: { courseId: legacy.id } })
      await prisma.classRequirement.deleteMany({
        where: { courseId: legacy.id },
      })
      await prisma.schedulingProposal.deleteMany({
        where: { courseId: legacy.id },
      })
      await prisma.teacherCourseQualification.deleteMany({
        where: { courseId: legacy.id },
      })
      await prisma.user.updateMany({
        where: { currentAllowedCourseId: legacy.id },
        data: { currentAllowedCourseId: getCourse("AME 1-1").id },
      })
      await prisma.course.updateMany({
        where: { prerequisiteId: legacy.id },
        data: { prerequisiteId: null },
      })
      await prisma.course.delete({ where: { id: legacy.id } })
      console.log(`🧹 Cleaned up legacy course: ${legacy.title}`)
    } catch {
      // Gracefully continue if retained by relations
    }
  }

  // 3. Classrooms (Capacity Contention: Cap 14, 18, 20, 25)
  const classroomsData = [
    {
      name: "کلاس A (اتاق ۱۰۱)",
      capacity: 20,
      description: "کلاس استاندارد با پروژکتور",
    },
    {
      name: "کلاس B (اتاق ۱۰۲)",
      capacity: 18,
      description: "کلاس استاندارد با پروژکتور و تخته هوشمند",
    },
    {
      name: "کلاس C (اتاق ۱۰۳)",
      capacity: 14, // Small room: rejects classes with cap > 14 (e.g. AME 1-5 with cap 16)
      description: "کلاس نیمه خصوصی (ظرفیت کوچک ۱۴ نفر)",
    },
    {
      name: "کلاس D (آزمایشگاه زبان)",
      capacity: 25,
      description: "سالن چندرسانه‌ای و آزمایشگاه زبان بزرگ",
    },
  ]

  for (const room of classroomsData) {
    const existing = await prisma.classroom.findFirst({
      where: { instituteId, name: room.name },
    })
    if (!existing) {
      await prisma.classroom.create({
        data: {
          instituteId,
          branchId: centralBranchId,
          name: room.name,
          capacity: room.capacity,
          description: room.description,
          isActive: true,
        },
      })
    } else {
      await prisma.classroom.update({
        where: { id: existing.id },
        data: {
          capacity: room.capacity,
          description: room.description,
          branchId: centralBranchId,
          isActive: true,
        },
      })
    }
  }
  console.log(
    "✅ Seeded 4 Classrooms with capacity bottlenecks (Cap 14, 18, 20, 25)"
  )

  // 4. Nine Teachers with Qualifications across AME 1-1 to AME 5-5
  // Strictly respects the Uniform Class Time Rule (identical hours on all days of their track)
  function buildEvenTrackSlots(
    timeRanges: Array<{ startTime: string; endTime: string }>
  ) {
    const days = ["SATURDAY", "MONDAY", "WEDNESDAY"] as const
    return days.flatMap((dayOfWeek) =>
      timeRanges.map((tr) => ({
        dayOfWeek,
        startTime: tr.startTime,
        endTime: tr.endTime,
      }))
    )
  }

  function buildOddTrackSlots(
    timeRanges: Array<{ startTime: string; endTime: string }>
  ) {
    const days = ["SUNDAY", "TUESDAY", "THURSDAY"] as const
    return days.flatMap((dayOfWeek) =>
      timeRanges.map((tr) => ({
        dayOfWeek,
        startTime: tr.startTime,
        endTime: tr.endTime,
      }))
    )
  }

  const teachersData = [
    {
      phone: "09127770001",
      firstName: "امیرحسین",
      lastName: "رضایی",
      degree: "کارشناسی ارشد آموزش زبان انگلیسی",
      specialties: [
        "AME 1-1",
        "AME 1-2",
        "AME 1-3",
        "AME 1-4",
        "AME 1-5",
        "AME 2-1",
        "AME 2-2",
      ],
      qualifiedTitles: [
        "AME 1-1",
        "AME 1-2",
        "AME 1-3",
        "AME 1-4",
        "AME 1-5",
        "AME 2-1",
        "AME 2-2",
      ],
      availabilities: buildEvenTrackSlots([
        { startTime: "14:00", endTime: "15:30" },
        { startTime: "15:30", endTime: "17:00" },
        { startTime: "17:00", endTime: "18:30" },
        { startTime: "18:30", endTime: "20:00" },
      ]),
    },
    {
      phone: "09127770002",
      firstName: "مریم",
      lastName: "کاظمی",
      degree: "دکتری زبان‌شناسی کاربردی",
      specialties: [
        "AME 2-1",
        "AME 2-2",
        "AME 2-3",
        "AME 2-4",
        "AME 2-5",
        "AME 3-1",
        "AME 3-2",
      ],
      qualifiedTitles: [
        "AME 2-1",
        "AME 2-2",
        "AME 2-3",
        "AME 2-4",
        "AME 2-5",
        "AME 3-1",
        "AME 3-2",
      ],
      availabilities: buildOddTrackSlots([
        { startTime: "14:00", endTime: "15:30" },
        { startTime: "15:30", endTime: "17:00" },
        { startTime: "17:00", endTime: "18:30" },
        { startTime: "18:30", endTime: "20:00" },
      ]),
    },
    {
      phone: "09127770003",
      firstName: "علیرضا",
      lastName: "شمس",
      degree: "کارشناسی ادبیات انگلیسی",
      specialties: [
        "AME 1-1",
        "AME 1-2",
        "AME 1-3",
        "AME 2-1",
        "AME 2-2",
        "AME 3-1",
      ],
      qualifiedTitles: [
        "AME 1-1",
        "AME 1-2",
        "AME 1-3",
        "AME 2-1",
        "AME 2-2",
        "AME 3-1",
      ],
      availabilities: [
        ...buildEvenTrackSlots([
          { startTime: "09:00", endTime: "10:30" },
          { startTime: "10:30", endTime: "12:00" },
        ]),
        ...buildOddTrackSlots([
          { startTime: "09:00", endTime: "10:30" },
          { startTime: "10:30", endTime: "12:00" },
        ]),
      ],
    },
    {
      phone: "09127770004",
      firstName: "نیلوفر",
      lastName: "صادقی",
      degree: "کارشناسی ارشد مترجمی زبان",
      specialties: [
        "AME 3-1",
        "AME 3-2",
        "AME 3-3",
        "AME 3-4",
        "AME 3-5",
        "AME 4-1",
        "AME 4-2",
      ],
      qualifiedTitles: [
        "AME 3-1",
        "AME 3-2",
        "AME 3-3",
        "AME 3-4",
        "AME 3-5",
        "AME 4-1",
        "AME 4-2",
      ],
      availabilities: buildEvenTrackSlots([
        { startTime: "15:30", endTime: "17:00" },
        { startTime: "17:00", endTime: "18:30" },
        { startTime: "18:30", endTime: "20:00" },
      ]),
    },
    {
      phone: "09127770005",
      firstName: "کامران",
      lastName: "حسینی",
      degree: "کارشناسی آموزش زبان انگلیسی",
      specialties: [
        "AME 2-2",
        "AME 2-3",
        "AME 2-4",
        "AME 2-5",
        "AME 3-1",
        "AME 3-2",
        "AME 3-3",
      ],
      qualifiedTitles: [
        "AME 2-2",
        "AME 2-3",
        "AME 2-4",
        "AME 2-5",
        "AME 3-1",
        "AME 3-2",
        "AME 3-3",
      ],
      availabilities: buildOddTrackSlots([
        { startTime: "09:00", endTime: "10:30" },
        { startTime: "10:30", endTime: "12:00" },
        { startTime: "14:00", endTime: "15:30" },
      ]),
    },
    {
      phone: "09127770006",
      firstName: "دکتر فرهاد",
      lastName: "رستمی",
      degree: "دکتری زبان و ادبیات انگلیسی",
      specialties: [
        "AME 4-1",
        "AME 4-2",
        "AME 4-3",
        "AME 4-4",
        "AME 4-5",
        "AME 5-1",
        "AME 5-2",
        "AME 5-3",
        "AME 5-4",
        "AME 5-5",
      ],
      qualifiedTitles: [
        "AME 4-1",
        "AME 4-2",
        "AME 4-3",
        "AME 4-4",
        "AME 4-5",
        "AME 5-1",
        "AME 5-2",
        "AME 5-3",
        "AME 5-4",
        "AME 5-5",
      ],
      availabilities: [
        ...buildEvenTrackSlots([{ startTime: "18:30", endTime: "20:00" }]),
        ...buildOddTrackSlots([{ startTime: "18:30", endTime: "20:00" }]),
      ],
    },
    {
      phone: "09127770007",
      firstName: "آرزو",
      lastName: "احمدی",
      degree: "کارشناسی ارشد آموزش زبان انگلیسی",
      specialties: [
        "AME 1-1",
        "AME 1-2",
        "AME 1-3",
        "AME 1-4",
        "AME 1-5",
        "AME 2-1",
        "AME 2-2",
      ],
      qualifiedTitles: [
        "AME 1-1",
        "AME 1-2",
        "AME 1-3",
        "AME 1-4",
        "AME 1-5",
        "AME 2-1",
        "AME 2-2",
      ],
      availabilities: buildEvenTrackSlots([
        { startTime: "09:00", endTime: "10:30" },
        { startTime: "10:30", endTime: "12:00" },
        { startTime: "14:00", endTime: "15:30" },
      ]),
    },
    {
      phone: "09127770008",
      firstName: "دکتر بهنام",
      lastName: "مرادی",
      degree: "دکتری آموزش زبان انگلیسی (TEFL)",
      specialties: [
        "AME 3-3",
        "AME 3-4",
        "AME 3-5",
        "AME 4-1",
        "AME 4-2",
        "AME 4-3",
        "AME 4-4",
        "AME 4-5",
        "AME 5-1",
        "AME 5-2",
        "AME 5-3",
        "AME 5-4",
        "AME 5-5",
      ],
      qualifiedTitles: [
        "AME 3-3",
        "AME 3-4",
        "AME 3-5",
        "AME 4-1",
        "AME 4-2",
        "AME 4-3",
        "AME 4-4",
        "AME 4-5",
        "AME 5-1",
        "AME 5-2",
        "AME 5-3",
        "AME 5-4",
        "AME 5-5",
      ],
      availabilities: buildOddTrackSlots([
        { startTime: "15:30", endTime: "17:00" },
        { startTime: "17:00", endTime: "18:30" },
        { startTime: "18:30", endTime: "20:00" },
      ]),
    },
    {
      phone: "09127770009",
      firstName: "سمیرا",
      lastName: "یزدانی",
      degree: "کارشناسی ارشد زبان‌شناسی همگانی",
      specialties: [
        "AME 4-3",
        "AME 4-4",
        "AME 4-5",
        "AME 5-1",
        "AME 5-2",
        "AME 5-3",
        "AME 5-4",
        "AME 5-5",
      ],
      qualifiedTitles: [
        "AME 4-3",
        "AME 4-4",
        "AME 4-5",
        "AME 5-1",
        "AME 5-2",
        "AME 5-3",
        "AME 5-4",
        "AME 5-5",
      ],
      availabilities: buildEvenTrackSlots([
        { startTime: "14:00", endTime: "15:30" },
        { startTime: "15:30", endTime: "17:00" },
        { startTime: "17:00", endTime: "18:30" },
      ]),
    },
  ]

  for (const t of teachersData) {
    const user = await prisma.user.upsert({
      where: {
        phone_instituteId: {
          phone: t.phone,
          instituteId,
        },
      },
      update: {
        firstName: t.firstName,
        lastName: t.lastName,
        role: Role.TEACHER,
        branchId: centralBranchId,
        isActive: true,
      },
      create: {
        instituteId,
        branchId: centralBranchId,
        phone: t.phone,
        firstName: t.firstName,
        lastName: t.lastName,
        role: Role.TEACHER,
        password: hashedPassword,
        isActive: true,
      },
    })

    const teacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        degree: t.degree,
        specialties: t.specialties,
      },
      create: {
        userId: user.id,
        degree: t.degree,
        specialties: t.specialties,
      },
    })

    // Upsert Qualifications
    await prisma.teacherCourseQualification.deleteMany({
      where: { teacherProfileId: teacherProfile.id },
    })
    for (const title of t.qualifiedTitles) {
      const course = activeCourses[title]
      if (course) {
        await prisma.teacherCourseQualification.create({
          data: {
            instituteId,
            teacherProfileId: teacherProfile.id,
            courseId: course.id,
          },
        })
      }
    }

    // Reset and add Availabilities
    await prisma.teacherAvailability.deleteMany({
      where: { teacherProfileId: teacherProfile.id },
    })

    await prisma.teacherAvailability.createMany({
      data: t.availabilities.map((avail) => ({
        teacherProfileId: teacherProfile.id,
        dayOfWeek: avail.dayOfWeek,
        startTime: avail.startTime,
        endTime: avail.endTime,
      })),
    })

    console.log(
      `👩‍🏫 Seeded Teacher: ${t.firstName} ${t.lastName} (${t.availabilities.length} availability slots, ${t.qualifiedTitles.length} qualified courses)`
    )
  }

  // 5. Seed ~294 Students across all 25 courses (AME 1-1 to AME 5-5)
  const studentData: Array<{
    phone: string
    firstName: string
    lastName: string
    courseId: string
    shift: StudentSchoolShift
    dayPref: StudentDayPreference
    gender: "MALE" | "FEMALE"
  }> = []

  const firstNamesM = [
    "پویا",
    "دانیال",
    "محمدرضا",
    "آرمین",
    "سپهر",
    "کیان",
    "نوید",
    "سینا",
    "متین",
    "امیر",
    "سهراب",
    "بردیا",
    "سامان",
    "امید",
    "ماهان",
    "علیرضا",
    "آرش",
    "بهراد",
    "فرزاد",
    "کامیار",
    "پرهام",
    "مهیار",
    "شاهین",
    "پیمان",
  ]
  const firstNamesF = [
    "سارا",
    "نیلوفر",
    "زهرا",
    "الهام",
    "یاسمین",
    "فاطمه",
    "پریا",
    "بهاره",
    "دنیا",
    "رکسانا",
    "آیدا",
    "طناز",
    "ترانه",
    "غزل",
    "شیدا",
    "مهسا",
    "نازنین",
    "نگار",
    "عسل",
    "سوگل",
    "مهناز",
    "هلیا",
    "درسا",
    "ملیکا",
  ]
  const lastNames = [
    "محمدی",
    "ناصری",
    "عباسی",
    "حسینی",
    "احمدی",
    "کاظمی",
    "کریمی",
    "رحیمی",
    "شریفی",
    "سعیدی",
    "مهرابی",
    "اکبری",
    "ابراهیمی",
    "رستمی",
    "جعفری",
    "صادقی",
    "خسروی",
    "اسدی",
    "مرادی",
    "یزدانی",
    "طاهری",
    "منصوری",
    "فرهادی",
    "سلیمانی",
  ]

  const shiftOptions: StudentSchoolShift[] = [
    StudentSchoolShift.MORNING,
    StudentSchoolShift.AFTERNOON,
    StudentSchoolShift.FLEXIBLE,
  ]
  const dayPrefOptions: StudentDayPreference[] = [
    StudentDayPreference.EVEN_DAYS,
    StudentDayPreference.ODD_DAYS,
    StudentDayPreference.ANY,
  ]

  const courseStudentCounts: Record<string, number> = {
    // Book 1: High density (triggers 2 parallel classes)
    "AME 1-1": 26,
    "AME 1-2": 24,
    "AME 1-3": 22,
    "AME 1-4": 20,
    "AME 1-5": 22,
    // Book 2: Medium-High density
    "AME 2-1": 20,
    "AME 2-2": 14,
    "AME 2-3": 12,
    "AME 2-4": 10,
    "AME 2-5": 14,
    // Book 3: Intermediate
    "AME 3-1": 14,
    "AME 3-2": 10,
    "AME 3-3": 8,
    "AME 3-4": 8,
    "AME 3-5": 12,
    // Book 4: Upper intermediate
    "AME 4-1": 12,
    "AME 4-2": 8,
    "AME 4-3": 8,
    "AME 4-4": 7,
    "AME 4-5": 10,
    // Book 5: Advanced
    "AME 5-1": 10,
    "AME 5-2": 6,
    "AME 5-3": 6,
    "AME 5-4": 5,
    "AME 5-5": 5,
  }

  let globalStudentIndex = 0
  for (const [courseTitle, count] of Object.entries(courseStudentCounts)) {
    const course = activeCourses[courseTitle]
    if (!course) continue

    for (let i = 1; i <= count; i++) {
      globalStudentIndex++
      const isFemale = i % 2 === 0
      const fn = isFemale
        ? (firstNamesF[i % firstNamesF.length] ?? "سارا")
        : (firstNamesM[i % firstNamesM.length] ?? "پویا")
      const ln =
        lastNames[(i + globalStudentIndex) % lastNames.length] ?? "محمدی"
      const phone = `0990100${String(globalStudentIndex).padStart(4, "0")}`
      const shift =
        shiftOptions[(i + globalStudentIndex) % shiftOptions.length] ??
        StudentSchoolShift.FLEXIBLE
      const dayPref =
        dayPrefOptions[(i + globalStudentIndex * 2) % dayPrefOptions.length] ??
        StudentDayPreference.ANY

      studentData.push({
        phone,
        firstName: fn,
        lastName: ln,
        courseId: course.id,
        shift,
        dayPref,
        gender: isFemale ? "FEMALE" : "MALE",
      })
    }
  }

  const seededStudentUsers = []
  for (const s of studentData) {
    const studentUser = await prisma.user.upsert({
      where: {
        phone_instituteId: {
          phone: s.phone,
          instituteId,
        },
      },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        role: Role.STUDENT,
        currentAllowedCourseId: s.courseId,
        branchId: centralBranchId,
        isActive: true,
      },
      create: {
        instituteId,
        branchId: centralBranchId,
        phone: s.phone,
        firstName: s.firstName,
        lastName: s.lastName,
        role: Role.STUDENT,
        password: hashedPassword,
        currentAllowedCourseId: s.courseId,
        isActive: true,
      },
    })

    await prisma.studentProfile.upsert({
      where: { userId: studentUser.id },
      update: {
        scheduleStatus: StudentScheduleStatus.COMPLETE,
        schoolShift: s.shift,
        dayPreference: s.dayPref,
        gender: s.gender,
      },
      create: {
        userId: studentUser.id,
        scheduleStatus: StudentScheduleStatus.COMPLETE,
        schoolShift: s.shift,
        dayPreference: s.dayPref,
        gender: s.gender,
      },
    })

    seededStudentUsers.push(studentUser)
  }
  console.log(
    `🎓 Seeded ${seededStudentUsers.length} Students across all 25 courses with scheduleStatus: COMPLETE`
  )

  // 6. Preceding Term (تابستان ۱۴۰۵) & Auto-Progression Ladder Enrollments
  // Students who passed in summer term advance to next level in target term:
  // AME 1-1 -> 1-2 | AME 1-2 -> 1-3 | AME 1-3 -> 1-4 | AME 1-4 -> 1-5 | AME 1-5 -> 2-1
  // AME 2-5 -> 3-1 | AME 3-5 -> 4-1 | AME 4-5 -> 5-1
  const summerStartDate = new Date("2026-06-22T00:00:00.000Z")
  const summerEndDate = new Date("2026-09-10T00:00:00.000Z")

  const summerTerm = await prisma.term.upsert({
    where: { id: "00000000-0000-0000-0000-000000000077" },
    update: {
      title: "تابستان ۱۴۰۵",
      startDate: summerStartDate,
      endDate: summerEndDate,
      isActive: false,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000077",
      instituteId,
      title: "تابستان ۱۴۰۵",
      startDate: summerStartDate,
      endDate: summerEndDate,
      isActive: false,
    },
  })

  // Create summer classes for progression checkpoints
  async function ensureSummerClass(
    id: string,
    title: string,
    courseId: string
  ) {
    return prisma.class.upsert({
      where: { id },
      update: {
        title,
        termId: summerTerm.id,
        courseId,
        branchId: centralBranchId,
        capacity: 16,
        fee: 1500000,
      },
      create: {
        id,
        instituteId,
        termId: summerTerm.id,
        courseId,
        branchId: centralBranchId,
        title,
        capacity: 16,
        fee: 1500000,
      },
    })
  }

  const summerClassCheckpoints = [
    {
      id: "00000000-0000-0000-0000-000000000078",
      title: "کلاس تابستان AME 1-1",
      course: getCourse("AME 1-1"),
      nextCourse: getCourse("AME 1-2"),
      count: 12,
    },
    {
      id: "00000000-0000-0000-0000-000000000079",
      title: "کلاس تابستان AME 1-2",
      course: getCourse("AME 1-2"),
      nextCourse: getCourse("AME 1-3"),
      count: 12,
    },
    {
      id: "00000000-0000-0000-0000-000000000080",
      title: "کلاس تابستان AME 1-3",
      course: getCourse("AME 1-3"),
      nextCourse: getCourse("AME 1-4"),
      count: 10,
    },
    {
      id: "00000000-0000-0000-0000-000000000081",
      title: "کلاس تابستان AME 1-4",
      course: getCourse("AME 1-4"),
      nextCourse: getCourse("AME 1-5"),
      count: 10,
    },
    {
      id: "00000000-0000-0000-0000-000000000082",
      title: "کلاس تابستان AME 1-5",
      course: getCourse("AME 1-5"),
      nextCourse: getCourse("AME 2-1"),
      count: 10,
    },
    {
      id: "00000000-0000-0000-0000-000000000083",
      title: "کلاس تابستان AME 2-5",
      course: getCourse("AME 2-5"),
      nextCourse: getCourse("AME 3-1"),
      count: 8,
    },
    {
      id: "00000000-0000-0000-0000-000000000084",
      title: "کلاس تابستان AME 3-5",
      course: getCourse("AME 3-5"),
      nextCourse: getCourse("AME 4-1"),
      count: 6,
    },
    {
      id: "00000000-0000-0000-0000-000000000085",
      title: "کلاس تابستان AME 4-5",
      course: getCourse("AME 4-5"),
      nextCourse: getCourse("AME 5-1"),
      count: 5,
    },
  ]

  for (const checkpoint of summerClassCheckpoints) {
    const sClass = await ensureSummerClass(
      checkpoint.id,
      checkpoint.title,
      checkpoint.course.id
    )
    const candidates = seededStudentUsers
      .filter((u) => u.currentAllowedCourseId === checkpoint.nextCourse.id)
      .slice(0, checkpoint.count)

    for (const st of candidates) {
      await prisma.enrollment.upsert({
        where: {
          studentId_classId: {
            studentId: st.id,
            classId: sClass.id,
          },
        },
        update: { status: EnrollmentStatus.ENROLLED, isPassed: true },
        create: {
          studentId: st.id,
          classId: sClass.id,
          status: EnrollmentStatus.ENROLLED,
          isPassed: true,
        },
      })
    }
  }

  console.log(
    "✅ Seeded Preceding Term (تابستان ۱۴۰۵) & multi-stage auto-progression ladder (including cross-book transitions 1-5➔2-1, 2-5➔3-1, 3-5➔4-1, 4-5➔5-1)"
  )

  // 7. Class Requirements for Target Term (مهر و آبان ۱۴۰۵)
  const autumnStartDate = new Date("2026-09-23T00:00:00.000Z")
  const autumnEndDate = new Date("2026-11-21T00:00:00.000Z")

  const activeTerm =
    (await prisma.term.findFirst({
      where: {
        instituteId,
        title: { contains: "مهر و آبان" },
        isActive: true,
      },
    })) ??
    (await prisma.term.upsert({
      where: { id: "00000000-0000-0000-0000-000000000078" },
      update: {
        title: "مهر و آبان ۱۴۰۵",
        startDate: autumnStartDate,
        endDate: autumnEndDate,
        isActive: true,
      },
      create: {
        id: "00000000-0000-0000-0000-000000000078",
        instituteId,
        title: "مهر و آبان ۱۴۰۵",
        startDate: autumnStartDate,
        endDate: autumnEndDate,
        isActive: true,
      },
    }))
  console.log(
    `📅 Target Scheduling Term: ${activeTerm.title} (${activeTerm.id})`
  )

  // Clear existing requirements for this term to avoid duplicate runs
  await prisma.classRequirement.deleteMany({
    where: { instituteId, termId: activeTerm.id },
  })

  // 18 Parallel Classes to Schedule (Intense multi-level scheduling stress-test):
  // - AME 1-1: 2 classes (In-Person, Cap 14)
  // - AME 1-2: 2 classes (In-Person, Cap 14)
  // - AME 1-3: 2 classes (In-Person, Cap 14)
  // - AME 1-4: 2 classes (In-Person, Cap 14)
  // - AME 1-5: 2 classes (In-Person, Cap 16 - exceeds Room C cap 14!)
  // - AME 2-1: 2 classes (In-Person, Cap 14)
  // - AME 2-5: 1 class (In-Person, Cap 16 - forces larger room!)
  // - AME 3-1: 1 class (In-Person, Cap 14)
  // - AME 3-5: 1 class (In-Person, Cap 14)
  // - AME 4-1: 1 class (In-Person, Cap 14)
  // - AME 4-5: 1 class (In-Person, Cap 14)
  // - AME 5-1: 1 class (In-Person, Cap 14)
  // - AME 5-5: 1 class (In-Person, Cap 14)
  const requirementsData = [
    {
      courseId: getCourse("AME 1-1").id,
      requiredClassCount: 2,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 1-2").id,
      requiredClassCount: 2,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 1-3").id,
      requiredClassCount: 2,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 1-4").id,
      requiredClassCount: 2,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 1-5").id,
      requiredClassCount: 2,
      capacity: 16,
    }, // Rejects Room C!
    {
      courseId: getCourse("AME 2-1").id,
      requiredClassCount: 2,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 2-5").id,
      requiredClassCount: 1,
      capacity: 16,
    }, // Rejects Room C!
    {
      courseId: getCourse("AME 3-1").id,
      requiredClassCount: 1,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 3-5").id,
      requiredClassCount: 1,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 4-1").id,
      requiredClassCount: 1,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 4-5").id,
      requiredClassCount: 1,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 5-1").id,
      requiredClassCount: 1,
      capacity: 14,
    },
    {
      courseId: getCourse("AME 5-5").id,
      requiredClassCount: 1,
      capacity: 14,
    },
  ]

  const seededRequirements = []
  for (const req of requirementsData) {
    const createdReq = await prisma.classRequirement.create({
      data: {
        instituteId,
        termId: activeTerm.id,
        courseId: req.courseId,
        branchId: centralBranchId,
        requiredClassCount: req.requiredClassCount,
        capacity: req.capacity,
        sessionDurationMinutes: 90,
        sessionsPerWeek: 3, // Always 3 sessions per week!
        totalSessions: null,
        deliveryMode: ClassDeliveryMode.IN_PERSON,
        isActive: true,
      },
    })
    seededRequirements.push(createdReq)
  }

  const totalClassesToSchedule = seededRequirements.reduce(
    (sum, r) => sum + r.requiredClassCount,
    0
  )
  console.log(
    `📋 Seeded ${seededRequirements.length} Class Requirements (Total ${totalClassesToSchedule} parallel classes to schedule) for ${activeTerm.title}:`
  )
  for (const req of seededRequirements) {
    console.log(
      `   - Course: ${req.courseId} | Mode: ${req.deliveryMode} | Required: ${req.requiredClassCount} classes | Cap: ${req.capacity} | Cadence: ${req.sessionsPerWeek} sess/wk`
    )
  }

  console.log(
    "\n🎉 Full AME 1-1 to AME 5-5 curriculum stress-test seed completed successfully!"
  )
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
