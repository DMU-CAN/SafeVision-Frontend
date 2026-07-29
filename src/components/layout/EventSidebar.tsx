import type { EventSeverity, SafetyEvent } from '../../types'
import './EventSidebar.css'

const cardClass: Record<EventSeverity, string> = { danger: 'event-card event-card--danger', warning: 'event-card', info: 'event-card' }
const titleClass: Record<EventSeverity, string> = { danger: 'event-card__title event-card__title--danger', warning: 'event-card__title event-card__title--accent', info: 'event-card__title' }
const actionClass: Record<EventSeverity, string> = { danger: 'event-card__action event-card__action--active', warning: 'event-card__action', info: 'event-card__action' }

interface EventSidebarProps {
  events: SafetyEvent[]
  loading?: boolean
  error?: string | null
  onPlayClip?: (clipUrl: string) => void
}

export function EventSidebar({ events, loading, error, onPlayClip }: EventSidebarProps) {
  return <aside className="event-sidebar">
    <div className="event-sidebar__panel-header">실시간 AI 감지 이력 <span className="event-sidebar__badge">NEW {events.length}</span></div>
    <div className="event-sidebar__list">
      {loading && <div className="event-sidebar__state">불러오는 중...</div>}
      {!loading && error && <div className="event-sidebar__state event-sidebar__state--error">{error}</div>}
      {!loading && !error && events.length === 0 && <div className="event-sidebar__state">표시할 이벤트가 없습니다.</div>}
      {!loading && !error && events.map((event) => <div key={event.id} className={cardClass[event.severity]}>
        <div className={titleClass[event.severity]}>{event.title}</div>
        <p className="event-card__desc">{event.description}</p>
        <div className="event-card__footer">
          <span className="event-card__meta">{event.meta}</span>
          <button
            type="button"
            className={actionClass[event.severity]}
            disabled={!event.clipUrl}
            onClick={() => event.clipUrl && onPlayClip?.(event.clipUrl)}
          >
            {event.clipUrl ? event.actionLabel : '영상 준비중'}
          </button>
        </div>
      </div>)}
    </div>
  </aside>
}
