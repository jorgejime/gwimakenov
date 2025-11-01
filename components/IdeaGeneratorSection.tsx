import React from 'react';
import { activityIcons } from '../constants';
import type { ItineraryDay } from '../types';

interface ItinerarySectionProps {
    itinerary: ItineraryDay[] | null;
    isLoading: boolean;
    error: string | null;
}

const ItinerarySkeletonLoader = () => (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
        {[1, 2].map(i => (
            <div key={i}>
                <div className="h-8 bg-slate-300 rounded w-3/4 mb-6"></div>
                <div className="space-y-6 border-l-2 border-slate-200 pl-6">
                    {[1, 2, 3].map(j => (
                        <div key={j} className="flex items-start space-x-4 relative">
                            <div className="absolute -left-[37px] top-1 bg-slate-100 p-1 rounded-full">
                                <div className="w-6 h-6 bg-slate-300 rounded-full border-4 border-slate-100"></div>
                            </div>
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


const ItinerarySection: React.FC<ItinerarySectionProps> = ({ itinerary, isLoading, error }) => {
    return (
        <section className="py-24 bg-slate-100 min-h-[500px]">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-slate-900 font-serif">Tu Itinerario Personalizado</h2>
                    <p className="text-lg text-slate-600 mt-2">Un plan de viaje único, creado especialmente para ti.</p>
                </div>

                {isLoading && <ItinerarySkeletonLoader />}

                {error && (
                    <div className="text-center max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        <strong className="font-bold">¡Oh, no!</strong>
                        <p className="block sm:inline ml-2">{error}</p>
                    </div>
                )}
                
                {!isLoading && !error && !itinerary && (
                    <div className="text-center max-w-xl mx-auto bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-8 rounded-xl shadow-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <h3 className="text-2xl font-bold mt-4 font-serif">Crea tu Aventura</h3>
                        <p className="mt-2 text-slate-600">
                            Selecciona tus fechas de llegada y salida en la sección de reservas para generar tu itinerario personalizado con la magia de la IA.
                        </p>
                    </div>
                )}

                {!isLoading && !error && itinerary && (
                     <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                        {itinerary.map((day) => (
                            <div key={day.day}>
                                <h3 className="text-2xl font-bold text-emerald-700 font-serif mb-6">{day.day}: <span className="text-slate-800">{day.title}</span></h3>
                                <div className="space-y-6 border-l-2 border-emerald-200 pl-6">
                                    {day.activities.map((activity, index) => (
                                        <div key={index} className="flex items-start space-x-4 relative">
                                            <div className="absolute -left-[37px] top-1 bg-slate-100 p-1 rounded-full">
                                                {activityIcons[activity.category] || activityIcons.default}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{activity.time}</p>
                                                <p className="text-slate-600">{activity.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ItinerarySection;