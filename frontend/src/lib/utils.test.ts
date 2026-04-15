import { describe, expect, it } from 'vitest'
import { formatDate } from './utils'

describe('formatDate', () => {
  it('returns a fallback when the date is invalid', () => {
    expect(formatDate('')).toBe('Data indisponível')
    expect(formatDate(undefined)).toBe('Data indisponível')
  })

  it('formats valid dates in pt-BR', () => {
    expect(formatDate('2026-04-14T10:30:00.000Z')).not.toBe('Data indisponível')
  })
})
