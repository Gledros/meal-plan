# Plan alimenticio — SSR y Estático

Este repositorio puede producir dos salidas de build: un servidor Node (SSR) y un sitio prerenderizado (estático).

- **SSR (Node):** el servidor lee las recetas desde disco en cada request (usa `RECIPES_DIR` o el fallback `src/data/recipes`). Ideal si quieres añadir/editar recetas en caliente montando la carpeta en el contenedor.
- **Estático:** el sitio se genera en tiempo de build y las recetas deben estar disponibles durante el build para incluirse en la salida estática. Si usas `astro:assets` para optimizar imágenes, la build estática puede requerir la dependencia `sharp`.

Las configuraciones principales son [astro.config.mjs](astro.config.mjs) (SSR) y [astro.config.static.mjs](astro.config.static.mjs) (estático). Los scripts se encuentran en [package.json](package.json).

## Disclaimer

```text
Este proyecto fue desarrollado en gran medida con asistencia de IA.
Se recomienda revisar y validar manualmente el código antes de usarlo en producción.
```

## Como funciona la lectura de recetas

- Si existe la variable de entorno `RECIPES_DIR`, se usa esa ruta.
- Si `RECIPES_DIR` no existe o no es valida, se usa fallback: `src/data/recipes`.
- Las recetas se validan con schema (Zod) antes de mostrarse.

Esto permite agregar archivos JSON nuevos sin volver a hacer build, siempre que el contenedor vea esos archivos en el filesystem montado.

## Estructura esperada en disco

La carpeta base debe tener estas subcarpetas:

```text
<RECIPES_DIR>/
  smoothies/
  breakfasts/
  meals/
  dinners/
```

Patrones de nombre por tipo:

- Smoothies: `s[NUMERO].json`
- Desayunos: `b[NUMERO].json`
- Comidas: `m[NUMERO].json`
- Cenas: `d[NUMERO].json`

Ejemplos:

- `smoothies/s32.json`
- `breakfasts/b8.json`
- `meals/m8.json`
- `dinners/d8.json`

El numero del nombre define el orden en la UI.

## Formato JSON para smoothie

```json
{
  "nombre": "Nombre del smoothie",
  "sabores": "fruta + vegetal + extra",
  "informacion_nutricional": {
    "kcal": 420,
    "carbohidratos_g": 50,
    "grasas_g": 15,
    "proteina_g": 20
  },
  "ingredientes": [
    "1 taza espinaca",
    "1/2 taza pina",
    "1 taza agua"
  ],
  "color": "#8BCF7A"
}
```

Campos obligatorios:

- `nombre`: string
- `sabores`: string
- `informacion_nutricional`: objeto con numeros
- `ingredientes`: arreglo de strings
- `color`: string en formato `#RRGGBB`

## Formato JSON para desayuno, comida y cena

```json
{
  "nombre": "Nombre del platillo",
  "informacion_nutricional": {
    "kcal": 320,
    "carbohidratos_g": 40,
    "grasas_g": 10,
    "proteina_g": 18
  },
  "ingredientes": [
    "2 tortillas",
    "1/2 taza frijoles"
  ],
  "pasos": [
    "Calentar tortillas.",
    "Servir y agregar frijoles."
  ]
}
```

Campos obligatorios:

- `nombre`: string
- `informacion_nutricional`: objeto con numeros
- `ingredientes`: arreglo de strings
- `pasos`: arreglo de strings

## Desarrollo local

```bash
pnpm install
pnpm dev
```

En local, si no defines `RECIPES_DIR`, se usa `src/data/recipes`.

## Scripts y builds

- `pnpm build` — Build por defecto. Con la configuración actual genera la salida SSR en `dist`.
- `pnpm run build:node` — Build explícito para Node (SSR) usando `astro.config.mjs`.
- `pnpm run build:static` — Build estático usando `astro.config.static.mjs`. Salida en `dist-static`.
- `pnpm run build:all` — Ejecuta ambos builds en secuencia (Node, luego Estático).

Ejemplos rápidos:

```bash
# Build SSR (Node)
pnpm run build:node

# Build Estático
pnpm run build:static

# Ambos
pnpm run build:all

# Ejecutar servidor SSR (después de build:node)
pnpm start

# Previsualizar build estático
pnpm run preview:static
```

Salidas:

- SSR Node: `dist/` (arranque con `pnpm start`)
- Estático: `dist-static/` (sirve con `pnpm run preview:static` o subir a cualquier hosting estático)

## Docker Compose + GHCR publico (Umbrel)

Este repo incluye `docker-compose.yml` para correr desde una imagen publica en GHCR y montar recetas desde disco.

1. Copia `.env.example` a `.env` y ajusta valores:

```bash
cp .env.example .env
```

Variables principales:

- `MEAL_PLAN_IMAGE`: imagen publica en GHCR (ejemplo: `ghcr.io/tu-usuario/meal-plan:latest`)
- `MEAL_PLAN_PORT`: puerto local (por defecto 4321)
- `RECIPES_HOST_PATH`: carpeta de recetas en el host Umbrel

1. Levanta el servicio:

```bash
docker compose pull
docker compose up -d
```

1. Verifica logs:

```bash
docker compose logs -f meal-plan
```

Estructura esperada en `RECIPES_HOST_PATH`:

```text
/ruta/en/umbrel/meal-plan-recipes/
  smoothies/
    s1.json
    s2.json
  breakfasts/
    b1.json
  meals/
    m1.json
  dinners/
    d1.json
```

Al agregar nuevos JSON en esa ruta montada, se reflejan al refrescar la UI (sin rebuild de la imagen).

## Publicar imagen a GHCR publico

1. Crea un token de GitHub con permiso `write:packages`.
1. Haz login local en GHCR:

```bash
echo <GHCR_TOKEN> | docker login ghcr.io -u <GITHUB_USER> --password-stdin
```

1. Construye y publica la imagen:

```bash
docker build -t ghcr.io/<GITHUB_USER>/meal-plan:latest -t ghcr.io/<GITHUB_USER>/meal-plan:ssr .
docker push ghcr.io/<GITHUB_USER>/meal-plan:latest
docker push ghcr.io/<GITHUB_USER>/meal-plan:ssr
```

1. En GitHub Packages, abre el paquete `meal-plan` y cambia visibility a `Public`.
1. Valida que cualquier usuario pueda descargar:

```bash
docker logout ghcr.io
docker pull ghcr.io/<GITHUB_USER>/meal-plan:latest
```

## Errores comunes

- No aparece una receta:
  - Revisa nombre de archivo (`s`, `b`, `m`, `d` + numero + `.json`).
- Error de color en smoothie:
  - Debe ser `#RRGGBB`.
- Error de schema:
  - Verifica campos obligatorios y tipos numericos en nutricion.
