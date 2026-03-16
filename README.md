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
import {
  AppTrans,
  defineLocalizeConfig,
  LocalizeProvider,
  changeLanguage,
  getInitialLanguage,
  getLanguage,
  isSupportedLanguage,
  useAppTranslation,
} from 'zsk-react-i18n'

const config = defineLocalizeConfig({
  resources,
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  localStorageKey: 'app-language',
})

export function App() {
  return (
    <LocalizeProvider config={config}>
      <YourRoutes />
    </LocalizeProvider>
  )
}

export function LanguageSwitcher() {
  const { t } = useAppTranslation()

  return (
    <button
      type="button"
      onClick={() => {
        if (isSupportedLanguage('fr')) {
          void changeLanguage('fr')
        }
      }}
    >
      {t('home.title')}
      <AppTrans i18nKey="home.title" />
      {getLanguage()} / {getInitialLanguage()}
    </button>
  )
}
```

This direct mode uses a runtime singleton configured by LocalizeProvider.

If you need to call direct helpers before React mounts the provider,
use `defineLocalizeConfig(config)` as shown above.

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
- `bun run lint`
- `bun run lint:fix`
- `bun run format`
- `bun run format:check`
- `bun run typecheck`
- `bun run typecheck:types`
- `bun test`
- `bun run verify` (runs checks + build + npm pack dry run)
- `bun run release` (runs verify, then publishes)

Lint config: `.oxlintrc.json`
Format config: `.oxfmtrc.json`

## Publish

```bash
npm whoami
bun run release
```

If already verified and you only want to publish:

```bash
bun run publish:release
```
