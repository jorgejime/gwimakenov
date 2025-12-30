import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OpenAI } from "npm:openai@4.67.3";

const TRIP_DURATION_NIGHTS = 1;

interface ItineraryActivity {
  time: string;
  description: string;
  category: string;
}

interface ItineraryDay {
  day: string;
  title: string;
  activities: ItineraryActivity[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request
    const { startDate, lang } = await req.json();

    if (!startDate || !lang) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: startDate, lang" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get OpenAI API key from environment
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      console.warn("OpenAI API key not configured, using fallback");
      const fallbackItinerary = getFallbackItinerary(startDate, lang);
      return new Response(JSON.stringify({ itinerary: fallbackItinerary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate end date
    const checkInDate = new Date(startDate);
    checkInDate.setDate(checkInDate.getDate() + TRIP_DURATION_NIGHTS);
    const endDate = checkInDate.toISOString().split('T')[0];

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey });

    // Prepare prompts
    const prompts: any = {
      es: {
        system: "Eres un experto planificador de viajes para Gwimake, una comunidad indígena Arhuaca en la Sierra Nevada de Santa Marta, Colombia. Tu tarea es crear una experiencia cultural inmersiva, respetuosa y transformadora para una estancia fija de 2 días y 1 noche.",
        user: `**Fechas de la estancia:**\n- Fecha de inicio del viaje (salida de Aracataca): ${startDate}\n- Fecha de fin del viaje (regreso a Aracataca): ${endDate}\n\n**Reglas de transporte obligatorias:**\n1. **Punto de Partida:** La expedición comienza el ${startDate} a las 6:00 AM. El punto de encuentro es en las oficinas de Gwimake en Aracataca. La primera actividad del itinerario debe reflejar esto.\n2. **Viaje de Ida:** El trayecto desde Aracataca hasta la comunidad es en camionetas 4x4 y dura aproximadamente 6 horas. La llegada a la comunidad será, por tanto, alrededor del mediodía. La bienvenida y el almuerzo deben ser las primeras actividades al llegar.\n3. **Viaje de Regreso:** La salida de la comunidad para el regreso a Aracataca es el día ${endDate} a las 3:00 PM. El almuerzo de despedida debe realizarse antes de esa hora. El viaje de regreso también dura 6 horas.\n\n**Actividades clave a incluir:**\nDistribuidas lógicamente durante la estancia de 2 días y 1 noche, asegúrate de incluir una selección de estas experiencias:\n- Bienvenida por la familia anfitriona (al llegar el primer día).\n- Recorrido por el territorio sagrado.\n- Cena comunitaria y círculo de la palabra alrededor del fuego.\n- Ritual de saludo al sol con el Mamo (líder espiritual).\n- Desayuno con diálogo sobre la cosmovisión Arhuaca.\n- Almuerzo de despedida (antes de la partida el último día).\n\n**Instrucciones:**\n- Crea un itinerario detallado para la visita desde el ${startDate} hasta el ${endDate}.\n- El ritmo debe ser relajado, fomentando una conexión genuina.\n- Para cada actividad, especifica el momento del día ('Amanecer', 'Mañana', 'Tarde', 'Noche'), una descripción concisa y una de las siguientes categorías: 'connection', 'nature', 'culture', 'community', 'spirituality'. El viaje en camioneta debe tener categoría 'nature'.\n- Toda la respuesta debe estar en español.\n\n**Formato de salida requerido:**\nDevuelve SOLO un JSON válido con la siguiente estructura (sin markdown, sin \`\`\`json):\n[\n  {\n    \"day\": \"Día 1 (${startDate})\",\n    \"title\": \"Título del día\",\n    \"activities\": [\n      {\n        \"time\": \"Mañana\",\n        \"description\": \"Descripción de la actividad\",\n        \"category\": \"nature\"\n      }\n    ]\n  }\n]`,
      },
      en: {
        system: "You are an expert travel planner for Gwimake, an Arhuaco indigenous community in the Sierra Nevada de Santa Marta, Colombia. Your task is to create an immersive, respectful, and transformative cultural experience for a fixed 2-day, 1-night stay.",
        user: `**Stay Dates:**\n- Start date of the trip (departure from Aracataca): ${startDate}\n- End date of the trip (return to Aracataca): ${endDate}\n\n**Mandatory Transport Rules:**\n1. **Departure Point:** The expedition begins on ${startDate} at 6:00 AM. The meeting point is at the Gwimake offices in Aracataca. The first itinerary activity must reflect this.\n2. **Inbound Journey:** The trip from Aracataca to the community is in 4x4 trucks and takes approximately 6 hours. Arrival at the community will therefore be around noon. A welcome and lunch should be the first activities upon arrival.\n3. **Return Journey:** Departure from the community to return to Aracataca is on ${endDate} at 3:00 PM. The farewell lunch should take place before that time. The return trip also takes 6 hours.\n\n**Key Activities to Include:**\nLogically distributed throughout the 2-day, 1-night stay, ensure you include a selection of these experiences:\n- Welcome by the host family (upon arrival on the first day).\n- Tour of the sacred territory.\n- Community dinner and circle of the word around the fire.\n- Sun-greeting ritual with the Mamo (spiritual leader).\n- Breakfast with a dialogue about the Arhuaco worldview.\n- Farewell lunch (before departure on the last day).\n\n**Instructions:**\n- Create a detailed itinerary for the visit from ${startDate} to ${endDate}.\n- The pace should be relaxed, fostering a genuine connection.\n- For each activity, specify the time of day ('Sunrise', 'Morning', 'Afternoon', 'Night'), a concise description, and one of the following categories: 'connection', 'nature', 'culture', 'community', 'spirituality'. The truck journey should be categorized as 'nature'.\n- The entire response must be in English.\n\n**Required output format:**\nReturn ONLY valid JSON with the following structure (no markdown, no \`\`\`json):\n[\n  {\n    \"day\": \"Day 1 (${startDate})\",\n    \"title\": \"Day title\",\n    \"activities\": [\n      {\n        \"time\": \"Morning\",\n        \"description\": \"Activity description\",\n        \"category\": \"nature\"\n      }\n    ]\n  }\n]`,
      },
    };

    const prompt = prompts[lang];

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 5000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let parsedData = JSON.parse(content);

    // Handle different response structures
    if (parsedData.itinerary) {
      parsedData = parsedData.itinerary;
    }

    if (!Array.isArray(parsedData)) {
      if (parsedData.days && Array.isArray(parsedData.days)) {
        parsedData = parsedData.days;
      } else {
        throw new Error("Invalid response format from OpenAI");
      }
    }

    return new Response(JSON.stringify({ itinerary: parsedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating itinerary:", error);

    // Use fallback on error
    try {
      const { startDate, lang } = await req.json();
      const fallbackItinerary = getFallbackItinerary(startDate, lang || 'es');
      return new Response(JSON.stringify({ itinerary: fallbackItinerary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fallbackError) {
      return new Response(
        JSON.stringify({ error: "Failed to generate itinerary", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }
});
