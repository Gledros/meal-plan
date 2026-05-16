# Reglas de cantidades y unidades

Este documento describe las reglas actuales que debes aplicar al editar ingredientes en recetas y listas de compra.

Fuente de verdad para schema de recetas: `src/data/schemas/recipes.ts`.

---

## Alineación con schema (`recipes.ts`)

- `IngredientSchema` define estos campos por ingrediente:
  - `clave` (string)
  - `nombre` (string)
  - `cantidad` (number)
  - `unidad` (enum)
  - `equivalente_g` (number)
  - `estado` (string)
  - `enlace` (string, optional)
- `TimeSchema` define unidades de tiempo válidas: `minutes`, `hours`, `days`.
- `RecipeSchema` incluye además estos campos opcionales a nivel receta:
  - `descripcion` (string, optional)
  - `rinde` (string, optional)
- No existe `unidad_display` en el schema actual. No agregar este campo.

## Reglas generales

- Unidades válidas (enum de `IngredientSchema`):
  - `g`, `kg`, `ml`, `l`, `tbsp`, `tsp`, `piece`, `clove`, `bunch`, `cup`, `pinch`.
- Unidades como `oz` y `fl oz` no son válidas como unidad final en JSON.
- Conversiones permitidas **solo**:
  - `oz` → `g`
  - `fl oz` → `ml`
- Ninguna otra conversión automática está permitida.
- No convertir automáticamente `tbsp`/`tsp`/`cup`/`piece`/`clove`/`bunch`/`pinch` a `g`/`ml`.
- Si aplicas una conversión, usa factores estándar y redondea al entero más cercano (ver sección de redondeo).
- No modifiques campos que no sean cantidades/unidades (por ejemplo: `nombre`, `clave`, `estado`, `enlace`, `pasos`, `descripcion`, `rinde`, etc.).

---

## Formato — Lista de compras (weekly shopping lists)

- Estructura esperada por ítem:
  - `{ cantidad: int, unidad: "g"|"kg"|"ml"|"l"|"tbsp"|"tsp"|"piece"|"clove"|"bunch"|"cup"|"pinch", nombre: string }`
- `cantidad` debe ser un entero (int).
- No convertir unidades en la lista de compras salvo aplicar `oz`→`g` o `fl oz`→`ml` si la fuente original está en esas unidades.
- Si la unidad es `piece`/`clove`/`bunch` y la receta tiene fracciones (ej. `0.5`), en la lista de compras usa un entero práctico (por ejemplo `1`) porque la lista de compra usa int.

---

## Formato — Ingredientes en recetas (schema)

Campos por ingrediente (`IngredientSchema`):

- `clave` (string)
- `nombre` (string)
- `cantidad` (z.number())
- `unidad` (enum)
- `equivalente_g` (z.number())
- `estado` (string)
- `enlace` (string, optional)

Reglas específicas:

- Si `unidad === "g"` → `equivalente_g` debe ser exactamente `-1`.
- Si `unidad !== "g"` → `equivalente_g` sigue siendo obligatorio (schema), con un valor numérico. No uses `-1` en este caso.
- Si hiciste conversión `oz`→`g`, la unidad final será `"g"` y por tanto `equivalente_g` debe quedar `-1`.
- `cantidad` puede ser decimal para unidades como `piece` en recetas (ej. `0.5`).
- Para `g` y `ml`, usar entero por consistencia de reglas operativas.

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
- `l` es una unidad válida en schema; no convertir automáticamente `l`→`ml` salvo que venga de `fl oz`.

---

## Cuándo editar cantidades

- Edita y redondea SOLO si:
  - La unidad actual es `"g"` (asegúrate que la cantidad sea entera y `equivalente_g = -1`), o
  - La unidad actual es `"ml"` (asegúrate que la cantidad sea entera), o
  - Tienes una medida en `oz` o `fl oz` que vas a convertir (aplica conversión → actualizar unidad y cantidad).
- NO edites cantidades si:
  - La unidad es `tbsp`, `tsp`, `cup`, `piece`, `clove`, `bunch` o `pinch` (a menos que la fuente original estuviera en `oz`/`fl oz` y vayas a convertir).
  - El archivo es una lista de compras y la cantidad ya es `int`: respeta el entero.

---

## Comprobaciones antes de guardar (checklist)

Para cada archivo JSON modificado:

1. Para cada ingrediente:
   - `unidad` pertenece al enum válido de `IngredientSchema`.
2. Para cada ingrediente con `unidad === "g"`:
   - `cantidad` es entero.
   - `equivalente_g === -1`.
3. Para cada ingrediente con `unidad === "ml"`:
   - `cantidad` es entero.
4. Para cada ingrediente con `unidad !== "g"`:
   - `equivalente_g` existe y es numérico.
   - `equivalente_g !== -1`.
5. Para cada conversión realizada:
   - Registra la conversión original y el resultado (ej. `2 oz setas → 57 g`).
6. Para las listas de compra:
   - Todas las `cantidad` son enteros.
   - No hay unidades convertidas salvo `oz`→`g` y `fl oz`→`ml`.
7. No cambies textos (nombre, clave, pasos, etc.).
8. No agregues campos fuera de schema (por ejemplo `unidad_display`).

---

## Ejemplos (aplicar exactamente)

- Original: `2 oz mushrooms`  
  Resultado:  

  ```json
  { "cantidad": 57, "unidad": "g", "equivalente_g": -1 }
  ```

- Original: `7 fl oz vegan broth`  
  Resultado:  

  ```json
  { "cantidad": 207, "unidad": "ml", "equivalente_g": 0 }
  ```

- Original (receta): `1/2 piece avocado`  
  Mantener:  

  ```json
  { "cantidad": 0.5, "unidad": "piece", "equivalente_g": 70 }
  ```

  (No redondear en recetas.)

- Shopping list: `avocado 0.5 piece` → cambiar a `1` (práctico para compra).

---

## Notas y buenas prácticas

- Documenta cada conversión en algún changelog o en el campo `validacion` del JSON si tu esquema lo usa.
- No convertir cucharadas/cucharaditas/cup a gramos automáticamente; si necesitas `equivalente_g` para esos, calcula y agrega el valor en `equivalente_g` sin cambiar la `unidad`.
- Para `piece` en listas de compra, usa valores enteros y procura que correspondan a lo que comprarás físicamente.
- Si dudas sobre cómo redondear para una medida práctica (ej. `0.5 piece` para compras), elige el entero que facilite la compra (normalmente `1`).
