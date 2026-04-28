import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "astro/zod";
import { hexColorSchema } from "@util";

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

export type SmoothieRecipe = z.infer<typeof SmoothieSchema>;
export type MealDinnerRecipe = z.infer<typeof MealDinnerSchema>;

export interface SmoothieListItem {
	id: number;
	smoothie: SmoothieRecipe;
}

export interface BreakfastListItem {
	id: number;
	breakfast: MealDinnerRecipe;
}

export interface MealListItem {
	id: number;
	meal: MealDinnerRecipe;
}

export interface DinnerListItem {
	id: number;
	dinner: MealDinnerRecipe;
}

export interface RuntimeRecipes {
	smoothies: SmoothieListItem[];
	breakfasts: BreakfastListItem[];
	meals: MealListItem[];
	dinners: DinnerListItem[];
}

type RecipePrefix = "s" | "b" | "m" | "d";

interface RecipeConfig<T> {
	folder: string;
	prefix: RecipePrefix;
	schema: z.ZodType<T>;
	optional?: boolean;
}

interface RecipeEntry<T> {
	id: number;
	data: T;
}

const FALLBACK_RECIPES_DIR = path.resolve(process.cwd(), "src/data/recipes");

const resolveRecipesDir = async (): Promise<string> => {
	const configured = process.env.RECIPES_DIR?.trim();

	if (!configured) {
		return FALLBACK_RECIPES_DIR;
	}

	const resolvedConfiguredPath = path.resolve(configured);

	try {
		await access(resolvedConfiguredPath);
		return resolvedConfiguredPath;
	} catch {
		console.warn(
			`[recipes] RECIPES_DIR no existe en ${resolvedConfiguredPath}. Se usara ${FALLBACK_RECIPES_DIR}.`,
		);
		return FALLBACK_RECIPES_DIR;
	}
};

const readRecipeGroup = async <T>(
	baseDir: string,
	config: RecipeConfig<T>,
): Promise<RecipeEntry<T>[]> => {
	const folderPath = path.join(baseDir, config.folder);
	const pattern = new RegExp(`^${config.prefix}(\\d+)\\.json$`);

	let folderEntries: string[];

	try {
		folderEntries = await readdir(folderPath);
	} catch (error) {
		const errorWithCode =
			typeof error === "object" && error !== null ? (error as NodeJS.ErrnoException) : null;

		if (config.optional && errorWithCode?.code === "ENOENT") {
			return [];
		}

		throw new Error(
			`[recipes] No se pudo leer la carpeta ${folderPath}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	const files = folderEntries
		.map((fileName) => {
			const match = fileName.match(pattern);

			if (!match) {
				return null;
			}

			return {
				fileName,
				id: Number.parseInt(match[1], 10),
			};
		})
		.filter((entry): entry is { fileName: string; id: number } => entry !== null)
		.sort((a, b) => a.id - b.id);

	return Promise.all(
		files.map(async ({ fileName, id }) => {
			const filePath = path.join(folderPath, fileName);
			const rawContent = await readFile(filePath, "utf-8");

			let parsedJson: unknown;

			try {
				parsedJson = JSON.parse(rawContent);
			} catch (error) {
				throw new Error(
					`[recipes] JSON invalido en ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}

			const parsed = config.schema.safeParse(parsedJson);

			if (!parsed.success) {
				const issues = parsed.error.issues
					.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
					.join("; ");

				throw new Error(`[recipes] Schema invalido en ${filePath}: ${issues}`);
			}

			return {
				id,
				data: parsed.data,
			};
		}),
	);
};

export const loadRecipesFromDisk = async (): Promise<RuntimeRecipes> => {
	const recipesDir = await resolveRecipesDir();

	const [smoothiesRaw, breakfastsRaw, mealsRaw, dinnersRaw] = await Promise.all([
		readRecipeGroup(recipesDir, {
			folder: "smoothies",
			prefix: "s",
			schema: SmoothieSchema,
		}),
		readRecipeGroup(recipesDir, {
			folder: "breakfasts",
			prefix: "b",
			schema: MealDinnerSchema,
			optional: true,
		}),
		readRecipeGroup(recipesDir, {
			folder: "meals",
			prefix: "m",
			schema: MealDinnerSchema,
		}),
		readRecipeGroup(recipesDir, {
			folder: "dinners",
			prefix: "d",
			schema: MealDinnerSchema,
		}),
	]);

	return {
		smoothies: smoothiesRaw.map(({ id, data }) => ({ id, smoothie: data })),
		breakfasts: breakfastsRaw.map(({ id, data }) => ({ id, breakfast: data })),
		meals: mealsRaw.map(({ id, data }) => ({ id, meal: data })),
		dinners: dinnersRaw.map(({ id, data }) => ({ id, dinner: data })),
	};
};