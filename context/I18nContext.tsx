
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SupportedLocale } from '../types';

interface I18nContextType {
    t: (key: string, params?: { [key: string]: string | number }) => string;
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

const getNestedValue = (obj: any, path: string): string | undefined => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, locale }) => {
    const [translations, setTranslations] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTranslations = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/locales/${locale}.json`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setTranslations(data);
            } catch (error) {
                console.error(`Could not load translations for ${locale}, falling back to 'en'`, error);
                // Fallback to English if the desired locale fails
                try {
                    const response = await fetch(`/locales/en.json`);
                    if (!response.ok) throw new Error('Fallback translation failed');
                    const data = await response.json();
                    setTranslations(data);
                } catch (fallbackError) {
                    console.error("Could not load fallback English translations.", fallbackError);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTranslations();
    }, [locale]);

    const t = useCallback((key: string, params: { [key: string]: string | number } = {}): string => {
        if (isLoading || !translations) {
            return ''; // Or a loading indicator string
        }
        
        const translatedText = getNestedValue(translations, key);

        if (translatedText === undefined) {
            // console.warn(`Translation key "${key}" not found.`);
            return key;
        }
        
        return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
            return acc.replace(`{${paramKey}}`, String(paramValue));
        }, translatedText);
    }, [translations, isLoading]);

    return (
        <I18nContext.Provider value={{ t, locale }}>
            {!isLoading ? children : null /* Or a global loading spinner */}
        </I18nContext.Provider>
    );
};
