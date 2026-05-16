import { z } from "astro/zod";
import {
	BaseIngredientSchema,
	ReferenceIdentitySchema,
	TimeSchema,
} from "./common";

export const GuideRecipeStyleSchema = ReferenceIdentitySchema.extend({
	nombre: z.string().min(1),
	rinde: z.string().min(1),
	tiempo_preparacion: TimeSchema,
	tiempo_cocinado: TimeSchema,
	ingredientes: z.array(BaseIngredientSchema),
	pasos: z.array(z.string()),
	notas: z.array(z.string()),
});

export const GuideSchema = GuideRecipeStyleSchema;

export const GuidesCollectionSchema = z.array(GuideSchema);

export type GuideIngredient = z.infer<typeof BaseIngredientSchema>;
export type GuideRecipeStyle = z.infer<typeof GuideRecipeStyleSchema>;
export type Guide = z.infer<typeof GuideSchema>;
