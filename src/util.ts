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

const FRACTION_MATCH_TOLERANCE = 0.04;
const INTEGER_SNAP_TOLERANCE = 0.01;

const FRACTION_UNITS = new Set([
	"taza",
	"cda",
	"cdita",
	"cup",
	"tbsp",
	"tsp",
	"piece",
	"pieza",
	"piezas",
	"clove",
	"diente",
	"dientes",
]);

export const isFractionUnit = (unit?: string): boolean =>
	typeof unit === "string" && FRACTION_UNITS.has(unit.toLowerCase());

const getClosestFraction = (decimal: number): [number, string] =>
	FRACTIONS.reduce(
		(best, [fraction, symbol]) =>
			Math.abs(fraction - decimal) < Math.abs(best[0] - decimal)
				? [fraction, symbol]
				: best,
		FRACTIONS[0] as [number, string],
	);

const normalizeFractionValue = (value: number): number => {
	const roundedInteger = Math.round(value);
	if (Math.abs(value - roundedInteger) <= INTEGER_SNAP_TOLERANCE) {
		return roundedInteger;
	}

	const whole = Math.floor(value);
	const decimal = value - whole;
	const [closestFraction] = getClosestFraction(decimal);

	if (Math.abs(closestFraction - decimal) <= FRACTION_MATCH_TOLERANCE) {
		return whole + closestFraction;
	}

	return value;
};

export const normalizeQuantityForUnit = (value: number, unit?: string): number =>
	isFractionUnit(unit) ? normalizeFractionValue(value) : value;

const formatRounded = (value: number): string =>
	String(Math.round(value * 100) / 100)
		.replace(/\.0+$/, "")
		.replace(/(\.\d*?)0+$/, "$1");

export const formatQuantity = (value: number, unit?: string): string => {
	if (!isFractionUnit(unit)) return formatRounded(value);

	const normalizedValue = normalizeQuantityForUnit(value, unit);
	const whole = Math.floor(normalizedValue);
	const decimal = normalizedValue - whole;

	if (decimal < INTEGER_SNAP_TOLERANCE) return whole === 0 ? "0" : String(whole);

	const [frac, symbol] = getClosestFraction(decimal);
	if (Math.abs(frac - decimal) > FRACTION_MATCH_TOLERANCE) {
		return formatRounded(normalizedValue);
	}

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
