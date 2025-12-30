import React, { useState } from 'react';
import { ArrowLeftIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../contexts/LanguageContext';
import { signIn } from '../services/authService';

interface AdminLoginProps {
    onLoginSuccess: (userId: string, role: string) => void;
    onBackToHome: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToHome }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { user, profile } = await signIn(email, password);

            // Verificar que el usuario tenga permisos de admin o gestor
            if (!['admin', 'gestor'].includes(profile.role)) {
                setError(t('admin.login.insufficientPermissions') || 'No tienes permisos suficientes');
                setIsLoading(false);
                return;
            }

            onLoginSuccess(user.id, profile.role);
        } catch (err: any) {
            console.error('Login error:', err);

            // Mapear errores específicos
            if (err.message === 'RATE_LIMIT_EXCEEDED') {
                setError(t('admin.login.rateLimitExceeded') || 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.');
            } else if (err.message === 'USER_INACTIVE') {
                setError(t('admin.login.userInactive') || 'Tu cuenta está inactiva. Contacta al administrador.');
            } else if (err.message === 'USER_PROFILE_NOT_FOUND') {
                setError(t('admin.login.profileNotFound') || 'Perfil de usuario no encontrado.');
            } else if (err.message?.includes('Invalid login credentials')) {
                setError(t('admin.login.invalidCredentials') || 'Email o contraseña incorrectos');
            } else {
                setError(t('admin.login.error') || 'Error al iniciar sesión. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
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
                        <div className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email
                                </label>
                                <input
                                    id="admin-email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@gwimake.com"
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700 mb-2">
                                    {t('admin.login.passwordLabel')}
                                </label>
                                <input
                                    id="admin-password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={t('admin.login.passwordPlaceholder')}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
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