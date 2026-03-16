import { createInstance, type i18n as I18nInstance } from 'i18next'
import React, { type PropsWithChildren } from 'react'
import { I18nextProvider, initReactI18next, Trans, useTranslation } from 'react-i18next'
import type {
  AppLanguage,
  AppTransProps,
  AppUseTranslationResult,
  CreatedI18n,
  CreateI18nConfig,
  LocalizeProviderProps,
  NamespaceKey,
  ResourceTree,
  StorageLike,
} from './types.js'

type RuntimeLocalize = {
  i18n: I18nInstance
  getInitialLanguage: () => string
  getLanguage: () => string
  isSupportedLanguage: (language: string) => boolean
  changeLanguage: (language: string) => Promise<void>
}

type AnyCreatedI18n = CreatedI18n<ResourceTree, string, string>

const DEFAULT_STORAGE_KEY = 'app-language'

let activeLocalize: RuntimeLocalize | undefined
let activeCreatedLocalize: AnyCreatedI18n | undefined
let initializePendingLocalize: (() => void) | undefined

const setActiveLocalize = (localize: RuntimeLocalize): void => {
  activeLocalize = localize
}

const activateCreatedLocalize = <
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
>(
  localize: CreatedI18n<R, D, N>,
): void => {
  activeCreatedLocalize = localize as unknown as AnyCreatedI18n

  setActiveLocalize({
    i18n: localize.i18n,
    getInitialLanguage: localize.getInitialLanguage,
    getLanguage: localize.getLanguage,
    isSupportedLanguage: localize.isSupportedLanguage,
    changeLanguage: async (language: string) => {
      if (localize.isSupportedLanguage(language)) {
        await localize.changeLanguage(language)
        return
      }

      await localize.changeLanguage(localize.getInitialLanguage())
    },
  })
}

const ensureActiveLocalize = (): void => {
  if (!activeLocalize && initializePendingLocalize) {
    initializePendingLocalize()
  }
}

const requireActiveLocalize = (apiName: string): RuntimeLocalize => {
  ensureActiveLocalize()

  if (!activeLocalize) {
    throw new Error(
      `${apiName} requires LocalizeProvider with config or configureI18n(config) to run first.`,
    )
  }

  return activeLocalize
}

const getDefaultStorage = (): StorageLike | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}

export function createI18n<
  const R extends ResourceTree,
  const D extends AppLanguage<R>,
  const N extends NamespaceKey<R, D> = 'translation' extends NamespaceKey<R, D>
    ? 'translation'
    : NamespaceKey<R, D>,
>(config: CreateI18nConfig<R, D, N>): CreatedI18n<R, D, N> {
  const {
    resources,
    defaultLanguage,
    fallbackLanguage = defaultLanguage,
    defaultNS = 'translation' as N,
    localStorageKey = DEFAULT_STORAGE_KEY,
    persistLanguage = true,
    storage = getDefaultStorage(),
    ...initOptions
  } = config

  const languages = Object.keys(resources) as AppLanguage<R>[]

  const isSupportedLanguage = (language: string): language is AppLanguage<R> => {
    return languages.includes(language as AppLanguage<R>)
  }

  const normalizeLanguage = (language: string | undefined | null): AppLanguage<R> => {
    if (!language) {
      return fallbackLanguage
    }

    if (isSupportedLanguage(language)) {
      return language
    }

    const normalized = language.toLowerCase()
    if (isSupportedLanguage(normalized)) {
      return normalized
    }

    const baseLanguage = normalized.split(/[-_]/)[0]
    if (baseLanguage && isSupportedLanguage(baseLanguage)) {
      return baseLanguage
    }

    return fallbackLanguage
  }

  const getInitialLanguage = (): AppLanguage<R> => {
    if (!persistLanguage || !storage) {
      return defaultLanguage
    }

    return normalizeLanguage(storage.getItem(localStorageKey))
  }

  const i18n = createInstance()

  const persistLanguageIfNeeded = (language: AppLanguage<R>) => {
    if (!persistLanguage || !storage) {
      return
    }

    storage.setItem(localStorageKey, language)
  }

  void i18n.use(initReactI18next).init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: fallbackLanguage,
    defaultNS,
    interpolation: {
      escapeValue: false,
      ...initOptions.interpolation,
    },
    ...initOptions,
  })

  i18n.on('languageChanged', (language) => {
    const nextLanguage = normalizeLanguage(language)
    persistLanguageIfNeeded(nextLanguage)

    if (language !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage)
    }
  })

  const getLanguage = (): AppLanguage<R> => {
    const activeLanguage = i18n.resolvedLanguage ?? i18n.language
    return normalizeLanguage(activeLanguage)
  }

  const changeLanguage = async (language: AppLanguage<R>): Promise<void> => {
    const nextLanguage = normalizeLanguage(language)
    await i18n.changeLanguage(nextLanguage)
    persistLanguageIfNeeded(nextLanguage)
  }

  const LocalizeProvider = ({ children }: PropsWithChildren): React.ReactElement => {
    return React.createElement(I18nextProvider, { i18n }, children)
  }

  const useAppTranslation = (ns?: N): AppUseTranslationResult<R, D, N> => {
    const translation = useTranslation(ns)

    return {
      t: translation.t as unknown as AppUseTranslationResult<R, D, N>['t'],
      i18n: translation.i18n,
      ready: translation.ready,
    }
  }

  const AppTrans = (props: AppTransProps<R, D, N>): React.ReactElement => {
    return React.createElement(Trans, props)
  }

  return {
    i18n,
    languages,
    LocalizeProvider,
    useAppTranslation,
    AppTrans,
    getInitialLanguage,
    getLanguage,
    isSupportedLanguage,
    changeLanguage,
  }
}

