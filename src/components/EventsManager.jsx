import { useState, useEffect } from 'react'
import { authClient } from '../lib/auth'
import ConfirmModal from './ConfirmModal'

const MATERIAS = [
  'Ingles',
  'Laboratorio de Datos',
  'Modelos Parametricos',
  'Tecnicas de Muestreo',
  'Taller Integrador I',
  'Modelos No Parametricos',
  'Calculo II'
]

const COLORS = [
  '#3788d8', '#28a745', '#dc3545', '#ffc107',
  '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'
]

function EventsManager() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [form, setForm] = useState({
    materia: MATERIAS[0],
    title: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    color: COLORS[0],
    alert_status: 'pending'
  })

  // Estado para modales de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'default'
  })

  // Obtener headers de autenticación
  const getAuthHeaders = async () => {
    try {
      const token = await authClient.getJWTToken?.();
      if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
    } catch (err) {
      console.error('Error obteniendo token:', err);
    }
    return {};
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      setEvents(data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const resetForm = () => {
    setForm({
      materia: MATERIAS[0],
      title: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      color: COLORS[0],
      alert_status: 'pending'
    })
    setEditingEvent(null)
  }

  const openModal = (event = null) => {
    if (event) {
      setEditingEvent(event)
      // Convertir de UTC (guardado en DB) a hora local
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)

      // Formatear fecha y hora en zona horaria local
      const formatLocalDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const formatLocalTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${hours}:${minutes}`
      }

      setForm({
        materia: event.materia,
        title: event.title,
        start_date: formatLocalDate(startDate),
        start_time: formatLocalTime(startDate),
        end_date: formatLocalDate(endDate),
        end_time: formatLocalTime(endDate),
        color: event.color,
        alert_status: event.alert_status
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeConfirmModal = () => {
    setConfirmModal({ ...confirmModal, isOpen: false })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Crear fechas en zona horaria local
    const startLocal = new Date(`${form.start_date}T${form.start_time}:00`)
    const endLocal = new Date(`${form.end_date}T${form.end_time}:00`)

    // Convertir a ISO string (UTC) para guardar en la DB
    const start_date = startLocal.toISOString()
    const end_date = endLocal.toISOString()

    const payload = {
      ...form,
      start_date,
      end_date
    }


    try {
      const headers = await getAuthHeaders();
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
      const method = editingEvent ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar evento')
      }

      setShowModal(false)
      resetForm()
      setError('')
      setSuccessMessage(editingEvent ? 'Evento actualizado correctamente' : 'Evento creado correctamente')
      fetchEvents()
    } catch (err) {
      console.error(err)
      setError(err.message)
    }
  }

  const handleDelete = (id) => {
    const event = events.find(e => e.id === id)
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Evento',
      message: `¿Estás seguro de que deseas eliminar el evento "${event?.title}" de ${event?.materia}?`,
      type: 'danger',
      onConfirm: async () => {
        closeConfirmModal()
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`/api/events/${id}`, {
            method: 'DELETE',
            headers
          })

          if (!res.ok) {
            throw new Error('Error al eliminar evento')
          }

          setSuccessMessage('Evento eliminado correctamente')
          fetchEvents()
        } catch (err) {
          console.error(err)
          setError(err.message)
        }
      }
    })
  }

  const sendAlert = (id) => {
    const event = events.find(e => e.id === id)
    setConfirmModal({
      isOpen: true,
      title: 'Enviar Alerta por Email',
      message: `¿Enviar recordatorio por email a todos los contactos para el evento "${event?.title}" de ${event?.materia}?`,
      type: 'success',
      onConfirm: async () => {
        closeConfirmModal()
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`/api/events/${id}/alert`, {
            method: 'POST',
            headers
          })

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.error || 'Error al enviar alerta')
          }

          if (data.message) {
            setSuccessMessage(data.message)
          } else {
            setSuccessMessage('Alerta enviada correctamente a todos los contactos')
          }
          fetchEvents()
        } catch (err) {
          console.error(err)
          setError(err.message)
        }
      }
    })
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Gestión de Eventos</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Nuevo Evento
        </button>
      </div>

      {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
      {successMessage && <div className="success-message" style={{ marginBottom: '1rem' }}>{successMessage}</div>}

      <div className="card">
        <table className="events-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Título</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Color</th>
              <th>Alerta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>{event.materia}</td>
                <td>{event.title}</td>
                <td>{new Date(event.start_date).toLocaleString('es-AR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}</td>
                <td>{new Date(event.end_date).toLocaleString('es-AR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}</td>
                <td><span className="color-badge" style={{ background: event.color }}></span></td>
                <td>
                  <span className={`alert-badge ${event.estado_alerta === 'enviado' ? 'sent' : 'pending'}`}>
                    {event.estado_alerta === 'enviado' ? 'Enviada' : 'Pendiente'}
                  </span>
                </td>
                <td className="actions">
                  <button className="btn btn-secondary" onClick={() => openModal(event)}>Editar</button>
                  <button className="btn btn-success" onClick={() => sendAlert(event.id)}>Alertar</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(event.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setShowModal(false)}>×</span>
            <h2>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Materia</label>
                <select value={form.materia} onChange={e => setForm({ ...form, materia: e.target.value })}>
                  {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Título</label>
                <textarea
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  rows="3"
                  placeholder="Ej: Examen Parcial - Unidad 1 y 2"
                />
              </div>
              <div className="form-group">
                <label>Fecha Inicio</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Hora Inicio</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha Fin</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Hora Fin</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <div
                      key={c}
                      className={`color-option ${form.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmText={confirmModal.type === 'danger' ? 'Eliminar' : 'Enviar'}
        cancelText="Cancelar"
      />
    </div>
  )
}

export default EventsManager