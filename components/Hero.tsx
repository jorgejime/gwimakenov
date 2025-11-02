import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { getHeroImages, type HeroImage } from '../services/supabaseExtendedService';

interface HeroProps {
    onBookNowClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBookNowClick }) => {
    const { t } = useTranslation();
    const [heroImage, setHeroImage] = useState<HeroImage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadHeroImage = async () => {
            try {
                const images = await getHeroImages(true);
                if (images.length > 0) {
                    setHeroImage(images[0]);
                }
            } catch (error) {
                console.error('Error loading hero image:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHeroImage();
    }, []);

    const defaultImageUrl = 'https://i.ibb.co/hJ9vpp44/20250719-1637-Cielo-Estrellado-Sierra-Nevada-remix-01k0j9t8rwe95aq24qadbnr31p.png';
    const imageUrl = heroImage?.url || defaultImageUrl;

    return (
        <section className="h-screen min-h-[700px] flex items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: `url('${imageUrl}')`, filter: 'brightness(0.6)' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/20 to-transparent z-10"></div>
            <div className="relative z-20 container mx-auto px-6 flex flex-col items-center">
                <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4 tracking-tight font-serif shadow-black/50 text-shadow">
                    {t('hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-2xl mx-auto mb-8 font-light">
                   {t('hero.subtitle')}
                </p>
                <button 
                    onClick={onBookNowClick}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg hover:shadow-emerald-700/40 transition-all duration-300 transform hover:scale-105">
                    {t('hero.button')}
                </button>
            </div>
        </section>
    );
};

export default Hero;