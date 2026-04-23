// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

export default defineConfig({
  integrations: [mdx(), sentry(), spotlightjs(), icon()],

  vite: {
    plugins: [tailwindcss()],
  },
});