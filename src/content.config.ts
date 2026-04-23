import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { hexColorSchema } from "./util";

const NutritionSchema = z.object({
	kcal: z.number(),
	carbohidratos_g: z.number(),
	grasas_g: z.number(),
	proteina_g: z.number(),
});

const SmoothieSchema = z.object({
	nombre: z.string(),
	sabores: z.string(),
	informacion_nutricional: NutritionSchema,
	ingredientes: z.array(z.string()),
	color: hexColorSchema,
});

const MealDinnerSchema = z.object({
	nombre: z.string(),
	informacion_nutricional: NutritionSchema,
	ingredientes: z.array(z.string()),
	pasos: z.array(z.string()),
});

export type ZodSmoothie = z.infer<typeof SmoothieSchema>;

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
