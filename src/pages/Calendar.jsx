import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'
import Calculadora from '../components/Calculadora'

function Calendar() {
  const [events, setEvents] = useState([])
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [completedEvents, setCompletedEvents] = useState(() => {
    const saved = localStorage.getItem('completedEvents')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    document.body.className = isDark ? 'dark-theme' : ''
  }, [isDark])

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start_date,
          end: e.end_date,
          backgroundColor: e.color,
          borderColor: e.color,
          extendedProps: {
            materia: e.materia,
            estado_alerta: e.estado_alerta
          }
        }))
        setEvents(formatted)
      })
      .catch(err => console.error('Error loading events:', err))
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  const handleEventClick = (info) => {
    const event = info.event
    setSelectedEvent({
      id: event.id,
      title: event.title,
      materia: event.extendedProps.materia,
      start: event.start,
      end: event.end,
      color: event.backgroundColor
    })
  }

  const toggleEventComplete = (eventId) => {
    const updated = completedEvents.includes(eventId)
      ? completedEvents.filter(id => id !== eventId)
      : [...completedEvents, eventId]
    setCompletedEvents(updated)
    localStorage.setItem('completedEvents', JSON.stringify(updated))
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <>
      <header>
        <h1>Cronograma y Simulador de Condicion para la Licenciatura en Analisis y Gestion de Datos</h1>
        <div className="header-actions">
          <Link to="/login" className="admin-link">⚙️</Link>
          <button className="theme-btn" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <section className="calendar-section">
        <div className="calendar-container">
          <h3>Calendario de Eventos</h3>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            timeZone="local"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listMonth'
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              list: 'Agenda',
              prev: '◀',
              next: '▶'
            }}
            events={events}
            eventClick={handleEventClick}
            eventClassNames={(arg) =>
              completedEvents.includes(arg.event.id) ? ['completed'] : []
            }
            eventContent={(arg) => {
              const time = new Date(arg.event.start).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
              return {
                html: `
                  <div class="fc-event-main-frame" style="background-color: ${arg.event.backgroundColor}; border-color: ${arg.event.borderColor}; color: white; padding: 2px 4px; border-radius: 3px;">
                    <div class="fc-event-time" style="font-weight: bold; font-size: 0.85em;">${time}</div>
                    <div class="fc-event-title-container" style="margin-top: 2px;">
                      <div class="fc-event-title fc-sticky" style="font-size: 0.9em; line-height: 1.3;">
                        <strong>${arg.event.extendedProps.materia}</strong>: ${arg.event.title}
                      </div>
                    </div>
                  </div>
                `
              };
            }}
            height="auto"
          />
        </div>
      </section>

      <Calculadora />

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setSelectedEvent(null)}>&times;</span>
            <h2 className="modal-materia" style={{ color: selectedEvent.color }}>
              {selectedEvent.materia}
            </h2>
            <p className="modal-title">{selectedEvent.title}</p>
            <div className="modal-details">
              <div className="modal-detail-item">
                <span className="modal-icon">📅</span>
                <div>
                  <strong>Fecha</strong>
                  <p>{formatDate(selectedEvent.start)}</p>
                </div>
              </div>
              <div className="modal-detail-item">
                <span className="modal-icon">🕐</span>
                <div>
                  <strong>Hora</strong>
                  <p>{formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</p>
                </div>
              </div>
            </div>
            <div className="modal-checkbox-container" onClick={() => toggleEventComplete(selectedEvent.id)}>
              <input
                type="checkbox"
                checked={completedEvents.includes(selectedEvent.id)}
                onChange={() => { }}
              />
              <label>Marcar como completado</label>
            </div>
          </div>
        </div>
      )}

      <footer>
        <p>
          Licenciatura en Analisis y Gestion de Datos -
          Desarrollado por <a href="https://github.com/aolender1" target="_blank" rel="noopener noreferrer">Alberto Olender</a>
        </p>
      </footer>
    </>
  )
}

export default Calendar