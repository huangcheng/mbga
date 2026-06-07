import { StorageManager } from '../../lib/storage'
import { collectEvidence, formatEvidenceForReport } from '../../lib/evidence'

const API_BASE = 'https://mbga-edge.your-subdomain.workers.dev' // TODO: Configure

export function addReportButton(panel: HTMLElement, card: HTMLElement): void {
  // Check if already added
  if (panel.querySelector('.mbga-report-btn')) return

  // Get creator/video info
  const spaceLink = card.querySelector('a[href*="space.bilibili.com"]')
  const videoLink = card.querySelector('a[href*="bilibili.com/video/"]')

  const creatorId = spaceLink?.getAttribute('href')?.match(/space\.bilibili\.com\/(\d+)/)?.[1]
  const videoId = videoLink?.getAttribute('href')?.match(/\/video\/(BV[a-zA-Z0-9]+)/)?.[1]

  if (!creatorId && !videoId) return

  // Add separator
  const separator = document.createElement('div')
  separator.className = 'mbga-report-btn'
  separator.style.cssText = 'height: 1px; background: #e3e5e7; margin: 4px 0;'
  panel.appendChild(separator)

  // Add report button
  const reportBtn = document.createElement('div')
  reportBtn.className = 'bili-video-card__info--no-interest-panel--item mbga-report-btn'
  reportBtn.textContent = '📢 举报垃圾内容'
  reportBtn.style.cssText = 'cursor: pointer; padding: 8px 12px; font-size: 12px; color: #f56c6c;'

  reportBtn.addEventListener('click', async (e) => {
    e.stopPropagation()
    e.preventDefault()

    const evidence = collectEvidence(
      card,
      creatorId ? 'creator' : 'video',
      creatorId || videoId!
    )

    try {
      // Get GitHub token from storage
      const result = await chrome.storage.local.get(['github_token'])
      const token = result.github_token

      if (!token) {
        showToast('请先在设置中登录 GitHub', 'error')
        return
      }

      const response = await fetch(`${API_BASE}/v1/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: evidence.type,
          target_id: evidence.target_id,
          reporter_id: token,
          reason: 'spam',
          evidence_text: formatEvidenceForReport(evidence),
        }),
      })

      if (response.ok) {
        showToast('举报已提交，感谢反馈！')
      } else {
        showToast('举报失败，请稍后重试', 'error')
      }
    } catch (error) {
      showToast('网络错误，请稍后重试', 'error')
    }
  })

  panel.appendChild(reportBtn)
}

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#67c23a' : '#f56c6c'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 99999;
  `
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}
