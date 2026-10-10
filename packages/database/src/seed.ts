import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import { prisma, Role } from "./index.js"

dotenv.config({ path: "../../.env" })
dotenv.config()

const maleFirstNames = [
  "علی",
  "محمد",
  "امیرحسین",
  "رضا",
  "مهدی",
  "حسین",
  "پارسا",
  "ایلیا",
  "سجاد",
  "دانیال",
  "کیان",
  "آرمین",
  "پوریا",
  "اشکان",
  "بردیا",
  "سینا",
  "شایان",
  "نوید",
  "سهیل",
  "کامران",
  "بابک",
  "فرهاد",
  "بهزاد",
  "مهران",
  "آرش",
  "سامان",
  "امید",
  "پویا",
  "سروش",
  "پیمان",
  "امیر",
  "احسان",
  "عرفان",
  "متین",
  "فرزاد",
  "شهاب",
  "پندار",
  "کسری",
  "ماهان",
  "آرتین",
]

const femaleFirstNames = [
  "سارا",
  "فاطمه",
  "زهرا",
  "مریم",
  "نگار",
  "پریا",
  "نازنین",
  "ریحانه",
  "نیلوفر",
  "کیمیا",
  "یکتا",
  "هانیه",
  "تینا",
  "آوا",
  "روژین",
  "پانیذ",
  "ملیکا",
  "آیدا",
  "بهاره",
  "مهسا",
  "نسترن",
  "رویا",
  "الهام",
  "شیدا",
  "یاسمن",
  "دنیا",
  "الناز",
  "سحر",
  "شیوا",
  "آناهیتا",
  "مهدیه",
  "شادی",
  "غزل",
  "صبا",
  "مونا",
  "عاطفه",
  "سوگند",
  "باران",
  "درسا",
  "رونیکا",
]

const lastNames = [
  "محمدی",
  "حسینی",
  "احمدی",
  "رضایی",
  "مرادی",
  "حیدری",
  "کریمی",
  "موسوی",
  "جعفری",
  "قاسمی",
  "رحیمی",
  "ابراهیمی",
  "صادقی",
  "شجاعی",
  "باقری",
  "اکبری",
  "کاظمی",
  "قنبری",
  "رستمی",
  "بیات",
  "سعیدی",
  "یوسفی",
  "خانی",
  "میرزایی",
  "عزیزی",
  "افشار",
  "جلالی",
  "سلطانی",
  "زمانی",
  "طاهری",
  "نوری",
  "ناصری",
  "زارع",
  "سلیمانی",
  "فلاح",
  "صالحی",
  "پاشایی",
  "عباسی",
  "قربانی",
  "خدابنده",
  "محبوبی",
  "صادق‌پور",
  "امامی",
  "دانشفر",
  "یزدانی",
  "هدایتی",
  "طهماسبی",
  "شریفی",
  "فروزان",
  "خسروی",
]

