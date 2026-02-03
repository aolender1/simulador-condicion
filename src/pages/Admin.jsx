import { Routes, Route, NavLink } from 'react-router-dom'
import EventsManager from '../components/EventsManager'
import ContactsManager from '../components/ContactsManager'

function Admin({ user, onLogout }) {
  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2>Panel Admin</h2>
        <p style={{ marginBottom: '1rem', opacity: 0.7 }}>{user.name || user.email}</p>
        <nav>
          <ul>
            <li>
              <NavLink to="/admin" end>Eventos</NavLink>
            </li>
            <li>
              <NavLink to="/admin/contactos">Lista de Contactos</NavLink>
            </li>
            <li style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <NavLink to="/">🏠 Volver al Calendario</NavLink>
            </li>
          </ul>
        </nav>
        <button className="btn btn-danger logout-btn" onClick={onLogout}>
          Cerrar Sesión
        </button>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<EventsManager />} />
          <Route path="contactos" element={<ContactsManager />} />
        </Routes>
      </main>
    </div>
  )
}

export default Admin