import { navTabs } from '../../data/mockData'
import './Header.css'

interface HeaderProps {
  activeTab: string
  now: string
  operatorName: string
  onTabChange: (tab: string) => void
  onLogout?: () => void
}

export function Header({ activeTab, now, operatorName, onTabChange, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo">🛡️ SAFE-VISION</span>
        <span className="app-header__version">v2.4 Control Center</span>
      </div>

      <nav className="app-header__tabs">
        {navTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'nav-tab nav-tab--active' : 'nav-tab'}
            onClick={() => onTabChange(tab)}
            aria-current={tab === activeTab ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="app-header__status">
        <span>{now}</span>
        <span className="status-dot" />
        <span>관제원: {operatorName}</span>
        {onLogout && (
          <button type="button" className="app-header__logout" onClick={onLogout}>로그아웃</button>
        )}
      </div>
    </header>
  )
}
