import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ExperienceSection from './components/ServicesSection';
import GallerySection from './components/GallerySection';
import BookingModal from './components/BookingModal';
import Footer from './components/Footer';
import ManageBooking from './components/ManageBooking';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { getTestimonials } from './constants';
import type { ItineraryDay, Testimonial } from './types';
import { generateItinerary } from './services/geminiService';
import { useTranslation } from './contexts/LanguageContext';

const TestimonialsSection: React.FC<{ testimonials: Testimonial[] }> = ({ testimonials }) => {
    const { t } = useTranslation();
    return (
        <section id="testimonials" className="py-24 bg-slate-100">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-extrabold text-slate-900 font-serif">{t('testimonials.title')}</h2>
                    <p className="text-lg text-slate-600 mt-4">{t('testimonials.subtitle')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="bg-white rounded-xl p-8 shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                            <div className="text-emerald-600 mb-4">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M10.414,1.586c1.1,0,2.186,0.43,2.969,1.213c0.783,0.783,1.214,1.87,1.214,2.969c0,1.1-0.43,2.186-1.214,2.969c-0.783,0.783-1.87,1.214-2.969,1.214c-0.53,0-1.049-0.1-1.531-0.293l-0.531-0.203L6.586,13.414l-1.414-1.414L8.586,8.586L8.383,8.055C8.19,7.572,8.086,7.055,8.086,6.521c0-1.1,0.43-2.186,1.214-2.969C10.084,2.373,10.2,1.686,10.414,1.586z M2.414,1.586c1.1,0,2.186,0.43,2.969,1.213c0.783,0.783,1.214,1.87,1.214,2.969c0,1.1-0.43,2.186-1.214,2.969c-0.783,0.783-1.87,1.214-2.969,1.214c-0.53,0-1.049-0.1-1.531-0.293L-1.414,8.25L-2.828,6.836l3.414-3.414L0.383,2.906C0.19,2.424,0.086,1.906,0.086,1.373c0-1.1,0.43-2.186,1.214-2.969C2.084,-0.627,2.2,-1.314,2.414-1.414L2.414,1.586z"></path></svg>
                            </div>
                            <p className="text-slate-600 italic mb-6">"{testimonial.quote}"</p>
                            <div className="font-semibold text-slate-800">{testimonial.author}</div>
                            <div className="text-sm text-slate-500">{testimonial.location}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const App: React.FC = () => {
    const { t, language } = useTranslation();
    const [view, setView] = useState('home'); // 'home' | 'manage' | 'admin'
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
    const [isItineraryLoading, setIsItineraryLoading] = useState(false);
    const [itineraryError, setItineraryError] = useState<string | null>(null);

    const testimonials = getTestimonials(t);

    const handleNavClick = (sectionId: string) => {
        const scrollToAction = () => {
            if (sectionId) {
                document.querySelector(sectionId)?.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        if (view !== 'home') {
            setView('home');
            setTimeout(scrollToAction, 100);
        } else {
            scrollToAction();
        }
    };

    const handleGenerateItinerary = useCallback(async () => {
        if (checkIn) {
            setIsItineraryLoading(true);
            setItineraryError(null);
            setItinerary(null);
            try {
                const data = await generateItinerary(checkIn, language);
                setItinerary(data);
            } catch (error) {
                setItineraryError(error instanceof Error ? error.message : t('errors.unknown'));
            } finally {
                setIsItineraryLoading(false);
            }
        } else {
            setItinerary(null);
            setItineraryError(t('errors.invalidDate'));
        }
    }, [checkIn, language, t]);

    const handleClearItinerary = useCallback(() => {
        setItinerary(null);
        setItineraryError(null);
    }, []);

    const handleOpenBookingModal = () => {
        setIsBookingModalOpen(true);
    };

    const handleCloseBookingModal = () => {
        setIsBookingModalOpen(false);
        setCheckIn('');
        setCheckOut('');
        handleClearItinerary();
    };

    const handleNavigate = (newView: 'home' | 'manage' | 'admin') => {
        setView(newView);
        window.scrollTo(0, 0);
    };
    
    const handleLogout = () => {
        setIsAdminAuthenticated(false);
        setView('home');
    }

    const renderView = () => {
        switch (view) {
            case 'manage':
                return <ManageBooking onBackToHome={() => handleNavigate('home')} />;
            case 'admin':
                return isAdminAuthenticated 
                    ? <AdminDashboard onLogout={handleLogout} /> 
                    : <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} onBackToHome={() => handleNavigate('home')} />;
            case 'home':
            default:
                return (
                    <>
                        <Hero onBookNowClick={handleOpenBookingModal} />
                        <div id="experience" className="pt-20 -mt-20">
                            <ExperienceSection onBookNowClick={handleOpenBookingModal} />
                        </div>
                        <div id="gallery" className="pt-20 -mt-20">
                            <GallerySection />
                        </div>
                        <div id="testimonials" className="pt-20 -mt-20">
                            <TestimonialsSection testimonials={testimonials} />
                        </div>
                    </>
                );
        }
    }

    return (
        <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
            <Header onBookNowClick={handleOpenBookingModal} onNavClick={handleNavClick} />
            <main className="flex-grow">
                {renderView()}
            </main>
            <Footer 
                onManageBookingClick={() => handleNavigate('manage')} 
                onAdminClick={() => handleNavigate('admin')}
            />

            {isBookingModalOpen && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={handleCloseBookingModal}
                    checkIn={checkIn}
                    setCheckIn={setCheckIn}
                    checkOut={checkOut}
                    setCheckOut={setCheckOut}
                    itinerary={itinerary}
                    isLoading={isItineraryLoading}
                    error={itineraryError}
                    onGenerateItinerary={handleGenerateItinerary}
                    onClearItinerary={handleClearItinerary}
                />
            )}
        </div>
    );
};

export default App;