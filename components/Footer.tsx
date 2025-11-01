import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0 1.8a5.16 5.16 0 100 10.32 5.16 5.16 0 000-10.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/>
    </svg>
);

interface FooterProps {
    onManageBookingClick: () => void;
    onAdminClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onManageBookingClick, onAdminClick }) => {
    const { t } = useTranslation();
    const year = new Date().getFullYear();
    return (
        <footer className="bg-slate-800 border-t border-slate-700">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                    <div className="text-slate-400 mb-4 md:mb-0">
                        &copy; {year} Gwimake Comunidad Arhuaca.
                        <button onClick={onManageBookingClick} className="ml-4 text-sm hover:text-emerald-500 underline transition-colors">
                            {t('footer.manageBooking')}
                        </button>
                         <span className="mx-2 text-slate-600">|</span>
                        <button onClick={onAdminClick} className="text-sm hover:text-emerald-500 underline transition-colors">
                            {t('footer.admin')}
                        </button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a href="https://www.instagram.com/gwimake/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-500 transition-colors">
                            <span className="sr-only">Instagram</span>
                            <InstagramIcon className="w-6 h-6" />
                        </a>
                        <p className="text-sm text-slate-500">{t('footer.location')}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;