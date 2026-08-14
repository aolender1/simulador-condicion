import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'

function Calendar() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [completedEvents, setCompletedEvents] = useState(() => {
    const saved = localStorage.getItem('completedEvents')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(e => {
          const startTs = new Date(e.start_date).getTime()
          const endTs = new Date(e.end_date).getTime()
          const sameDateTime = startTs === endTs

          const startDateObj = new Date(e.start_date)
          const endDateObj = new Date(e.end_date)

          // FullCalendar treats `end` as exclusive and may push an event into the next day
          // if the end time is late (e.g. 23:59). To prevent this, when start and end fall
          // on the same calendar day, we pass end as null so FullCalendar renders it as a
          // single-day event without bleeding into the next column.
          const sameCalendarDay =
            startDateObj.getFullYear() === endDateObj.getFullYear() &&
            startDateObj.getMonth() === endDateObj.getMonth() &&
            startDateObj.getDate() === endDateObj.getDate()

          return {
            id: e.id,
            title: e.title,
            start: sameDateTime ? e.end_date : e.start_date,
            end: (sameDateTime || sameCalendarDay) ? null : e.end_date,
            backgroundColor: e.color,
            borderColor: e.color,
            extendedProps: {
              materia: e.materia,
              estado_alerta: e.estado_alerta,
              startDate: e.start_date,
              endDate: e.end_date,
              sameDateTime
            }
          }
        })
        setEvents(formatted)
      })
      .catch(err => console.error('Error loading events:', err))
  }, [])

  const handleEventClick = (info) => {
    const event = info.event
    setSelectedEvent({
      id: event.id,
      title: event.title,
      materia: event.extendedProps.materia,
      start: new Date(event.extendedProps.endDate),
      end: event.extendedProps.sameDateTime ? null : new Date(event.extendedProps.endDate),
      startDate: new Date(event.extendedProps.startDate),
      endDate: new Date(event.extendedProps.endDate),
      sameDateTime: event.extendedProps.sameDateTime,
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
    <section className="calendar-section" style={{ padding: 0 }}>
      <div className="calendar-container">
        <h3>Calendario de Eventos</h3>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView={window.innerWidth < 640 ? 'listMonth' : 'dayGridMonth'}
          locale={esLocale}
          timeZone="local"
          headerToolbar={window.innerWidth < 640 ? {
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,listMonth'
          } : {
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
          slotMinTime="07:00:00"
          slotMaxTime="24:00:00"
          scrollTime="08:00:00"
          events={events}
          eventClick={handleEventClick}
          eventClassNames={(arg) =>
            completedEvents.includes(arg.event.id) ? ['completed'] : []
          }
          eventContent={(arg) => {
            const isMobile = window.innerWidth < 640
            let time = '';
            if (arg.event.start) {
              time = new Date(arg.event.start).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }
            // On mobile month view: show only the hour dot to avoid overflow
            if (isMobile && arg.view.type === 'dayGridMonth') {
              return (
                <div style={{
                  backgroundColor: arg.event.backgroundColor,
                  color: 'white',
                  borderRadius: '3px',
                  padding: '1px 3px',
                  fontSize: '0.7em',
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  lineHeight: '1.4'
                }}>
                  {time}
                </div>
              );
            }
            return (
              <div className="fc-event-main-frame" style={{ backgroundColor: arg.event.backgroundColor, borderColor: arg.event.borderColor, color: 'white', padding: '2px 4px', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                {time && <div className="fc-event-time" style={{ fontWeight: 'bold', fontSize: '0.85em' }}>{time}</div>}
                <div className="fc-event-title-container" style={{ marginTop: '2px' }}>
                  <div className="fc-event-title fc-sticky" style={{ fontSize: '0.9em', lineHeight: '1.3', whiteSpace: 'normal' }}>
                    <strong>{arg.event.extendedProps.materia}</strong>: {arg.event.title}
                  </div>
                </div>
              </div>
            );
          }}
          height="auto"
        />
      </div>

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
                  <p>{formatDate(selectedEvent.endDate)}</p>
                </div>
              </div>
              <div className="modal-detail-item">
                <span className="modal-icon">🕐</span>
                <div>
                  <strong>Hora</strong>
                  {selectedEvent.sameDateTime
                    ? <p>{formatTime(selectedEvent.endDate)}</p>
                    : <p>{formatTime(selectedEvent.startDate)} - {formatTime(selectedEvent.endDate)}</p>
                  }
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
    </section>
  )
}

export default Calendar
