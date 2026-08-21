import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import { prisma, Role } from "./index.js"

dotenv.config({ path: "../../.env" })
dotenv.config()

async function main() {
  console.log("🌱 Seeding Kalameh database...")

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
    `✅ Institute seeded: ${institute.name} (subdomain: ${institute.subdomain})`
  )

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
  console.log(`👤 Super Admin seeded: 09120000001 (SUPER_ADMIN)`)

  // 4. Institute Users (Tehran)
  const instituteUsers = [
    {
      phone: "09120000002",
      firstName: "مدیر",
      lastName: "آموزشگاه",
      role: Role.INSTITUTE_ADMIN,
      nationalCode: "0000000002",
    },
    {
      phone: "09120000003",
      firstName: "کارمند",
      lastName: "پذیرش",
      role: Role.CLERK,
      nationalCode: "0000000003",
    },
    {
      phone: "09120000004",
      firstName: "علی",
      lastName: "رضایی",
      role: Role.STUDENT,
      nationalCode: "0012345678",
    },
  ]

  for (const user of instituteUsers) {
    await prisma.user.upsert({
      where: {
        phone_instituteId: {
          phone: user.phone,
          instituteId: institute.id,
        },
      },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        password: hashedPassword,
        nationalCode: user.nationalCode,
        isActive: true,
      },
      create: {
        instituteId: institute.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        password: hashedPassword,
        nationalCode: user.nationalCode,
        isActive: true,
      },
    })
    console.log(
      `👤 User seeded: ${user.phone} (${user.role}) - Password: ${defaultPassword}`
    )
  }

  // 5. Sample Term
  const now = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3)

  const term = await prisma.term.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      title: "پاییز ۱۴۰۳",
      startDate: now,
      endDate: endDate,
      isActive: true,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      instituteId: institute.id,
      title: "پاییز ۱۴۰۳",
      startDate: now,
      endDate: endDate,
      isActive: true,
    },
  })
  console.log(`📅 Term seeded: ${term.title}`)

  // 6. Sample Course
  const course = await prisma.course.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {
      title: "انگلیسی مقدماتی (Starter 101)",
      baseFee: 1500000,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      instituteId: institute.id,
      title: "انگلیسی مقدماتی (Starter 101)",
      baseFee: 1500000,
    },
  })
  console.log(`📚 Course seeded: ${course.title}`)

  // 7. Sample Class
  const sampleClass = await prisma.class.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {
      title: "کلاس Starter 101 - کد A",
      capacity: 20,
      fee: 1500000,
      teacherName: "استاد سهرابی",
      schedule: "روزهای زوج ساعت ۱۷:۰۰ الی ۱۸:۳۰",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      instituteId: institute.id,
      termId: term.id,
      courseId: course.id,
      title: "کلاس Starter 101 - کد A",
      capacity: 20,
      fee: 1500000,
      teacherName: "استاد سهرابی",
      schedule: "روزهای زوج ساعت ۱۷:۰۰ الی ۱۸:۳۰",
    },
  })
  console.log(`🏫 Class seeded: ${sampleClass.title}`)

  console.log("✨ Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
