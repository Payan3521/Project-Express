# Cómo está armado el proyecto (Frontend → Backend → DB)

Resumen rápido de carpetas, archivos y flujo para entender la comunicación entre las tres partes.

---

## Flujo de un envío del formulario

1. **Frontend (React)**  
   El usuario escribe nombre y edad y pulsa "Guardar".  
   → `fetch(POST /api/personas)` con `{ nombre, edad }`.

2. **Backend (Express)**  
   Recibe la petición en la ruta `POST /api/personas`, valida datos y usa el **pool de PostgreSQL** para hacer `INSERT` en la tabla `personas`.

3. **Base de datos (PostgreSQL)**  
   Guarda la fila con `id` (autoincremental), `nombre` y `edad`.  
   El backend devuelve al frontend el objeto creado (con `id`).

4. **Frontend**  
   Muestra mensaje de éxito y vuelve a pedir la lista (`GET /api/personas`) para actualizar la tabla en pantalla.

---

## Estructura del Backend (Express + TypeScript)

```
backend/
├── src/
│   ├── index.ts          # Punto de entrada: crea app Express, monta rutas, inicia servidor y DB
│   ├── db.ts             # Conexión a Postgres (Pool) y creación de tabla personas
│   └── routes/
│       └── personas.ts   # Rutas GET y POST /api/personas (hablan con la DB)
├── package.json          # Dependencias: express, pg
├── tsconfig.json
├── dockerfile
└── .env                  # DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
```

### Qué hace cada parte

| Archivo / carpeta | Rol |
|-------------------|-----|
| `index.ts` | Crea la app Express, usa `express.json()` para leer el body, monta `app.use("/api/personas", personasRoutes)` y al arrancar llama a `initDb()` y luego `app.listen()`. |
| `db.ts` | Crea el `Pool` de `pg` con las variables de entorno; `initDb()` ejecuta `CREATE TABLE IF NOT EXISTS personas (id, nombre, edad)`. |
| `routes/personas.ts` | **GET /** → lista todas las personas desde la DB. **POST /** → recibe `{ nombre, edad }`, valida e inserta en la DB, devuelve la fila creada. |

### Paquetes importantes

- **express**: servidor HTTP y rutas.
- **pg**: cliente de PostgreSQL (conexión, queries).

Las variables de conexión salen de `backend/.env` (y en Docker del `env_file` que apunta a ese mismo archivo).

---

## Estructura del Frontend (React + Vite)

```
frontend/
├── src/
│   ├── main.jsx      # Entrada: monta <App /> en #root
│   ├── App.jsx       # Formulario nombre/edad, fetch a /api/personas, lista de registros
│   └── index.css     # Estilos mínimos
├── index.html        # Página única; el script carga main.jsx
├── vite.config.js    # Config de Vite y puerto del dev server
├── package.json      # react, react-dom, vite, @vitejs/plugin-react
├── dockerfile        # Build (npm run build) y Nginx sirviendo dist/
└── .env              # Opcional: VITE_API_URL (por defecto usa http://localhost:8080)
```

### Qué hace cada parte

| Archivo | Rol |
|---------|-----|
| `App.jsx` | Estado: `nombre`, `edad`, `lista`, `mensaje`. Al cargar hace `GET /api/personas` y pinta la lista. Al enviar el formulario hace `POST /api/personas` con `{ nombre, edad }`, muestra el resultado y vuelve a cargar la lista. |
| `main.jsx` | Punto de entrada de React. |
| `vite.config.js` | Configuración de Vite; el dev server puede usar puerto 3000. |

La URL del backend se toma de `import.meta.env.VITE_API_URL` o, si no está definida, de `http://localhost:8080`. En Docker, el navegador sigue usando `localhost:8080` porque los puertos están mapeados en tu máquina.

---

## Base de datos (PostgreSQL)

- **Dónde corre**: contenedor `service-postgres` (imagen `postgres:16-alpine`).
- **Variables** (en `infra/.env`): `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`. Esas mismas credenciales se usan en `backend/.env` como `DB_NAME`, `DB_USER`, `DB_PASSWORD` (y `DB_HOST=service-postgres`, `DB_PORT=5432` en Docker).
- **Tabla**: `personas (id SERIAL PRIMARY KEY, nombre VARCHAR(255), edad INTEGER)`. Se crea sola al iniciar el backend con `initDb()` en `db.ts`.

---

## Cómo probar

1. **Todo con Docker** (desde `infra/`):
   ```bash
   docker compose up --build
   ```
   - Frontend: http://localhost:3000  
   - Backend: http://localhost:8080  
   - API: http://localhost:8080/api/personas (GET lista, POST crear).

2. **Solo backend y DB** (frontend en local):
   - En `infra/`: `docker compose up service-postgres service-backend`.
   - En `frontend/`: `npm install && npm run dev`.
   - El frontend en local seguirá usando `http://localhost:8080` para la API (o `VITE_API_URL` si la defines).

Con esto tienes una interacción sencilla **formulario → backend → base de datos** y una idea clara de qué archivos y carpetas intervienen en cada paso.
