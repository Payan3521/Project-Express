import { useEffect, useState } from "react";

// URL del backend (en Docker: mismo host, puerto 8080; en local igual)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login"); // login | register | tasks | profile | stats | users | notifications
  const [globalMessage, setGlobalMessage] = useState("");

  // Al montar, intentar restaurar sesión desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.user) {
          setToken(parsed.token);
          setUser(parsed.user);
          setView("tasks");
        }
      } catch {
        // ignorar
      }
    }
  }, []);

  // Helper para guardar/eliminar sesión
  function saveSession(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
    if (newToken && newUser) {
      localStorage.setItem("auth", JSON.stringify({ token: newToken, user: newUser }));
    } else {
      localStorage.removeItem("auth");
    }
  }

  // Wrapper de fetch con cabecera Authorization
  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      const msg = body?.error || `Error ${res.status}`;
      throw new Error(msg);
    }
    return body;
  }

  async function handleLogout() {
    try {
      if (token) {
        await apiFetch("/api/auth/logout", { method: "POST" });
      }
    } catch {
      // no pasa nada si falla, simplemente limpiamos sesión
    } finally {
      saveSession(null, null);
      setView("login");
      setGlobalMessage("Sesión cerrada");
    }
  }

  const isLoggedIn = Boolean(token && user);

  return (
    <div style={{ padding: "1.5rem", fontFamily: "system-ui" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Gestor de Tareas</h1>
          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
            Frontend → Backend (Express) → PostgreSQL
          </p>
        </div>
        {isLoggedIn && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem" }}>Hola, {user.name}</div>
            <button
              onClick={handleLogout}
              style={{ marginTop: 4, padding: "4px 10px", fontSize: "0.8rem" }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      {/* Navegación sencilla */}
      <nav style={{ marginBottom: "1rem" }}>
        {!isLoggedIn ? (
          <>
            <NavButton label="Iniciar sesión" active={view === "login"} onClick={() => setView("login")} />
            <NavButton label="Registrarse" active={view === "register"} onClick={() => setView("register")} />
          </>
        ) : (
          <>
            <NavButton label="Tareas" active={view === "tasks"} onClick={() => setView("tasks")} />
            <NavButton label="Notificaciones" active={view === "notifications"} onClick={() => setView("notifications")} />
            <NavButton label="Perfil" active={view === "profile"} onClick={() => setView("profile")} />
            <NavButton label="Estadísticas" active={view === "stats"} onClick={() => setView("stats")} />
            <NavButton label="Usuarios" active={view === "users"} onClick={() => setView("users")} />
          </>
        )}
      </nav>

      {globalMessage && (
        <p style={{ color: "#0a7", marginBottom: "0.75rem" }}>{globalMessage}</p>
      )}

      {/* Vistas */}
      <main style={{ maxWidth: 720 }}>
        {!isLoggedIn && view === "login" && (
          <LoginView apiFetch={apiFetch} onLogin={saveSession} setGlobalMessage={setGlobalMessage} />
        )}
        {!isLoggedIn && view === "register" && (
          <RegisterView apiFetch={apiFetch} setGlobalMessage={setGlobalMessage} onRegistered={() => setView("login")} />
        )}
        {isLoggedIn && view === "tasks" && (
          <TasksView apiFetch={apiFetch} />
        )}
        {isLoggedIn && view === "profile" && (
          <ProfileView apiFetch={apiFetch} />
        )}
        {isLoggedIn && view === "stats" && (
          <StatsView apiFetch={apiFetch} />
        )}
        {isLoggedIn && view === "users" && (
          <UsersView apiFetch={apiFetch} />
        )}
        {isLoggedIn && view === "notifications" && (
          <NotificationsView apiFetch={apiFetch} />
        )}
      </main>
    </div>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        marginRight: 8,
        marginBottom: 4,
        borderRadius: 4,
        border: active ? "1px solid #2563eb" : "1px solid #ddd",
        backgroundColor: active ? "#2563eb" : "#f9fafb",
        color: active ? "#fff" : "#111",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ---------- VISTAS ----------

function LoginView({ apiFetch, onLogin, setGlobalMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGlobalMessage("");
    if (!email || !password) {
      setError("Completa email y contraseña");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(data.token, data.user);
      setGlobalMessage("Sesión iniciada correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </Field>
        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {error && <p style={{ color: "#c00", marginTop: "0.75rem" }}>{error}</p>}
      </form>
    </section>
  );
}

function RegisterView({ apiFetch, setGlobalMessage, onRegistered }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setGlobalMessage("");
    if (!name || !email || !password) {
      setError("Completa nombre, email y contraseña");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/users/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setGlobalMessage("Registro correcto, ahora inicia sesión");
      setName("");
      setEmail("");
      setPassword("");
      onRegistered();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Registro de usuario</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
        <Field label="Nombre">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </Field>
        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Guardando..." : "Registrarse"}
        </button>
        {error && <p style={{ color: "#c00", marginTop: "0.75rem" }}>{error}</p>}
      </form>
    </section>
  );
}

// Formatea una fecha ISO (UTC) para input datetime-local en hora LOCAL del usuario
function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

// Parsea "YYYY-MM-DDTHH:mm" como hora LOCAL (evita que el navegador lo interprete como UTC)
// y devuelve ISO en UTC para enviar al backend.
function toISOUTC(datetimeLocal) {
  if (!datetimeLocal || typeof datetimeLocal !== "string") return null;
  const parts = datetimeLocal.trim().split(/\D/);
  if (parts.length < 5) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const h = parseInt(parts[3], 10);
  const min = parseInt(parts[4], 10) || 0;
  const d = new Date(y, m, day, h, min, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function TasksView({ apiFetch }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [startAt, setStartAt] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [editStartAt, setEditStartAt] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  async function loadTasks(currentFilter) {
    setMessage("");
    try {
      const query = currentFilter ? `?status=${encodeURIComponent(currentFilter)}` : "";
      const data = await apiFetch(`/api/tasks${query}`);
      setTasks(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  useEffect(() => {
    loadTasks(filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  function openEdit(t) {
    setEditingTask(t);
    setEditTitle(t.title);
    setEditDescription(t.description || "");
    setEditStatus(t.status === "not_done" ? "pending" : t.status);
    setEditStartAt(toDatetimeLocal(t.start_at));
    setEditDueAt(toDatetimeLocal(t.due_at));
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingTask) return;
    setEditSaving(true);
    setMessage("");
    try {
      await apiFetch(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          status: editStatus,
          start_at: toISOUTC(editStartAt) ?? null,
          due_at: toISOUTC(editDueAt) ?? null,
        }),
      });
      setEditingTask(null);
      await loadTasks(filterStatus);
      setMessage("Tarea actualizada");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMessage("");
    if (!title.trim()) {
      setMessage("El título es obligatorio");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          start_at: toISOUTC(startAt) ?? null,
          due_at: toISOUTC(dueAt) ?? null,
        }),
      });
      setTitle("");
      setDescription("");
      setStatus("pending");
      setStartAt("");
      setDueAt("");
      await loadTasks(filterStatus);
      setMessage("Tarea creada");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    setMessage("");
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      await loadTasks(filterStatus);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleUpdateStatus(id, newStatus) {
    setMessage("");
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      await loadTasks(filterStatus);
    } catch (err) {
      setMessage(err.message);
    }
  }

  const statusLabel = (s) =>
    ({ pending: "Pendiente", in_progress: "En curso", completed: "Terminada", not_done: "Vencida" })[s] || s;

  return (
    <section>
      <h2>Tareas</h2>
      <form onSubmit={handleCreate} style={{ marginBottom: "1.5rem", maxWidth: 480 }}>
        <Field label="Título">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="Ej. Estudiar arquitectura backend"
          />
        </Field>
        <Field label="Descripción">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: 8, minHeight: 60 }}
          />
        </Field>
        <Field label="Fecha/hora inicio (aviso para hacer)">
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </Field>
        <Field label="Fecha/hora límite (vencimiento)">
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </Field>
        <Field label="Estado inicial">
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 6 }}>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Terminada</option>
          </select>
        </Field>
        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Guardando..." : "Crear tarea"}
        </button>
      </form>

      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ marginRight: 8 }}>Filtrar por estado:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: 4 }}
        >
          <option value="">Todas</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En curso</option>
          <option value="completed">Terminada</option>
          <option value="not_done">Vencida</option>
        </select>
      </div>

      {message && <p style={{ color: message.startsWith("Tarea") ? "#0a7" : "#c00" }}>{message}</p>}

      {editingTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          onClick={() => setEditingTask(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: 8,
              maxWidth: 420,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Modificar tarea</h3>
            <form onSubmit={handleSaveEdit}>
              <Field label="Título">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: "100%", padding: 8, minHeight: 60 }}
                />
              </Field>
              <Field label="Fecha/hora inicio">
                <input
                  type="datetime-local"
                  value={editStartAt}
                  onChange={(e) => setEditStartAt(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </Field>
              <Field label="Fecha/hora límite">
                <input
                  type="datetime-local"
                  value={editDueAt}
                  onChange={(e) => setEditDueAt(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </Field>
              <Field label="Estado">
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ padding: 6 }}>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="completed">Terminada</option>
                </select>
              </Field>
              <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
                <button type="submit" disabled={editSaving} style={{ padding: "8px 16px" }}>
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
                <button type="button" onClick={() => setEditingTask(null)} style={{ padding: "8px 16px" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <p style={{ color: "#666" }}>No hay tareas.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map((t) => (
            <li
              key={t.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>#{t.id}</strong> {t.title}
                {t.description && (
                  <div style={{ fontSize: "0.85rem", color: "#555" }}>{t.description}</div>
                )}
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  Estado: {statusLabel(t.status)}
                  {t.start_at && (
                    <> · Inicio: {new Date(t.start_at).toLocaleString()}</>
                  )}
                  {t.due_at && (
                    <> · Límite: {new Date(t.due_at).toLocaleString()}</>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 180, display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  onClick={() => openEdit(t)}
                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                >
                  Editar
                </button>
                {t.status === "not_done" ? (
                  <span style={{ fontSize: "0.8rem", color: "#999" }}>Vencida (solo lectura)</span>
                ) : (
                  <select
                    value={t.status}
                    onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                    style={{ padding: 4, width: "100%" }}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En curso</option>
                    <option value="completed">Terminada</option>
                  </select>
                )}
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProfileView({ apiFetch }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiFetch("/api/profile");
        setProfile(data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <h2>Perfil</h2>
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      {!profile && !error && <p>Cargando perfil...</p>}
      {profile && (
        <div>
          <p>
            <strong>Nombre:</strong> {profile.name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Creado:</strong> {new Date(profile.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}

function StatsView({ apiFetch }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiFetch("/api/stats");
        setStats(data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <h2>Estadísticas</h2>
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      {!stats && !error && <p>Cargando estadísticas...</p>}
      {stats && (
        <>
          <ul>
            <li>Total de tareas: {stats.total_tareas}</li>
            <li>Tareas completadas: {stats.total_completadas}</li>
            <li>Tareas pendientes: {stats.total_pendientes}</li>
            <li>
              Porcentaje de cumplimiento:{" "}
              {stats.porcentaje_cumplimiento.toFixed(1)}%
            </li>
          </ul>
          <h3>Últimas 5 tareas</h3>
          {stats.ultimas_5_tareas.length === 0 ? (
            <p>No hay tareas recientes.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {stats.ultimas_5_tareas.map((t) => (
                <li key={t.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
                  <strong>#{t.id}</strong> {t.title} ({t.status}) —{" "}
                  {new Date(t.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function UsersView({ apiFetch }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await apiFetch("/api/users");
        setUsers(data);
      } catch (err) {
        setError(err.message);
      }
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <h2>Usuarios</h2>
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      {users.length === 0 && !error && <p>No hay usuarios.</p>}
      {users.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((u) => (
            <li key={u.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee" }}>
              <strong>#{u.id}</strong> {u.name} ({u.email})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NotificationsView({ apiFetch }) {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await apiFetch("/api/notifications");
      setList(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      // ignore
    }
  }

  const typeLabel = (type) =>
    ({
      task_created: "Nueva tarea",
      task_completed: "Completada",
      task_overdue: "Vencida",
      task_reminder: "Recordatorio",
    })[type] || type;

  return (
    <section>
      <h2>Notificaciones</h2>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Aquí aparecen: nueva tarea, tarea completada, tarea vencida y recordatorio de inicio.
      </p>
      {error && <p style={{ color: "#c00" }}>{error}</p>}
      {list.length === 0 && !error && <p>No hay notificaciones.</p>}
      {list.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {list.map((n) => (
            <li
              key={n.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #eee",
                backgroundColor: n.read_at ? "transparent" : "#f0f9ff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#666", marginRight: 8 }}>
                    {typeLabel(n.type)}
                  </span>
                  {n.message}
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                {!n.read_at && (
                  <button
                    onClick={() => markRead(n.id)}
                    style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label style={{ display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

export default App;