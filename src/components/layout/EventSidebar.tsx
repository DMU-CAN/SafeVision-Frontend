import type { EventSeverity, SafetyEvent } from '../../types'
import './EventSidebar.css'

const cardClass: Record<EventSeverity, string> = { danger: 'event-card event-card--danger', warning: 'event-card', info: 'event-card' }
const titleClass: Record<EventSeverity, string> = { danger: 'event-card__title event-card__title--danger', warning: 'event-card__title event-card__title--accent', info: 'event-card__title' }
const actionClass: Record<EventSeverity, string> = { danger: 'event-card__action event-card__action--active', warning: 'event-card__action', info: 'event-card__action' }

export function EventSidebar({ events }: { events: SafetyEvent[] }) {
  return <aside className="event-sidebar">
    <div className="event-sidebar__panel-header">실시간 AI 감지 이력 <span className="event-sidebar__badge">NEW {events.length}</span></div>
    <div className="event-sidebar__list">{events.map((event) => <div key={event.id} className={cardClass[event.severity]}>
      <div className={titleClass[event.severity]}>{event.title}</div>
      <p className="event-card__desc">{event.description}</p>
      <div className="event-card__footer"><span className="event-card__meta">{event.meta}</span><button type="button" className={actionClass[event.severity]}>{event.actionLabel}</button></div>
    </div>)}</div>
  </aside>
}
