import { test, expect } from '@playwright/test'

test.describe('MBGA Extension', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.bilibili.com')
    await page.waitForSelector('.bili-video-card')
  })

  test('should hide feed initially', async ({ page }) => {
    const feed = await page.$('.bili-feed-card')
    const visibility = await feed?.evaluate(el =>
      window.getComputedStyle(el).visibility
    )
    expect(visibility).toBe('hidden')
  })

  test('should block live streams when type filter enabled', async ({ page }) => {
    await page.evaluate(() => {
      chrome.storage.local.set({
        profile: {
          id: 'test',
          name: 'Test',
          filters: {
            types: [{ id: '1', type: 'live', enabled: true }],
            keywords: [],
            ids: [],
          },
        },
      })
    })
    await page.reload()
    await page.waitForSelector('.bili-video-card')
    const liveLinks = await page.$$('a[href*="live.bilibili.com"]')
    for (const link of liveLinks) {
      const parent = await link.evaluateHandle(el => el.closest('.bili-video-card'))
      if (parent) {
        const hasOverlay = await parent.evaluate(el =>
          el.querySelector('.mbga-blocked-overlay') !== null
        )
        expect(hasOverlay).toBe(true)
      }
    }
  })
})
