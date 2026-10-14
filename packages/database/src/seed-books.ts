import dotenv from "dotenv"
import { prisma } from "./index.js"

dotenv.config({ path: "../../.env" })
dotenv.config()

export interface SeedBookItem {
  title: string
  author: string
  publisher: string
  description: string
  coverUrl?: string | null
}

export const SEED_BOOKS: SeedBookItem[] = [
  // --- American English File (3rd Edition) ---
  {
    title: "American English File Starter",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "American English File Third Edition Starter (CEFR A1)",
  },
  {
    title: "American English File 1",
    author: "Christina Latham-Koenig, Clive Oxenden, Paul Seligson",
    publisher: "Oxford University Press",
    description: "American English File Third Edition Level 1 (CEFR A1-A2)",
  },
  {
    title: "American English File 2",
    author: "Christina Latham-Koenig, Clive Oxenden, Paul Seligson",
    publisher: "Oxford University Press",
    description: "American English File Third Edition Level 2 (CEFR A2-B1)",
  },
  {
    title: "American English File 3",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "American English File Third Edition Level 3 (CEFR B1-B2)",
  },
  {
    title: "American English File 4",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "American English File Third Edition Level 4 (CEFR B2)",
  },
  {
    title: "American English File 5",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "American English File Third Edition Level 5 (CEFR C1)",
  },

  // --- English File (4th Edition) ---
  {
    title: "English File Beginner",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "English File Fourth Edition Beginner (CEFR A1)",
  },
  {
    title: "English File Elementary",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "English File Fourth Edition Elementary (CEFR A1-A2)",
  },
  {
    title: "English File Pre-Intermediate",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "English File Fourth Edition Pre-Intermediate (CEFR A2-B1)",
  },
  {
    title: "English File Intermediate",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "English File Fourth Edition Intermediate (CEFR B1-B2)",
  },
  {
    title: "English File Intermediate Plus",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "English File Fourth Edition Intermediate Plus (CEFR B2)",
  },
  {
    title: "English File Upper-Intermediate",
    author: "Christina Latham-Koenig, Clive Oxenden",
    publisher: "Oxford University Press",
    description: "English File Fourth Edition Upper-Intermediate (CEFR B2-C1)",
  },
  {
    title: "English File Advanced",
    author: "Christina Latham-Koenig, Clive Oxenden, Kate Chomacki",
    publisher: "Oxford University Press",
    description: "English File Fourth Edition Advanced (CEFR C1)",
  },

  // --- Touchstone & Viewpoint (2nd Edition) ---
  {
    title: "Touchstone 1",
    author: "Michael McCarthy, Jeanne McCarten, Helen Sandiford",
    publisher: "Cambridge University Press",
    description: "Touchstone Second Edition Level 1 (CEFR A1)",
  },
  {
    title: "Touchstone 2",
    author: "Michael McCarthy, Jeanne McCarten, Helen Sandiford",
    publisher: "Cambridge University Press",
    description: "Touchstone Second Edition Level 2 (CEFR A2)",
  },
  {
    title: "Touchstone 3",
    author: "Michael McCarthy, Jeanne McCarten, Helen Sandiford",
    publisher: "Cambridge University Press",
    description: "Touchstone Second Edition Level 3 (CEFR B1)",
  },
  {
    title: "Touchstone 4",
    author: "Michael McCarthy, Jeanne McCarten, Helen Sandiford",
    publisher: "Cambridge University Press",
    description: "Touchstone Second Edition Level 4 (CEFR B2)",
  },
  {
    title: "Viewpoint 1",
    author: "Michael McCarthy, Jeanne McCarten, Helen Sandiford",
    publisher: "Cambridge University Press",
    description:
      "Viewpoint Level 1 for High-Intermediate to Advanced (CEFR B2)",
  },
  {
    title: "Viewpoint 2",
    author: "Michael McCarthy, Jeanne McCarten, Helen Sandiford",
    publisher: "Cambridge University Press",
    description: "Viewpoint Level 2 for Advanced Learners (CEFR C1)",
  },

  // --- Top Notch & Summit (3rd Edition) ---
  {
    title: "Top Notch Fundamentals",
    author: "Joan Saslow, Allen Ascher",
    publisher: "Pearson",
    description: "Top Notch Third Edition Fundamentals (CEFR A1)",
  },
  {
    title: "Top Notch 1",
    author: "Joan Saslow, Allen Ascher",
    publisher: "Pearson",
    description: "Top Notch Third Edition Level 1 (CEFR A1-A2)",
  },
  {
    title: "Top Notch 2",
    author: "Joan Saslow, Allen Ascher",
    publisher: "Pearson",
    description: "Top Notch Third Edition Level 2 (CEFR A2-B1)",
  },
  {
    title: "Top Notch 3",
    author: "Joan Saslow, Allen Ascher",
    publisher: "Pearson",
    description: "Top Notch Third Edition Level 3 (CEFR B1-B2)",
  },
  {
    title: "Summit 1",
    author: "Joan Saslow, Allen Ascher",
    publisher: "Pearson",
    description: "Summit Third Edition Level 1 (CEFR B2-C1)",
  },
  {
    title: "Summit 2",
    author: "Joan Saslow, Allen Ascher",
    publisher: "Pearson",
    description: "Summit Third Edition Level 2 (CEFR C1-C2)",
  },

  // --- Interchange & Passages (5th Edition) ---
  {
    title: "Interchange Intro",
    author: "Jack C. Richards",
    publisher: "Cambridge University Press",
    description: "Interchange Fifth Edition Intro Level (CEFR A1)",
  },
  {
    title: "Interchange 1",
    author: "Jack C. Richards, Jonathan Hull, Susan Proctor",
    publisher: "Cambridge University Press",
    description: "Interchange Fifth Edition Level 1 (CEFR A2)",
  },
  {
    title: "Interchange 2",
    author: "Jack C. Richards, Jonathan Hull, Susan Proctor",
    publisher: "Cambridge University Press",
    description: "Interchange Fifth Edition Level 2 (CEFR B1)",
  },
  {
    title: "Interchange 3",
    author: "Jack C. Richards, Jonathan Hull, Susan Proctor",
    publisher: "Cambridge University Press",
    description: "Interchange Fifth Edition Level 3 (CEFR B2)",
  },
  {
    title: "Passages 1",
    author: "Jack C. Richards, Chuck Sandy",
    publisher: "Cambridge University Press",
    description: "Passages Third Edition Level 1 (CEFR B2-C1)",
  },
  {
    title: "Passages 2",
    author: "Jack C. Richards, Chuck Sandy",
    publisher: "Cambridge University Press",
    description: "Passages Third Edition Level 2 (CEFR C1)",
  },

  // --- Four Corners (2nd Edition) ---
  {
    title: "Four Corners 1",
    author: "Jack C. Richards, David Bohlke",
    publisher: "Cambridge University Press",
    description: "Four Corners Second Edition Level 1 (CEFR A1)",
  },
  {
    title: "Four Corners 2",
    author: "Jack C. Richards, David Bohlke",
    publisher: "Cambridge University Press",
    description: "Four Corners Second Edition Level 2 (CEFR A2)",
  },
  {
    title: "Four Corners 3",
    author: "Jack C. Richards, David Bohlke",
    publisher: "Cambridge University Press",
    description: "Four Corners Second Edition Level 3 (CEFR B1)",
  },
  {
    title: "Four Corners 4",
    author: "Jack C. Richards, David Bohlke",
    publisher: "Cambridge University Press",
    description: "Four Corners Second Edition Level 4 (CEFR B2)",
  },

  // --- Speakout (3rd Edition) ---
  {
    title: "Speakout Starter",
    author: "Frances Eales, Steve Oakes",
    publisher: "Pearson",
    description: "Speakout Third Edition Starter (CEFR A1)",
  },
  {
    title: "Speakout Elementary",
    author: "Frances Eales, Steve Oakes",
    publisher: "Pearson",
    description: "Speakout Third Edition Elementary (CEFR A1-A2)",
  },
  {
    title: "Speakout Pre-Intermediate",
    author: "Antonia Clare, JJ Wilson",
    publisher: "Pearson",
    description: "Speakout Third Edition Pre-Intermediate (CEFR A2-B1)",
  },
  {
    title: "Speakout Intermediate",
    author: "Frances Eales, Steve Oakes",
    publisher: "Pearson",
    description: "Speakout Third Edition Intermediate (CEFR B1-B2)",
  },
  {
    title: "Speakout Upper-Intermediate",
    author: "Antonia Clare, JJ Wilson",
    publisher: "Pearson",
    description: "Speakout Third Edition Upper-Intermediate (CEFR B2)",
  },
  {
    title: "Speakout Advanced",
    author: "Frances Eales, Steve Oakes",
    publisher: "Pearson",
    description: "Speakout Third Edition Advanced (CEFR C1)",
  },

  // --- Solutions (3rd Edition) ---
  {
    title: "Solutions Elementary",
    author: "Tim Falla, Paul A Davies",
    publisher: "Oxford University Press",
    description:
      "Solutions Third Edition Elementary for Secondary Students (CEFR A1-A2)",
  },
  {
    title: "Solutions Pre-Intermediate",
    author: "Tim Falla, Paul A Davies",
    publisher: "Oxford University Press",
    description: "Solutions Third Edition Pre-Intermediate (CEFR A2-B1)",
  },
  {
    title: "Solutions Intermediate",
    author: "Tim Falla, Paul A Davies",
    publisher: "Oxford University Press",
    description: "Solutions Third Edition Intermediate (CEFR B1-B2)",
  },
  {
    title: "Solutions Upper-Intermediate",
    author: "Tim Falla, Paul A Davies",
    publisher: "Oxford University Press",
    description: "Solutions Third Edition Upper-Intermediate (CEFR B2)",
  },
  {
    title: "Solutions Advanced",
    author: "Tim Falla, Paul A Davies",
    publisher: "Oxford University Press",
    description: "Solutions Third Edition Advanced (CEFR C1)",
  },

  // --- Project Explore ---
  {
    title: "Project Explore Starter",
    author: "Sarah Phillips, Paul Shipton",
    publisher: "Oxford University Press",
    description: "Project Explore Starter for Young Teenagers (CEFR A1)",
  },
  {
    title: "Project Explore 1",
    author: "Sarah Phillips, Paul Shipton",
    publisher: "Oxford University Press",
    description: "Project Explore Level 1 (CEFR A1-A2)",
  },
  {
    title: "Project Explore 2",
    author: "Sarah Phillips, Paul Shipton",
    publisher: "Oxford University Press",
    description: "Project Explore Level 2 (CEFR A2-B1)",
  },
  {
    title: "Project Explore 3",
    author: "Sarah Phillips, Paul Shipton",
    publisher: "Oxford University Press",
    description: "Project Explore Level 3 (CEFR B1)",
  },
  {
    title: "Project Explore 4",
    author: "Sarah Phillips, Paul Shipton",
    publisher: "Oxford University Press",
    description: "Project Explore Level 4 (CEFR B1-B2)",
  },

  // --- Family and Friends (2nd Edition) ---
  {
    title: "Family and Friends Starter",
    author: "Naomi Simmons",
    publisher: "Oxford University Press",
    description: "Family and Friends Second Edition Starter for Young Learners",
  },
  {
    title: "Family and Friends 1",
    author: "Naomi Simmons",
    publisher: "Oxford University Press",
    description: "Family and Friends Second Edition Level 1",
  },
  {
    title: "Family and Friends 2",
    author: "Naomi Simmons",
    publisher: "Oxford University Press",
    description: "Family and Friends Second Edition Level 2",
  },
  {
    title: "Family and Friends 3",
    author: "Naomi Simmons",
    publisher: "Oxford University Press",
    description: "Family and Friends Second Edition Level 3",
  },
  {
    title: "Family and Friends 4",
    author: "Naomi Simmons",
    publisher: "Oxford University Press",
    description: "Family and Friends Second Edition Level 4",
  },
  {
    title: "Family and Friends 5",
    author: "Tamzin Thompson",
    publisher: "Oxford University Press",
    description: "Family and Friends Second Edition Level 5",
  },
  {
    title: "Family and Friends 6",
    author: "Tamzin Thompson",
    publisher: "Oxford University Press",
    description: "Family and Friends Second Edition Level 6",
  },

  // --- First Friends (2nd Edition) ---
  {
    title: "First Friends 1",
    author: "Susan Iannuzzi",
    publisher: "Oxford University Press",
    description:
      "First Friends Second Edition Level 1 for Kindergarten & Preschool",
  },
  {
    title: "First Friends 2",
    author: "Susan Iannuzzi",
    publisher: "Oxford University Press",
    description:
      "First Friends Second Edition Level 2 for Kindergarten & Preschool",
  },

  // --- Let's Go (5th Edition) ---
  {
    title: "Let's Go Begin 1",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Begin 1 for Young Children",
  },
  {
    title: "Let's Go Begin 2",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Begin 2 for Young Children",
  },
  {
    title: "Let's Go 1",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Level 1",
  },
  {
    title: "Let's Go 2",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Level 2",
  },
  {
    title: "Let's Go 3",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Level 3",
  },
  {
    title: "Let's Go 4",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Level 4",
  },
  {
    title: "Let's Go 5",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Level 5",
  },
  {
    title: "Let's Go 6",
    author: "Ritsuko Nakata, Karen Frazier, Barbara Hoskins",
    publisher: "Oxford University Press",
    description: "Let's Go Fifth Edition Level 6",
  },

  // --- Super Minds (2nd Edition) ---
  {
    title: "Super Minds Starter",
    author: "Herbert Puchta, Günter Gerngross, Peter Lewis-Jones",
    publisher: "Cambridge University Press",
    description: "Super Minds Second Edition Starter for Primary Students",
  },
  {
    title: "Super Minds 1",
    author: "Herbert Puchta, Günter Gerngross, Peter Lewis-Jones",
    publisher: "Cambridge University Press",
    description: "Super Minds Second Edition Level 1",
  },
  {
    title: "Super Minds 2",
    author: "Herbert Puchta, Günter Gerngross, Peter Lewis-Jones",
    publisher: "Cambridge University Press",
    description: "Super Minds Second Edition Level 2",
  },
  {
    title: "Super Minds 3",
    author: "Herbert Puchta, Günter Gerngross, Peter Lewis-Jones",
    publisher: "Cambridge University Press",
    description: "Super Minds Second Edition Level 3",
  },
  {
    title: "Super Minds 4",
    author: "Herbert Puchta, Günter Gerngross, Peter Lewis-Jones",
    publisher: "Cambridge University Press",
    description: "Super Minds Second Edition Level 4",
  },
  {
    title: "Super Minds 5",
    author: "Herbert Puchta, Günter Gerngross, Peter Lewis-Jones",
    publisher: "Cambridge University Press",
    description: "Super Minds Second Edition Level 5",
  },
  {
    title: "Super Minds 6",
    author: "Herbert Puchta, Günter Gerngross, Peter Lewis-Jones",
    publisher: "Cambridge University Press",
    description: "Super Minds Second Edition Level 6",
  },

  // --- Oxford Phonics World ---
  {
    title: "Oxford Phonics World 1: The Alphabet",
    author: "Kaj Schwermer, Julia Chang, Craig Wright",
    publisher: "Oxford University Press",
    description: "Oxford Phonics World Level 1: The Alphabet",
  },
  {
    title: "Oxford Phonics World 2: Short Vowels",
    author: "Kaj Schwermer, Julia Chang, Craig Wright",
    publisher: "Oxford University Press",
    description: "Oxford Phonics World Level 2: Short Vowels",
  },
  {
    title: "Oxford Phonics World 3: Long Vowels",
    author: "Kaj Schwermer, Julia Chang, Craig Wright",
    publisher: "Oxford University Press",
    description: "Oxford Phonics World Level 3: Long Vowels",
  },
  {
    title: "Oxford Phonics World 4: Consonant Blends",
    author: "Kaj Schwermer, Julia Chang, Craig Wright",
    publisher: "Oxford University Press",
    description: "Oxford Phonics World Level 4: Consonant Blends",
  },
  {
    title: "Oxford Phonics World 5: Letter Combinations",
    author: "Kaj Schwermer, Julia Chang, Craig Wright",
    publisher: "Oxford University Press",
    description: "Oxford Phonics World Level 5: Letter Combinations",
  },

  // --- IELTS & Exam Preparation ---
  {
    title: "The Official Cambridge Guide to IELTS",
    author: "Pauline Cullen, Amanda French, Vanessa Jakeman",
    publisher: "Cambridge University Press",
    description:
      "Comprehensive preparation guide for Academic & General Training IELTS",
  },
  {
    title: "Mindset for IELTS Foundation",
    author: "Greg Archer, Lucy Passmore",
    publisher: "Cambridge University Press",
    description: "Mindset for IELTS Foundation Level (Target Band 4.5-5.0)",
  },
  {
    title: "Mindset for IELTS 1",
    author: "Greg Archer",
    publisher: "Cambridge University Press",
    description: "Mindset for IELTS Level 1 (Target Band 5.5)",
  },
  {
    title: "Mindset for IELTS 2",
    author: "Peter Crosthwaite, Natasha De Souza",
    publisher: "Cambridge University Press",
    description: "Mindset for IELTS Level 2 (Target Band 6.5)",
  },
  {
    title: "Mindset for IELTS 3",
    author: "Nicholas Tims",
    publisher: "Cambridge University Press",
    description: "Mindset for IELTS Level 3 (Target Band 7.5+)",
  },
  {
    title: "Complete IELTS Bands 4-5",
    author: "Guy Brook-Hart, Vanessa Jakeman",
    publisher: "Cambridge University Press",
    description: "Complete IELTS Bands 4-5 Coursebook (B1)",
  },
  {
    title: "Complete IELTS Bands 5-6.5",
    author: "Guy Brook-Hart, Vanessa Jakeman",
    publisher: "Cambridge University Press",
    description: "Complete IELTS Bands 5-6.5 Coursebook (B2)",
  },
  {
    title: "Complete IELTS Bands 6.5-7.5",
    author: "Guy Brook-Hart, Vanessa Jakeman",
    publisher: "Cambridge University Press",
    description: "Complete IELTS Bands 6.5-7.5 Coursebook (C1)",
  },

  // --- Grammar & Vocabulary Skills ---
  {
    title: "Essential Grammar in Use",
    author: "Raymond Murphy",
    publisher: "Cambridge University Press",
    description: "Elementary Grammar Reference and Practice (CEFR A1-B1)",
  },
  {
    title: "English Grammar in Use",
    author: "Raymond Murphy",
    publisher: "Cambridge University Press",
    description: "Intermediate Grammar Reference and Practice (CEFR B1-B2)",
  },
  {
    title: "Advanced Grammar in Use",
    author: "Martin Hewings",
    publisher: "Cambridge University Press",
    description: "Advanced Grammar Reference and Practice (CEFR C1-C2)",
  },
  {
    title: "Oxford Word Skills Basic",
    author: "Ruth Gairns, Stuart Redman",
    publisher: "Oxford University Press",
    description:
      "Oxford Word Skills Second Edition Elementary & Pre-Intermediate",
  },
  {
    title: "Oxford Word Skills Intermediate",
    author: "Ruth Gairns, Stuart Redman",
    publisher: "Oxford University Press",
    description:
      "Oxford Word Skills Second Edition Intermediate & Upper-Intermediate",
  },
  {
    title: "Oxford Word Skills Advanced",
    author: "Ruth Gairns, Stuart Redman",
    publisher: "Oxford University Press",
    description:
      "Oxford Word Skills Second Edition Advanced & Vocabulary Builder",
  },
  {
    title: "English Vocabulary in Use Elementary",
    author: "Michael McCarthy, Felicity O'Dell",
    publisher: "Cambridge University Press",
    description: "English Vocabulary in Use Third Edition Elementary",
  },
  {
    title: "English Vocabulary in Use Pre-intermediate & Intermediate",
    author: "Stuart Redman",
    publisher: "Cambridge University Press",
    description:
      "English Vocabulary in Use Fourth Edition Pre-intermediate & Intermediate",
  },
  {
    title: "English Vocabulary in Use Upper-intermediate",
    author: "Michael McCarthy, Felicity O'Dell",
    publisher: "Cambridge University Press",
    description: "English Vocabulary in Use Fourth Edition Upper-intermediate",
  },
  {
    title: "English Vocabulary in Use Advanced",
    author: "Michael McCarthy, Felicity O'Dell",
    publisher: "Cambridge University Press",
    description: "English Vocabulary in Use Third Edition Advanced",
  },
]

