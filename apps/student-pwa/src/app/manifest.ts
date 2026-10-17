import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سامانه زبان‌آموز کلمه | Kalameh Student",
    short_name: "Kalameh Student",
    description: "سامانه یادگیری و پرتال زبان‌آموزان آموزشگاه زبان کلمه",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "any",
    lang: "fa",
    dir: "rtl",
    categories: ["education", "productivity", "study"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "کلاس‌های من",
        short_name: "کلاس‌ها",
        description: "مشاهده و پیگیری کلاس‌های فعال و برنامه درسی",
        url: "/classes",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "تمرین و فلش‌کارت",
        short_name: "فلش‌کارت",
        description: "تمرین لغات و جعبه لایتنر هوشمند",
        url: "/flashcards",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "ثبت‌نام و شهریه",
        short_name: "ثبت‌نام",
        description: "پیگیری وضعیت ثبت‌نام و پرداخت شهریه",
        url: "/enrollments",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  }
}
