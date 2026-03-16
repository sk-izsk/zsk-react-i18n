# zsk-react-i18n

Typed i18n wrapper for React + i18next + react-i18next.

## Install

```bash
bun add i18next react react-i18next
bun add -d typescript @types/react @types/node
```

## API

### Option A: Factory (best for typed helpers)

```ts
import { createI18n } from 'zsk-react-i18n'

const resources = {
  en: {
    translation: {
      home: { title: 'Home' },
    },
  },
  fr: {
    translation: {
      home: { title: 'Accueil' },
    },
  },
  es: {
    translation: {
      home: { title: 'Inicio' },
    },
  },
} as const

const localize = createI18n({
  resources,
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  localStorageKey: 'app-language',
})

export const {
  LocalizeProvider,
  useAppTranslation,
  AppTrans,
  changeLanguage,
  getLanguage,
  getInitialLanguage,
  isSupportedLanguage,
} = localize
```

### Option B: Direct Provider

```tsx
import { LocalizeProvider } from 'zsk-react-i18n'

const config = {
  resources,
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  localStorageKey: 'app-language',
}

export function App() {
  return (
    <LocalizeProvider config={config}>
      <YourRoutes />
    </LocalizeProvider>
  )
}
```

## Optional i18next module augmentation in consumer app

Create `src/i18next.d.ts`:

```ts
import 'i18next'
import type { resources } from './i18n/resources'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: (typeof resources)['en']
  }
}
```

## Scripts

- `bun run build`
- `bun run typecheck`
- `bun run typecheck:types`
- `bun test`
