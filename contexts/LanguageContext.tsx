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
    isLoading: boolean;
}

const getNestedValue = (obj: any, key: string) => {
    if (!obj) return undefined;
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('es');
    const [translationsData, setTranslationsData] = useState<{ [key in Language]?: Translations }>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTranslations = async () => {
            setIsLoading(true);
            try {
                const esPromise = fetch('/locales/es.json').then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch Spanish translations: ${res.status}`);
                    return res.json();
                });
                const enPromise = fetch('/locales/en.json').then(res => {
                    if (!res.ok) throw new Error(`Failed to fetch English translations: ${res.status}`);
                    return res.json();
                });

                const [es, en] = await Promise.all([esPromise, enPromise]);
                setTranslationsData({ es, en });
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch translation files:", err);
                setIsLoading(false);
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
        translations: translationsData[language] || {},
        isLoading
    }), [language, t, translationsData, isLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

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
