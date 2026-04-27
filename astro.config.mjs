// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

/** @param {any} tagName */
const isHeadingTag = (tagName) => /^h[1-6]$/.test(tagName ?? "");

/** @param {any} node */
const getNodeTextContent = (node) => {
	if (!node || typeof node !== "object") {
		return "";
	}

	if (node.type === "text" && typeof node.value === "string") {
		return node.value;
	}

	if (node.type === "element" && node.tagName === "img") {
		const alt = node.properties?.alt;
		return typeof alt === "string" ? alt : "";
	}

	if (!Array.isArray(node.children)) {
		return "";
	}

	return node.children.map(getNodeTextContent).join("");
};

const addHeadingAccessibleNames = () => {
	/** @param {any} tree */
	return (tree) => {
		const stack = [tree];

		while (stack.length > 0) {
			const node = stack.pop();

			if (!node || typeof node !== "object") {
				continue;
			}

			if (node.type === "element" && isHeadingTag(node.tagName)) {
				const headingText = getNodeTextContent(node).replace(/\s+/g, " ").trim();

				if (headingText.length > 0) {
					node.properties ??= {};
					const currentAriaLabel = node.properties["aria-label"];

					if (typeof currentAriaLabel !== "string" || currentAriaLabel.trim().length === 0) {
						node.properties["aria-label"] = headingText;
					}
				}
			}

			if (Array.isArray(node.children)) {
				for (let index = node.children.length - 1; index >= 0; index -= 1) {
					stack.push(node.children[index]);
				}
			}
		}
	};
};

export default defineConfig({
	output: "server",
	adapter: node({ mode: "standalone" }),
	integrations: [mdx(), sentry(), spotlightjs(), icon()],
	markdown: {
		rehypePlugins: [addHeadingAccessibleNames],
	},

	vite: {
		plugins: [tailwindcss()],
	},
});