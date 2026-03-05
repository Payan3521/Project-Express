import { useState, useEffect } from 'react'

// URL del backend (en Docker: mismo host, puerto 8080; en local igual)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function App() {
  const [nombre, setNombre] = useState('')
  const [edad, setEdad] = useState('')
  const [lista, setLista] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  // Al montar y al guardar, traer la lista de personas
  async function cargarLista() {
    try {
      const res = await fetch(`${API_URL}/api/personas`)
      if (res.ok) {
        const data = await res.json()
        setLista(data)
      }
    } catch (e) {
      console.error(e)
      setMensaje('Error al cargar la lista')
    }
  }

  useEffect(() => {
    cargarLista()
  }, [])

  async function enviar(e) {
    e.preventDefault()
    setMensaje('')
    if (!nombre.trim() || !edad.trim()) {
      setMensaje('Completa nombre y edad')
      return
    }
    const edadNum = Number(edad)
    if (Number.isNaN(edadNum) || edadNum < 0 || edadNum > 150) {
      setMensaje('Edad no válida')
      return
    }
    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/api/personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), edad: edadNum }),
      })
      const data = await res.json()
      if (res.ok) {
        setMensaje(`Guardado: ${data.nombre} (id: ${data.id})`)
        setNombre('')
        setEdad('')
        cargarLista()
      } else {
        setMensaje(data.error || 'Error al guardar')
      }
    } catch (err) {
      setMensaje('No se pudo conectar con el backend')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 480 }}>
      <h1>Personas</h1>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Formulario → Backend (Express) → PostgreSQL
      </p>

      <form onSubmit={enviar} style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Ana"
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Edad</label>
          <input
            type="number"
            min={0}
            max={150}
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            placeholder="Ej. 25"
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <button type="submit" disabled={cargando} style={{ padding: '8px 16px' }}>
          {cargando ? 'Guardando…' : 'Guardar'}
        </button>
      </form>

      {mensaje && (
        <p style={{ color: mensaje.startsWith('Guardado') ? 'green' : '#c00', marginBottom: '1rem' }}>
          {mensaje}
        </p>
      )}

      <h2>Registros en la base de datos</h2>
      {lista.length === 0 ? (
        <p style={{ color: '#666' }}>Aún no hay registros.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {lista.map((p) => (
            <li key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
              <strong>#{p.id}</strong> {p.nombre}, {p.edad} años
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
