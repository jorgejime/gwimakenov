import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface HeaderProps {
    onBookNowClick: () => void;
    onNavClick: (sectionId: string) => void;
}

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useTranslation();

    return (
        <div className="flex items-center border border-white/50 rounded-full">
            <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${language === 'es' ? 'bg-white text-emerald-700' : 'text-white hover:bg-white/20'}`}
            >
                ES
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-300 ${language === 'en' ? 'bg-white text-emerald-700' : 'text-white hover:bg-white/20'}`}
            >
                EN
            </button>
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ onBookNowClick, onNavClick }) => {
    const { t } = useTranslation();
    const [scrolled, setScrolled] =useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        onNavClick(sectionId);
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
            <div className="container mx-auto px-6 py-3">
                <div className="flex justify-between items-center">
                    <a href="#" onClick={(e) => handleLinkClick(e, '')} className={`text-2xl font-bold tracking-wider transition-colors ${scrolled ? 'text-slate-800' : 'text-white'}`}>
                        Gwimake
                    </a>
                    <div className="flex items-center space-x-6">
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#experience" onClick={(e) => handleLinkClick(e, '#experience')} className={`transition-colors ${scrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-white hover:text-slate-200'}`}>{t('header.experience')}</a>
                            <a href="#gallery" onClick={(e) => handleLinkClick(e, '#gallery')} className={`transition-colors ${scrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-white hover:text-slate-200'}`}>{t('header.gallery')}</a>
                            <a href="#testimonials" onClick={(e) => handleLinkClick(e, '#testimonials')} className={`transition-colors ${scrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-white hover:text-slate-200'}`}>{t('header.testimonials')}</a>
                        </nav>
                        <div className="hidden md:flex items-center space-x-4">
                           <button 
                                onClick={onBookNowClick}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-emerald-700/30 transition-all duration-300 transform hover:scale-105">
                                {t('header.bookNow')}
                            </button>
                            <div className={`${scrolled ? '' : 'hidden'}`}>
                                <LanguageSwitcher />
                            </div>
                        </div>
                         <div className={`md:hidden ${scrolled ? 'hidden' : ''}`}>
                             <LanguageSwitcher />
                         </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;