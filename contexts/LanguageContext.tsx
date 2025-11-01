import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';

export type Language = 'es' | 'en';
// Since we fetch JSON at runtime, we can't statically derive the type from an import.
// Using a generic record type is a practical and safe compromise.
export type Translations = Record<string, any>;
export type TFunction = (key: string, options?: { [key: string]: string | number }) => string;


interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: TFunction;
    translations: Translations;
}

const getNestedValue = (obj: any, key: string) => {
    if (!obj) return undefined;
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('es');
    const [translationsData, setTranslationsData] = useState<{ [key in Language]?: Translations }>({});

    useEffect(() => {
        // Asynchronously fetch translation files. This is more cross-browser compatible
        // than trying to import JSON modules directly, which has inconsistent support.
        const fetchTranslations = async () => {
            try {
                // The paths are relative to the root index.html file.
                const esPromise = fetch('./locales/es.json').then(res => res.json());
                const enPromise = fetch('./locales/en.json').then(res => res.json());

                const [es, en] = await Promise.all([esPromise, enPromise]);
                setTranslationsData({ es, en });
            } catch (err) {
                console.error("Failed to fetch translation files:", err);
            }
        };
        fetchTranslations();
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        document.documentElement.lang = lang;
    };

    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'en') {
            setLanguage('en');
        } else {
            setLanguage('es');
        }
    }, []);

    const t: TFunction = useCallback((key, options) => {
        const translations = translationsData[language];
        // If translations are not loaded yet, return the key. The UI will update once they are.
        if (!translations || Object.keys(translations).length === 0) {
            return key;
        }

        const translation = getNestedValue(translations, key);

        if (typeof translation !== 'string') {
            console.warn(`Translation key '${key}' not found for language '${language}'.`);
            return key;
        }

        if (options) {
            return Object.entries(options).reduce((str, [optKey, optValue]) => {
                return str.replace(new RegExp(`{{${optKey}}}`, 'g'), String(optValue));
            }, translation);
        }
        return translation;
    }, [language, translationsData]);


    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
        translations: translationsData[language] || {}
    }), [language, t, translationsData]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