export function configureI18n<
  const R extends ResourceTree,
  const D extends AppLanguage<R>,
  const N extends NamespaceKey<R, D> = 'translation' extends NamespaceKey<R, D>
    ? 'translation'
    : NamespaceKey<R, D>,
>(config: CreateI18nConfig<R, D, N>): CreatedI18n<R, D, N> {
  const localize = createI18n(config)

  activateCreatedLocalize(localize)

  return localize
}

export function defineLocalizeConfig<
  const R extends ResourceTree,
  const D extends AppLanguage<R>,
  const N extends NamespaceKey<R, D> = 'translation' extends NamespaceKey<R, D>
    ? 'translation'
    : NamespaceKey<R, D>,
>(config: CreateI18nConfig<R, D, N>): CreateI18nConfig<R, D, N> {
  initializePendingLocalize = () => {
    const localize = createI18n(config)
    activateCreatedLocalize(localize)
  }

  // If an instance is already active (tests/HMR), reconfigure immediately.
  if (activeLocalize) {
    initializePendingLocalize()
  }

  return config
}

export const AppTrans = Trans

export const useAppTranslation: typeof useTranslation = ((...args) => {
  const localize = requireActiveLocalize('useAppTranslation')
  const [namespace, options] = args as [
    Parameters<typeof useTranslation>[0],
    Parameters<typeof useTranslation>[1],
  ]

  return useTranslation(namespace, {
    ...options,
    i18n: localize.i18n,
  })
}) as typeof useTranslation

export const changeLanguage = async (language: string): Promise<void> => {
  const localize = requireActiveLocalize('changeLanguage')
  await localize.changeLanguage(language)
}

export const getLanguage = (): string => {
  const localize = requireActiveLocalize('getLanguage')
  return localize.getLanguage()
}

export const getInitialLanguage = (): string => {
  const localize = requireActiveLocalize('getInitialLanguage')
  return localize.getInitialLanguage()
}

export const isSupportedLanguage = (language: string): boolean => {
  const localize = requireActiveLocalize('isSupportedLanguage')
  return localize.isSupportedLanguage(language)
}

export function LocalizeProvider<
  const R extends ResourceTree,
  const D extends AppLanguage<R>,
  const N extends NamespaceKey<R, D> = 'translation' extends NamespaceKey<R, D>
    ? 'translation'
    : NamespaceKey<R, D>,
>({ config, children }: LocalizeProviderProps<R, D, N>): React.ReactElement {
  const localizeRef = React.useRef<CreatedI18n<R, D, N> | undefined>(undefined)

  if (!localizeRef.current) {
    if (activeCreatedLocalize) {
      localizeRef.current = activeCreatedLocalize as unknown as CreatedI18n<R, D, N>
    } else {
      localizeRef.current = configureI18n(config)
    }
  }

  return React.createElement(localizeRef.current.LocalizeProvider, null, children)
}

export type {
  AppLanguage,
  CreatedI18n,
  CreateI18nConfig,
  LocalizeProviderProps,
  StorageLike,
} from './types.js'
