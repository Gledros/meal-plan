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
	unidad: z.enum(["minutes", "hours", "days"]),
	notas: z.string(),
});

export const IngredientSchema = z.object({
	clave: z.string().min(1),
	nombre: z.string().min(1),
	cantidad: z.number(),
	unidad: z.string().min(1),
	unidad_display: z.string().min(1),
	equivalente_g: z.number(),
	estado: z.string(),
	enlace: z.string().optional(),
});

export const ValidationSchema = z.object({
	score: z.number().int().min(0).max(100),
	warnings: z.array(z.string()),
	correcciones: z.array(z.string()),
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
	ingredientes: z.array(IngredientSchema),
	pasos: z.array(z.string()),
	notas: z.array(z.string()),
	validacion: ValidationSchema,
});

export const BreakfastSchema = MealDinnerSchema;

export type SmoothieRecipe = z.infer<typeof SmoothieSchema>;
export type MealDinnerRecipe = z.infer<typeof MealDinnerSchema>;
export type BreakfastRecipe = z.infer<typeof BreakfastSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Validation = z.infer<typeof ValidationSchema>;