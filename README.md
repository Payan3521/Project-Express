# Project-Express

API REST Full Stack con Express + TypeScript, React + Vite, PostgreSQL y Docker. Gestor de tareas con autenticación JWT, notificaciones automáticas y estadísticas en tiempo real.

---

## Características

- **Autenticación JWT** - Login/registro con tokens seguros
- **Gestión de Tareas** - CRUD completo con estados (pending, in_progress, completed, not_done)
- **Notificaciones Automáticas** - Recordatorios y alertas de vencimiento
- **Estadísticas** - Dashboard con métricas de tareas
- **API REST** - Endpoints bien estructurados
- **Docker** - Contenedores para todo el stack

---

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Backend | Express 5, TypeScript, Node.js |
| Frontend | React 18, Vite |
| Base de Datos | PostgreSQL 16 |
| Autenticación | JWT (jsonwebtoken), bcrypt |
| Contenedores | Docker, Docker Compose |

---

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│ PostgreSQL  │
│  (React)    │◀────│  (Express)  │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘
   localhost:3000     localhost:8080       :5432
```

### Flujo de comunicación

1. **Usuario** interactúa con el Frontend (React)
2. **Frontend** envía peticiones HTTP al Backend
3. **Backend** valida tokens JWT, procesa lógica de negocio
4. **Backend** ejecuta queries SQL en PostgreSQL
5. **Respuesta** retorna al Frontend → muestra datos al usuario

---

## Estructura del proyecto

```
Project-Express/
├── backend/                    # Servidor API
│   ├── src/
│   │   ├── index.ts           # Punto de entrada
│   │   ├── db.ts              # Conexión PostgreSQL
│   │   ├── routes/            # Endpoints
│   │   │   ├── auth.ts        # Login/Logout
│   │   │   ├── users.ts       # CRUD usuarios
│   │   │   ├── tasks.ts       # CRUD tareas
│   │   │   ├── profile.ts     # Perfil usuario
│   │   │   ├── stats.ts       # Estadísticas
│   │   │   ├── notifications.ts
│   │   │   ├── debug.ts       # Diagnóstico
│   │   │   └── personas.ts    # Demo CRUD
│   │   ├── middleware/
│   │   │   └── auth.ts        # Validación JWT
│   │   └── jobs/
│   │       └── notificationsCron.ts
│   ├── package.json
│   └── .env
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── .env
├── infra/                      # Docker Compose
│   ├── docker-compose.yml
│   └── .env
├── scripts/
│   └── seed.sql               # Datos iniciales
└── README.md
```

---

## Endpoints de la API

### Rutas Públicas

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| GET | `/` | Verifica que la API funciona | - |
| POST | `/api/auth/login` | Iniciar sesión | `{ email, password }` |
| POST | `/api/auth/logout` | Cerrar sesión | - |
| POST | `/api/users/register` | Registrar usuario | `{ name, email, password }` |
| GET | `/api/personas` | Listar personas (demo) | - |
| POST | `/api/personas` | Crear persona (demo) | `{ nombre, edad }` |

### Rutas Protegidas (requieren JWT)

#### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar todos los usuarios |
| GET | `/api/users/:id` | Obtener usuario por ID |
| PUT | `/api/users/:id` | Actualizar nombre |
| DELETE | `/api/users/:id` | Eliminar usuario |

#### Tareas

| Método | Ruta | Descripción | Body |
|--------|------|-------------|------|
| GET | `/api/tasks` | Listar tareas (filtro `?status=`) | - |
| POST | `/api/tasks` | Crear tarea | `{ title, description?, status?, start_at?, due_at? }` |
| GET | `/api/tasks/:id` | Obtener tarea por ID | - |
| PUT | `/api/tasks/:id` | Actualizar tarea | `{ title?, description?, status?, start_at?, due_at? }` |
| DELETE | `/api/tasks/:id` | Eliminar tarea | - |

#### Perfil y Estadísticas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/profile` | Datos del usuario autenticado |
| GET | `/api/stats` | Estadísticas de tareas |

#### Notificaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Listar notificaciones |
| PATCH | `/api/notifications/:id/read` | Marcar como leída |

---

## Esquema de Base de Datos

### Tabla: users

```sql
users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Tabla: tasks

```sql
tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  start_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Tabla: notifications

```sql
notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Autenticación JWT

### Flujo

1. **Registro**: `POST /api/users/register` → guarda usuario con password hasheado (bcrypt)
2. **Login**: `POST /api/auth/login` → valida credenciales, retorna JWT
3. **Peticiones protegidas**: incluir header `Authorization: Bearer <token>`

### Ejemplo de uso

```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"123456"}'

# Respuesta: { "token": "eyJhbGciOiJIUz...", "user": {...} }

# 2. Usar token en peticiones protegidas
curl -X GET http://localhost:8080/api/tasks \
  -H "Authorization: Bearer eyJhbGciOiJIUz..."
```

### Validación

- Tokens expiran en 1 hora
- Middleware `authRequired` verifica el token en cada request protegido

---

## Cómo ejecutar el proyecto

### Opción 1: Todo con Docker (Recomendado)

```bash
cd infra/
docker compose up --build
```

Servicios disponibles:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

### Opción 2: Desarrollo local

**Backend:**
```bash
cd backend/
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend/
npm install
npm run dev
```

### Seed de datos de prueba

```bash
# Con Docker
docker exec -i service-postgres psql -U project_user -d project_db < scripts/seed.sql

# Local
psql -h localhost -p 5432 -U project_user -d project_db -f scripts/seed.sql
```

---

## Variables de entorno

### backend/.env

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de PostgreSQL | localhost |
| `DB_PORT` | Puerto de PostgreSQL | 5432 |
| `DB_NAME` | Nombre de la base de datos | project_db |
| `DB_USER` | Usuario de PostgreSQL | project_user |
| `DB_PASSWORD` | Contraseña de PostgreSQL | project_password |
| `JWT_SECRET` | Clave secreta para JWT | (configurable) |

### infra/.env

| Variable | Descripción |
|----------|-------------|
| `POSTGRES_DB` | Nombre de la base de datos |
| `POSTGRES_USER` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |

---

## Scripts disponibles

### Backend

```bash
npm run dev      # Desarrollo (nodemon + ts-node)
npm run build    # Compilar TypeScript
npm start        # Producción (node dist/index.js)
```

### Frontend

```bash
npm run dev      # Desarrollo (Vite)
npm run build    # Build de producción
npm run preview  # Previsualizar build
```

---

## Usuarios de prueba

Del seed.sql:

| Email | Contraseña |
|-------|------------|
| ana@example.com | 123456 |
| carlos@example.com | 123456 |
| maria@example.com | 123456 |
| pedro@example.com | 123456 |

---

## Notificaciones automáticas

El sistema tiene un **cron job** que se ejecuta cada 15 segundos:

- **Tareas vencidas**: Marca como `not_done` cuando `due_at < now()`
- **Recordatorios**: Envía notificación cuando `start_at <= now()` y no se ha enviado

Para diagnóstico:

```bash
# Ver estado del cron
curl -X GET http://localhost:8080/api/debug/notification-check \
  -H "Authorization: Bearer <token>"

# Ejecutar cron manualmente
curl -X POST http://localhost:8080/api/debug/run-cron \
  -H "Authorization: Bearer <token>"
```

---

## Ejemplos de uso de la API

### Registro de usuario

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@test.com","password":"123456"}'
```

### Crear tarea

```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Terminar proyecto","description":"Finalizar el README","due_at":"2026-03-15T23:59:00Z"}'
```

### Listar tareas pendientes

```bash
curl -X GET "http://localhost:8080/api/tasks?status=pending" \
  -H "Authorization: Bearer <token>"
```

### Obtener estadísticas

```bash
curl -X GET http://localhost:8080/api/stats \
  -H "Authorization: Bearer <token>"
```

### Marcar notificación como leída

```bash
curl -X PATCH http://localhost:8080/api/notifications/1/read \
  -H "Authorization: Bearer <token>"
```
