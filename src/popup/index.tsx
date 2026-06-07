import React, { useState, useEffect } from 'react'
import { applyTheme, listenToSystemThemeChanges, type Theme } from '../lib/theme'
import './style.css'

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)
  const [pauseUntil, setPauseUntil] = useState<number | null>(null)
  const [stats, setStats] = useState({ totalBlocked: 0, blockedToday: 0 })
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
      if (settings) {
        setEnabled(settings.enabled)
        setPauseUntil(settings.pauseUntil)
      }
    })
    chrome.storage.local.get(['stats', 'theme'], (result) => {
      if (result.stats) setStats(result.stats)
      const savedTheme = result.theme || 'system'
      setTheme(savedTheme)
      applyTheme(savedTheme)
    })
  }, [])

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return
    const unsubscribe = listenToSystemThemeChanges(() => {
      applyTheme('system')
    })
    return unsubscribe
  }, [theme])

  const handleToggle = () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { enabled: newEnabled } })
  }

  const handlePause = (minutes: number) => {
    const until = Date.now() + minutes * 60000
    setPauseUntil(until)
    chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { pauseUntil: until } })
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    chrome.storage.local.set({ theme: newTheme })
  }

  const isPaused = pauseUntil && Date.now() < pauseUntil

  return (
    <div className="popup">
      <div className="popup-head">
        <div className="logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">MBGA</div>
            <div className="logo-sub">Make Bilibili Great Again</div>
          </div>
        </div>
        <div className="theme-switch">
          <button
            className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
            onClick={() => handleThemeChange('system')}
            title="跟随系统"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          <button
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
            title="浅色模式"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </button>
          <button
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
            title="深色模式"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
        </div>
        <div className={`switch ${enabled ? 'on' : ''}`} onClick={handleToggle} role="switch" aria-checked={enabled}>
          <div className="switch-knob" />
        </div>
      </div>
      <div className="popup-body">
        <div className="section">
          <div className="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            暂停过滤
          </div>
          <div className="btn-row">
            <button className={`btn ${isPaused && pauseUntil === Date.now() + 30*60000 ? 'active' : ''}`} onClick={() => handlePause(30)}>30分钟</button>
            <button className={`btn ${isPaused && pauseUntil === Date.now() + 60*60000 ? 'active' : ''}`} onClick={() => handlePause(60)}>1小时</button>
            <button className={`btn ${isPaused && pauseUntil === Date.now() + 120*60000 ? 'active' : ''}`} onClick={() => handlePause(120)}>2小时</button>
          </div>
          {isPaused && (
            <div className="pause-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
              过滤已暂停
            </div>
          )}
        </div>
        <div className="section">
          <div className="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10"/>
              <path d="M18 20V4"/>
              <path d="M6 20v-4"/>
            </svg>
            统计
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-label">
                <span className="stat-dot blue" />
                今日屏蔽
              </span>
              <span className="value accent">{stats.blockedToday}</span>
            </div>
            <div className="stat">
              <span className="stat-label">
                <span className="stat-dot pink" />
                累计屏蔽
              </span>
              <span className="value">{stats.totalBlocked}</span>
            </div>
          </div>
        </div>
      </div>
      <a href="#" className="footer" onClick={() => chrome.runtime.openOptionsPage()}>
        <span>打开设置</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>
  )
}

export default IndexPopup
