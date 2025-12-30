import type { ItineraryDay } from '../types';
import { TRIP_DURATION_NIGHTS } from '../constants';

/**
 * Genera un itinerario llamando a la Edge Function de Supabase
 * SEGURIDAD: El API key de OpenAI ahora está seguro en el servidor
 */
const getFallbackItinerary = (startDate: string, lang: 'es' | 'en'): ItineraryDay[] => {
    const checkInDate = new Date(startDate);
    checkInDate.setDate(checkInDate.getDate() + TRIP_DURATION_NIGHTS);
    const endDate = checkInDate.toISOString().split('T')[0];

    if (lang === 'es') {
        return [
            {
                day: `Día 1 (${startDate})`,
                title: "Viaje y Bienvenida a Gwimake",
                activities: [
                    {
                        time: "6:00 AM",
                        description: "Salida desde las oficinas de Gwimake en Aracataca. Encuentro con el grupo y viaje en camionetas 4x4 hacia la Sierra Nevada (6 horas de recorrido).",
                        category: "nature"
                    },
                    {
                        time: "12:00 PM",
                        description: "Llegada a la comunidad. Bienvenida por la familia anfitriona con una ceremonia tradicional de agradecimiento.",
                        category: "community"
                    },
                    {
                        time: "1:00 PM",
                        description: "Almuerzo comunitario con alimentos cultivados en la Sierra. Conversación sobre la cosmovisión Arhuaca.",
                        category: "culture"
                    },
                    {
                        time: "3:00 PM",
                        description: "Recorrido por el territorio sagrado. Visita a lugares de importancia espiritual y cultural, aprendiendo sobre la relación de los Arhuacos con la naturaleza.",
                        category: "spirituality"
                    },
                    {
                        time: "6:00 PM",
                        description: "Cena comunitaria y círculo de la palabra alrededor del fuego. Historias, cantos y conexión profunda con la comunidad.",
                        category: "connection"
                    },
                    {
                        time: "9:00 PM",
                        description: "Descanso en alojamiento tradicional. Noche bajo las estrellas de la Sierra.",
                        category: "nature"
                    }
                ]
            },
            {
                day: `Día 2 (${endDate})`,
                title: "Ritual del Amanecer y Despedida",
                activities: [
                    {
                        time: "5:30 AM",
                        description: "Ritual de saludo al sol con el Mamo (líder espiritual). Ceremonia de agradecimiento y reflexión sobre la experiencia vivida.",
                        category: "spirituality"
                    },
                    {
                        time: "7:00 AM",
                        description: "Desayuno con la familia anfitriona. Diálogo sobre la cosmovisión Arhuaca y despedida personal.",
                        category: "connection"
                    },
                    {
                        time: "9:00 AM",
                        description: "Tiempo libre para recorrer la comunidad, tomar fotografías respetuosas y hacer últimas preguntas.",
                        category: "culture"
                    },
                    {
                        time: "12:00 PM",
                        description: "Almuerzo de despedida con la comunidad. Intercambio de palabras finales y preparación para el retorno.",
                        category: "community"
                    },
                    {
                        time: "3:00 PM",
                        description: "Salida de la comunidad hacia Aracataca. Viaje de regreso en camionetas 4x4 (6 horas). Llegada aproximada a las 9:00 PM.",
                        category: "nature"
                    }
                ]
            }
        ];
    } else {
        return [
            {
                day: `Day 1 (${startDate})`,
                title: "Journey and Welcome to Gwimake",
                activities: [
                    {
                        time: "6:00 AM",
                        description: "Departure from Gwimake offices in Aracataca. Meet the group and travel in 4x4 trucks to Sierra Nevada (6-hour journey).",
                        category: "nature"
                    },
                    {
                        time: "12:00 PM",
                        description: "Arrival at the community. Welcome by the host family with a traditional gratitude ceremony.",
                        category: "community"
                    },
                    {
                        time: "1:00 PM",
                        description: "Community lunch with food grown in the Sierra. Conversation about the Arhuaco worldview.",
                        category: "culture"
                    },
                    {
                        time: "3:00 PM",
                        description: "Tour of the sacred territory. Visit places of spiritual and cultural importance, learning about the Arhuaco relationship with nature.",
                        category: "spirituality"
                    },
                    {
                        time: "6:00 PM",
                        description: "Community dinner and circle of the word around the fire. Stories, songs, and deep connection with the community.",
                        category: "connection"
                    },
                    {
                        time: "9:00 PM",
                        description: "Rest in traditional accommodation. Night under the stars of the Sierra.",
                        category: "nature"
                    }
                ]
            },
            {
                day: `Day 2 (${endDate})`,
                title: "Sunrise Ritual and Farewell",
                activities: [
                    {
                        time: "5:30 AM",
                        description: "Sun-greeting ritual with the Mamo (spiritual leader). Ceremony of gratitude and reflection on the experience.",
                        category: "spirituality"
                    },
                    {
                        time: "7:00 AM",
                        description: "Breakfast with the host family. Dialogue about the Arhuaco worldview and personal farewell.",
                        category: "connection"
                    },
                    {
                        time: "9:00 AM",
                        description: "Free time to explore the community, take respectful photographs, and ask final questions.",
                        category: "culture"
                    },
                    {
                        time: "12:00 PM",
                        description: "Farewell lunch with the community. Exchange of final words and preparation for return.",
                        category: "community"
                    },
                    {
                        time: "3:00 PM",
                        description: "Departure from the community to Aracataca. Return trip in 4x4 trucks (6 hours). Approximate arrival at 9:00 PM.",
                        category: "nature"
                    }
                ]
            }
        ];
    }
};

/**
 * Genera un itinerario llamando a la Edge Function segura de Supabase
 * SEGURIDAD: El API key de OpenAI está protegido en el servidor
 */
export const generateItinerary = async (startDate: string, lang: 'es' | 'en'): Promise<ItineraryDay[]> => {
    try {
        // Obtener la URL de Supabase
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('Supabase not configured, using fallback itinerary');
            return getFallbackItinerary(startDate, lang);
        }

        // Llamar a la Edge Function
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-itinerary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ startDate, lang })
        });

        if (!response.ok) {
            throw new Error(`Edge Function error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.itinerary || !Array.isArray(data.itinerary)) {
            throw new Error('Invalid response format from Edge Function');
        }

        return data.itinerary as ItineraryDay[];

    } catch (error) {
        console.error("Error generating itinerary:", error);
        console.warn("Falling back to predefined itinerary");
        return getFallbackItinerary(startDate, lang);
    }
};
