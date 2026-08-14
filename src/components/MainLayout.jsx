import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

function MainLayout() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    document.body.className = isDark ? 'dark-theme' : ''
  }, [isDark])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  const closeMenu = () => setMobileMenuOpen(false)

  const navLinkClass = ({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`

  return (
    <div className="app-wrapper">
      <header>
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Abrir menú"
        >
          <span className={`hamburger-icon ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span><span></span><span></span>
          </span>
        </button>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(c => !c)}
          aria-label={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
          title={sidebarCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
        >
          {sidebarCollapsed ? '☰' : '◀'}
        </button>
        <h1>Licenciatura en Analisis y Gestion de Datos - UNSL</h1>
        <div className="header-actions">
          <NavLink to="/login" className="admin-link">⚙️</NavLink>
          <button className="theme-btn" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <div className="main-layout">
        <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <NavLink to="/" end className={navLinkClass} onClick={closeMenu}>
            📅 Calendario de Eventos
          </NavLink>
          <NavLink to="/correlatividades" className={navLinkClass} onClick={closeMenu}>
            📚 Correlatividades
          </NavLink>
          <NavLink to="/calculadora" className={navLinkClass} onClick={closeMenu}>
            🧮 Calculadora de Condición
          </NavLink>
          <NavLink to="/calendario-academico" className={navLinkClass} onClick={closeMenu}>
            📆 Calendario Académico
          </NavLink>
        </aside>

        <div className="app-content">
          <Outlet />
        </div>
      </div>

      <footer>
        <p>
          Licenciatura en Analisis y Gestion de Datos -
          Desarrollado por <a href="https://github.com/aolender1" target="_blank" rel="noopener noreferrer">Alberto Olender</a>
        </p>
      </footer>
    </div>
  )
}

export default MainLayout
