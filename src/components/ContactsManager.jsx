import { useState, useEffect } from 'react'
import { authClient } from '../lib/auth'
import ConfirmModal from './ConfirmModal'

function ContactsManager() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Estado para modal de confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'default'
  })

  // Obtener el token JWT de Better Auth
  const getAuthHeaders = async () => {
    try {
      let token = null;
      if (typeof authClient.getJWTToken === 'function') {
        token = await authClient.getJWTToken();
      }

      if (token && typeof token === 'string' && token !== 'undefined') {
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }
    } catch (err) {
      console.error('Error obteniendo token:', err);
    }
    return { 'Content-Type': 'application/json' };
  }

  const fetchContacts = async () => {
    try {
      const headers = await getAuthHeaders();
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
    setConfirmModal({ ...confirmModal, isOpen: false })
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
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
      onConfirm: async () => {
        closeConfirmModal()
        try {
          const headers = await getAuthHeaders();
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

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div>
      <h1>Lista de Contactos</h1>
      <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
        Contactos para alertas por Email (Resend) y WhatsApp (CallMeBot)
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

        <div className="contacts-list">
          {contacts.length === 0 ? (
            <p>No hay contactos registrados</p>
          ) : (
            contacts.map(contact => (
              <div key={contact.id} className="contact-item">
                <div className="contact-info">
                  <span className="contact-email">{contact.email}</span>
                  {contact.phone && <span className="contact-phone">{contact.phone}</span>}
                </div>
                <button className="btn btn-danger" onClick={() => handleDelete(contact.id)}>
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  )
}

export default ContactsManager