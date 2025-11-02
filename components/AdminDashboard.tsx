import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllBookings, updateBookingStatus, AdminBooking, BookingStatus } from '../services/supabaseService';
import { getDashboardStats } from '../services/supabaseExtendedService';
import { useTranslation } from '../contexts/LanguageContext';
import { ArrowRightOnRectangleIcon, CheckCircleIcon, ExclamationTriangleIcon, PhotoIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import BookingDetailModal from './BookingDetailModal';
import HeroImageManager from './HeroImageManager';
import GalleryImageManager from './GalleryImageManager';

const formatDate = (dateString: string, locale: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString); // Use full ISO string
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
};

const getStatusInfo = (status: BookingStatus, t: (key: string) => string) => {
    switch (status) {
        case 'pending': return { text: t('bookingStatus.pending'), color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
        case 'confirmed': return { text: t('bookingStatus.confirmed'), color: 'bg-green-100 text-green-800 border-green-200' };
        case 'cancelled': return { text: t('bookingStatus.cancelled'), color: 'bg-red-100 text-red-800 border-red-200' };
        default: return { text: status, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { t, language } = useTranslation();
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'bookings' | 'images' | 'gallery' | 'stats'>('bookings');
    const [stats, setStats] = useState<any>(null);

    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllBookings();
            setBookings(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? t(`errors.supabase.${err.message}`) : t('errors.unknown');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBookings();
        if (activeView === 'stats') {
            loadStats();
        }
    }, [fetchBookings, activeView]);

    const loadStats = async () => {
        try {
            const statsData = await getDashboardStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleUpdateStatus = async (id: string, status: BookingStatus) => {
        setUpdatingId(id);
        setError(null);
        setSuccessMessage(null);
        try {
            const updatedBooking = await updateBookingStatus(id, status);
            setBookings(currentBookings => 
                currentBookings.map(b => b.id === id ? updatedBooking : b)
            );
            const statusText = getStatusInfo(status, t).text.toLowerCase();
            setSuccessMessage(t('admin.dashboard.successUpdate', { status: statusText }));
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err) {
            const errorMessage = err instanceof Error ? t(`errors.supabase.${err.message}`) : t('errors.unknown');
            setError(errorMessage);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredAndSortedBookings = useMemo(() => {
        return bookings
            .filter(booking => statusFilter === 'all' || booking.status === statusFilter)
            .sort((a, b) => {
                const dateA = new Date(a.departure_date).getTime();
                const dateB = new Date(b.departure_date).getTime();
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
            });
    }, [bookings, statusFilter, sortOrder]);

    return (
        <div className="bg-white min-h-full py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 font-serif">{t('admin.dashboard.title')}</h1>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        {t('admin.dashboard.logout')}
                    </button>
                </header>

                <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveView('bookings')}
                        className={`px-6 py-3 font-semibold whitespace-nowrap ${activeView === 'bookings' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        {t('admin.dashboard.tabs.bookings')}
                    </button>
                    <button
                        onClick={() => setActiveView('images')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeView === 'images' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        <PhotoIcon className="w-5 h-5" />
                        {t('admin.dashboard.tabs.images')}
                    </button>
                    <button
                        onClick={() => setActiveView('gallery')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeView === 'gallery' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        <PhotoIcon className="w-5 h-5" />
                        Galería
                    </button>
                    <button
                        onClick={() => setActiveView('stats')}
                        className={`flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap ${activeView === 'stats' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        {t('admin.dashboard.tabs.stats')}
                    </button>
                </div>
                
                 {successMessage && (
                    <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg flex items-center gap-3">
                        <CheckCircleIcon className="w-6 h-6 text-green-600"/>
                        <div>{successMessage}</div>
                    </div>
                )}
                {error && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600"/>
                        <div>{error}</div>
                    </div>
                )}

                {activeView === 'images' && <HeroImageManager />}

                {activeView === 'gallery' && <GalleryImageManager />}

                {activeView === 'stats' && (
                    <div className="space-y-6">
                        {stats ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                                        <h3 className="text-sm font-semibold mb-2 opacity-90">{t('admin.stats.totalBookings')}</h3>
                                        <p className="text-4xl font-bold">{stats.total}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                                        <h3 className="text-sm font-semibold mb-2 opacity-90">{t('admin.stats.confirmed')}</h3>
                                        <p className="text-4xl font-bold">{stats.confirmed}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
                                        <h3 className="text-sm font-semibold mb-2 opacity-90">{t('admin.stats.pending')}</h3>
                                        <p className="text-4xl font-bold">{stats.pending}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
                                        <h3 className="text-sm font-semibold mb-2 opacity-90">{t('admin.stats.cancelled')}</h3>
                                        <p className="text-4xl font-bold">{stats.cancelled}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('admin.stats.totalRevenue')}</h3>
                                        <p className="text-3xl font-bold text-emerald-600">COP {stats.totalRevenue.toLocaleString('es-CO')}</p>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow">
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('admin.stats.upcomingGuests')}</h3>
                                        <p className="text-3xl font-bold text-blue-600">{stats.upcomingGuests}</p>
                                        <p className="text-sm text-slate-600 mt-1">{t('admin.stats.next30Days')}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-slate-600">{t('common.loading')}</p>
                        )}
                    </div>
                )}

                {activeView === 'bookings' && (
                    <>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">{t('admin.dashboard.filterByStatus')}</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
                                <option value="all">{t('bookingStatus.all')}</option>
                                <option value="pending">{t('bookingStatus.pending')}</option>
                                <option value="confirmed">{t('bookingStatus.confirmed')}</option>
                                <option value="cancelled">{t('bookingStatus.cancelled')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">{t('admin.dashboard.sortByDate')}</label>
                            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
                                <option value="newest">{t('admin.dashboard.newestFirst')}</option>
                                <option value="oldest">{t('admin.dashboard.oldestFirst')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-center text-slate-600 py-10">{t('admin.dashboard.loading')}</p>
                ) : filteredAndSortedBookings.length === 0 ? (
                     <p className="text-center text-slate-600 py-10 bg-slate-50 rounded-lg">{t('admin.dashboard.noBookingsFound')}</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedBookings.map(booking => {
                            const statusInfo = getStatusInfo(booking.status, t);
                            const isUpdatingThis = updatingId === booking.id;
                            return (
                                <div key={booking.id} className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedBookingId(booking.id)}>
                                    <div className={`p-4 border-b-4 ${statusInfo.color.replace('bg-', 'border-')} rounded-t-xl`}>
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg text-slate-800">{booking.payer_name}</h3>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">ID: <code className="bg-slate-100 rounded px-1">{booking.id.substring(0,8)}</code></p>
                                    </div>
                                    <div className="p-4 space-y-2 text-sm flex-grow">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">{t('admin.dashboard.departureDate')}:</span>
                                            <span className="font-semibold text-slate-700">{formatDate(booking.departure_date, language)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">{t('admin.dashboard.guests')}:</span>
                                            <span className="font-semibold text-slate-700">{booking.total_guests}</span>
                                        </div>
                                    </div>
                                    {booking.status !== 'cancelled' && (
                                        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex flex-wrap gap-2 justify-end">
                                            {booking.status !== 'confirmed' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking.id, 'confirmed'); }} disabled={isUpdatingThis} className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition disabled:bg-slate-400">
                                                    {isUpdatingThis ? t('admin.dashboard.actions.updating') : t('admin.dashboard.actions.confirm')}
                                                </button>
                                            )}
                                            {booking.status !== 'pending' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking.id, 'pending'); }} disabled={isUpdatingThis} className="text-xs font-bold bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition disabled:bg-slate-400">
                                                    {isUpdatingThis ? t('admin.dashboard.actions.updating') : t('admin.dashboard.actions.setPending')}
                                                </button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking.id, 'cancelled'); }} disabled={isUpdatingThis} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition disabled:bg-slate-400">
                                                {isUpdatingThis ? t('admin.dashboard.actions.updating') : t('admin.dashboard.actions.cancel')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                    </>
                )}

                {selectedBookingId && (
                    <BookingDetailModal
                        bookingId={selectedBookingId}
                        onClose={() => setSelectedBookingId(null)}
                        onBookingUpdated={() => {
                            fetchBookings();
                            setSuccessMessage(t('admin.dashboard.bookingUpdated'));
                            setTimeout(() => setSuccessMessage(null), 4000);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
