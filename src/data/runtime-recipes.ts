import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ZodType } from "astro/zod";
import {
	MealDinnerSchema,
	SmoothieSchema,
	type MealDinnerRecipe,
	type SmoothieRecipe,
} from "./recipe-schemas";

export type { MealDinnerRecipe, SmoothieRecipe };

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
	schema: ZodType<T>;
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

			if (typeof parsed.data === "object" && parsed.data !== null) {
				const dataWithIdentity = parsed.data as {
					id?: unknown;
					referencia?: unknown;
				};

				if (typeof dataWithIdentity.id === "number" && dataWithIdentity.id !== id) {
					throw new Error(
						`[recipes] El id del contenido (${dataWithIdentity.id}) no coincide con el nombre del archivo ${fileName}.`,
					);
				}

				if (typeof dataWithIdentity.referencia === "string") {
					const expectedReference = `${config.prefix}${id}`;

					if (dataWithIdentity.referencia !== expectedReference) {
						throw new Error(
							`[recipes] La referencia del contenido (${dataWithIdentity.referencia}) no coincide con ${expectedReference} en ${fileName}.`,
						);
					}
				}
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