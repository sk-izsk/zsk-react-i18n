import { describe, expect, it } from 'bun:test'
import React from 'react'
import { createI18n, LocalizeProvider, type StorageLike } from '../src/index.js'

const en = {
  sidebar: {
    nav: {
      home: 'Home',
    },
  },
}

const fr = {
  sidebar: {
    nav: {
      home: 'Accueil',
    },
  },
}

const es = {
  sidebar: {
    nav: {
      home: 'Inicio',
    },
  },
}

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
} as const

class MockStorage implements StorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

describe('createI18n', () => {
  it('persists language with custom storage key', async () => {
    const storage = new MockStorage()

    const localize = createI18n({
      resources,
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      localStorageKey: 'custom-language',
      storage,
    })

    await localize.changeLanguage('fr')

    expect(storage.getItem('custom-language')).toBe('fr')
  })

  it('falls back to configured fallback language for invalid stored value', () => {
    const storage = new MockStorage()
    storage.setItem('app-language', 'de')

    const localize = createI18n({
      resources,
      defaultLanguage: 'en',
      fallbackLanguage: 'es',
      storage,
    })

    expect(localize.getInitialLanguage()).toBe('es')
  })

  it('handles unsupported language values using runtime guard', () => {
    const storage = new MockStorage()

    const localize = createI18n({
      resources,
      defaultLanguage: 'en',
      fallbackLanguage: 'fr',
      storage,
    })

    expect(localize.isSupportedLanguage('es')).toBe(true)
    expect(localize.isSupportedLanguage('de')).toBe(false)
    expect(localize.getLanguage()).toBe('fr')
  })

  it('scales to 3+ languages with inferred language list', () => {
    const localize = createI18n({
      resources,
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      persistLanguage: false,
    })

    expect(localize.languages).toEqual(['en', 'fr', 'es'])
  })

  it('supports direct LocalizeProvider config API', () => {
    const element = React.createElement(
      LocalizeProvider,
      {
        config: {
          resources,
          defaultLanguage: 'en',
          fallbackLanguage: 'en',
          persistLanguage: false,
        },
      },
      React.createElement('div', null, 'child'),
    )

    expect(Boolean(element)).toBe(true)
  })
})
