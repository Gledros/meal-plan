import { z } from "astro/zod";

export const TimeSchema = z.object({
	tiempo: z.number(),
	unidad: z.enum(["minutes", "hours", "days"]),
	notas: z.string(),
});

export const IngredientUnitSchema = z.enum([
	"g",
	"kg",
	"ml",
	"l",
	"tbsp",
	"tsp",
	"piece",
	"clove",
	"bunch",
	"cup",
	"pinch",
]);

export const BaseIngredientSchema = z.object({
	clave: z.string().min(1),
	nombre: z.string().min(1),
	cantidad: z.number(),
	unidad: IngredientUnitSchema,
	estado: z.string(),
});

export const ReferenceIdentitySchema = z.object({
	id: z.number().int().positive(),
	referencia: z.string().min(1),
});

export type IngredientUnit = z.infer<typeof IngredientUnitSchema>;
export type BaseIngredient = z.infer<typeof BaseIngredientSchema>;
export type ReferenceIdentity = z.infer<typeof ReferenceIdentitySchema>;
