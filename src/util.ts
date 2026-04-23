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
