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
  console.log("🚀 Starting seed for Zaban Land (زبان لند) scheduling data...")

  const defaultPassword = "Password123!"
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  // 1. Fetch Institute
  const institute = await prisma.institute.findUnique({
    where: { subdomain: "zabanland" },
    include: {
      branches: true,
      terms: true,
      courses: true,
    },
  })

  if (!institute) {
    throw new Error("Institute 'zabanland' not found! Please ensure it exists.")
  }

  const centralBranch =
    institute.branches.find((b) => b.name === "شعبه مرکزی") ??
    institute.branches[0]
  if (!centralBranch) {
    throw new Error("Central branch for 'zabanland' not found!")
  }

  console.log(`✅ Target Institute: ${institute.name} (${institute.id})`)
  console.log(`✅ Central Branch: ${centralBranch.name} (${centralBranch.id})`)

  // 2. Identify Courses
  const courseAme1 = institute.courses.find((c) => c.title === "AME 1")
  const courseAme2 = institute.courses.find((c) => c.title === "AME 2")
  const courseAme3 = institute.courses.find((c) => c.title === "AME 3")

  if (!courseAme1 || !courseAme2 || !courseAme3) {
    throw new Error(
      "Required courses (AME 1, AME 2, AME 3) not found in Zaban Land!"
    )
  }
  console.log("✅ Verified Courses: AME 1, AME 2, AME 3")

  // 3. Classrooms (Ensure 4 rooms to accommodate parallel classes)
  const classroomsData = [
    {
      name: "کلاس A (اتاق ۱۰۱)",
      capacity: 20,
      description: "کلاس استاندارد با پروژکتور",
    },
    {
      name: "کلاس B (اتاق ۱۰۲)",
      capacity: 20,
      description: "کلاس استاندارد با پروژکتور و تخته هوشمند",
    },
    {
      name: "کلاس C (اتاق ۱۰۳)",
      capacity: 16,
      description: "کلاس نیمه خصوصی و پیشرفته",
    },
    {
      name: "کلاس D (آزمایشگاه زبان)",
      capacity: 25,
      description: "سالن چندرسانه‌ای و آزمایشگاه زبان",
    },
  ]

  for (const room of classroomsData) {
    const existing = await prisma.classroom.findFirst({
      where: { instituteId: institute.id, name: room.name },
    })
    if (!existing) {
      await prisma.classroom.create({
        data: {
          instituteId: institute.id,
          branchId: centralBranch.id,
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
          branchId: centralBranch.id,
          isActive: true,
        },
      })
    }
  }
  console.log("✅ Seeded 4 Classrooms with capacities 16-25")

  // 4. Additional Teachers & Qualifications & Availabilities
  const additionalTeachers = [
    {
      phone: "09127770001",
      firstName: "امیرحسین",
      lastName: "رضایی",
      degree: "کارشناسی ارشد آموزش زبان انگلیسی",
      specialties: ["Starter", "Elementary", "AME 1", "AME 2"],
      qualifiedCourseIds: [courseAme1.id, courseAme2.id],
      availabilities: [
        // SATURDAY afternoon & evening
        { dayOfWeek: "SATURDAY", startTime: "14:00", endTime: "15:30" },
        { dayOfWeek: "SATURDAY", startTime: "15:30", endTime: "17:00" },
        { dayOfWeek: "SATURDAY", startTime: "17:00", endTime: "18:30" },
        { dayOfWeek: "SATURDAY", startTime: "18:30", endTime: "20:00" },
        // MONDAY afternoon & evening
        { dayOfWeek: "MONDAY", startTime: "14:00", endTime: "15:30" },
        { dayOfWeek: "MONDAY", startTime: "15:30", endTime: "17:00" },
        { dayOfWeek: "MONDAY", startTime: "17:00", endTime: "18:30" },
        { dayOfWeek: "MONDAY", startTime: "18:30", endTime: "20:00" },
        // WEDNESDAY afternoon & evening
        { dayOfWeek: "WEDNESDAY", startTime: "14:00", endTime: "15:30" },
        { dayOfWeek: "WEDNESDAY", startTime: "15:30", endTime: "17:00" },
        { dayOfWeek: "WEDNESDAY", startTime: "17:00", endTime: "18:30" },
        { dayOfWeek: "WEDNESDAY", startTime: "18:30", endTime: "20:00" },
      ],
    },
    {
      phone: "09127770002",
      firstName: "مریم",
      lastName: "کاظمی",
      degree: "دکتری زبان‌شناسی کاربردی",
      specialties: ["Intermediate", "Advanced", "AME 2", "AME 3"],
      qualifiedCourseIds: [courseAme2.id, courseAme3.id],
      availabilities: [
        // SUNDAY afternoon & evening
        { dayOfWeek: "SUNDAY", startTime: "14:00", endTime: "15:30" },
        { dayOfWeek: "SUNDAY", startTime: "15:30", endTime: "17:00" },
        { dayOfWeek: "SUNDAY", startTime: "17:00", endTime: "18:30" },
        { dayOfWeek: "SUNDAY", startTime: "18:30", endTime: "20:00" },
        // TUESDAY afternoon & evening
        { dayOfWeek: "TUESDAY", startTime: "14:00", endTime: "15:30" },
        { dayOfWeek: "TUESDAY", startTime: "15:30", endTime: "17:00" },
        { dayOfWeek: "TUESDAY", startTime: "17:00", endTime: "18:30" },
        { dayOfWeek: "TUESDAY", startTime: "18:30", endTime: "20:00" },
        // THURSDAY morning
        { dayOfWeek: "THURSDAY", startTime: "09:00", endTime: "10:30" },
        { dayOfWeek: "THURSDAY", startTime: "10:30", endTime: "12:00" },
      ],
    },
    {
      phone: "09127770003",
      firstName: "علیرضا",
      lastName: "شمس",
      degree: "کارشناسی ادبیات انگلیسی",
      specialties: ["AME 1", "AME 3", "Conversation"],
      qualifiedCourseIds: [courseAme1.id, courseAme3.id],
      availabilities: [
        // Morning slots
        { dayOfWeek: "SATURDAY", startTime: "09:00", endTime: "10:30" },
        { dayOfWeek: "SATURDAY", startTime: "10:30", endTime: "12:00" },
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:30" },
        { dayOfWeek: "MONDAY", startTime: "10:30", endTime: "12:00" },
        { dayOfWeek: "WEDNESDAY", startTime: "09:00", endTime: "10:30" },
        { dayOfWeek: "WEDNESDAY", startTime: "10:30", endTime: "12:00" },
        { dayOfWeek: "SUNDAY", startTime: "09:00", endTime: "10:30" },
        { dayOfWeek: "SUNDAY", startTime: "10:30", endTime: "12:00" },
        { dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "10:30" },
        { dayOfWeek: "TUESDAY", startTime: "10:30", endTime: "12:00" },
      ],
    },
  ]

  for (const t of additionalTeachers) {
    const user = await prisma.user.upsert({
      where: {
        phone_instituteId: {
          phone: t.phone,
          instituteId: institute.id,
        },
      },
      update: {
        firstName: t.firstName,
        lastName: t.lastName,
        role: Role.TEACHER,
        branchId: centralBranch.id,
        isActive: true,
      },
      create: {
        instituteId: institute.id,
        branchId: centralBranch.id,
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
    for (const courseId of t.qualifiedCourseIds) {
      await prisma.teacherCourseQualification.upsert({
        where: {
          teacherProfileId_courseId: {
            teacherProfileId: teacherProfile.id,
            courseId,
          },
        },
        update: {},
        create: {
          instituteId: institute.id,
          teacherProfileId: teacherProfile.id,
          courseId,
        },
      })
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
      `👩‍🏫 Seeded Teacher: ${t.firstName} ${t.lastName} (${t.availabilities.length} availability slots)`
    )
  }

  // 5. Update existing Student 'مهدی رضاوند' to COMPLETE
  const existingStudent = await prisma.user.findFirst({
    where: { phone: "09903103965", instituteId: institute.id },
    include: { studentProfile: true },
  })
  if (existingStudent) {
    await prisma.studentProfile.upsert({
      where: { userId: existingStudent.id },
      update: {
        scheduleStatus: StudentScheduleStatus.COMPLETE,
        schoolShift: StudentSchoolShift.AFTERNOON,
        dayPreference: StudentDayPreference.EVEN_DAYS,
      },
      create: {
        userId: existingStudent.id,
        scheduleStatus: StudentScheduleStatus.COMPLETE,
        schoolShift: StudentSchoolShift.AFTERNOON,
        dayPreference: StudentDayPreference.EVEN_DAYS,
      },
    })
    console.log(
      "✅ Updated existing student مهدی رضاوند to COMPLETE schedule status"
    )
  }

  // 6. Seed 18 More Students (6 per Course Level)
  const studentTemplates = [
    // Course AME 1
    {
      phone: "09900000101",
      firstName: "سارا",
      lastName: "محمدی",
      courseId: courseAme1.id,
      shift: StudentSchoolShift.MORNING,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "FEMALE",
    },
    {
      phone: "09900000102",
      firstName: "پویا",
      lastName: "ناصری",
      courseId: courseAme1.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "MALE",
    },
    {
      phone: "09900000103",
      firstName: "نیلوفر",
      lastName: "عباسی",
      courseId: courseAme1.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.ODD_DAYS,
      gender: "FEMALE",
    },
    {
      phone: "09900000104",
      firstName: "دانیال",
      lastName: "حسینی",
      courseId: courseAme1.id,
      shift: StudentSchoolShift.FLEXIBLE,
      dayPref: StudentDayPreference.ANY,
      gender: "MALE",
    },
    {
      phone: "09900000105",
      firstName: "زهرا",
      lastName: "احمدی",
      courseId: courseAme1.id,
      shift: StudentSchoolShift.MORNING,
      dayPref: StudentDayPreference.ANY,
      gender: "FEMALE",
    },
    {
      phone: "09900000106",
      firstName: "محمدرضا",
      lastName: "کاظمی",
      courseId: courseAme1.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "MALE",
    },

    // Course AME 2
    {
      phone: "09900000201",
      firstName: "آرمین",
      lastName: "کریمی",
      courseId: courseAme2.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "MALE",
    },
    {
      phone: "09900000202",
      firstName: "الهام",
      lastName: "رحیمی",
      courseId: courseAme2.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.ODD_DAYS,
      gender: "FEMALE",
    },
    {
      phone: "09900000203",
      firstName: "سپهر",
      lastName: "شریفی",
      courseId: courseAme2.id,
      shift: StudentSchoolShift.MORNING,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "MALE",
    },
    {
      phone: "09900000204",
      firstName: "یاسمین",
      lastName: "سعیدی",
      courseId: courseAme2.id,
      shift: StudentSchoolShift.FLEXIBLE,
      dayPref: StudentDayPreference.ANY,
      gender: "FEMALE",
    },
    {
      phone: "09900000205",
      firstName: "کیان",
      lastName: "مهرابی",
      courseId: courseAme2.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "MALE",
    },
    {
      phone: "09900000206",
      firstName: "فاطمه",
      lastName: "اکبری",
      courseId: courseAme2.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.ODD_DAYS,
      gender: "FEMALE",
    },

    // Course AME 3
    {
      phone: "09900000301",
      firstName: "نوید",
      lastName: "ابراهیمی",
      courseId: courseAme3.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "MALE",
    },
    {
      phone: "09900000302",
      firstName: "پریا",
      lastName: "رستمی",
      courseId: courseAme3.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.ODD_DAYS,
      gender: "FEMALE",
    },
    {
      phone: "09900000303",
      firstName: "سینا",
      lastName: "جعفری",
      courseId: courseAme3.id,
      shift: StudentSchoolShift.FLEXIBLE,
      dayPref: StudentDayPreference.ANY,
      gender: "MALE",
    },
    {
      phone: "09900000304",
      firstName: "بهاره",
      lastName: "صادقی",
      courseId: courseAme3.id,
      shift: StudentSchoolShift.MORNING,
      dayPref: StudentDayPreference.ANY,
      gender: "FEMALE",
    },
    {
      phone: "09900000305",
      firstName: "متین",
      lastName: "خسروی",
      courseId: courseAme3.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.EVEN_DAYS,
      gender: "MALE",
    },
    {
      phone: "09900000306",
      firstName: "دنیا",
      lastName: "اسدی",
      courseId: courseAme3.id,
      shift: StudentSchoolShift.AFTERNOON,
      dayPref: StudentDayPreference.ODD_DAYS,
      gender: "FEMALE",
    },
  ]

  const seededStudentUsers = []
  for (const s of studentTemplates) {
    const studentUser = await prisma.user.upsert({
      where: {
        phone_instituteId: {
          phone: s.phone,
          instituteId: institute.id,
        },
      },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        currentAllowedCourseId: s.courseId,
        branchId: centralBranch.id,
        role: Role.STUDENT,
        isActive: true,
      },
      create: {
        instituteId: institute.id,
        branchId: centralBranch.id,
        phone: s.phone,
        firstName: s.firstName,
        lastName: s.lastName,
        currentAllowedCourseId: s.courseId,
        role: Role.STUDENT,
        password: hashedPassword,
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
    `🎓 Seeded ${seededStudentUsers.length} Students across AME 1, 2, 3 with scheduleStatus: COMPLETE`
  )

  // 7. Preceding Term (تابستان ۱۴۰۵) & Completed Enrollments for Demand Analysis
  const summerStartDate = new Date("2026-06-22T00:00:00.000Z")
  const summerEndDate = new Date("2026-09-10T00:00:00.000Z")

  const summerTerm = await prisma.term.upsert({
    where: { id: "00000000-0000-0000-0000-000000000077" },
    update: {
      title: "تابستان ۱۴۰۵",
      startDate: summerStartDate,
      endDate: summerEndDate,
      isActive: false, // Preceding term has ended
    },
    create: {
      id: "00000000-0000-0000-0000-000000000077",
      instituteId: institute.id,
      title: "تابستان ۱۴۰۵",
      startDate: summerStartDate,
      endDate: summerEndDate,
      isActive: false,
    },
  })

  // Create summer classes to anchor continuing students
  const summerClassAme1 = await prisma.class.upsert({
    where: { id: "00000000-0000-0000-0000-000000000078" },
    update: {
      title: "کلاس تابستان AME 1",
      termId: summerTerm.id,
      courseId: courseAme1.id,
      branchId: centralBranch.id,
      capacity: 15,
      fee: 1500000,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000078",
      instituteId: institute.id,
      termId: summerTerm.id,
      courseId: courseAme1.id,
      branchId: centralBranch.id,
      title: "کلاس تابستان AME 1",
      capacity: 15,
      fee: 1500000,
    },
  })

  const summerClassAme2 = await prisma.class.upsert({
    where: { id: "00000000-0000-0000-0000-000000000079" },
    update: {
      title: "کلاس تابستان AME 2",
      termId: summerTerm.id,
      courseId: courseAme2.id,
      branchId: centralBranch.id,
      capacity: 15,
      fee: 1500000,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000079",
      instituteId: institute.id,
      termId: summerTerm.id,
      courseId: courseAme2.id,
      branchId: centralBranch.id,
      title: "کلاس تابستان AME 2",
      capacity: 15,
      fee: 1500000,
    },
  })

  // Enroll some students from AME 2 group into summer AME 1 (so they are "continuing" to AME 2 now)
  const continuingToAme2Students = seededStudentUsers
    .filter((u) => u.currentAllowedCourseId === courseAme2.id)
    .slice(0, 4)
  for (const st of continuingToAme2Students) {
    await prisma.enrollment.upsert({
      where: {
        studentId_classId: {
          studentId: st.id,
          classId: summerClassAme1.id,
        },
      },
      update: {
        status: EnrollmentStatus.ENROLLED,
        isPassed: true,
      },
      create: {
        studentId: st.id,
        classId: summerClassAme1.id,
        status: EnrollmentStatus.ENROLLED,
        isPassed: true,
      },
    })
  }

  // Enroll some students from AME 3 group into summer AME 2 (so they are "continuing" to AME 3 now)
  const continuingToAme3Students = seededStudentUsers
    .filter((u) => u.currentAllowedCourseId === courseAme3.id)
    .slice(0, 4)
  for (const st of continuingToAme3Students) {
    await prisma.enrollment.upsert({
      where: {
        studentId_classId: {
          studentId: st.id,
          classId: summerClassAme2.id,
        },
      },
      update: {
        status: EnrollmentStatus.ENROLLED,
        isPassed: true,
      },
      create: {
        studentId: st.id,
        classId: summerClassAme2.id,
        status: EnrollmentStatus.ENROLLED,
        isPassed: true,
      },
    })
  }
  console.log(
    "✅ Seeded Preceding Term (تابستان ۱۴۰۵) & historical enrollments for Demand calculation"
  )

  // 8. Class Requirements for Current Active Term (مهر و آبان ۱۴۰۵)
  const activeTerm =
    institute.terms.find((t) => t.title.includes("مهر و آبان") && t.isActive) ??
    institute.terms[0]
  if (!activeTerm) {
    throw new Error("Active term for مهر و آبان ۱۴۰۵ not found!")
  }
  console.log(
    `📅 Target Scheduling Term: ${activeTerm.title} (${activeTerm.id})`
  )

  // Clear any existing requirements for this term to avoid duplicate runs
  await prisma.classRequirement.deleteMany({
    where: { instituteId: institute.id, termId: activeTerm.id },
  })

  const requirementsData = [
    {
      courseId: courseAme1.id,
      branchId: centralBranch.id,
      requiredClassCount: 2,
      capacity: 14,
      sessionDurationMinutes: 90,
      sessionsPerWeek: 3,
      totalSessions: null,
      deliveryMode: ClassDeliveryMode.IN_PERSON,
    },
    {
      courseId: courseAme2.id,
      branchId: centralBranch.id,
      requiredClassCount: 2,
      capacity: 14,
      sessionDurationMinutes: 90,
      sessionsPerWeek: 3,
      totalSessions: null,
      deliveryMode: ClassDeliveryMode.IN_PERSON,
    },
    {
      courseId: courseAme3.id,
      branchId: centralBranch.id,
      requiredClassCount: 1,
      capacity: 12,
      sessionDurationMinutes: 90,
      sessionsPerWeek: 2,
      totalSessions: null,
      deliveryMode: ClassDeliveryMode.IN_PERSON,
    },
    {
      courseId: courseAme1.id,
      branchId: null,
      requiredClassCount: 1,
      capacity: 16,
      sessionDurationMinutes: 90,
      sessionsPerWeek: 2,
      totalSessions: null,
      deliveryMode: ClassDeliveryMode.ONLINE,
    },
  ]

  const seededRequirements = []
  for (const req of requirementsData) {
    const createdReq = await prisma.classRequirement.create({
      data: {
        instituteId: institute.id,
        termId: activeTerm.id,
        courseId: req.courseId,
        branchId: req.branchId,
        requiredClassCount: req.requiredClassCount,
        capacity: req.capacity,
        sessionDurationMinutes: req.sessionDurationMinutes,
        sessionsPerWeek: req.sessionsPerWeek,
        totalSessions: req.totalSessions,
        deliveryMode: req.deliveryMode,
        isActive: true,
      },
    })
    seededRequirements.push(createdReq)
  }

  console.log(
    `📋 Seeded ${seededRequirements.length} Class Requirements (Total 6 classes to schedule) for ${activeTerm.title}:`
  )
  for (const req of seededRequirements) {
    console.log(
      `   - Course: ${req.courseId} | Mode: ${req.deliveryMode} | Required: ${req.requiredClassCount} classes | Cap: ${req.capacity}`
    )
  }

  console.log("\n🎉 Seeding for automatic scheduling completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
