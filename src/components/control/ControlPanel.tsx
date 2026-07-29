import { api } from '../../api/client'
import './ControlPanel.css'

export function ControlPanel() {
  const control = (action: 'stop' | 'slow' | 'resume') => api.post(`/equipment/${action}`, {}).catch(() => undefined)

  return <section className="control-panel">
    <div className="control-panel__section">
      <h3>설비 제어</h3>
      <div className="control-panel__actions">
        <button type="button" className="danger" onClick={() => control('stop')}>정지</button>
        <button type="button" onClick={() => control('slow')}>감속</button>
        <button type="button" onClick={() => control('resume')}>재가동</button>
      </div>
    </div>
  </section>
}
