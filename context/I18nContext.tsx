
import React, { createContext, ReactNode, useCallback, useMemo } from 'react';
import enTranslations from '../locales/en.json';
import idTranslations from '../locales/id.json';
import { SupportedLocale } from '../types';

interface TranslationParams {
    [key: string]: string | number | undefined;
    defaultValue?: string;
}

interface I18nContextType {
    t: (key: string, params?: TranslationParams) => string;
    locale: SupportedLocale;
}

export const I18nContext = createContext<I18nContextType>({
    t: (key) => key,
    locale: 'en',
});

interface I18nProviderProps {
    children: ReactNode;
    locale: SupportedLocale;
}

interface TranslationTree {
    [key: string]: string | TranslationTree;
}

const translationCatalog: Record<SupportedLocale, TranslationTree> = {
    en: enTranslations as TranslationTree,
    id: idTranslations as TranslationTree,
};

const getNestedValue = (obj: TranslationTree, path: string): string | undefined => {
    const value = path.split('.').reduce<unknown>((acc, part) => {
        if (typeof acc === 'object' && acc !== null) {
            return (acc as Record<string, unknown>)[part];
        }

        return undefined;
    }, obj);

    return typeof value === 'string' ? value : undefined;
};

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, locale }) => {
    const translations = useMemo(() => {
        return translationCatalog[locale] ?? translationCatalog.en;
    }, [locale]);

    const t = useCallback((key: string, params: TranslationParams = {}): string => {
        const translatedText = getNestedValue(translations, key);

        if (translatedText === undefined) {
            return params.defaultValue ?? key;
        }

        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
            if (paramKey === 'defaultValue' || paramValue === undefined) {
                return acc;
            }
            return acc.replace(`{${paramKey}}`, String(paramValue));
        }, translatedText);
    }, [translations]);

    return (
        <I18nContext.Provider value={{ t, locale }}>
            {children}
        </I18nContext.Provider>
    );
};
