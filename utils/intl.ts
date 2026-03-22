import { SupportedLocale } from '../types';

export const getLocaleCode = (locale: SupportedLocale): string => {
    return locale === 'id' ? 'id-ID' : 'en-US';
};

export const formatCurrency = (
    value: number,
    currency: string,
    locale: SupportedLocale,
    options: Intl.NumberFormatOptions = {},
): string => {
    return new Intl.NumberFormat(getLocaleCode(locale), {
        style: 'currency',
        currency,
        ...options,
    }).format(value);
};

export const formatDate = (
    value: Date | string,
    locale: SupportedLocale,
    options: Intl.DateTimeFormatOptions = {},
): string => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat(getLocaleCode(locale), options).format(date);
};
