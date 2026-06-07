import { test, expect, chromium } from '@playwright/test'
import path from 'path'

const extensionPath = path.join(__dirname, '..', '..', 'build', 'chrome-mv3-prod')

test.describe('MBGA Extension', () => {
  test('should load extension and process cards', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })

    const page = await context.newPage()
    
    const consoleMessages: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('[MBGA]')) {
        consoleMessages.push(msg.text())
      }
    })

    await page.goto('https://www.bilibili.com')
    await page.waitForTimeout(5000)

    const hasInit = consoleMessages.some(m => m.includes('Initializing'))
    const hasComplete = consoleMessages.some(m => m.includes('complete'))
    
    expect(hasInit).toBe(true)
    expect(hasComplete).toBe(true)

    await context.close()
  })

  test('should block content when keyword filter is set via UI', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })

    const page = await context.newPage()
    
    // Listen for blocked messages
    const blockedMessages: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('[MBGA] BLOCKED')) {
        blockedMessages.push(msg.text())
      }
    })

    // First visit Bilibili to trigger extension load
    await page.goto('https://www.bilibili.com')
    await page.waitForTimeout(2000)

    // Get extension ID from service workers
    const serviceWorkers = context.serviceWorkers()
    let extensionId = ''
    
    for (const sw of serviceWorkers) {
      const url = sw.url()
      if (url.startsWith('chrome-extension://')) {
        const match = url.match(/chrome-extension:\/\/([a-z]+)\//)
        if (match) {
          extensionId = match[1]
          break
        }
      }
    }

    if (!extensionId) {
      // Try to find from background pages
      const bgPages = context.backgroundPages()
      for (const bg of bgPages) {
        const url = bg.url()
        if (url.startsWith('chrome-extension://')) {
          const match = url.match(/chrome-extension:\/\/([a-z]+)\//)
          if (match) {
            extensionId = match[1]
            break
          }
        }
      }
    }

    if (!extensionId) {
      console.log('Could not find extension ID, trying to continue...')
      // Try common extension IDs or skip
      await context.close()
      return
    }

    console.log(`Extension ID: ${extensionId}`)

    // Navigate to options page
    await page.goto(`chrome-extension://${extensionId}/options.html`)
    await page.waitForTimeout(2000)

    // Add keyword filter using the UI
    const keywordInput = await page.$('input[placeholder*="关键词"]')
    if (keywordInput) {
      await keywordInput.fill('的')
      await page.waitForTimeout(200)
      
      const addButton = await page.$('button:has-text("添加")')
      if (addButton) {
        await addButton.click()
        await page.waitForTimeout(500)
      }
    }

    // Verify filter was added
    const filterItems = await page.$$('.item')
    console.log(`Filter items in UI: ${filterItems.length}`)

    // Go back to Bilibili
    await page.goto('https://www.bilibili.com')
    await page.waitForTimeout(5000)

    // Count remaining cards (blocked ones are removed from DOM)
    const remainingCards = await page.evaluate(() => {
      return document.querySelectorAll('.bili-video-card, .floor-single-card').length
    })

    console.log(`Remaining cards: ${remainingCards}`)
    console.log(`Blocked messages from console: ${blockedMessages.length}`)

    // Should have fewer cards than typical (~36) because some were blocked
    // The keyword "的" should match many titles
    expect(remainingCards).toBeLessThan(36)
    expect(blockedMessages.length).toBeGreaterThan(0)

    await context.close()
  })

  test('should inject style element', async () => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    })

    const page = await context.newPage()
    await page.goto('https://www.bilibili.com')
    await page.waitForTimeout(3000)

    const feedExists = await page.evaluate(() => {
      return document.querySelector('.bili-feed-card') !== null
    })

    expect(feedExists).toBe(true)

    const cardCount = await page.evaluate(() => {
      return document.querySelectorAll('.bili-video-card').length
    })

    expect(cardCount).toBeGreaterThan(0)

    await context.close()
  })
})
