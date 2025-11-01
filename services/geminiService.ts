import { GoogleGenAI, Type } from "@google/genai";
import type { ItineraryDay } from '../types';
import { TRIP_DURATION_NIGHTS } from '../constants';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

let ai: any = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

const itinerarySchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: {
        type: Type.STRING,
        description: "The day number and date, e.g., 'Day 1 (2024-08-10)' or 'Día 1 (2024-08-10)'"
      },
      title: {
        type: Type.STRING,
        description: "A thematic title for the day."
      },
      activities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: {
              type: Type.STRING,
              description: "Time of day (e.g., 'Sunrise', 'Morning', 'Afternoon', 'Night' or their Spanish equivalents)."
            },
            description: {
              type: Type.STRING,
              description: "Brief description of the activity."
            },
            category: {
              type: Type.STRING,
              enum: ['connection', 'nature', 'culture', 'community', 'spirituality'],
              description: "Category of the activity."
            }
          },
          required: ["time", "description", "category"]
        }
      }
    },
    required: ["day", "title", "activities"]
  }
};


export const generateItinerary = async (startDate: string, lang: 'es' | 'en'): Promise<ItineraryDay[]> => {
    if (!ai) {
        throw new Error(lang === 'es'
            ? 'La API de Gemini no está configurada. Por favor, contacta al administrador.'
            : 'The Gemini API is not configured. Please contact the administrator.');
    }

    const checkInDate = new Date(startDate);
    checkInDate.setDate(checkInDate.getDate() + TRIP_DURATION_NIGHTS);
    const endDate = checkInDate.toISOString().split('T')[0];

    const prompts = {
        es: {
            expert: "Eres un experto planificador de viajes para Gwimake, una comunidad indígena Arhuaca en la Sierra Nevada de Santa Marta, Colombia. Tu tarea es crear una experiencia cultural inmersiva, respetuosa y transformadora para una estancia fija de 2 días y 1 noche.",
            dates: `**Fechas de la estancia:**\n- Fecha de inicio del viaje (salida de Aracataca): ${startDate}\n- Fecha de fin del viaje (regreso a Aracataca): ${endDate}`,
            transportRules: "**Reglas de transporte obligatorias:**\n1.  **Punto de Partida:** La expedición comienza el ${startDate} a las 6:00 AM. El punto de encuentro es en las oficinas de Gwimake en Aracataca. La primera actividad del itinerario debe reflejar esto.\n2.  **Viaje de Ida:** El trayecto desde Aracataca hasta la comunidad es en camionetas 4x4 y dura aproximadamente 6 horas. La llegada a la comunidad será, por tanto, alrededor del mediodía. La bienvenida y el almuerzo deben ser las primeras actividades al llegar.\n3.  **Viaje de Regreso:** La salida de la comunidad para el regreso a Aracataca es el día ${endDate} a las 3:00 PM. El almuerzo de despedida debe realizarse antes de esa hora. El viaje de regreso también dura 6 horas.",
            keyActivities: "**Actividades clave a incluir:**\nDistribuidas lógicamente durante la estancia de 2 días y 1 noche, asegúrate de incluir una selección de estas experiencias:\n- Bienvenida por la familia anfitriona (al llegar el primer día).\n- Recorrido por el territorio sagrado.\n- Cena comunitaria y círculo de la palabra alrededor del fuego.\n- Ritual de saludo al sol con el Mamo (líder espiritual).\n- Desayuno con diálogo sobre la cosmovisión Arhuaca.\n- Almuerzo de despedida (antes de la partida el último día).",
            instructions: `**Instrucciones:**\n- Crea un itinerario detallado para la visita desde el ${startDate} hasta el ${endDate}.\n- El ritmo debe ser relajado, fomentando una conexión genuina.\n- Para cada actividad, especifica el momento del día ('Amanecer', 'Mañana', 'Tarde', 'Noche'), una descripción concisa y una de las siguientes categorías: 'connection', 'nature', 'culture', 'community', 'spirituality'. El viaje en camioneta debe tener categoría 'nature'.\n- Toda la respuesta debe estar en español.`,
            outputFormat: "El resultado debe ser un objeto JSON que se adhiera estrictamente al esquema proporcionado.",
            error: "No pudimos generar tu itinerario en este momento. Por favor, intenta de nuevo."
        },
        en: {
            expert: "You are an expert travel planner for Gwimake, an Arhuaco indigenous community in the Sierra Nevada de Santa Marta, Colombia. Your task is to create an immersive, respectful, and transformative cultural experience for a fixed 2-day, 1-night stay.",
            dates: `**Stay Dates:**\n- Start date of the trip (departure from Aracataca): ${startDate}\n- End date of the trip (return to Aracataca): ${endDate}`,
            transportRules: "**Mandatory Transport Rules:**\n1.  **Departure Point:** The expedition begins on ${startDate} at 6:00 AM. The meeting point is at the Gwimake offices in Aracataca. The first itinerary activity must reflect this.\n2.  **Inbound Journey:** The trip from Aracataca to the community is in 4x4 trucks and takes approximately 6 hours. Arrival at the community will therefore be around noon. A welcome and lunch should be the first activities upon arrival.\n3.  **Return Journey:** Departure from the community to return to Aracataca is on ${endDate} at 3:00 PM. The farewell lunch should take place before that time. The return trip also takes 6 hours.",
            keyActivities: "**Key Activities to Include:**\nLogically distributed throughout the 2-day, 1-night stay, ensure you include a selection of these experiences:\n- Welcome by the host family (upon arrival on the first day).\n- Tour of the sacred territory.\n- Community dinner and circle of the word around the fire.\n- Sun-greeting ritual with the Mamo (spiritual leader).\n- Breakfast with a dialogue about the Arhuaco worldview.\n- Farewell lunch (before departure on the last day).",
            instructions: `**Instructions:**\n- Create a detailed itinerary for the visit from ${startDate} to ${endDate}.\n- The pace should be relaxed, fostering a genuine connection.\n- For each activity, specify the time of day ('Sunrise', 'Morning', 'Afternoon', 'Night'), a concise description, and one of the following categories: 'connection', 'nature', 'culture', 'community', 'spirituality'. The truck journey should be categorized as 'nature'.\n- The entire response must be in English.`,
            outputFormat: "The output must be a JSON object that strictly adheres to the provided schema.",
            error: "We couldn't generate your itinerary at this time. Please try again."
        }
    }

    const p = prompts[lang];
    const prompt = `${p.expert}\n\n${p.dates}\n\n${p.transportRules}\n\n${p.keyActivities}\n\n${p.instructions}\n\n${p.outputFormat}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: itinerarySchema,
            },
        });
        
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json|```$/g, '').trim();
        const parsedData = JSON.parse(cleanedJson);

        return parsedData as ItineraryDay[];

    } catch (error) {
        console.error("Error generating itinerary with Gemini:", error);
        throw new Error(p.error);
    }
};