import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

// This file is reused as the "Experience" section.
// The name 'ServicesSection' is kept due to platform constraints,
// but its content has been fully adapted.

interface ExperienceSectionProps {
    onBookNowClick: () => void;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ onBookNowClick }) => {
    const { t } = useTranslation();
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-extrabold text-slate-900 font-serif">{t('experience.title')}</h2>
                    <div className="w-24 h-1 bg-emerald-500 mx-auto mt-4 mb-6"></div>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                        {t('experience.paragraph1')}
                    </p>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        {t('experience.paragraph2')}
                    </p>
                     <button 
                        onClick={onBookNowClick}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-slate-900/40 transition-all duration-300 transform hover:scale-105">
                        {t('experience.button')}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ExperienceSection;