import { describe, expect, it } from 'vitest'
import { createI18n } from '../src'

const resources = {
  en: { translation: { foo: 'bar' } },
  fr: { translation: { foo: 'baz' } },
} as const

describe('createI18n core', () => {
  it('initializes with default language', () => {
    const i18n = createI18n({ resources, defaultLanguage: 'en' })
    expect(i18n.getLanguage()).toBe('en')
  })

  it('changes language and persists', async () => {
    const i18n = createI18n({ resources, defaultLanguage: 'en' })
    await i18n.changeLanguage('fr')
    expect(i18n.getLanguage()).toBe('fr')
  })

  it('isSupportedLanguage returns correct values', () => {
    const i18n = createI18n({ resources, defaultLanguage: 'en' })
    expect(i18n.isSupportedLanguage('en')).toBe(true)
    expect(i18n.isSupportedLanguage('fr')).toBe(true)
    expect(i18n.isSupportedLanguage('es')).toBe(false)
  })
})
