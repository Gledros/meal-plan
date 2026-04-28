import { z } from "astro/zod";
import { hexColorSchema } from "@util";

export const NutritionSchema = z.object({
	kcal: z.number(),
	carbohidratos_g: z.number(),
	grasas_g: z.number(),
	proteina_g: z.number(),
});

export const TimeSchema = z.object({
	tiempo: z.number(),
	unidad: z.enum(["M", "H", "D"]),
	notas: z.string(),
});

export const SmoothieSchema = z.object({
	id: z.number().int().positive(),
	nombre: z.string(),
	sabores: z.string(),
	informacion_nutricional: NutritionSchema,
	ingredientes: z.array(z.string()),
	color: hexColorSchema,
});

export const MealDinnerSchema = z.object({
	id: z.number().int().positive(),
	referencia: z.string().min(1),
	nombre: z.string(),
	tiempo_preparacion: TimeSchema,
	tiempo_cocinado: TimeSchema,
	informacion_nutricional: NutritionSchema,
	ingredientes: z.array(z.string()),
	pasos: z.array(z.string()),
	notas: z.array(z.string()),
});

export type SmoothieRecipe = z.infer<typeof SmoothieSchema>;
export type MealDinnerRecipe = z.infer<typeof MealDinnerSchema>;