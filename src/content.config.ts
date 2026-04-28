import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
	MealDinnerSchema,
	SmoothieSchema,
	type SmoothieRecipe,
} from "./data/recipe-schemas";

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
	schema: () => MealDinnerSchema,
});

const Dinners = defineCollection({
	loader: glob({
		base: "./src/data/recipes/dinners",
		pattern: "d[0-9]*.json",
	}),
	schema: () => MealDinnerSchema,
});

export const collections = { Smoothies, Meals, Dinners };
