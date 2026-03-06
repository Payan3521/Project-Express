-- =============================================================================
-- Seed: datos iniciales para la base de datos del Gestor de Tareas
-- Contraseña de todos los usuarios: 123456
-- Ejecutar después de que initDb haya creado las tablas (o en una BD vacía).
-- Ejemplo: psql -h localhost -U project_user -d project_db -f scripts/seed.sql
-- Con Docker: docker exec -i service-postgres psql -U project_user -d project_db < scripts/seed.sql
-- =============================================================================

-- Limpiar datos previos (opcional; quitar si quieres conservar datos existentes)
TRUNCATE notifications, tasks, users RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- Usuarios (contraseña: 123456)
-- -----------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash) VALUES
  ('Ana García',      'ana@example.com',    '$2a$10$rVnr1GWdBOHvZB8CfEE/Teg9w2srEJBQr92EQJwt/IYoWp9rdUsIS'),
  ('Carlos López',   'carlos@example.com',  '$2a$10$rVnr1GWdBOHvZB8CfEE/Teg9w2srEJBQr92EQJwt/IYoWp9rdUsIS'),
  ('María Ruiz',     'maria@example.com',   '$2a$10$rVnr1GWdBOHvZB8CfEE/Teg9w2srEJBQr92EQJwt/IYoWp9rdUsIS'),
  ('Pedro Sánchez',  'pedro@example.com',   '$2a$10$rVnr1GWdBOHvZB8CfEE/Teg9w2srEJBQr92EQJwt/IYoWp9rdUsIS');

-- -----------------------------------------------------------------------------
-- Tareas de Ana (variedad: pendiente, en curso, completada, vencida)
-- -----------------------------------------------------------------------------
INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Revisar documentación del API', 'Revisar endpoints y ejemplos', 'completed',
       NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days',
       NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'ana@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Preparar presentación mensual', 'Slides y notas para el equipo', 'in_progress',
       NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days',
       NOW() - INTERVAL '5 days', NOW()
FROM users u WHERE u.email = 'ana@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Llamada con cliente externo', NULL, 'pending',
       NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
       NOW() - INTERVAL '2 days', NOW()
FROM users u WHERE u.email = 'ana@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, reminder_sent_at, created_at, updated_at)
SELECT u.id, 'Entregar informe trimestral', 'Cerrar métricas y redactar', 'not_done',
       NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day',
       NOW() - INTERVAL '1 day',
       NOW() - INTERVAL '7 days', NOW()
FROM users u WHERE u.email = 'ana@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Actualizar dependencias del proyecto', 'npm audit y actualizaciones', 'completed',
       NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days',
       NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 days'
FROM users u WHERE u.email = 'ana@example.com';

-- -----------------------------------------------------------------------------
-- Tareas de Carlos
-- -----------------------------------------------------------------------------
INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Configurar CI/CD', 'Pipeline en GitLab', 'completed',
       NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days',
       NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days'
FROM users u WHERE u.email = 'carlos@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Code review PR #42', NULL, 'pending',
       NOW() + INTERVAL '3 hours', NOW() + INTERVAL '1 day',
       NOW() - INTERVAL '1 day', NOW()
FROM users u WHERE u.email = 'carlos@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Migrar base de datos a nueva versión', 'Backup y script de migración', 'not_done',
       NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 hours',
       NOW() - INTERVAL '3 days', NOW()
FROM users u WHERE u.email = 'carlos@example.com';

-- -----------------------------------------------------------------------------
-- Tareas de María
-- -----------------------------------------------------------------------------
INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Diseñar mockups de la app', 'Figma y guía de estilo', 'in_progress',
       NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days',
       NOW() - INTERVAL '4 days', NOW()
FROM users u WHERE u.email = 'maria@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Reunión de sprint planning', NULL, 'completed',
       NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days',
       NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'
FROM users u WHERE u.email = 'maria@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Escribir tests E2E', 'Al menos login y listado de tareas', 'pending',
       NOW() + INTERVAL '2 days', NOW() + INTERVAL '1 week',
       NOW() - INTERVAL '1 day', NOW()
FROM users u WHERE u.email = 'maria@example.com';

-- -----------------------------------------------------------------------------
-- Tareas de Pedro
-- -----------------------------------------------------------------------------
INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Desplegar en staging', NULL, 'completed',
       NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
       NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'pedro@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Documentar API en Swagger', 'Todos los endpoints con ejemplos', 'pending',
       NOW() + INTERVAL '1 day', NOW() + INTERVAL '3 days',
       NOW(), NOW()
FROM users u WHERE u.email = 'pedro@example.com';

INSERT INTO tasks (user_id, title, description, status, start_at, due_at, created_at, updated_at)
SELECT u.id, 'Revisar seguridad (OWASP)', 'Checklist y correcciones', 'not_done',
       NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days',
       NOW() - INTERVAL '10 days', NOW()
FROM users u WHERE u.email = 'pedro@example.com';

-- -----------------------------------------------------------------------------
-- Notificaciones (asociadas a tareas y usuarios existentes)
-- -----------------------------------------------------------------------------
INSERT INTO notifications (user_id, type, task_id, message, read_at)
SELECT u.id, 'task_created', t.id, 'Nueva tarea: ' || t.title, NULL
FROM users u
JOIN tasks t ON t.user_id = u.id
WHERE u.email = 'ana@example.com'
ORDER BY t.id DESC LIMIT 2;

INSERT INTO notifications (user_id, type, task_id, message, read_at)
SELECT u.id, 'task_completed', t.id, 'Tarea completada: ' || t.title, NOW()
FROM users u
JOIN tasks t ON t.user_id = u.id
WHERE u.email = 'ana@example.com' AND t.status = 'completed'
ORDER BY t.updated_at DESC LIMIT 1;

INSERT INTO notifications (user_id, type, task_id, message, read_at)
SELECT u.id, 'task_overdue', t.id, 'Tarea vencida: ' || t.title, NULL
FROM users u
JOIN tasks t ON t.user_id = u.id
WHERE u.email = 'ana@example.com' AND t.status = 'not_done'
ORDER BY t.id DESC LIMIT 1;

INSERT INTO notifications (user_id, type, task_id, message, read_at)
SELECT u.id, 'task_reminder', t.id, 'Es hora de hacer: ' || t.title, NULL
FROM users u
JOIN tasks t ON t.user_id = u.id
WHERE u.email = 'carlos@example.com'
ORDER BY t.id ASC LIMIT 1;

INSERT INTO notifications (user_id, type, task_id, message, read_at)
SELECT u.id, 'task_created', t.id, 'Nueva tarea: ' || t.title, NULL
FROM users u
JOIN tasks t ON t.user_id = u.id
WHERE u.email = 'maria@example.com'
ORDER BY t.id DESC LIMIT 1;

INSERT INTO notifications (user_id, type, task_id, message, read_at)
SELECT u.id, 'task_completed', t.id, 'Tarea completada: ' || t.title, NULL
FROM users u
JOIN tasks t ON t.user_id = u.id
WHERE u.email = 'pedro@example.com' AND t.status = 'completed'
ORDER BY t.id DESC LIMIT 1;

-- -----------------------------------------------------------------------------
-- Resumen
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'Seed completado: % usuarios, % tareas, % notificaciones',
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(*) FROM tasks),
    (SELECT COUNT(*) FROM notifications);
END $$;