export async function seedBooks(): Promise<{
  createdCount: number
  updatedCount: number
  total: number
}> {
  console.log(
    `[Books Seed] Seeding ${SEED_BOOKS.length} master catalog books (Global / All Institutes)...`
  )
  let createdCount = 0
  let updatedCount = 0

  for (const book of SEED_BOOKS) {
    const existing = await prisma.book.findFirst({
      where: {
        title: book.title,
        instituteId: null,
      },
    })

    if (existing) {
      await prisma.book.update({
        where: { id: existing.id },
        data: {
          author: book.author,
          publisher: book.publisher,
          description: book.description,
          isActive: true,
        },
      })
      updatedCount++
    } else {
      await prisma.book.create({
        data: {
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          description: book.description,
          coverUrl: book.coverUrl ?? null,
          instituteId: null,
          isActive: true,
        },
      })
      createdCount++
    }
  }

  // Also convert any legacy books with matching titles that had an instituteId to global
  const legacyBooks = await prisma.book.findMany({
    where: {
      instituteId: { not: null },
      title: { in: SEED_BOOKS.map((b) => b.title) },
    },
  })
  if (legacyBooks.length > 0) {
    for (const legacy of legacyBooks) {
      const globalCounterpart = await prisma.book.findFirst({
        where: { title: legacy.title, instituteId: null },
      })
      if (globalCounterpart && globalCounterpart.id !== legacy.id) {
        // Re-point any courses pointing to legacy book to global counterpart
        await prisma.course.updateMany({
          where: { bookId: legacy.id },
          data: { bookId: globalCounterpart.id },
        })
        await prisma.book.delete({ where: { id: legacy.id } })
      } else {
        await prisma.book.update({
          where: { id: legacy.id },
          data: { instituteId: null },
        })
      }
    }
    console.log(
      `[Books Seed] Migrated ${legacyBooks.length} legacy institute books to global master catalog.`
    )
  }

  console.log(
    `[Books Seed] Completed successfully: ${createdCount} created, ${updatedCount} updated, total ${SEED_BOOKS.length} books.`
  )
  return { createdCount, updatedCount, total: SEED_BOOKS.length }
}

// Auto-run if executed directly
if (process.argv[1]?.includes("seed-books")) {
  seedBooks()
    .catch((err) => {
      console.error("[Books Seed] Error:", err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
