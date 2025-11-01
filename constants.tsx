import React from 'react';
import type { InstagramPost, Testimonial } from './types';
import type { TFunction } from './contexts/LanguageContext';

// Icons for Itinerary
const SunriseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.95-4.243l-1.591 1.591M5.25 12H3m4.243-4.95l1.591-1.591" /></svg>
);
const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.57-1.023.57-2.206 0-3.228m-5.742 4.243L4.5 15.75m1.5-1.5l1.5-1.5m-3 3l-1.5-1.5m3 3l1.5 1.5M9 11.25l-1.5 1.5L6 11.25m6-3.75l.375.375m-.375-.375L15 6.375M17.25 9.75l-1.5-1.5m-3-3l-1.5-1.5m1.5 1.5l1.5 1.5" /></svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
);
const FireIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797z" /></svg>
);

export const activityIcons: { [key: string]: React.ReactNode } = {
    connection: <UserGroupIcon className="w-6 h-6 text-emerald-600" />,
    nature: <SunriseIcon className="w-6 h-6 text-emerald-600" />,
    culture: <SparklesIcon className="w-6 h-6 text-emerald-600" />,
    community: <FireIcon className="w-6 h-6 text-emerald-600" />,
    spirituality: <SparklesIcon className="w-6 h-6 text-emerald-600" />,
    default: <SparklesIcon className="w-6 h-6 text-emerald-600" />,
};

export const getInstagramPosts = (t: TFunction): InstagramPost[] => [
    { id: "1", src: "https://i.ibb.co/BVgWnYbz/imgi-11-510977674-18073508762497491-8712212144693316187-n.jpg", alt: t('gallery.posts.0.alt'), caption: t('gallery.posts.0.caption'), likes: 120, comments: 15 },
    { id: "2", src: "https://i.ibb.co/357M7c0H/imgi-13-471863200-1123279195865002-7505376879281847661-n.jpg", alt: t('gallery.posts.1.alt'), caption: t('gallery.posts.1.caption'), likes: 256, comments: 23 },
    { id: "3", src: "https://i.ibb.co/j9j9ZLz3/imgi-6-461288196-838543938477413-4359253168510007997-n.jpg", alt: t('gallery.posts.2.alt'), caption: t('gallery.posts.2.caption'), likes: 310, comments: 45 },
    { id: "4", src: "https://i.ibb.co/PGngLp2S/imgi-32-469199706-18055644730822217-8566621187428463397-n.jpg", alt: t('gallery.posts.3.alt'), caption: t('gallery.posts.3.caption'), likes: 189, comments: 12 },
    { id: "5", src: "https://i.ibb.co/4wkhhG2s/imgi-25-503980544-1025310469713770-8097250938206860100-n.jpg", alt: t('gallery.posts.4.alt'), caption: t('gallery.posts.4.caption'), likes: 145, comments: 8 },
    { id: "6", src: "https://i.ibb.co/HD0b6pdy/imgi-18-503829183-723803386746242-373303711569613251-n.jpg", alt: t('gallery.posts.5.alt'), caption: t('gallery.posts.5.caption'), likes: 212, comments: 19 },
];

export const getTestimonials = (t: TFunction): Testimonial[] => [
    {
        quote: t('testimonials.items.0.quote'),
        author: t('testimonials.items.0.author'),
        location: t('testimonials.items.0.location')
    },
    {
        quote: t('testimonials.items.1.quote'),
        author: t('testimonials.items.1.author'),
        location: t('testimonials.items.1.location')
    },
    {
        quote: t('testimonials.items.2.quote'),
        author: t('testimonials.items.2.author'),
        location: t('testimonials.items.2.location')
    }
];

export const getIDTypes = (t: TFunction): string[] => ([
    t('idTypes.citizenshipCard'),
    t('idTypes.passport'),
    t('idTypes.foreignersCard'),
    t('idTypes.identityCard'),
    t('idTypes.other'),
]);


// --- Booking Engine Constants ---
export const PRICE_PER_NIGHT = 250000; // Price per night per person in COP
export const SERVICE_FEE = 50000; // Service/management fee in COP
export const TRANSPORT_COST_ADULT = 90000; // Transport cost per adult
export const TRANSPORT_COST_CHILD = 70000; // Transport cost per child
export const INSURANCE_COST_PERSON = 12000; // Insurance cost per person
export const MAX_CAPACITY = 20; // Maximum visitor capacity
export const WHATSAPP_CONFIRMATION_NUMBER = '573184131391';

// --- Business Rules for Booking ---
export const TRIP_DURATION_NIGHTS = 1; // The stay is always 1 night (2 days).
export const DEPARTURE_INTERVAL_DAYS = 2; // Departures are every 2 days.
export const BOOKING_AVAILABILITY_MONTHS = 3; // Show availability for the next 3 months.