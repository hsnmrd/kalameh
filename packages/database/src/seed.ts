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

  // 5. Clean up any existing classes, terms, and operating phases for this sample institute
  // Rule: NO operating phase, NO terms, NO class
  try {
    await prisma.enrollment.deleteMany({
      where: { class: { instituteId: institute.id } },
    })
    await prisma.classRequirement.deleteMany({
      where: { instituteId: institute.id },
    })
    await prisma.schedulingProposal.deleteMany({
      where: { instituteId: institute.id },
    })
    await prisma.schedulingRun.deleteMany({
      where: { instituteId: institute.id },
    })
    await prisma.class.deleteMany({
      where: { instituteId: institute.id },
    })
    await prisma.term.deleteMany({
      where: { instituteId: institute.id },
    })
    await prisma.instituteOperatingPhase.deleteMany({
      where: { instituteId: institute.id },
    })
    console.log(
      `🧹 Verified clean state: 0 classes, 0 terms, 0 operating phases`
    )
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
    },
    {
      id: "00000000-0000-0000-0000-000000000032",
      name: "اتاق ۱۰۲ (یاس)",
      capacity: 20,
      description: "طبقه اول - مجهز به سیستم صوتی",
    },
    {
      id: "00000000-0000-0000-0000-000000000033",
      name: "اتاق ۱۰۳ (سرو)",
      capacity: 22,
      description: "طبقه اول - نورگیر عالی",
    },
    {
      id: "00000000-0000-0000-0000-000000000034",
      name: "اتاق ۱۰۴ (صنوبر)",
      capacity: 16,
      description: "طبقه اول - کلاس ویژه مکالمه",
    },
    {
      id: "00000000-0000-0000-0000-000000000035",
      name: "اتاق ۲۰۱ (لابراتوار A)",
      capacity: 24,
      description: "طبقه دوم - لابراتوار کامپیوتری",
    },
    {
      id: "00000000-0000-0000-0000-000000000036",
      name: "اتاق ۲۰۲ (لابراتوار B)",
      capacity: 20,
      description: "طبقه دوم - تجهیزات پیشرفته شنوایی",
    },
    {
      id: "00000000-0000-0000-0000-000000000037",
      name: "اتاق ۲۰۳ (سمینار)",
      capacity: 30,
      description: "طبقه دوم - سالن همایش و سمینار",
    },
    {
      id: "00000000-0000-0000-0000-000000000038",
      name: "اتاق ۲۰۴ (کارگاه تخصصی)",
      capacity: 15,
      description: "طبقه دوم - مناسب دوره‌های فشرده IELTS",
    },
  ]

  for (const r of roomsData) {
    await prisma.classroom.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        capacity: r.capacity,
        description: r.description,
        branchId: centralBranch.id,
        isActive: true,
      },
      create: {
        id: r.id,
        instituteId: institute.id,
        branchId: centralBranch.id,
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
        branchId: centralBranch.id,
      },
      create: {
        instituteId: institute.id,
        branchId: centralBranch.id,
        phone,
        firstName,
        lastName,
        role: Role.TEACHER,
        password: hashedPassword,
        nationalCode,
        isActive: true,
      },
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

    // Add standard availabilities for teachers
    await prisma.teacherAvailability.deleteMany({
      where: { teacherProfileId: teacherProfile.id },
    })

    const days =
      i % 2 === 0
        ? ["SATURDAY", "MONDAY", "WEDNESDAY"]
        : ["SUNDAY", "TUESDAY", "THURSDAY"]

    await prisma.teacherAvailability.createMany({
      data: days.map((day) => ({
        teacherProfileId: teacherProfile.id,
        dayOfWeek: day,
        startTime: "15:00",
        endTime: "20:00",
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

  // 9. Seed 100 Students
  console.log("🎓 Seeding 100 students...")
  for (let i = 1; i <= 100; i++) {
    const isMale = i % 2 === 1
    const firstList = isMale ? maleFirstNames : femaleFirstNames
    const firstName = firstList[(i - 1) % firstList.length]
    const lastName = lastNames[(i - 1) % lastNames.length]
    const fatherName = maleFirstNames[(i * 3) % maleFirstNames.length]
    const phone = `0912100${String(i).padStart(4, "0")}`
    const nationalCode = `00${String(10000000 + i)}`
    const assignedCourseId = coursesToSeed[(i - 1) % coursesToSeed.length].id

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
        branchId: centralBranch.id,
        currentAllowedCourseId: assignedCourseId,
      },
      create: {
        instituteId: institute.id,
        branchId: centralBranch.id,
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
  }
  console.log(
    `✅ 100 Students seeded (Phones: 09121000001 - 09121000100, Password: ${defaultPassword})`
  )

  console.log("\n=========================================")
  console.log("✨ Seeding completed successfully!")
  console.log("📊 Summary:")
  console.log("  • Sample Institute: tehran")
  console.log(`  • Courses: ${coursesToSeed.length} (AME 1-1 to AME 5-5)`)
  console.log("  • Rooms: 8")
  console.log("  • Teachers: 15 (Phones: 09122000001 to 09122000015)")
  console.log("  • Students: 100 (Phones: 09121000001 to 09121000100)")
  console.log("  • Operating Phases: 0")
  console.log("  • Terms: 0")
  console.log("  • Classes: 0")
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
