import { describe, it } from 'vitest'
import { createI18n } from '../src'

describe('type safety', () => {
  it('should not allow unsupported language at compile time', () => {
    const resources = {
      en: { translation: { foo: 'bar' } },
      fr: { translation: { foo: 'baz' } },
    } as const
    const i18n = createI18n({ resources, defaultLanguage: 'en' })
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    i18n.changeLanguage('es')
  })
})
