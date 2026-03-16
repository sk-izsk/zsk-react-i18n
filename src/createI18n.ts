import { createInstance, type i18n as I18nInstance, type InitOptions } from 'i18next'
import React, { type PropsWithChildren } from 'react'
import { I18nextProvider, Trans, initReactI18next, useTranslation } from 'react-i18next'

type Primitive = string | number | boolean | null | undefined | symbol | bigint

type Join<K extends string, P extends string> = `${K}.${P}`

type DeepKeys<T> = T extends Primitive
  ? never
  : {
      [K in Extract<keyof T, string>]: T[K] extends Primitive
        ? K
        : T[K] extends readonly unknown[]
          ? K
          : K | Join<K, DeepKeys<T[K]>>
    }[Extract<keyof T, string>]

type ResourceTree = Record<string, Record<string, Record<string, unknown>>>

export type AppLanguage<R extends ResourceTree> = Extract<keyof R, string>

type NamespaceKey<R extends ResourceTree, L extends AppLanguage<R>> = Extract<keyof R[L], string>

type BaseLanguage<R extends ResourceTree, D extends AppLanguage<R>> = R[D]

type TranslationKey<
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
> = DeepKeys<BaseLanguage<R, D>[N]>

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface CreateI18nConfig<
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
> extends Omit<InitOptions, 'resources' | 'lng' | 'fallbackLng' | 'defaultNS'> {
  resources: R
  defaultLanguage: D
  fallbackLanguage?: AppLanguage<R>
  defaultNS?: N
  localStorageKey?: string
  persistLanguage?: boolean
  storage?: StorageLike
}

type AppTransProps<
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
> = Omit<React.ComponentProps<typeof Trans>, 'i18nKey' | 'ns'> & {
  i18nKey: TranslationKey<R, D, N>
  ns?: N
}

type AppUseTranslationResult<
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
> = {
  t: (key: TranslationKey<R, D, N>, options?: Record<string, unknown>) => string
  i18n: I18nInstance
  ready: boolean
}

export interface CreatedI18n<
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
> {
  readonly i18n: I18nInstance
  readonly languages: readonly AppLanguage<R>[]
  LocalizeProvider: (props: PropsWithChildren) => React.ReactElement
  useAppTranslation: (ns?: N) => AppUseTranslationResult<R, D, N>
  AppTrans: (props: AppTransProps<R, D, N>) => React.ReactElement
  getInitialLanguage: () => AppLanguage<R>
  getLanguage: () => AppLanguage<R>
  isSupportedLanguage: (language: string) => language is AppLanguage<R>
  changeLanguage: (language: AppLanguage<R>) => Promise<void>
}

export type LocalizeProviderProps<
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
> = PropsWithChildren<{
  config: CreateI18nConfig<R, D, N>
}>

const DEFAULT_STORAGE_KEY = 'app-language'

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

export function LocalizeProvider<
  const R extends ResourceTree,
  const D extends AppLanguage<R>,
  const N extends NamespaceKey<R, D> = 'translation' extends NamespaceKey<R, D>
    ? 'translation'
    : NamespaceKey<R, D>,
>({ config, children }: LocalizeProviderProps<R, D, N>): React.ReactElement {
  const localizeRef = React.useRef<CreatedI18n<R, D, N> | undefined>(undefined)

  if (!localizeRef.current) {
    localizeRef.current = createI18n(config)
  }

  return React.createElement(localizeRef.current.LocalizeProvider, null, children)
}
