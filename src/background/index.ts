import { StorageManager } from '../lib/storage'

const storage = new StorageManager()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PROFILE') {
    storage.getProfile().then(sendResponse)
    return true
  }

  if (message.type === 'GET_SETTINGS') {
    storage.getSettings().then(sendResponse)
    return true
  }

  if (message.type === 'INCREMENT_STATS') {
    storage.incrementStats(message.filterType).then(() => {
      sendResponse({ success: true })
    })
    return true
  }
})

chrome.runtime.onInstalled.addListener(async () => {
  const profile = await storage.getProfile()
  if (!profile) {
    console.log('MBGA installed with default settings')
  }
})