async function main() {
  console.log("🌱 Starting Kalameh database seeding...")

  const defaultPassword = "Password123!"
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  // 1. System Platform Institute for Super Admin
  const systemInstitute = await prisma.institute.upsert({
    where: { subdomain: "system" },
    update: {
      name: "سامانه مرکزی کلمه (Platform Admin)",
      isActive: true,
    },
    create: {
      name: "سامانه مرکزی کلمه (Platform Admin)",
      subdomain: "system",
      isActive: true,
    },
  })

  // 2. Sample Institute (Tehran)
  const institute = await prisma.institute.upsert({
    where: { subdomain: "tehran" },
    update: {
      name: "آموزشگاه زبان تهران (مرکزی)",
      isActive: true,
      bankCardNumber: "6037991812345678",
      bankAccountName: "آموزشگاه کلمه تهران",
      bankShaba: "IR120170000000123456789012",
    },
    create: {
      name: "آموزشگاه زبان تهران (مرکزی)",
      subdomain: "tehran",
      isActive: true,
      bankCardNumber: "6037991812345678",
      bankAccountName: "آموزشگاه کلمه تهران",
      bankShaba: "IR120170000000123456789012",
    },
  })
  console.log(
    `✅ Sample Institute: ${institute.name} (subdomain: ${institute.subdomain})`
  )

  // 2.1. Central Branch
  const centralBranch = await prisma.branch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {
      name: "شعبه مرکزی (آزادی)",
      address: "تهران، خیابان آزادی، پلاک ۱۲",
      phones: ["02166001122"],
      isActive: true,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      instituteId: institute.id,
      name: "شعبه مرکزی (آزادی)",
      address: "تهران، خیابان آزادی، پلاک ۱۲",
      phones: ["02166001122"],
      isActive: true,
    },
  })
  console.log(`🏢 Branch created: ${centralBranch.name}`)

  // 2.2. West Branch
  const westBranch = await prisma.branch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000020" },
    update: {
      name: "شعبه غرب (سعادت‌آباد)",
      address: "تهران، سعادت‌آباد، میدان کاج، پلاک ۴۵",
      phones: ["02122003344"],
      isActive: true,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000020",
      instituteId: institute.id,
      name: "شعبه غرب (سعادت‌آباد)",
      address: "تهران، سعادت‌آباد، میدان کاج، پلاک ۴۵",
      phones: ["02122003344"],
      isActive: true,
    },
  })
  console.log(`🏢 Branch created: ${westBranch.name}`)

  // 3. Super Admin User
  await prisma.user.upsert({
    where: {
      phone_instituteId: {
        phone: "09120000001",
        instituteId: systemInstitute.id,
      },
    },
    update: {
      firstName: "مدیر",
      lastName: "کل سامانه",
      role: Role.SUPER_ADMIN,
      password: hashedPassword,
      nationalCode: "0000000001",
      isActive: true,
    },
    create: {
      instituteId: systemInstitute.id,
      phone: "09120000001",
      firstName: "مدیر",
      lastName: "کل سامانه",
      role: Role.SUPER_ADMIN,
      password: hashedPassword,
      nationalCode: "0000000001",
      isActive: true,
    },
  })
  console.log(`👤 Super Admin: 09120000001 (SUPER_ADMIN)`)

  // 4. Institute Admin and Clerk
  await prisma.user.upsert({
    where: {
      phone_instituteId: {
        phone: "09120000002",
        instituteId: institute.id,
      },
    },
    update: {
      firstName: "مدیر",
      lastName: "آموزشگاه",
      role: Role.ADMIN,
      password: hashedPassword,
      nationalCode: "0000000002",
      isActive: true,
      branchId: centralBranch.id,
    },
    create: {
      instituteId: institute.id,
      phone: "09120000002",
      firstName: "مدیر",
      lastName: "آموزشگاه",
      role: Role.ADMIN,
      password: hashedPassword,
      nationalCode: "0000000002",
      isActive: true,
      branchId: centralBranch.id,
    },
  })

  await prisma.user.upsert({
    where: {
      phone_instituteId: {
        phone: "09120000003",
        instituteId: institute.id,
      },
    },
    update: {
      firstName: "کارمند",
      lastName: "پذیرش",
      role: Role.CLERK,
      password: hashedPassword,
      nationalCode: "0000000003",
      isActive: true,
      branchId: centralBranch.id,
    },
    create: {
      instituteId: institute.id,
      phone: "09120000003",
      firstName: "کارمند",
      lastName: "پذیرش",
      role: Role.CLERK,
      password: hashedPassword,
      nationalCode: "0000000003",
      isActive: true,
      branchId: centralBranch.id,
    },
  })
  console.log(`👤 Staff users seeded: 09120000002 (ADMIN), 09120000003 (CLERK)`)

  // 5. Clean up previous sample summer classes and enrollments
  const sampleSummerTermId = "00000000-0000-0000-0000-000000000005"
  try {
    await prisma.enrollment.deleteMany({
      where: { class: { termId: sampleSummerTermId } },
    })
    await prisma.class.deleteMany({
      where: { termId: sampleSummerTermId },
    })
    console.log(`🧹 Cleaned previous sample summer classes and enrollments`)
  } catch (err) {
    console.warn("⚠️ Cleanup note:", err)
  }

  // 6. Seed Courses (AME 1-1 to AME 5-5)
  console.log("📚 Seeding Courses...")
  const coursesToSeed: { id: string; title: string; baseFee: number }[] = []

  for (let level = 1; level <= 5; level++) {
    const partsCount = level === 5 ? 5 : 4
    for (let part = 1; part <= partsCount; part++) {
      const id = `00000000-0000-0000-0000-000000000${level}0${part}`
      const title = `AME ${level}-${part}`
      const baseFee = 1500000 + (level - 1) * 100000
      coursesToSeed.push({ id, title, baseFee })
    }
  }

  // Clean up any obsolete courses for this institute not in our list
  await prisma.course.deleteMany({
    where: {
      instituteId: institute.id,
      id: { notIn: coursesToSeed.map((c) => c.id) },
    },
  })

  // Upsert courses and establish prerequisite chain
  for (let idx = 0; idx < coursesToSeed.length; idx++) {
    const c = coursesToSeed[idx]
    const prerequisiteId = idx > 0 ? coursesToSeed[idx - 1].id : null

    await prisma.course.upsert({
      where: { id: c.id },
      update: {
        title: c.title,
        baseFee: c.baseFee,
        instituteId: institute.id,
        prerequisiteId,
      },
      create: {
        id: c.id,
        title: c.title,
        baseFee: c.baseFee,
        instituteId: institute.id,
        prerequisiteId,
      },
    })
  }
  console.log(`✅ ${coursesToSeed.length} Courses seeded (AME 1-1 to AME 5-5)`)

  // 7. Seed 8 Classrooms (Rooms)
  console.log("🚪 Seeding 8 rooms (classrooms)...")
  const roomsData = [
    {
      id: "00000000-0000-0000-0000-000000000031",
      name: "اتاق ۱۰۱ (نیلوفر)",
      capacity: 18,
      description: "طبقه اول - مجهز به ویدیو پروژکتور",
      branchId: centralBranch.id,
    },
    {
      id: "00000000-0000-0000-0000-000000000032",
      name: "اتاق ۱۰۲ (یاس)",
      capacity: 20,
      description: "طبقه اول - مجهز به سیستم صوتی",
      branchId: centralBranch.id,
    },
    {
      id: "00000000-0000-0000-0000-000000000033",
      name: "اتاق ۱۰۳ (سرو)",
      capacity: 22,
      description: "طبقه اول - نورگیر عالی",
      branchId: centralBranch.id,
    },
    {
      id: "00000000-0000-0000-0000-000000000034",
      name: "اتاق ۱۰۴ (صنوبر)",
      capacity: 16,
      description: "طبقه اول - کلاس ویژه مکالمه",
      branchId: centralBranch.id,
    },
    {
      id: "00000000-0000-0000-0000-000000000035",
      name: "اتاق ۲۰۱ (لابراتوار A)",
      capacity: 24,
      description: "طبقه دوم - لابراتوار کامپیوتری",
      branchId: westBranch.id,
    },
    {
      id: "00000000-0000-0000-0000-000000000036",
      name: "اتاق ۲۰۲ (لابراتوار B)",
      capacity: 20,
      description: "طبقه دوم - تجهیزات پیشرفته شنوایی",
      branchId: westBranch.id,
    },
    {
      id: "00000000-0000-0000-0000-000000000037",
      name: "اتاق ۲۰۳ (سمینار)",
      capacity: 30,
      description: "طبقه دوم - سالن همایش و سمینار",
      branchId: westBranch.id,
    },
    {
      id: "00000000-0000-0000-0000-000000000038",
      name: "اتاق ۲۰۴ (کارگاه تخصصی)",
      capacity: 15,
      description: "طبقه دوم - مناسب دوره‌های فشرده IELTS",
      branchId: westBranch.id,
    },
  ]

  for (const r of roomsData) {
    await prisma.classroom.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        capacity: r.capacity,
        description: r.description,
        branchId: r.branchId,
        isActive: true,
      },
      create: {
        id: r.id,
        instituteId: institute.id,
        branchId: r.branchId,
        name: r.name,
        capacity: r.capacity,
        description: r.description,
        isActive: true,
      },
    })
  }
  console.log(`✅ 8 Rooms seeded successfully`)

  // 8. Seed 15 Teachers
  console.log("👨‍🏫 Seeding 15 teachers...")
  const seededTeachers: { id: string; firstName: string; lastName: string }[] =
    []
  const teacherSpecialtiesList = [
    ["IELTS", "Speaking", "Grammar"],
    ["TOEFL", "Academic Writing"],
    ["General English", "Kids & Teens"],
    ["Business English", "Negotiation"],
    ["PTE", "Pronunciation"],
  ]

  for (let i = 1; i <= 15; i++) {
    const isMale = i % 2 === 1
    const firstList = isMale ? maleFirstNames : femaleFirstNames
    const firstName = firstList[(i + 14) % firstList.length]
    const lastName = lastNames[(i + 18) % lastNames.length]
    const phone = `0912200${String(i).padStart(4, "0")}`
    const nationalCode = `00${String(20000000 + i)}`

    const teacherBranch = i <= 9 ? centralBranch : westBranch

    const user = await prisma.user.upsert({
      where: {
        phone_instituteId: {
          phone,
          instituteId: institute.id,
        },
      },
      update: {
        firstName,
        lastName,
        role: Role.TEACHER,
        password: hashedPassword,
        nationalCode,
        isActive: true,
        branchId: teacherBranch.id,
      },
      create: {
        instituteId: institute.id,
        branchId: teacherBranch.id,
        phone,
        firstName,
        lastName,
        role: Role.TEACHER,
        password: hashedPassword,
        nationalCode,
        isActive: true,
      },
    })
    seededTeachers.push({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    const teacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: `مدرس با سابقه زبان انگلیسی با بیش از ۵ سال تجربه تدریس در دوره‌های مکالمه و آزمون‌های بین‌المللی`,
        degree:
          i % 3 === 0
            ? "دکتری آموزش زبان انگلیسی"
            : i % 2 === 0
              ? "کارشناسی ارشد آموزش زبان"
              : "کارشناسی مترجمی زبان",
        specialties:
          teacherSpecialtiesList[(i - 1) % teacherSpecialtiesList.length],
      },
      create: {
        userId: user.id,
        bio: `مدرس با سابقه زبان انگلیسی با بیش از ۵ سال تجربه تدریس در دوره‌های مکالمه و آزمون‌های بین‌المللی`,
        degree:
          i % 3 === 0
            ? "دکتری آموزش زبان انگلیسی"
            : i % 2 === 0
              ? "کارشناسی ارشد آموزش زبان"
              : "کارشناسی مترجمی زبان",
        specialties:
          teacherSpecialtiesList[(i - 1) % teacherSpecialtiesList.length],
      },
    })

    // Add standard availabilities for teachers with branchId
    await prisma.teacherAvailability.deleteMany({
      where: { teacherProfileId: teacherProfile.id },
    })

    const days =
      i % 2 === 0
        ? ["SATURDAY", "MONDAY", "WEDNESDAY"]
        : ["SUNDAY", "TUESDAY", "THURSDAY"]

    type AvailabilitySlot = {
      dayOfWeek:
        "SATURDAY" | "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY"
      branchId: string
      startTime: string
      endTime: string
    }
    const availData: AvailabilitySlot[] = []

    if (i <= 7) {
      days.forEach((day) =>
        availData.push({
          dayOfWeek: day as AvailabilitySlot["dayOfWeek"],
          branchId: centralBranch.id,
          startTime: "15:00",
          endTime: "20:00",
        })
      )
    } else if (i <= 12) {
      days.forEach((day) =>
        availData.push({
          dayOfWeek: day as AvailabilitySlot["dayOfWeek"],
          branchId: westBranch.id,
          startTime: "15:00",
          endTime: "20:00",
        })
      )
    } else {
      // Roaming teachers (13-15): Sat/Mon/Wed at Central, Sun/Tue/Thu at West
      ;["SATURDAY", "MONDAY", "WEDNESDAY"].forEach((day) =>
        availData.push({
          dayOfWeek: day as AvailabilitySlot["dayOfWeek"],
          branchId: centralBranch.id,
          startTime: "15:00",
          endTime: "18:00",
        })
      )
      ;["SUNDAY", "TUESDAY", "THURSDAY"].forEach((day) =>
        availData.push({
          dayOfWeek: day as AvailabilitySlot["dayOfWeek"],
          branchId: westBranch.id,
          startTime: "15:00",
          endTime: "18:00",
        })
      )
    }

    await prisma.teacherAvailability.createMany({
      data: availData.map((slot) => ({
        teacherProfileId: teacherProfile.id,
        branchId: slot.branchId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    })

    // Qualify teachers for courses
    await prisma.teacherCourseQualification.deleteMany({
      where: { teacherProfileId: teacherProfile.id },
    })

    const qualifiedCourses = coursesToSeed.filter((_, cIdx) => {
      const start = (i - 1) % coursesToSeed.length
      return (
        (cIdx >= start && cIdx < start + 6) ||
        (start + 6 > coursesToSeed.length &&
          cIdx < (start + 6) % coursesToSeed.length)
      )
    })

    if (qualifiedCourses.length > 0) {
      await prisma.teacherCourseQualification.createMany({
        data: qualifiedCourses.map((qc) => ({
          instituteId: institute.id,
          teacherProfileId: teacherProfile.id,
          courseId: qc.id,
        })),
        skipDuplicates: true,
      })
    }
  }
  console.log(
    `✅ 15 Teachers seeded (Phones: 09122000001 - 09122000015, Password: ${defaultPassword})`
  )

  // 9. Seed Operating Phases and Preceding Term (Summer 1405)
  console.log("⏰ Seeding Operating Phases and Preceding Term (Summer 1405)...")
  const defaultDaysOfWeek = [
    "SATURDAY",
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
  ]

  const summerPhase = await prisma.instituteOperatingPhase.upsert({
    where: { id: "00000000-0000-0000-0000-000000000023" },
    update: {
      title: "فاز تابستان",
      months: [4, 5, 6],
      startTime: "09:00",
      endTime: "21:00",
      slotDurationMinutes: 90,
      daysOfWeek: defaultDaysOfWeek,
      hasBreak: false,
      isActive: true,
      order: 3,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000023",
      instituteId: institute.id,
      title: "فاز تابستان",
      months: [4, 5, 6],
      startTime: "09:00",
      endTime: "21:00",
      slotDurationMinutes: 90,
      daysOfWeek: defaultDaysOfWeek,
      hasBreak: false,
      isActive: true,
      order: 3,
    },
  })

  await prisma.instituteOperatingPhase.upsert({
    where: { id: "00000000-0000-0000-0000-000000000020" },
    update: {
      title: "فاز پاییز",
      months: [7, 8, 9],
      startTime: "15:00",
      endTime: "21:00",
      slotDurationMinutes: 90,
      daysOfWeek: defaultDaysOfWeek,
      hasBreak: false,
      isActive: true,
      order: 0,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000020",
      instituteId: institute.id,
      title: "فاز پاییز",
      months: [7, 8, 9],
      startTime: "15:00",
      endTime: "21:00",
      slotDurationMinutes: 90,
      daysOfWeek: defaultDaysOfWeek,
      hasBreak: false,
      isActive: true,
      order: 0,
    },
  })

  // Upsert preceding term (تابستان ۱۴۰۵)
  const summerTerm = await prisma.term.upsert({
    where: { id: sampleSummerTermId },
    update: {
      title: "تابستان ۱۴۰۵",
      startDate: new Date("2026-06-22T00:00:00.000Z"),
      endDate: new Date("2026-09-15T00:00:00.000Z"),
      operatingPhaseId: summerPhase.id,
      isActive: false,
    },
    create: {
      id: sampleSummerTermId,
      instituteId: institute.id,
      title: "تابستان ۱۴۰۵",
      startDate: new Date("2026-06-22T00:00:00.000Z"),
      endDate: new Date("2026-09-15T00:00:00.000Z"),
      operatingPhaseId: summerPhase.id,
      isActive: false,
    },
  })
  console.log(`📅 Preceding Term seeded: ${summerTerm.title}`)

  // Seed Summer classes for courses AME 1-1 to AME 5-4 (first 20 courses)
  const summerClasses: {
    courseId: string
    classId: string
    branchId: string
  }[] = []
  for (let cIdx = 0; cIdx < coursesToSeed.length - 1; cIdx++) {
    const course = coursesToSeed[cIdx]
    const classId = `00000000-0000-0000-0000-00000001${String(cIdx + 1).padStart(4, "0")}`
    const teacher = seededTeachers[cIdx % seededTeachers.length]
    const isCentral = cIdx < 12
    const classBranch = isCentral ? centralBranch : westBranch
    const room = isCentral
      ? roomsData[cIdx % 4]
      : roomsData[4 + ((cIdx - 12) % 4)]
    const isEven = cIdx % 2 === 0
    const daysOfWeek = isEven
      ? ["SATURDAY", "MONDAY", "WEDNESDAY"]
      : ["SUNDAY", "TUESDAY", "THURSDAY"]

    const cls = await prisma.class.upsert({
      where: { id: classId },
      update: {
        title: `کلاس ${course.title} - تابستان ۱۴۰۵ (${isCentral ? "مرکزی" : "غرب"})`,
        instituteId: institute.id,
        branchId: classBranch.id,
        termId: summerTerm.id,
        courseId: course.id,
        classroomId: room.id,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        capacity: 15,
        fee: course.baseFee,
        daysOfWeek,
        startTime: "16:00",
        endTime: "17:30",
      },
      create: {
        id: classId,
        title: `کلاس ${course.title} - تابستان ۱۴۰۵ (${isCentral ? "مرکزی" : "غرب"})`,
        instituteId: institute.id,
        branchId: classBranch.id,
        termId: summerTerm.id,
        courseId: course.id,
        classroomId: room.id,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        capacity: 15,
        fee: course.baseFee,
        daysOfWeek,
        startTime: "16:00",
        endTime: "17:30",
      },
    })
    summerClasses.push({
      courseId: course.id,
      classId: cls.id,
      branchId: classBranch.id,
    })
  }
  console.log(
    `🏫 20 Summer classes seeded for preceding term (12 Central, 8 West)`
  )

  // 10. Seed 420 Students (200 continuing from Summer + 220 newly placed)
  console.log("🎓 Seeding 420 students...")

  const newPlacementCounts = [
    24, // AME 1-1
    12, // AME 1-2
    12, // AME 1-3
    12, // AME 1-4
    19, // AME 2-1
    11, // AME 2-2
    11, // AME 2-3
    11, // AME 2-4
    15, // AME 3-1
    10, // AME 3-2
    10, // AME 3-3
    10, // AME 3-4
    10, // AME 4-1
    8, // AME 4-2
    8, // AME 4-3
    8, // AME 4-4
    8, // AME 5-1
    6, // AME 5-2
    5, // AME 5-3
    5, // AME 5-4
    5, // AME 5-5
  ]

  const newPlacementCourseAssignments: string[] = []
  for (let cIdx = 0; cIdx < newPlacementCounts.length; cIdx++) {
    for (let k = 0; k < newPlacementCounts[cIdx]; k++) {
      newPlacementCourseAssignments.push(coursesToSeed[cIdx].id)
    }
  }

  for (let i = 1; i <= 420; i++) {
    const isMale = i % 2 === 1
    const firstList = isMale ? maleFirstNames : femaleFirstNames
    const firstName = firstList[(i - 1) % firstList.length]
    const lastName = lastNames[(i - 1) % lastNames.length]
    const fatherName = maleFirstNames[(i * 3) % maleFirstNames.length]
    const phone = `0912100${String(i).padStart(4, "0")}`
    const nationalCode = `00${String(10000000 + i)}`

    let assignedCourseId: string
    let enrolledClassId: string | null = null
    let studentBranchId: string

    if (i <= 200) {
      // Continuing students: enrolled in Summer class, then eligible for next course in Fall
      const classIndex = Math.floor((i - 1) / 10) // 0 to 19
      const summerClass = summerClasses[classIndex]
      enrolledClassId = summerClass.classId
      assignedCourseId = coursesToSeed[classIndex + 1].id
      studentBranchId = summerClass.branchId
    } else {
      // Newly placed students (201 to 420):
      assignedCourseId = newPlacementCourseAssignments[i - 201]
      studentBranchId = i <= 330 ? centralBranch.id : westBranch.id
    }

    const user = await prisma.user.upsert({
      where: {
        phone_instituteId: {
          phone,
          instituteId: institute.id,
        },
      },
      update: {
        firstName,
        lastName,
        role: Role.STUDENT,
        password: hashedPassword,
        nationalCode,
        isActive: true,
        branchId: studentBranchId,
        currentAllowedCourseId: assignedCourseId,
      },
      create: {
        instituteId: institute.id,
        branchId: studentBranchId,
        phone,
        firstName,
        lastName,
        role: Role.STUDENT,
        password: hashedPassword,
        nationalCode,
        isActive: true,
        currentAllowedCourseId: assignedCourseId,
      },
    })

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        fatherName,
        emergencyPhone: `0912999${String(i).padStart(4, "0")}`,
        gender: isMale ? "MALE" : "FEMALE",
        address: `تهران، منطقه ${(i % 22) + 1}، پلاک ${i}`,
        schoolShift:
          i % 3 === 0 ? "MORNING" : i % 3 === 1 ? "AFTERNOON" : "FLEXIBLE",
        dayPreference:
          i % 3 === 0 ? "EVEN_DAYS" : i % 3 === 1 ? "ODD_DAYS" : "ANY",
        scheduleStatus: "COMPLETE",
      },
      create: {
        userId: user.id,
        fatherName,
        emergencyPhone: `0912999${String(i).padStart(4, "0")}`,
        gender: isMale ? "MALE" : "FEMALE",
        address: `تهران، منطقه ${(i % 22) + 1}، پلاک ${i}`,
        schoolShift:
          i % 3 === 0 ? "MORNING" : i % 3 === 1 ? "AFTERNOON" : "FLEXIBLE",
        dayPreference:
          i % 3 === 0 ? "EVEN_DAYS" : i % 3 === 1 ? "ODD_DAYS" : "ANY",
        scheduleStatus: "COMPLETE",
      },
    })

    if (enrolledClassId) {
      await prisma.enrollment.upsert({
        where: {
          studentId_classId: {
            studentId: user.id,
            classId: enrolledClassId,
          },
        },
        update: {
          status: "ENROLLED",
          isPassed: true,
          finalScore: 85 + (i % 15),
        },
        create: {
          studentId: user.id,
          classId: enrolledClassId,
          status: "ENROLLED",
          isPassed: true,
          finalScore: 85 + (i % 15),
        },
      })
    }
  }
  console.log(
    `✅ 420 Students seeded (Phones: 09121000001 - 09121000420, Password: ${defaultPassword})`
  )

  console.log("\n=========================================")
  console.log("✨ Seeding completed successfully!")
  console.log("📊 Summary:")
  console.log("  • Sample Institute: tehran")
  console.log("  • Branches: شعبه مرکزی (آزادی), شعبه غرب (سعادت‌آباد)")
  console.log(`  • Courses: ${coursesToSeed.length} (AME 1-1 to AME 5-5)`)
  console.log("  • Rooms: 8")
  console.log("  • Teachers: 15 (Phones: 09122000001 to 09122000015)")
  console.log(
    "  • Students: 420 (200 continuing from Summer + 220 newly placed)"
  )
  console.log(
    "  • Preceding Term: تابستان ۱۴۰۵ (20 classes with 200 enrolled students)"
  )
  console.log("  • Password for all accounts: Password123!")
  console.log("=========================================\n")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
