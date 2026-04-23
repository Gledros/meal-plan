import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { hexColorSchema } from "./util";

const SmoothieSchema = z.object({
	nombre: z.string(),
	sabores: z.string(),
	informacion_nutricional: z.object({
		kcal: z.number(),
		carbohidratos_g: z.number(),
		grasas_g: z.number(),
		proteina_g: z.number(),
	}),
	ingredientes: z.array(z.string()),
	color: hexColorSchema,
});

export type ZodSmoothie = z.infer<typeof SmoothieSchema>;

const Smoothies = defineCollection({
	loader: glob({
		base: "./src/data/recipes/smoothies",
		pattern: "s[0-9]*.json",
	}),
	schema: () => SmoothieSchema,
});

export const collections = { Smoothies };
