import React, { useState } from 'react';
import { cancelBooking } from '../services/supabaseService';
import { getBookingComplete, type BookingComplete } from '../services/supabaseExtendedService';
import type { ItineraryDay } from '../types';
import { CheckCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../contexts/LanguageContext';

const formatDate = (dateString: string, locale: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00Z');
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    }).format(date);
};

const ManageBooking: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
    const { t, language } = useTranslation();
    const [bookingId, setBookingId] = useState('');
    const [foundBooking, setFoundBooking] = useState<BookingComplete | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleFindBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setFoundBooking(null);
        if (!bookingId.trim()) {
            setError(t('manageBooking.errors.invalidId'));
            return;
        }
        setIsLoading(true);
        try {
            const booking = await getBookingComplete(bookingId.trim());
            if (booking) {
                setFoundBooking(booking);
            } else {
                setError(t('manageBooking.errors.notFound'));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? t(`errors.supabase.${err.message}`) : t('errors.unknown');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!foundBooking) return;
        
        const isConfirmed = window.confirm(t('manageBooking.cancelConfirmation'));
        if (!isConfirmed) return;

        setIsLoading(true);
        setError(null);
        try {
            await cancelBooking(foundBooking.id);
            setSuccessMessage(t('manageBooking.success.cancelled'));
            setFoundBooking(null);
            setBookingId('');
        } catch (err) {
            const errorMessage = err instanceof Error ? t(`errors.supabase.${err.message}`) : t('errors.unknown');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getStatusInfo = (status: BookingComplete['status']) => {
        switch (status) {
            case 'pending': return { text: t('bookingStatus.pending'), color: 'bg-yellow-100 text-yellow-800' };
            case 'confirmed': return { text: t('bookingStatus.confirmed'), color: 'bg-green-100 text-green-800' };
            case 'cancelled': return { text: t('bookingStatus.cancelled'), color: 'bg-red-100 text-red-800' };
            default: return { text: status, color: 'bg-slate-100 text-slate-800' };
        }
    };


    return (
        <section className="py-24 md:py-32 bg-white">
            <div className="container mx-auto px-6 max-w-2xl">
                <button onClick={onBackToHome} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-700 font-semibold mb-8 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" />
                    {t('manageBooking.backToHome')}
                </button>

                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-slate-900 font-serif">{t('manageBooking.title')}</h2>
                    <p className="text-lg text-slate-600 mt-4">{t('manageBooking.subtitle')}</p>
                </div>

                <div className="mt-12 bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-sm">
                    <form onSubmit={handleFindBooking}>
                        <label htmlFor="booking-id" className="block text-sm font-semibold text-slate-700 mb-2">{t('manageBooking.idLabel')}</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                id="booking-id"
                                type="text"
                                value={bookingId}
                                onChange={e => setBookingId(e.target.value)}
                                placeholder={t('manageBooking.idPlaceholder')}
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                required
                            />
                            <button type="submit" disabled={isLoading} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                {isLoading ? t('buttons.searching') : t('buttons.findBooking')}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg flex items-center gap-3">
                           <ExclamationTriangleIcon className="w-6 h-6 text-red-600"/>
                           <div><strong className="font-bold">{t('common.error')}:</strong> {error}</div>
                        </div>
                    )}
                    {successMessage && (
                        <div className="mt-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg flex items-center gap-3">
                           <CheckCircleIcon className="w-6 h-6 text-green-600"/>
                           <div><strong className="font-bold">{t('common.success')}:</strong> {successMessage}</div>
                        </div>
                    )}

                    {foundBooking && (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                             <h3 className="text-2xl font-bold text-slate-800 font-serif mb-4">{t('manageBooking.detailsTitle')}</h3>
                             <div className="space-y-6">
                             <div className="bg-white p-6 rounded-lg border border-slate-300 space-y-3">
                                <h4 className="text-lg font-bold text-slate-800 mb-3">{t('manageBooking.details.basicInfo')}</h4>
                                <div className="flex justify-between items-center"><span className="font-semibold text-slate-600">{t('manageBooking.details.id')}:</span> <code className="text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">{foundBooking.id}</code></div>
                                <div className="flex justify-between items-center"><span className="font-semibold text-slate-600">{t('manageBooking.details.departureDate')}:</span> <span className="font-bold">{formatDate(foundBooking.departure_date, language)}</span></div>
                                <div className="flex justify-between items-center"><span className="font-semibold text-slate-600">{t('manageBooking.details.returnDate')}:</span> <span className="font-bold">{formatDate(foundBooking.return_date, language)}</span></div>
                                <div className="flex justify-between items-center"><span className="font-semibold text-slate-600">{t('manageBooking.details.totalGuests')}:</span> <span className="font-bold">{foundBooking.total_guests} ({foundBooking.adults} {t('manageBooking.adults')}, {foundBooking.children} {t('manageBooking.children')})</span></div>
                                <div className="flex justify-between items-center"><span className="font-semibold text-slate-600">{t('manageBooking.details.totalPrice')}:</span> <span className="font-bold text-emerald-600 text-xl">COP {Number(foundBooking.total_price).toLocaleString('es-CO')}</span></div>
                                <div className="flex justify-between items-center"><span className="font-semibold text-slate-600">{t('manageBooking.details.status')}:</span> <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusInfo(foundBooking.status).color}`}>{getStatusInfo(foundBooking.status).text}</span></div>
                             </div>

                             <div className="bg-white p-6 rounded-lg border border-slate-300">
                                <h4 className="text-lg font-bold text-slate-800 mb-3">{t('manageBooking.details.payerInfo')}</h4>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-semibold text-slate-600">{t('manageBooking.details.name')}:</span> {foundBooking.payer_name}</div>
                                    <div><span className="font-semibold text-slate-600">{t('manageBooking.details.email')}:</span> {foundBooking.payer_email}</div>
                                    <div><span className="font-semibold text-slate-600">{t('manageBooking.details.whatsapp')}:</span> {foundBooking.payer_whatsapp}</div>
                                </div>
                             </div>

                             {Array.isArray(foundBooking.guest_details) && foundBooking.guest_details.length > 0 && (
                                <div className="bg-white p-6 rounded-lg border border-slate-300">
                                    <h4 className="text-lg font-bold text-slate-800 mb-3">{t('manageBooking.details.guestsInfo')}</h4>
                                    <div className="space-y-2">
                                        {foundBooking.guest_details.map((guest: any, index: number) => (
                                            <div key={index} className="bg-slate-50 p-3 rounded">
                                                <p className="font-semibold text-slate-800">{guest.name}</p>
                                                <p className="text-sm text-slate-600">{guest.idType}: {guest.idNumber}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}

                             {Array.isArray(foundBooking.itinerary) && foundBooking.itinerary.length > 0 && (
                                <div className="bg-white p-6 rounded-lg border border-slate-300">
                                    <h4 className="text-lg font-bold text-slate-800 mb-3">{t('manageBooking.details.itinerary')}</h4>
                                    <div className="space-y-4">
                                        {(foundBooking.itinerary as ItineraryDay[]).map((day, index) => (
                                            <div key={index}>
                                                <h5 className="font-bold text-emerald-700">{day.day}: {day.title}</h5>
                                                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                                    {day.activities.map((activity, actIndex) => (
                                                        <li key={actIndex}>• {activity.time} - {activity.description}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                        </div>

                             {['pending', 'confirmed'].includes(foundBooking.status) ? (
                                <div className="mt-6 text-center">
                                    <button onClick={handleCancelBooking} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-red-700/30 transition-all duration-300 disabled:bg-slate-400">
                                         {isLoading ? t('buttons.cancelling') : t('buttons.cancelBooking')}
                                    </button>
                                     <p className="text-xs text-slate-500 mt-3">{t('manageBooking.cancelNotice')}</p>
                                </div>
                             ) : (
                                <div className="mt-6 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-lg flex items-center gap-3">
                                   <InformationCircleIcon className="w-6 h-6 text-blue-600"/>
                                   <div>{t('manageBooking.alreadyCancelled')}</div>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ManageBooking;