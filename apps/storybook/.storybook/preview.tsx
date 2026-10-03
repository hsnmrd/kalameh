import * as React from "react"
import type { Preview } from "@storybook/nextjs-vite"
import { ThemeProvider } from "@workspace/ui/components/theme-provider"
import { Toaster } from "@workspace/ui/components/sonner"
import "./preview.css"

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as "light" | "dark"
      const direction = context.globals.direction as "ltr" | "rtl"

      document.documentElement.classList.toggle("dark", theme === "dark")
      document.documentElement.dir = direction
      document.documentElement.lang = direction === "rtl" ? "fa" : "en"

      return (
        <ThemeProvider
          attribute="class"
          forcedTheme={theme}
          enableSystem={false}
          disableTransitionOnChange
        >
          <div
            dir={direction}
            data-storybook-preview
            className="min-h-screen bg-background p-6 font-sans text-foreground"
          >
            <Story />
          </div>
          <Toaster dir={direction} />
        </ThemeProvider>
      )
    },
  ],
  globalTypes: {
    theme: {
      description: "Component color theme",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      description: "Document reading direction",
      toolbar: {
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR / English" },
          { value: "rtl", title: "RTL / فارسی" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
    direction: "ltr",
  },
  parameters: {
    layout: "centered",
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
    options: {
      storySort: {
        order: ["Foundations", "Inputs", "Feedback", "Overlays", "Data"],
      },
    },
  },
  tags: ["autodocs", "test"],
}

export default preview
