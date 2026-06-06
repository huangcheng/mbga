import React, { useState, useEffect } from 'react'
import { StorageManager } from '../lib/storage'
import type { Profile } from '../lib/types'
import './style.css'

const storage = new StorageManager()

function OptionsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [newId, setNewId] = useState('')
  const [idType, setIdType] = useState<'video' | 'creator'>('creator')

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const p = await storage.getProfile()
    setProfile(p)
  }

  const handleAddType = async (type: string) => {
    await storage.addTypeFilter({ type: type as any, enabled: true })
    await loadProfile()
  }

  const handleAddKeyword = async () => {
    if (!newKeyword) return
    await storage.addKeywordFilter({ keyword: newKeyword, matchIn: ['title', 'author'], caseSensitive: false, enabled: true })
    setNewKeyword('')
    await loadProfile()
  }

  const handleAddId = async () => {
    if (!newId) return
    await storage.addIDFilter({ targetId: newId, type: idType, enabled: true })
    setNewId('')
    await loadProfile()
  }

  const handleDelete = async (type: string, id: string) => {
    if (type === 'type') await storage.deleteTypeFilter(id)
    if (type === 'keyword') await storage.deleteKeywordFilter(id)
    if (type === 'id') await storage.deleteIDFilter(id)
    await loadProfile()
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="options">
      <div className="page-head">
        <h1>Make Bilibili Great Again</h1>
        <p>管理你的过滤规则</p>
      </div>
      <div className="tabs">
        <div className="tab active">过滤规则</div>
        <div className="tab">导入导出</div>
      </div>
      <div className="card">
        <h3>屏蔽内容类型</h3>
        <div className="tags">
          {['video', 'live', 'course', 'bangumi', 'article', 'dynamic', 'ad'].map(type => (
            <div key={type} className={`tag ${profile.filters.types.some(f => f.type === type) ? 'on' : ''}`} onClick={() => handleAddType(type)}>
              {type === 'video' ? '视频' : type === 'live' ? '直播' : type === 'course' ? '课堂' : type === 'bangumi' ? '番剧' : type === 'article' ? '专栏' : type === 'dynamic' ? '动态' : '广告'}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>关键词屏蔽</h3>
        <div className="input-row">
          <input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="输入关键词..." />
          <button onClick={handleAddKeyword}>添加</button>
        </div>
        <div className="items">
          {profile.filters.keywords.map(f => (
            <div key={f.id} className="item">
              <span>{f.keyword}</span>
              <span className="del" onClick={() => handleDelete('keyword', f.id)}>×</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>UP主 / 视频黑名单</h3>
        <div className="input-row">
          <select value={idType} onChange={e => setIdType(e.target.value as any)}>
            <option value="creator">UP主</option>
            <option value="video">视频</option>
          </select>
          <input value={newId} onChange={e => setNewId(e.target.value)} placeholder="输入ID或BV号..." />
          <button onClick={handleAddId}>添加</button>
        </div>
        <div className="items">
          {profile.filters.ids.map(f => (
            <div key={f.id} className="item">
              <span><span className="sub">{f.type === 'creator' ? 'UP主' : 'BV'}</span>{f.targetId}</span>
              <span className="del" onClick={() => handleDelete('id', f.id)}>×</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OptionsPage
