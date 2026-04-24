// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

export default defineConfig({
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [mdx(), sentry(), spotlightjs(), icon()],

	vite: {
		plugins: [tailwindcss()],
	},
});