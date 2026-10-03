import type { StorybookConfig } from "@storybook/nextjs-vite"

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: [
    {
      from: "../../admin-panel/src/fonts",
      to: "/fonts",
    },
  ],
  docs: {
    autodocs: "tag",
  },
  core: {
    disableTelemetry: true,
  },
}

export default config
