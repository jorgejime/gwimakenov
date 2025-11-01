import React, { useState } from 'react';
import { ArrowLeftIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../contexts/LanguageContext';

interface AdminLoginProps {
    onLoginSuccess: () => void;
    onBackToHome: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        setTimeout(() => {
            const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '@Gwimake2025';
            if (password === adminPassword) {
                onLoginSuccess();
            } else {
                setError(t('admin.login.error'));
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <section className="py-24 md:py-32 bg-white flex-grow flex flex-col justify-center">
            <div className="container mx-auto px-6 max-w-md">
                <button onClick={onBackToHome} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-700 font-semibold mb-8 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" />
                    {t('manageBooking.backToHome')}
                </button>

                <div className="text-center">
                    <LockClosedIcon className="w-16 h-16 mx-auto text-slate-400" />
                    <h2 className="text-4xl font-extrabold text-slate-900 font-serif mt-4">{t('admin.login.title')}</h2>
                    <p className="text-lg text-slate-600 mt-2">{t('admin.login.subtitle')}</p>
                </div>

                <div className="mt-10 bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700 mb-2">{t('admin.login.passwordLabel')}</label>
                        <div className="flex flex-col gap-3">
                            <input
                                id="admin-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={t('admin.login.passwordPlaceholder')}
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                required
                            />
                            <button type="submit" disabled={isLoading} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                {isLoading ? t('buttons.processing') : t('admin.login.button')}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg flex items-center gap-3">
                           <ExclamationTriangleIcon className="w-6 h-6 text-red-600"/>
                           <div><strong className="font-bold">{t('common.error')}:</strong> {error}</div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AdminLogin;