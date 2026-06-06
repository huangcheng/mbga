import { describe, it, expect } from 'vitest'
import type { TypeFilter, KeywordFilter, IDFilter, Profile, StorageSchema } from '../../src/lib/types'

describe('Type definitions', () => {
  it('should allow creating a TypeFilter', () => {
    const filter: TypeFilter = {
      id: 'test-id',
      type: 'live',
      enabled: true,
    }
    expect(filter.type).toBe('live')
  })

  it('should allow creating a KeywordFilter', () => {
    const filter: KeywordFilter = {
      id: 'test-id',
      keyword: '影视飓风',
      matchIn: ['title'],
      caseSensitive: false,
      enabled: true,
    }
    expect(filter.keyword).toBe('影视飓风')
  })

  it('should allow creating an IDFilter', () => {
    const filter: IDFilter = {
      id: 'test-id',
      targetId: '12345678',
      type: 'creator',
      enabled: true,
    }
    expect(filter.type).toBe('creator')
  })
})
