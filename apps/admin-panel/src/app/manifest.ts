import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سامانه مدیریت کلمه | Kalameh Admin",
    short_name: "Kalameh Admin",
    description: "سامانه جامع مدیریت و برنامه‌ریزی هوشمند آموزشگاه زبان کلمه",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "any",
    lang: "fa",
    dir: "rtl",
    categories: ["education", "productivity", "management", "business"],
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
        name: "مدیریت کلاس‌ها",
        short_name: "کلاس‌ها",
        description: "مشاهده و مدیریت کلاس‌های فعال آموزشگاه",
        url: "/classes",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "تقویم آموزشی هوشمند",
        short_name: "تقویم",
        description: "برنامه‌ریزی هوشمند دوره‌ها و جلسات",
        url: "/scheduling",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "دوره‌ها و ترم‌ها",
        short_name: "ترم‌ها",
        description: "مدیریت چرخه‌ها و ترم‌های تحصیلی",
        url: "/terms",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  }
}
