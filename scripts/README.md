# Scripts de base de datos

## seed.sql

Inserta datos iniciales para que la aplicación no arranque vacía:

- **4 usuarios:** Ana, Carlos, María y Pedro (todos con contraseña **`123456`**).
- **Tareas** con distintos estados: `pending`, `in_progress`, `completed`, `not_done`.
- **Notificaciones** de ejemplo (creadas, completadas, vencidas, recordatorios).

**Importante:** El script hace `TRUNCATE` de `notifications`, `tasks` y `users` al inicio. Si quieres conservar datos existentes, edita `seed.sql` y elimina o comenta la línea del `TRUNCATE`.

### Cómo ejecutarlo

**Con Docker (compose en `infra/`):**

```bash
# Desde la raíz del proyecto
docker exec -i infra-service-postgres-1 psql -U project_user -d project_db < scripts/seed.sql
```

Si el nombre del contenedor de Postgres es otro (por ejemplo `service-postgres`):

```bash
docker exec -i service-postgres psql -U project_user -d project_db < scripts/seed.sql
```

**Local (psql instalado y BD creada):**

```bash
psql -h localhost -p 5432 -U project_user -d project_db -f scripts/seed.sql
```

Te pedirá la contraseña de `project_user` (por defecto `project_password` si no has cambiado las variables de entorno).

### Credenciales de prueba

| Email              | Contraseña |
|--------------------|------------|
| ana@example.com    | 123456     |
| carlos@example.com | 123456     |
| maria@example.com  | 123456     |
| pedro@example.com  | 123456     |
