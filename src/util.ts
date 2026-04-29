import { z } from "astro/zod";

export const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, {
	message:
		"Invalid color format. Must be a 7-character hex code (e.g., #RRGGBB).",
});

export const lightenHexColor = (hex: string, amount = 0.5): string => {
	const parsedHex = hexColorSchema.safeParse(hex);

	if (!parsedHex.success) {
		throw new Error(parsedHex.error.issues[0]?.message ?? "Invalid hex color.");
	}

	const clampedAmount = Math.max(0, Math.min(1, amount));
	const value = hex.slice(1);
	const color = Number.parseInt(value, 16);
	const red = (color >> 16) & 255;
	const green = (color >> 8) & 255;
	const blue = color & 255;

	const lighten = (channel: number) =>
		Math.round(channel + (255 - channel) * clampedAmount);

	const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

	return `#${toHex(lighten(red))}${toHex(lighten(green))}${toHex(lighten(blue))}`;
};

const FRACTIONS: [number, string][] = [
	[1 / 8, "⅛"],
	[1 / 4, "¼"],
	[1 / 3, "⅓"],
	[1 / 2, "½"],
	[2 / 3, "⅔"],
	[3 / 4, "¾"],
];

const FRACTION_UNITS = new Set(["taza", "cda", "cdita", "cup", "tbsp", "tsp"]);

export const formatQuantity = (value: number, unit?: string): string => {
	const useFraction = unit !== undefined && FRACTION_UNITS.has(unit.toLowerCase());

	if (!useFraction) return String(value);

	const whole = Math.floor(value);
	const decimal = value - whole;

	if (decimal < 0.01) return whole === 0 ? "0" : String(whole);

	const match = FRACTIONS.reduce(
		(best, [frac, symbol]) =>
			Math.abs(frac - decimal) < Math.abs(best[0] - decimal) ? [frac, symbol] : best,
		FRACTIONS[0] as [number, string],
	);

	const [frac, symbol] = match;
	if (Math.abs(frac - decimal) > 0.04) return String(value);

	return whole === 0 ? symbol : `${whole}${symbol}`;
};

export const darkenHexColor = (hex: string, amount = 0.5): string => {
	const parsedHex = hexColorSchema.safeParse(hex);

	if (!parsedHex.success) {
		throw new Error(parsedHex.error.issues[0]?.message ?? "Invalid hex color.");
	}

	const clampedAmount = Math.max(0, Math.min(1, amount));
	const value = hex.slice(1);
	const color = Number.parseInt(value, 16);
	const red = (color >> 16) & 255;
	const green = (color >> 8) & 255;
	const blue = color & 255;

	const darken = (channel: number) => Math.round(channel * (1 - clampedAmount));

	const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

	return `#${toHex(darken(red))}${toHex(darken(green))}${toHex(darken(blue))}`;
};
