# Reglas de cantidades y unidades

Este documento describe las reglas actuales que debes aplicar al editar ingredientes en recetas y listas de compra. Pega tal cual en un archivo llamado por ejemplo `REGLAS_CANTIDADES.md`.

---

## Reglas generales
- Unidades válidas: `g`, `kg`, `ml`, `l`, `tbsp`, `tsp`, `piece`, `clove`, `cup`.
- Conversiones permitidas **solo**:
  - `oz` → `g`
  - `fl oz` → `ml`
- Ninguna otra conversión automática está permitida (no convertir `tbsp`/`tsp`/`cup` a `g`/`ml`).
- Si aplicas una conversión, usa factores estándar y redondea al entero más cercano (ver sección de redondeo).
- No modifiques campos que no sean cantidades/unidades (por ejemplo: `nombre`, `clave`, `estado`, `enlace`, `pasos`, etc.).

---

## Formato — Lista de compras (weekly shopping lists)
- Estructura esperada por ítem:
  - `{ cantidad: int, unidad: "g"|"kg"|"ml"|"l"|"tbsp"|"tsp"|"piece"|"clove"|"cup", nombre: string }`
- `cantidad` debe ser un entero (int).
- No convertir unidades en la lista de compras salvo aplicar `oz`→`g` o `fl oz`→`ml` si la fuente original está en esas unidades.
- Si la unidad es `piece` y la receta tiene fracciones (ej. `0.5`), en la lista de compras usa un entero práctico (por ejemplo `1`) porque la lista de compra usa int.

---

## Formato — Ingredientes en recetas (schema)
Campos por ingrediente:
- `clave` (string)
- `nombre` (string)
- `cantidad` (z.number()) — puede ser decimal excepto cuando la unidad sea `g` (ver abajo)
- `unidad` (enum) — una de las unidades válidas
- `unidad_display` (string) — texto legible (ej. `cdita`, `cda`, `pieza`, `g`)
- `equivalente_g` (z.number())
- `estado` (string)
- `enlace` (string, optional)

Reglas específicas:
- Si `unidad === "g"` → `equivalente_g` debe ser exactamente `-1`.
- Si `unidad !== "g"` → `equivalente_g` puede contener una estimación en gramos (recomendado pero opcional). No uses `-1` en este caso.
- Si hiciste conversión `oz`→`g`, la unidad final será `"g"` y por tanto `equivalente_g` debe quedar `-1`.
- `cantidad` puede ser decimal para unidades como `piece` (ej. `0.5`) en recetas; en listas de compra usar enteros.

---

## Redondeo y factores de conversión
- Redondeo: para gramos y mililitros:
  - Si la fracción es ≥ 0.5 → redondear hacia arriba.
  - Si la fracción es < 0.5 → redondear hacia abajo.
- Factores:
  - 1 oz = 28.35 g
  - 1 fl oz = 29.5735 ml
- Procedimiento:
  1. Multiplica (p. ej. `oz * 28.35` o `fl_oz * 29.5735`).
  2. Redondea al entero más cercano.
  3. Actualiza `cantidad` con el entero y `unidad` a `"g"` o `"ml"` según corresponda.
- Para `ml` y `l`: almacenar `ml` como entero. Si usas `l`, preferible convertir a `ml` y usar entero.

---

## Cuándo editar cantidades
- Edita y redondea SOLO si:
  - La unidad actual es `"g"` (asegúrate que la cantidad sea entera y `equivalente_g = -1`), o
  - Tienes una medida en `oz` o `fl oz` que vas a convertir (aplica conversión → actualizar unidad y cantidad).
- NO edites cantidades si:
  - La unidad es `tbsp`, `tsp`, `cup` o `piece` (a menos que la fuente original estuviera en `oz`/`fl oz` y vayas a convertir).
  - El archivo es una lista de compras y la cantidad ya es `int`: respeta el entero.

---

## Comprobaciones antes de guardar (checklist)
Para cada archivo JSON modificado:
1. Para cada ingrediente con `unidad === "g"`:
   - `cantidad` es entero.
   - `equivalente_g === -1`.
2. Para cada conversión realizada:
   - Registra la conversión original y el resultado (ej. `2 oz setas → 57 g`).
3. Para cada ingrediente con `unidad === "ml"`:
   - `cantidad` es entero.
4. Para las listas de compra:
   - Todas las `cantidad` son enteros.
   - No hay unidades convertidas salvo `oz`→`g` y `fl oz`→`ml`.
5. No cambies textos (nombre, clave, pasos, etc.).

---

## Ejemplos (aplicar exactamente)
- Original: `2 oz mushrooms`  
  Resultado:  
  ```json
  { "cantidad": 57, "unidad": "g", "unidad_display": "g", "equivalente_g": -1 }
  ```
- Original: `7 fl oz vegan broth`  
  Resultado:  
  ```json
  { "cantidad": 207, "unidad": "ml", "unidad_display": "ml" }
  ```
- Original (receta): `1/2 piece avocado`  
  Mantener:  
  ```json
  { "cantidad": 0.5, "unidad": "piece", "unidad_display": "pieza", "equivalente_g": 70 }
  ```
  (No redondear en recetas.)
- Shopping list: `avocado 0.5 piece` → cambiar a `1` (práctico para compra).

---

## Notas y buenas prácticas
- Documenta cada conversión en algún changelog o en el campo `validacion` del JSON si tu esquema lo usa.
- No convertir cucharadas/cucharaditas/cup a gramos automáticamente; si necesitas `equivalente_g` para esos, calcula y agrega el valor en `equivalente_g` sin cambiar la `unidad`.
- Para `piece` en listas de compra, usa valores enteros y procura que correspondan a lo que comprarás físicamente.
- Si dudas sobre cómo redondear para una medida práctica (ej. `0.5 piece` para compras), elige el entero que facilite la compra (normalmente `1`).
