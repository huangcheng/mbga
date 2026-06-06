import React, { useState, useEffect } from 'react'
import './style.css'

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)
  const [pauseUntil, setPauseUntil] = useState<number | null>(null)
  const [stats, setStats] = useState({ totalBlocked: 0, blockedToday: 0 })

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
      if (settings) {
        setEnabled(settings.enabled)
        setPauseUntil(settings.pauseUntil)
      }
    })
    chrome.storage.local.get(['stats'], (result) => {
      if (result.stats) setStats(result.stats)
    })
  }, [])

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

  const isPaused = pauseUntil && Date.now() < pauseUntil

  return (
    <div className="popup">
      <div className="popup-head">
        <div className="logo">
          <div className="logo-icon">M</div>
          <div>
            <div className="logo-text">MBGA</div>
            <div className="logo-sub">Make Bilibili Great Again</div>
          </div>
        </div>
        <div className={`switch ${enabled ? 'on' : ''}`} onClick={handleToggle} />
      </div>
      <div className="popup-body">
        <div className="section">
          <div className="label">暂停过滤</div>
          <div className="btn-row">
            <button className={`btn ${isPaused && pauseUntil === Date.now() + 30*60000 ? 'active' : ''}`} onClick={() => handlePause(30)}>30分钟</button>
            <button className={`btn ${isPaused && pauseUntil === Date.now() + 60*60000 ? 'active' : ''}`} onClick={() => handlePause(60)}>1小时</button>
            <button className={`btn ${isPaused && pauseUntil === Date.now() + 120*60000 ? 'active' : ''}`} onClick={() => handlePause(120)}>2小时</button>
          </div>
        </div>
        <div className="section">
          <div className="label">统计</div>
          <div className="stats">
            <div className="stat"><span>今日屏蔽</span><span className="value accent">{stats.blockedToday}</span></div>
            <div className="stat"><span>累计屏蔽</span><span className="value">{stats.totalBlocked}</span></div>
          </div>
        </div>
      </div>
      <a href="#" className="footer" onClick={() => chrome.runtime.openOptionsPage()}>打开设置 →</a>
    </div>
  )
}

export default IndexPopup
