import { useState, useEffect, useMemo } from 'react'
import { getAuthHeaders } from '../lib/auth'
import ConfirmModal from './ConfirmModal'

const SORT_OPTIONS = {
  'email-asc': { field: 'email', dir: 'asc', label: 'Email (A-Z)' },
  'email-desc': { field: 'email', dir: 'desc', label: 'Email (Z-A)' },
  'phone-asc': { field: 'phone', dir: 'asc', label: 'Teléfono (A-Z)' },
  'phone-desc': { field: 'phone', dir: 'desc', label: 'Teléfono (Z-A)' },
  'created-desc': { field: 'created_at', dir: 'desc', label: 'Más recientes primero' },
  'created-asc': { field: 'created_at', dir: 'asc', label: 'Más antiguos primero' }
}

function ContactsManager() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created-desc')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Estado para modal de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'default',
    confirmText: 'Confirmar'
  })

  const fetchContacts = async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/contacts', { headers })

      if (!res.ok) {
        throw new Error('Error al cargar contactos')
      }

      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      console.error(err)
      setError('Error al cargar contactos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
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

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: newEmail, phone: newPhone || null })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al agregar contacto')
      }

      setNewEmail('')
      setNewPhone('')
      setError('')
      setSuccessMessage('Contacto agregado correctamente')
      fetchContacts()
    } catch (err) {
      console.error(err)
      setError(err.message)
    }
  }

  const handleDelete = (id) => {
    const contact = contacts.find(c => c.id === id)
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Contacto',
      message: `¿Estás seguro de que deseas eliminar el contacto "${contact?.email}"?${contact?.phone ? ` (${contact.phone})` : ''}`,
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: async () => {
        closeConfirmModal()
        try {
          const headers = await getAuthHeaders()
          const res = await fetch(`/api/contacts/${id}`, {
            method: 'DELETE',
            headers
          })

          if (!res.ok) {
            throw new Error('Error al eliminar contacto')
          }

          setSuccessMessage('Contacto eliminado correctamente')
          fetchContacts()
        } catch (err) {
          console.error(err)
          setError(err.message)
        }
      }
    })
  }

  // Alternar un canal para un contacto puntual
  const toggleContactChannel = async (contact, field, value) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ [field]: value })
      })

      if (!res.ok) {
        throw new Error('Error al actualizar contacto')
      }

      const updated = await res.json()
      setContacts(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
      setError('')
      setSuccessMessage('Contacto actualizado correctamente')
    } catch (err) {
      console.error(err)
      setError(err.message)
    }
  }

  // Activar/desactivar un canal para toda la tabla
  const toggleAllChannels = (channel) => {
    const field = channel === 'email' ? 'enabled_email' : 'enabled_whatsapp'
    const label = channel === 'email' ? 'Email' : 'WhatsApp'
    const allEnabled = contacts.length > 0 && contacts.every(c => c[field] !== false)
    const target = !allEnabled

    setConfirmModal({
      isOpen: true,
      title: `${target ? 'Activar' : 'Desactivar'} ${label} para todos`,
      message: `¿Estás seguro de que deseas ${target ? 'activar' : 'desactivar'} el envío por ${label} para todos los contactos (${contacts.length})?`,
      type: target ? 'success' : 'default',
      confirmText: target ? 'Activar' : 'Desactivar',
      onConfirm: async () => {
        closeConfirmModal()
        try {
          const headers = await getAuthHeaders()
          const res = await fetch('/api/contacts/set-all', {
            method: 'POST',
            headers,
            body: JSON.stringify({ [field]: target })
          })

          if (!res.ok) {
            throw new Error('Error al actualizar contactos')
          }

          const updated = await res.json()
          setContacts(Array.isArray(updated) ? updated : [])
          setError('')
          setSuccessMessage(`Envío por ${label} ${target ? 'activado' : 'desactivado'} para todos los contactos`)
        } catch (err) {
          console.error(err)
          setError(err.message)
        }
      }
    })
  }

  // Filtrado por búsqueda y ordenamiento
  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? contacts.filter(c =>
          (c.email || '').toLowerCase().includes(query) ||
          (c.phone || '').toLowerCase().includes(query)
        )
      : contacts

    const { field, dir } = SORT_OPTIONS[sortBy] || SORT_OPTIONS['created-desc']

    return filtered.slice().sort((a, b) => {
      let cmp
      if (field === 'created_at') {
        cmp = new Date(a[field] || 0) - new Date(b[field] || 0)
      } else {
        const av = (a[field] || '').toString().toLowerCase()
        const bv = (b[field] || '').toString().toLowerCase()
        cmp = av < bv ? -1 : av > bv ? 1 : 0
      }
      return dir === 'desc' ? -cmp : cmp
    })
  }, [contacts, search, sortBy])

  const allEmailEnabled = contacts.length > 0 && contacts.every(c => c.enabled_email !== false)
  const allWhatsappEnabled = contacts.length > 0 && contacts.every(c => c.enabled_whatsapp !== false)

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <h1>Lista de Contactos</h1>
      <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
        Contactos para alertas por Email y WhatsApp
      </p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="card">
        <form className="add-form" onSubmit={handleAdd}>
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="+54 9 11 1234-5678 (opcional)"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Agregar</button>
        </form>

        <div className="contacts-toolbar">
          <input
            type="search"
            className="contacts-search"
            placeholder="Buscar por email o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="contacts-sort">
            {Object.entries(SORT_OPTIONS).map(([value, opt]) => (
              <option key={value} value={value}>{opt.label}</option>
            ))}
          </select>
          <div className="contacts-bulk">
            <button
              className={`btn ${allEmailEnabled ? 'btn-secondary' : 'btn-success'}`}
              onClick={() => toggleAllChannels('email')}
              title={allEmailEnabled ? 'Desactivar envío por email para todos' : 'Activar envío por email para todos'}
            >
              {allEmailEnabled ? '✉️ Desactivar Email (todos)' : '✉️ Activar Email (todos)'}
            </button>
            <button
              className={`btn ${allWhatsappEnabled ? 'btn-secondary' : 'btn-success'}`}
              onClick={() => toggleAllChannels('whatsapp')}
              title={allWhatsappEnabled ? 'Desactivar envío por WhatsApp para todos' : 'Activar envío por WhatsApp para todos'}
            >
              {allWhatsappEnabled ? '💬 Desactivar WhatsApp (todos)' : '💬 Activar WhatsApp (todos)'}
            </button>
          </div>
        </div>

        <table className="events-table contacts-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Teléfono</th>
              <th style={{ textAlign: 'center' }}>Email</th>
              <th style={{ textAlign: 'center' }}>WhatsApp</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-results">
                  {contacts.length === 0 ? 'No hay contactos registrados' : 'No se encontraron contactos con la búsqueda actual'}
                </td>
              </tr>
            ) : (
              filteredContacts.map(contact => (
                <tr key={contact.id}>
                  <td>{contact.email}</td>
                  <td>{contact.phone || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="toggle" title={contact.enabled_email !== false ? 'Desactivar envío por email' : 'Activar envío por email'}>
                      <input
                        type="checkbox"
                        checked={contact.enabled_email !== false}
                        onChange={e => toggleContactChannel(contact, 'enabled_email', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label className="toggle" title={contact.enabled_whatsapp !== false ? 'Desactivar envío por WhatsApp' : 'Activar envío por WhatsApp'}>
                      <input
                        type="checkbox"
                        checked={contact.enabled_whatsapp !== false}
                        onChange={e => toggleContactChannel(contact, 'enabled_whatsapp', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td className="actions">
                    <button className="btn btn-danger" onClick={() => handleDelete(contact.id)}>Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmText={confirmModal.confirmText}
        cancelText="Cancelar"
      />
    </div>
  )
}

export default ContactsManager
