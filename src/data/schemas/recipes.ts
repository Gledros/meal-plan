import { z } from "astro/zod";
import { hexColorSchema } from "@util";
import { BaseIngredientSchema, ReferenceIdentitySchema, TimeSchema } from "./common";

export const NutritionSchema = z.object({
	kcal: z.number(),
	carbohidratos_g: z.number(),
	grasas_g: z.number(),
	proteina_g: z.number(),
});

export const IngredientSchema = BaseIngredientSchema.extend({
	equivalente_g: z.number(),
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
	ingredientes: z.array(IngredientSchema),
	color: hexColorSchema,
});

export const RecipeSchema = ReferenceIdentitySchema.extend({
	nombre: z.string(),
	descripcion: z.string().optional(),
	rinde: z.string().optional(),
	tiempo_preparacion: TimeSchema,
	tiempo_cocinado: TimeSchema,
	informacion_nutricional: NutritionSchema,
	ingredientes: z.array(IngredientSchema),
	pasos: z.array(z.string()),
	notas: z.array(z.string()),
	validacion: ValidationSchema,
});

export type SmoothieRecipe = z.infer<typeof SmoothieSchema>;
export type MealDinnerRecipe = z.infer<typeof RecipeSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Validation = z.infer<typeof ValidationSchema>;