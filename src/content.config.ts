import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
	RecipeSchema,
	SmoothieSchema,
	type SmoothieRecipe,
} from "./data/schemas/recipes";

export type ZodSmoothie = SmoothieRecipe;

const Smoothies = defineCollection({
	loader: glob({
		base: "./src/data/recipes/smoothies",
		pattern: "s[0-9]*.json",
	}),
	schema: () => SmoothieSchema,
});

const Meals = defineCollection({
	loader: glob({
		base: "./src/data/recipes/meals",
		pattern: "m[0-9]*.json",
	}),
	schema: () => RecipeSchema,
});

const Dinners = defineCollection({
	loader: glob({
		base: "./src/data/recipes/dinners",
		pattern: "d[0-9]*.json",
	}),
	schema: () => RecipeSchema,
});

export const collections = { Smoothies, Meals, Dinners };
