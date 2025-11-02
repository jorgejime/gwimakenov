import React, { useState, useMemo, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, EnvelopeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { activityIcons, WHATSAPP_CONFIRMATION_NUMBER, getIDTypes, BOOKING_AVAILABILITY_MONTHS, TRIP_DURATION_NIGHTS } from '../constants';
import type { GuestInfo, ItineraryDay } from '../types';
import { getBookedDates, createBooking } from '../services/supabaseService';
import { useTranslation, type TFunction } from '../contexts/LanguageContext';
import { usePricing } from '../hooks/usePricing';

const formatDate = (dateString: string, locale: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00Z');
    return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    }).format(date);
};

// --- START CALENDAR COMPONENT ---
interface CalendarProps {
    viewDate: Date;
    setViewDate: (date: Date) => void;
    selectedDate: string | null;
    onDateSelect: (date: string) => void;
    bookingCapacity: Map<string, number>;
    isLoading: boolean;
    maxCapacity: number;
}

const Calendar: React.FC<CalendarProps> = ({ viewDate, setViewDate, selectedDate, onDateSelect, bookingCapacity, isLoading, maxCapacity }) => {
    const { language } = useTranslation();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstAvailableDate = new Date();
    firstAvailableDate.setDate(firstAvailableDate.getDate() + 1);

    const lastAvailableDate = new Date(today);
    lastAvailableDate.setMonth(lastAvailableDate.getMonth() + BOOKING_AVAILABILITY_MONTHS);

    const year = viewDate.getUTCFullYear();
    const month = viewDate.getUTCMonth();

    const monthName = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(viewDate);
    const weekdays = new Intl.DateTimeFormat(language, { weekday: 'narrow', timeZone: 'UTC' });
    const weekdayNames = [...Array(7).keys()].map(day => weekdays.format(new Date(Date.UTC(2021, 5, day))));


    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getUTCDay();

    const checkAvailability = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        if (date < firstAvailableDate) return { available: false, booked: false };
        const guestsOnDate = bookingCapacity.get(dateStr) || 0;
        const isFull = guestsOnDate >= maxCapacity;
        return { available: !isFull, booked: isFull };
    };
    
    const handlePrevMonth = () => {
        const newDate = new Date(viewDate);
        newDate.setUTCMonth(newDate.getUTCMonth() - 1);
        if (newDate.getUTCFullYear() > today.getUTCFullYear() || (newDate.getUTCFullYear() === today.getUTCFullYear() && newDate.getUTCMonth() >= today.getUTCMonth())) {
             setViewDate(newDate);
        }
    };
    
    const handleNextMonth = () => {
       const newDate = new Date(viewDate);
       newDate.setUTCMonth(newDate.getUTCMonth() + 1);
       if (newDate < lastAvailableDate) {
           setViewDate(newDate);
       }
    };

    const isPrevMonthDisabled = (viewDate.getUTCMonth() === today.getUTCMonth() && viewDate.getUTCFullYear() === today.getUTCFullYear()) || isLoading;
    const isNextMonthDisabled = (viewDate.getUTCMonth() === lastAvailableDate.getUTCMonth() && viewDate.getUTCFullYear() === lastAvailableDate.getUTCFullYear()) || isLoading;

    return (
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} disabled={isPrevMonthDisabled} className="p-2 rounded-full hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeftIcon className="w-5 h-5 text-slate-600" /></button>
                <h3 className="font-bold text-slate-700 capitalize">{monthName}</h3>
                <button onClick={handleNextMonth} disabled={isNextMonthDisabled} className="p-2 rounded-full hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRightIcon className="w-5 h-5 text-slate-600" /></button>
            </div>
            {isLoading ? (
                 <div className="grid grid-cols-7 gap-1 h-52 animate-pulse">
                     {Array.from({ length: 42 }).map((_, i) => <div key={i} className="bg-slate-200 rounded-full"></div>)}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 font-semibold mb-2">
                        {weekdayNames.map((d, i) => <div key={i}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`}></div>)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const date = new Date(Date.UTC(year, month, day));
                            const dateStr = date.toISOString().split('T')[0];
                            const { available, booked } = checkAvailability(date);
                            const isSelected = selectedDate === dateStr;
                            let checkOutDateStr = '';
                            if (selectedDate) {
                                const checkInDate = new Date(selectedDate + 'T00:00:00Z');
                                checkInDate.setUTCDate(checkInDate.getUTCDate() + TRIP_DURATION_NIGHTS);
                                checkOutDateStr = checkInDate.toISOString().split('T')[0];
                            }
                            const isTripDay = isSelected || dateStr === checkOutDateStr;
                            let classes = "w-10 h-10 flex items-center justify-center rounded-full text-sm transition-colors duration-200 ";
                            if (!available && !isSelected) {
                                classes += "text-slate-400 " + (booked ? "line-through " : "");
                                classes += "cursor-not-allowed";
                            } else if (isTripDay) {
                                classes += "bg-emerald-600 text-white font-bold ";
                                if (dateStr === checkOutDateStr) classes += "rounded-l-none ";
                                if (isSelected) classes += "rounded-r-none ";
                            } else if (available) {
                                classes += "text-slate-700 hover:bg-emerald-100 cursor-pointer ";
                            }
                            const isPartOfRange = selectedDate && dateStr > selectedDate && dateStr < checkOutDateStr;
                            if(isPartOfRange) {
                                classes += "bg-emerald-200 text-emerald-800 rounded-none ";
                            }
                            return (
                                <div key={day} className={`flex items-center justify-center ${isTripDay && dateStr !== checkOutDateStr ? 'bg-emerald-600 rounded-r-full' : ''} ${isTripDay && dateStr === checkOutDateStr ? 'bg-emerald-600 rounded-l-full' : ''}`}>
                                    <button onClick={() => available && onDateSelect(dateStr)} disabled={!available} className={classes}>
                                        {day}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};
// --- END CALENDAR COMPONENT ---


interface GuestCounterProps {
    label: string;
    count: number;
    onIncrement: () => void;
    onDecrement: () => void;
    disabled: boolean;
}

const GuestCounter: React.FC<GuestCounterProps> = ({ label, count, onIncrement, onDecrement, disabled }) => (
    <div className="flex justify-between items-center">
        <span className="text-slate-600 text-base">{label}</span>
        <div className="flex items-center gap-4">
            <button type="button" onClick={onDecrement} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={count === 0}>-</button>
            <span className="text-lg font-bold w-4 text-center text-slate-800">{count}</span>
            <button type="button" onClick={onIncrement} className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={disabled}>+</button>
        </div>
    </div>
);

const ItinerarySkeletonLoader = () => (
    <div className="space-y-8 animate-pulse">
        {[1].map(i => (
            <div key={i}>
                <div className="h-7 bg-slate-300 rounded w-3/4 mb-4"></div>
                <div className="space-y-4 border-l-2 border-slate-200 pl-6">
                    {[1, 2, 3].map(j => (
                        <div key={j} className="flex items-start space-x-4 relative pt-2">
                             <div className="absolute -left-[13px] top-3 bg-slate-100 p-1 rounded-full"><div className="w-4 h-4 bg-slate-300 rounded-full"></div></div>
                            <div>
                                <div className="h-5 bg-slate-300 rounded w-1/3 mb-2"></div>
                                <div className="h-4 bg-slate-300 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const ItineraryDisplay: React.FC<{
    itinerary: ItineraryDay[] | null, 
    isLoading: boolean, 
    error: string | null,
    isMobile?: boolean
}> = ({ itinerary, isLoading, error, isMobile = false }) => {
    const { t } = useTranslation();
    const containerClasses = isMobile 
        ? ""
        : "bg-slate-100 p-8 rounded-r-2xl h-full overflow-y-auto";

    return (
        <div className={containerClasses}>
            <h2 className="text-3xl font-extrabold text-slate-900 font-serif mb-6">{t('bookingModal.itinerary.title')}</h2>
            
            {isLoading && <ItinerarySkeletonLoader />}

            {error && (
                <div className="text-center max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                </div>
            )}
            
            {!isLoading && !error && !itinerary && (
                 <div className="text-center h-full flex flex-col justify-center items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <h3 className="text-2xl font-bold mt-4 font-serif text-slate-800">{t('bookingModal.itinerary.ctaTitle')}</h3>
                    <p className="mt-2 text-slate-600 max-w-sm">
                       {t('bookingModal.itinerary.ctaSubtitle')}
                    </p>
                </div>
            )}

            {!isLoading && !error && itinerary && (
                 <div className="space-y-8">
                    {itinerary.map((day) => (
                        <div key={day.day}>
                            <h3 className="text-xl font-bold text-emerald-700 font-serif mb-4">{day.day}: <span className="text-slate-800">{day.title}</span></h3>
                            <div className="space-y-5 border-l-2 border-emerald-200">
                                {day.activities.map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-4 relative pl-6">
                                        <div className="absolute -left-4 top-1 bg-slate-100 p-1 rounded-full border-4 border-slate-100">
                                            {activityIcons[activity.category] || activityIcons.default}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700">{activity.time}</p>
                                            <p className="text-slate-600 text-sm">{activity.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkIn: string;
    setCheckIn: (date: string) => void;
    checkOut: string;
    setCheckOut: (date: string) => void;
    itinerary: ItineraryDay[] | null;
    isLoading: boolean;
    error: string | null;
    onGenerateItinerary: () => void;
    onClearItinerary: () => void;
}

const formatItineraryForMessage = (itinerary: ItineraryDay[], t: TFunction, lang: string): string => {
    if (!itinerary || itinerary.length === 0) return t('whatsapp.itineraryNotGenerated');
    return itinerary.map(day => {
        const activities = day.activities.map(act => `  - ${act.time}: ${act.description}`).join('\n');
        return `*${day.day}: ${day.title}*\n${activities}`;
    }).join('\n\n');
};


const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, checkIn, setCheckIn, checkOut, setCheckOut, itinerary, isLoading, error, onGenerateItinerary, onClearItinerary }) => {
    const { t, language } = useTranslation();
    const { pricing } = usePricing();
    const ID_TYPES = getIDTypes(t);

    const [step, setStep] = useState(1);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [guests, setGuests] = useState<GuestInfo[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [finalMessage, setFinalMessage] = useState('');
    const [viewDate, setViewDate] = useState(new Date());

    const [bookingCapacity, setBookingCapacity] = useState<Map<string, number>>(new Map());
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true);

    const [payerName, setPayerName] = useState('');
    const [payerWhatsapp, setPayerWhatsapp] = useState('');
    const [payerEmail, setPayerEmail] = useState('');

    const totalGuests = adults + children;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setStep(1);
            setAdults(1);
            setChildren(0);
            setFormError(null);
            setPayerName('');
            setPayerWhatsapp('');
            setPayerEmail('');
            setIsSubmitting(false);
            setIsSubmitted(false);
            setFinalMessage('');
            setViewDate(new Date());

            const fetchAvailability = async () => {
                setIsAvailabilityLoading(true);
                try {
                    const capacityData = await getBookedDates();
                    setBookingCapacity(capacityData);
                } catch (error) {
                    const err = error instanceof Error ? error.message : 'FETCH_CAPACITY_FAILED';
                    setFormError(t(`errors.supabase.${err}`));
                } finally {
                    setIsAvailabilityLoading(false);
                }
            };
            fetchAvailability();

        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, t]);

    useEffect(() => {
        setGuests(currentGuests => {
            const newGuests: GuestInfo[] = [];
            for (let i = 0; i < totalGuests; i++) {
                newGuests.push(currentGuests[i] || { id: Date.now() + i, name: '', idType: ID_TYPES[0], idNumber: '' });
            }
            return newGuests;
        });
    }, [totalGuests, ID_TYPES]);

    const handleGuestInfoChange = (index: number, field: keyof Omit<GuestInfo, 'id'>, value: string) => {
        setGuests(currentGuests => {
            const newGuests = [...currentGuests];
            newGuests[index] = { ...newGuests[index], [field]: value };
            return newGuests;
        });
    };

    const handleDateSelect = (dateStr: string) => {
        setCheckIn(dateStr);
        onClearItinerary();
        if (dateStr) {
            const checkInDate = new Date(dateStr + 'T00:00:00Z');
            checkInDate.setUTCDate(checkInDate.getUTCDate() + TRIP_DURATION_NIGHTS);
            setCheckOut(checkInDate.toISOString().split('T')[0]);
        } else {
            setCheckOut('');
        }
    };

    const { accommodationCost, transportCost, insuranceCost, totalPrice } = useMemo(() => {
        if (!checkIn) return { accommodationCost: 0, transportCost: 0, insuranceCost: 0, totalPrice: 0 };
        const accommodationCost = TRIP_DURATION_NIGHTS * totalGuests * pricing.price_per_night;
        const transportCost = (adults * pricing.transport_cost_adult) + (children * pricing.transport_cost_child);
        const insuranceCost = totalGuests * pricing.insurance_cost_person;
        const totalPrice = accommodationCost + transportCost + insuranceCost + pricing.service_fee;
        return { accommodationCost, transportCost, insuranceCost, totalPrice };
    }, [checkIn, adults, children, totalGuests, pricing]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!checkIn || totalGuests === 0) { setFormError(t('errors.form.completeDateAndGuests')); return; }
        if (!payerName.trim() || !payerWhatsapp.trim() || !payerEmail.trim()) { setFormError(t('errors.form.completePayerInfo')); return; }
        if (guests.some(g => !g.name.trim() || !g.idType.trim() || !g.idNumber.trim())) { setFormError(t('errors.form.completeGuestInfo')); return; }
        if (!itinerary) { setFormError(t('errors.form.generateItinerary')); return; }

        setIsSubmitting(true);

        try {
            const bookingData = {
                departure_date: checkIn,
                return_date: checkOut,
                adults: adults,
                children: children,
                total_guests: totalGuests,
                total_price: totalPrice,
                payer_name: payerName,
                payer_email: payerEmail,
                payer_whatsapp: payerWhatsapp,
                guest_details: guests.map(({ id, ...rest }) => rest),
                itinerary: itinerary,
                language_preference: language
            };
            const newBooking = await createBooking(bookingData);
            
            const guestsDetails = guests.map((g, index) => 
                `*${t('whatsapp.guest', { count: index + 1 })}:*\n` +
                `  - ${t('whatsapp.name')}: ${g.name}\n` +
                `  - ${t('whatsapp.document')}: ${g.idType} - ${g.idNumber}`
            ).join('\n\n');
            const priceDetails =
                `*${t('whatsapp.priceSummary')}:*\n` +
                `${t('whatsapp.accommodation', { nights: TRIP_DURATION_NIGHTS })}: COP ${accommodationCost.toLocaleString('es-CO')}\n` +
                `${t('whatsapp.transport')}: COP ${transportCost.toLocaleString('es-CO')}\n` +
                `${t('whatsapp.insurance')}: COP ${insuranceCost.toLocaleString('es-CO')}\n` +
                `${t('whatsapp.serviceFee')}: COP ${pricing.service_fee.toLocaleString('es-CO')}\n` +
                `*Total: COP ${totalPrice.toLocaleString('es-CO')}*`;
            const itineraryDetails = formatItineraryForMessage(itinerary, t, language);
            const message = 
                `${t('whatsapp.greeting')}\n\n` +
                `${t('whatsapp.intro', { id: newBooking.id })}\n\n`+
                `*${t('whatsapp.payerDetails')}*\n` +
                `${t('whatsapp.name')}: ${payerName}\n` +
                `WhatsApp: ${payerWhatsapp}\n` +
                `${t('whatsapp.email')}: ${payerEmail}\n\n` +
                `*${t('whatsapp.tripDetails')}*\n` +
                `${t('whatsapp.departure')}: ${formatDate(checkIn, language)}\n` +
                `${t('whatsapp.return')}: ${formatDate(checkOut, language)}\n` +
                `${t('whatsapp.nights', { nights: TRIP_DURATION_NIGHTS })}\n\n` +
                `*${t('whatsapp.guestsHeader', { count: totalGuests })}*\n` +
                `${adults} ${t('whatsapp.adults')}${children > 0 ? `, ${children} ${t('whatsapp.children')}` : ''}\n\n` +
                `${guestsDetails}\n\n` +
                `*${t('whatsapp.itineraryHeader')}*\n`+
                `${itineraryDetails}\n\n` +
                `*${t('whatsapp.pricesHeader')}*\n` +
                `${priceDetails}\n\n` +
                `${t('whatsapp.farewell')}`;
            
            setFinalMessage(message);
            const whatsappUrl = `https://wa.me/${WHATSAPP_CONFIRMATION_NUMBER}?text=${encodeURIComponent(message)}`;
            
            window.open(whatsappUrl, '_blank');
            setIsSubmitted(true);

        } catch (error) {
             const err = error instanceof Error ? error.message : 'CREATE_BOOKING_FAILED';
             setFormError(t(`errors.supabase.${err}`));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const mailtoLink = `mailto:${payerEmail}?subject=${encodeURIComponent(t('bookingModal.success.emailSubject'))}&body=${encodeURIComponent(finalMessage)}`;

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 z-20"><span className="sr-only">{t('common.close')}</span><XMarkIcon className="w-8 h-8" /></button>
                
                <div className="w-full lg:w-1/2 p-8 flex flex-col overflow-y-auto">
                   {isSubmitted ? (
                        <div className="flex flex-col items-center justify-center text-center h-full">
                           <CheckCircleIcon className="w-24 h-24 text-emerald-500 mb-6" />
                           <h2 className="text-3xl font-extrabold text-slate-900 font-serif mb-2">{t('bookingModal.success.title')}</h2>
                           <p className="text-slate-600 max-w-md mb-8">{t('bookingModal.success.subtitle')}</p>
                           <div className="space-y-4 w-full max-w-sm">
                                <a href={mailtoLink} target="_blank" rel="noopener noreferrer" className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-slate-800/30 transition-all duration-300">
                                   <EnvelopeIcon className="w-5 h-5"/>
                                   {t('bookingModal.success.emailButton')}
                               </a>
                               <button onClick={onClose} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-lg transition-all duration-300">
                                   {t('bookingModal.success.finishButton')}
                               </button>
                           </div>
                       </div>
                   ) : (
                    <>
                        <div className="flex-grow">
                            <h2 className="text-3xl font-extrabold text-slate-900 font-serif mb-2">{t('bookingModal.title')}</h2>
                            <p className="text-slate-500 mb-6">{step === 1 ? t('bookingModal.step1Subtitle') : t('bookingModal.step2Subtitle')}</p>
                            
                            <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
                                {step === 1 && (
                                    <div className="space-y-5">
                                        <div>
                                            <label htmlFor="checkin-date" className="block text-sm font-semibold text-slate-600 mb-2">{t('bookingModal.dateLabel')}</label>
                                            <Calendar
                                                viewDate={viewDate}
                                                setViewDate={setViewDate}
                                                selectedDate={checkIn}
                                                onDateSelect={handleDateSelect}
                                                bookingCapacity={bookingCapacity}
                                                isLoading={isAvailabilityLoading}
                                                maxCapacity={pricing.max_capacity}
                                            />
                                            {checkOut && <p className="text-sm text-slate-500 mt-2">{t('bookingModal.returnDate')}: {formatDate(checkOut, language)} ({t('bookingModal.stayDuration', { nights: TRIP_DURATION_NIGHTS })})</p>}
                                             <p className="text-xs text-slate-500 mt-2 bg-slate-100 p-2 rounded-md">{t('bookingModal.availabilityNotice', { capacity: pricing.max_capacity })}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-1">{t('bookingModal.guestsLabel', { capacity: pricing.max_capacity })}</label>
                                            <div className="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-300">
                                                <GuestCounter label={t('bookingModal.adults')} count={adults} onIncrement={() => setAdults(a => a + 1)} onDecrement={() => setAdults(a => Math.max(1, a - 1))} disabled={totalGuests >= pricing.max_capacity}/>
                                                <GuestCounter label={t('bookingModal.children')} count={children} onIncrement={() => setChildren(c => c + 1)} onDecrement={() => setChildren(c => Math.max(0, c - 1))} disabled={totalGuests >= pricing.max_capacity} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('bookingModal.payerDetails')}</h3>
                                            <div className="space-y-3">
                                                <input type="text" placeholder={t('bookingModal.placeholders.fullName')} value={payerName} onChange={e => setPayerName(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                                <input type="tel" placeholder={t('bookingModal.placeholders.whatsapp')} value={payerWhatsapp} onChange={e => setPayerWhatsapp(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                                <input type="email" placeholder={t('bookingModal.placeholders.email')} value={payerEmail} onChange={e => setPayerEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                            </div>
                                        </div>

                                        {totalGuests > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('bookingModal.guestDetails')}</h3>
                                                <div className="space-y-3">
                                                    {guests.map((guest, index) => (
                                                        <div key={guest.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                                                            <p className="text-sm font-bold text-slate-600">{t('bookingModal.guestNumber', { count: index + 1 })}</p>
                                                            <input type="text" placeholder={t('bookingModal.placeholders.fullName')} value={guest.name} onChange={(e) => handleGuestInfoChange(index, 'name', e.target.value)} required className="w-full bg-white border border-slate-300 rounded-lg p-2 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                                            <div className="flex gap-2">
                                                                <select value={guest.idType} onChange={(e) => handleGuestInfoChange(index, 'idType', e.target.value)} required className="w-1/2 bg-white border border-slate-300 rounded-lg p-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
                                                                    <option value="" disabled>{t('bookingModal.placeholders.idType')}</option>
                                                                    {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                                                </select>
                                                                <input type="text" placeholder={t('bookingModal.placeholders.idNumber')} value={guest.idNumber} onChange={(e) => handleGuestInfoChange(index, 'idNumber', e.target.value)} required className="w-1/2 bg-white border border-slate-300 rounded-lg p-2 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"/>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {checkIn && totalGuests > 0 && (
                                             <div className="space-y-1 text-slate-600 text-sm pt-4 border-t border-slate-200">
                                                <h4 className="text-base font-bold text-slate-800 mb-2">{t('bookingModal.priceSummary.title')}</h4>
                                                <div className="flex justify-between"><span>{t('bookingModal.priceSummary.accommodation', { nights: TRIP_DURATION_NIGHTS })}</span> <span>COP {accommodationCost.toLocaleString('es-CO')}</span></div>
                                                <div className="flex justify-between"><span>{t('bookingModal.priceSummary.transport')}</span> <span>COP {transportCost.toLocaleString('es-CO')}</span></div>
                                                <div className="flex justify-between"><span>{t('bookingModal.priceSummary.insurance')}</span> <span>COP {insuranceCost.toLocaleString('es-CO')}</span></div>
                                                <div className="flex justify-between"><span>{t('bookingModal.priceSummary.serviceFee')}</span> <span>COP {pricing.service_fee.toLocaleString('es-CO')}</span></div>
                                                <div className="flex justify-between font-bold text-slate-800 text-lg pt-2 border-t border-slate-300 mt-2"><span>{t('bookingModal.priceSummary.total')}</span> <span>COP {totalPrice.toLocaleString('es-CO')}</span></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                 {formError && <p className="text-red-500 text-center text-sm pt-2">{formError}</p>}
                            </form>
                            
                            <div className="lg:hidden mt-8 pt-8 border-t border-slate-200">
                               <ItineraryDisplay itinerary={itinerary} isLoading={isLoading} error={error} isMobile={true} />
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200">
                             {step === 1 && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button type="button" onClick={onGenerateItinerary} disabled={isLoading || !checkIn} className="w-full flex justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-600/30 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                        {isLoading ? t('buttons.generating') : t('buttons.generateItinerary')}
                                    </button>
                                    {itinerary && !isLoading && !error && (
                                        <button type="button" onClick={() => setStep(2)} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300">
                                            {t('buttons.next')}
                                        </button>
                                    )}
                                </div>
                             )}
                             {step === 2 && (
                                 <div className="flex flex-col sm:flex-row gap-4">
                                    <button type="button" onClick={() => setStep(1)} className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-lg transition-all duration-300">
                                        {t('buttons.back')}
                                    </button>
                                    <button type="submit" form="booking-form" disabled={isSubmitting || !checkIn} className="w-full flex justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-600/30 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                        {isSubmitting ? t('buttons.processing') : t('buttons.confirmBooking')}
                                    </button>
                                 </div>
                             )}
                        </div>
                    </>
                   )}
                </div>

                <div className="hidden lg:block lg:w-1/2">
                    <ItineraryDisplay itinerary={itinerary} isLoading={isLoading} error={error} />
                </div>
            </div>
        </div>
    );
};

export default BookingModal;