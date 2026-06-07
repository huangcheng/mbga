import React, { useState, useEffect } from 'react'
import { StorageManager } from '../lib/storage'
import { importBilibiliBlacklist } from '../lib/bilibili-api'
import { applyTheme, listenToSystemThemeChanges, type Theme } from '../lib/theme'
import type { Profile } from '../lib/types'
import './style.css'

const storage = new StorageManager()

const contentTypes = [
  { id: 'video', label: '视频', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )},
  { id: 'live', label: '直播', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  )},
  { id: 'course', label: '课堂', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )},
  { id: 'bangumi', label: '番剧', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
      <line x1="7" y1="2" x2="7" y2="22"/>
      <line x1="17" y1="2" x2="17" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="2" y1="7" x2="7" y2="7"/>
      <line x1="2" y1="17" x2="7" y2="17"/>
      <line x1="17" y1="17" x2="22" y2="17"/>
      <line x1="17" y1="7" x2="22" y2="7"/>
    </svg>
  )},
  { id: 'article', label: '专栏', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )},
  { id: 'dynamic', label: '动态', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )},
  { id: 'ad', label: '广告', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )},
  { id: 'esports', label: '赛事', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  )},
  { id: 'variety', label: '综艺', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  )},
]

function OptionsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<'filters' | 'import-export'>('filters')
  const [newKeyword, setNewKeyword] = useState('')
  const [newCreatorId, setNewCreatorId] = useState('')
  const [newVideoId, setNewVideoId] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    loadProfile()
    // Load saved theme
    chrome.storage.local.get(['theme'], (result) => {
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

  const loadProfile = async () => {
    const p = await storage.getProfile()
    setProfile(p)
  }

  const handleAddType = async (type: string) => {
    const existingFilter = profile?.filters.types.find(f => f.type === type)
    if (existingFilter) {
      await storage.deleteTypeFilter(existingFilter.id)
    } else {
      await storage.addTypeFilter({ type: type as any, enabled: true })
    }
    await loadProfile()
  }

  const handleAddKeyword = async () => {
    if (!newKeyword) return
    await storage.addKeywordFilter({ keyword: newKeyword, matchIn: ['title', 'author'], caseSensitive: false, enabled: true })
    setNewKeyword('')
    await loadProfile()
  }

  const handleAddCreator = async () => {
    if (!newCreatorId) return
    await storage.addIDFilter({ targetId: newCreatorId, type: 'creator', enabled: true })
    setNewCreatorId('')
    await loadProfile()
  }

  const handleAddVideo = async () => {
    if (!newVideoId) return
    await storage.addIDFilter({ targetId: newVideoId, type: 'video', enabled: true })
    setNewVideoId('')
    await loadProfile()
  }

  const handleDelete = async (type: string, id: string) => {
    if (type === 'type') await storage.deleteTypeFilter(id)
    if (type === 'keyword') await storage.deleteKeywordFilter(id)
    if (type === 'id') await storage.deleteIDFilter(id)
    await loadProfile()
  }

  const handleImportBlacklist = async () => {
    setImporting(true)
    setImportResult(null)
    
    try {
      const result = await importBilibiliBlacklist()
      setImportResult(`成功导入 ${result.imported} 个UP主（共 ${result.total} 个）`)
      await loadProfile()
    } catch (error) {
      setImportResult(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setImporting(false)
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    chrome.storage.local.set({ theme: newTheme })
  }

  const handleExport = async () => {
    try {
      const data = await storage.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mbga-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await storage.importData(text)
      await loadProfile()
      setImportResult('导入成功！')
    } catch (error) {
      setImportResult(`导入失败: ${error instanceof Error ? error.message : '文件格式错误'}`)
    }
    // Reset file input
    e.target.value = ''
  }

  if (!profile) return (
    <div className="options-loading">
      <div className="loading-spinner" />
      <span>加载中...</span>
    </div>
  )

  return (
    <div className="options">
      <div className="page-head">
        <div className="page-head-logo">
          <div className="page-head-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1>Make Bilibili Great Again</h1>
            <p>管理你的过滤规则</p>
          </div>
        </div>
      </div>
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'filters' ? 'active' : ''}`} 
          onClick={() => setActiveTab('filters')}
        >
          过滤规则
        </div>
        <div 
          className={`tab ${activeTab === 'import-export' ? 'active' : ''}`}
          onClick={() => setActiveTab('import-export')}
        >
          导入导出
        </div>
      </div>
      
      {/* Theme Settings - Always visible */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon settings-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h3>外观设置</h3>
        </div>
        <div className="theme-options">
          <div className="theme-label">主题模式</div>
          <div className="theme-switch">
            <button
              className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
              onClick={() => handleThemeChange('system')}
              title="跟随系统"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span>跟随系统</span>
            </button>
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
              title="浅色模式"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <span>浅色</span>
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
              title="深色模式"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <span>深色</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters Tab */}
      {activeTab === 'filters' && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="card-icon type-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              </div>
              <h3>屏蔽内容类型</h3>
            </div>
        <div className="tags">
          {contentTypes.map(({ id, label, icon }) => (
            <div 
              key={id} 
              className={`tag ${profile.filters.types.some(f => f.type === id) ? 'on' : ''}`} 
              onClick={() => handleAddType(id)}
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-icon keyword-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h3>关键词屏蔽</h3>
        </div>
        <div className="input-row">
          <input 
            value={newKeyword} 
            onChange={e => setNewKeyword(e.target.value)} 
            placeholder="输入关键词..."
            onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
          />
          <button onClick={handleAddKeyword}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加
          </button>
        </div>
        <div className="items">
          {profile.filters.keywords.map(f => (
            <div key={f.id} className="item">
              <span className="item-text">{f.keyword}</span>
              <button className="del" onClick={() => handleDelete('keyword', f.id)} aria-label="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
          {profile.filters.keywords.length === 0 && (
            <div className="empty-state">暂无关键词过滤规则</div>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-icon creator-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h3>UP主黑名单</h3>
        </div>
        <div className="input-row">
          <input 
            value={newCreatorId} 
            onChange={e => setNewCreatorId(e.target.value)} 
            placeholder="输入UP主ID..."
            onKeyDown={e => e.key === 'Enter' && handleAddCreator()}
          />
          <button onClick={handleAddCreator}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加
          </button>
        </div>
        <div className="import-section">
          <button 
            onClick={handleImportBlacklist} 
            disabled={importing}
            className="btn-import"
          >
            {importing ? (
              <>
                <div className="btn-spinner" />
                导入中...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                从B站导入黑名单
              </>
            )}
          </button>
          {importResult && (
            <div className={`import-result ${importResult.includes('成功') ? 'success' : 'error'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {importResult.includes('成功') ? (
                  <polyline points="20 6 9 17 4 12"/>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </>
                )}
              </svg>
              {importResult}
            </div>
          )}
        </div>
        <div className="items">
          {profile.filters.ids.filter(f => f.type === 'creator').map(f => (
            <div key={f.id} className="item">
              <span className="item-text">
                <span className="sub">UP主</span>
                {f.targetId}
              </span>
              <button className="del" onClick={() => handleDelete('id', f.id)} aria-label="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
          {profile.filters.ids.filter(f => f.type === 'creator').length === 0 && (
            <div className="empty-state">暂无UP主黑名单</div>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-icon video-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
              <line x1="7" y1="2" x2="7" y2="22"/>
              <line x1="17" y1="2" x2="17" y2="22"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="2" y1="7" x2="7" y2="7"/>
              <line x1="2" y1="17" x2="7" y2="17"/>
              <line x1="17" y1="17" x2="22" y2="17"/>
              <line x1="17" y1="7" x2="22" y2="7"/>
            </svg>
          </div>
          <h3>视频黑名单</h3>
        </div>
        <div className="input-row">
          <input 
            value={newVideoId} 
            onChange={e => setNewVideoId(e.target.value)} 
            placeholder="输入BV号..."
            onKeyDown={e => e.key === 'Enter' && handleAddVideo()}
          />
          <button onClick={handleAddVideo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            添加
          </button>
        </div>
        <div className="items">
          {profile.filters.ids.filter(f => f.type === 'video').map(f => (
            <div key={f.id} className="item">
              <span className="item-text">
                <span className="sub">BV</span>
                {f.targetId}
              </span>
              <button className="del" onClick={() => handleDelete('id', f.id)} aria-label="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
          {profile.filters.ids.filter(f => f.type === 'video').length === 0 && (
            <div className="empty-state">暂无视频黑名单</div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="card-icon export-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>导出数据</h3>
            </div>
            <p className="card-desc">导出你的过滤规则和设置为 JSON 文件，用于备份或分享。</p>
            <button className="btn-export" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出配置
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon import-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h3>导入数据</h3>
            </div>
            <p className="card-desc">从 JSON 文件导入过滤规则和设置。这将覆盖当前配置。</p>
            <label className="btn-import">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              选择文件导入
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            {importResult && (
              <div className={`import-result ${importResult.includes('成功') ? 'success' : 'error'}`}>
                {importResult}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon bilibili-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3>从B站导入黑名单</h3>
            </div>
            <p className="card-desc">导入你在B站拉黑的UP主列表。需要登录B站账号。</p>
            <button 
              className="btn-import-bilibili" 
              onClick={handleImportBlacklist}
              disabled={importing}
            >
              {importing ? '导入中...' : '导入B站黑名单'}
            </button>
            {importResult && importResult.includes('UP主') && (
              <div className="import-result success">
                {importResult}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default OptionsPage
