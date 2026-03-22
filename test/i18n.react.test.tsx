import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  changeLanguage,
  getLanguage,
  isSupportedLanguage,
  LocalizeProvider,
  useAppTranslation,
} from '../src'

const resources = {
  en: {
    translation: {
      greeting: 'Hello',
      farewell: 'Goodbye',
    },
  },
  fr: {
    translation: {
      greeting: 'Bonjour',
      farewell: 'Au revoir',
    },
  },
} as const

describe('i18n React integration', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders translation with useAppTranslation', () => {
    function Greeting() {
      const { t } = useAppTranslation()
      return <span>{t('greeting')}</span>
    }
    render(
      <LocalizeProvider config={{ resources, defaultLanguage: 'en' }}>
        <Greeting />
      </LocalizeProvider>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('updates translation on language change', async () => {
    function Farewell() {
      const { t } = useAppTranslation()
      return <span>{t('farewell')}</span>
    }
    render(
      <LocalizeProvider config={{ resources, defaultLanguage: 'en' }}>
        <Farewell />
      </LocalizeProvider>,
    )
    expect(screen.getByText('Goodbye')).toBeInTheDocument()
    await changeLanguage('fr')
    // Wait for the UI to update
    expect(await screen.findByText('Au revoir')).toBeInTheDocument()
  })

  it('getLanguage returns the current language', async () => {
    render(
      <LocalizeProvider config={{ resources, defaultLanguage: 'en' }}>
        <span />
      </LocalizeProvider>,
    )
    await changeLanguage('en')
    expect(getLanguage()).toBe('en')
  })

  it('isSupportedLanguage returns correct values', () => {
    expect(isSupportedLanguage('en')).toBe(true)
    expect(isSupportedLanguage('fr')).toBe(true)
    expect(isSupportedLanguage('es')).toBe(false)
  })
})
