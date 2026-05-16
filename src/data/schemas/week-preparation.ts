import { z } from "astro/zod";

/**
 * Esquema Zod simplificado para los "prep days" (datos de los escaneos).
 * Campos en español y pensados para parseo/validación en Astro.
 */

/* Ingrediente referencial (opcional dentro de una tarea) */
const Ingrediente = z.object({
	clave: z.string().optional(),           // id corto opcional
	nombre: z.string(),                     // nombre legible en español
	cantidad: z.number().optional(),        // cantidad numérica (puede ser decimal)
	unidad: z
		.enum(["g", "kg", "ml", "l", "tbsp", "tsp", "cup", "piece", "clove"])
		.optional(),
	nota: z.string().optional(),
});

/* Item básico (lista "BASICS") */
const Basico = z.object({
	clave: z.string().optional(),
	nombre: z.string(),
	referencia: z.string().optional(), // ej. "recipe://... "
	listo: z.boolean().optional().default(false), // checkbox si ya está hecho
	nota: z.string().optional(),
});

/* Tipo de acción en timetable / tarea */
const TipoAccion = z.enum(["make", "prep", "cook", "soak", "prep_and_bake", "other"]);

/* Acción dentro de un evento del horario */
const Accion = z.object({
	tipo: TipoAccion,
	tarea_id: z.string().optional(),   // referencia a tareas[].id si aplica
	descripcion: z.string().optional(),// texto libre si no se referencia tarea
});

/* Evento (entrada del timetable) */
const Evento = z.object({
	hora: z.string(),                   // "10:00", "10AM", "10.30AM" — normalizar en frontend
	titulo: z.string().optional(),      // etiqueta corta (ej. "PREP and BAKE")
	acciones: z.array(Accion).min(1),
	notas: z.string().optional(),
});

/* Tarea (MAKE / PREP / COOK / etc.) */
const Tarea = z.object({
	id: z.string().optional(),                      // recomendable único (p.ej. "make_d22")
	tipo: TipoAccion.optional(),
	nombre: z.string(),                             // nombre descriptivo (español)
	descripcion: z.string().optional(),             // instrucciones cortas / nota
	referencia: z.string().optional(),              // URI a sub-receta si aplica
	dia_relacionado: z.array(z.number().int().positive()).min(1), // p.ej. [22, 23]
	duracion_minutos: z.number().int().nonnegative().optional(),
	ingredientes_necesarios: z.array(Ingrediente).optional(),
	hecho: z.boolean().optional().default(false),   // checkbox local
});

/* Esquema principal de la semana (prep day scan) */
export const WeekPrepSchema = z
	.object({
		semana: z.number().int().min(1),
		titulo: z.string().optional(),
		descripcion: z.string().optional(),
		basicos: z.array(Basico).optional(),
		tareas: z.array(Tarea).optional(),
		horario: z.array(Evento).optional(),
		notas_generales: z.string().optional(),
	})
	.strict();

/* Typescript types útiles */
export type WeekPrep = z.infer<typeof WeekPrepSchema>;
export type BasicoT = z.infer<typeof Basico>;
export type TareaT = z.infer<typeof Tarea>;
export type EventoT = z.infer<typeof Evento>;