import { describe, it, expect } from 'vitest'
import { isAdvertisement } from '../../../src/contents/filters/ad-filter'

describe('Ad Filter', () => {
  it('should detect ad by URL', () => {
    const element = document.createElement('div')
    const link = document.createElement('a')
    link.href = 'https://cm.bilibili.com/some-ad'
    element.appendChild(link)
    expect(isAdvertisement(element)).toBe(true)
  })

  it('should detect ad by class', () => {
    const element = document.createElement('div')
    element.className = 'bili-video-card__wrap ad-card'
    expect(isAdvertisement(element)).toBe(true)
  })

  it('should not detect regular content as ad', () => {
    const element = document.createElement('div')
    element.className = 'bili-video-card__wrap'
    const link = document.createElement('a')
    link.href = 'https://www.bilibili.com/video/BV1234567890'
    element.appendChild(link)
    expect(isAdvertisement(element)).toBe(false)
  })
})
