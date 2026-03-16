import type { i18n as I18nInstance, InitOptions } from 'i18next'
import type React from 'react'
import type { PropsWithChildren } from 'react'
import type { Trans } from 'react-i18next'

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

export type ResourceTree = Record<string, Record<string, Record<string, unknown>>>

export type AppLanguage<R extends ResourceTree> = Extract<keyof R, string>

export type NamespaceKey<R extends ResourceTree, L extends AppLanguage<R>> = Extract<
  keyof R[L],
  string
>

type BaseLanguage<R extends ResourceTree, D extends AppLanguage<R>> = R[D]

export type TranslationKey<
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

export type AppTransProps<
  R extends ResourceTree,
  D extends AppLanguage<R>,
  N extends NamespaceKey<R, D>,
> = Omit<React.ComponentProps<typeof Trans>, 'i18nKey' | 'ns'> & {
  i18nKey: TranslationKey<R, D, N>
  ns?: N
}

export type AppUseTranslationResult<
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
