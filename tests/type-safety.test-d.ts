import React from 'react'
import { createI18n, LocalizeProvider } from '../src/index.js'

const resources = {
  en: {
    translation: {
      home: {
        title: 'Home',
      },
    },
  },
  fr: {
    translation: {
      home: {
        title: 'Accueil',
      },
    },
  },
  es: {
    translation: {
      home: {
        title: 'Inicio',
      },
    },
  },
} as const

const localize = createI18n({
  resources,
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
})

void localize.changeLanguage('fr')

// @ts-expect-error unsupported language must fail at compile time
void localize.changeLanguage('de')

// Type-safe translation key expectation for helper signature shape
// This checks compile-time key union without React runtime.
type AppTranslationFn = ReturnType<typeof localize.useAppTranslation>['t']
declare const t: AppTranslationFn
void t('home.title')

// @ts-expect-error unknown key must fail
void t('home.unknown')

void React.createElement(LocalizeProvider, {
  config: {
    resources,
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
  },
})
