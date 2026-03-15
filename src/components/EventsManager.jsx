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
  'Calculo II',
  'AVISO IMPORTANTE'
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
  const [modalError, setModalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [form, setForm] = useState({
    materia: MATERIAS[0],
    title: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    color: COLORS[0],
    alert_status: 'pending',
    alert_email: true,
    alert_whatsapp: false,
    alert_hours_email: [24],
    alert_hours_whatsapp: [2]
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
      alert_status: 'pending',
      alert_email: true,
      alert_whatsapp: false,
      alert_hours_email: [24],
      alert_hours_whatsapp: [2]
    })
    setEditingEvent(null)
  }

  const openModal = (event = null) => {
    setModalError('')  // Limpiar error del modal al abrir
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
        alert_status: event.alert_status,
        alert_email: event.alert_email !== false,
        alert_whatsapp: event.alert_whatsapp === true,
        alert_hours_email: Array.isArray(event.alert_hours_email) && event.alert_hours_email.length > 0
          ? event.alert_hours_email : [24],
        alert_hours_whatsapp: Array.isArray(event.alert_hours_whatsapp) && event.alert_hours_whatsapp.length > 0
          ? event.alert_hours_whatsapp : [2]
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

    // Validar que la fecha de inicio sea anterior a la fecha de fin
    if (startLocal >= endLocal) {
      setModalError('La fecha y hora de inicio debe ser anterior a la fecha y hora de fin')
      return
    }

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
      setModalError('')
      setSuccessMessage(editingEvent ? 'Evento actualizado correctamente' : 'Evento creado correctamente')
      fetchEvents()
    } catch (err) {
      console.error(err)
      setModalError(err.message)
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

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
              <th>Canales y avisos</th>
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
                  <div style={{ fontSize: '0.78rem', lineHeight: '1.6' }}>
                    {event.alert_email !== false && (
                      <div>
                        <span style={{ background: '#e3f0ff', color: '#1a6fc4', padding: '0.1rem 0.4rem', borderRadius: '999px', marginRight: '0.3rem' }}>Email</span>
                        {Array.isArray(event.alert_hours_email) && event.alert_hours_email.length > 0
                          ? event.alert_hours_email.map(h => `${h}h`).join(', ')
                          : '24h'}
                      </div>
                    )}
                    {event.alert_whatsapp === true && (
                      <div style={{ marginTop: '0.2rem' }}>
                        <span style={{ background: '#e6f9f0', color: '#1a8a4a', padding: '0.1rem 0.4rem', borderRadius: '999px', marginRight: '0.3rem' }}>WA</span>
                        {Array.isArray(event.alert_hours_whatsapp) && event.alert_hours_whatsapp.length > 0
                          ? event.alert_hours_whatsapp.map(h => `${h}h`).join(', ')
                          : '2h'}
                      </div>
                    )}
                    {event.alert_email === false && event.alert_whatsapp !== true && (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </div>
                </td>
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
        <div className="modal-overlay" onClick={() => { setShowModal(false); setModalError(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <span className="modal-close" onClick={() => { setShowModal(false); setModalError(''); }}>×</span>
            <h2>{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</h2>
            {modalError && <div className="error-message" style={{ marginBottom: '1rem' }}>{modalError}</div>}
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
                  min={minDate}
                  max="2029-12-31"
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
                  min={minDate}
                  max="2029-12-31"
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

              <div className="form-group">
                <label>Canales de alerta</label>

                {/* Email */}
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={form.alert_email}
                      onChange={e => setForm({ ...form, alert_email: e.target.checked })}
                    />
                    Email
                  </label>
                  {form.alert_email && (
                    <div>
                      <span style={{ fontSize: '0.82rem', color: '#666', display: 'block', marginBottom: '0.4rem' }}>Avisar con anticipación:</span>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[1, 2, 6, 12, 24, 48].map(h => (
                          <label key={h} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'normal', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={form.alert_hours_email.includes(h)}
                              onChange={e => {
                                const updated = e.target.checked
                                  ? [...form.alert_hours_email, h].sort((a, b) => a - b)
                                  : form.alert_hours_email.filter(x => x !== h)
                                setForm({ ...form, alert_hours_email: updated })
                              }}
                            />
                            {h}h
                          </label>
                        ))}
                      </div>
                      {form.alert_hours_email.length === 0 && (
                        <p style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '0.3rem' }}>Seleccioná al menos una hora.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* WhatsApp */}
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={form.alert_whatsapp}
                      onChange={e => setForm({ ...form, alert_whatsapp: e.target.checked })}
                    />
                    WhatsApp
                  </label>
                  {form.alert_whatsapp && (
                    <div>
                      <span style={{ fontSize: '0.82rem', color: '#666', display: 'block', marginBottom: '0.4rem' }}>Avisar con anticipación:</span>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[1, 2, 6, 12, 24, 48].map(h => (
                          <label key={h} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 'normal', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={form.alert_hours_whatsapp.includes(h)}
                              onChange={e => {
                                const updated = e.target.checked
                                  ? [...form.alert_hours_whatsapp, h].sort((a, b) => a - b)
                                  : form.alert_hours_whatsapp.filter(x => x !== h)
                                setForm({ ...form, alert_hours_whatsapp: updated })
                              }}
                            />
                            {h}h
                          </label>
                        ))}
                      </div>
                      {form.alert_hours_whatsapp.length === 0 && (
                        <p style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '0.3rem' }}>Seleccioná al menos una hora.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setModalError(''); }}>
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
