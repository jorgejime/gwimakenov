import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { GuestInfo, GuestDetails } from '../types';

// This custom Json type is needed because it's no longer exported from the supabase-js library.
// It allows the auto-generated Database type to work correctly.
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          created_at: string;
          departure_date: string;
          return_date: string;
          adults: number;
          children: number;
          total_guests: number;
          total_price: number;
          payer_name: string;
          payer_email: string;
          payer_whatsapp: string;
          guest_details: Json;
          status: 'pending' | 'confirmed' | 'cancelled';
        };
        Insert: {
          id?: string;
          created_at?: string;
          departure_date: string;
          return_date: string;
          adults: number;
          children: number;
          total_guests: number;
          total_price: number;
          payer_name: string;
          payer_email: string;
          payer_whatsapp: string;
          guest_details: Json;
          status?: 'pending' | 'confirmed' | 'cancelled';
        };
        Update: {
          id?: string;
          created_at?: string;
          departure_date?: string;
          return_date?: string;
          adults?: number;
          children?: number;
          total_guests?: number;
          total_price?: number;
          payer_name?: string;
          payer_email?: string;
          payer_whatsapp?: string;
          guest_details?: Json;
          status?: 'pending' | 'confirmed' | 'cancelled';
        };
        Relationships: [];
      };
      pricing_config: {
        Row: {
          id: string;
          created_at: string;
          price_per_night: number;
          service_fee: number;
          transport_cost_adult: number;
          transport_cost_child: number;
          insurance_cost_person: number;
          max_capacity: number;
          whatsapp_number: string;
          is_active: boolean;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          price_per_night: number;
          service_fee: number;
          transport_cost_adult: number;
          transport_cost_child: number;
          insurance_cost_person: number;
          max_capacity: number;
          whatsapp_number?: string;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          price_per_night?: number;
          service_fee?: number;
          transport_cost_adult?: number;
          transport_cost_child?: number;
          insurance_cost_person?: number;
          max_capacity?: number;
          whatsapp_number?: string;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [];
      };
      pricing_history: {
        Row: {
          id: string;
          pricing_config_id: string | null;
          created_at: string;
          field_name: string;
          old_value: number | null;
          new_value: number;
          changed_by: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          pricing_config_id?: string | null;
          created_at?: string;
          field_name: string;
          old_value?: number | null;
          new_value: number;
          changed_by?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          pricing_config_id?: string | null;
          created_at?: string;
          field_name?: string;
          old_value?: number | null;
          new_value?: number;
          changed_by?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_history_pricing_config_id_fkey";
            columns: ["pricing_config_id"];
            referencedRelation: "pricing_config";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type BookingStatus = Database['public']['Tables']['bookings']['Row']['status'];
export type BookingDetails = Pick<Database['public']['Tables']['bookings']['Row'], 'id' | 'departure_date' | 'total_guests' | 'total_price' | 'status'>;
export type AdminBooking = Pick<Database['public']['Tables']['bookings']['Row'], 'id' | 'payer_name' | 'departure_date' | 'total_guests' | 'status' | 'created_at'>;

export type PricingConfig = Database['public']['Tables']['pricing_config']['Row'];
export type PricingHistory = Database['public']['Tables']['pricing_history']['Row'];


let supabase: SupabaseClient<Database> | null = null;
let isDemoMode: boolean | null = null;

const getSupabaseClient = (): SupabaseClient<Database> | null => {
    if (isDemoMode === false && supabase) {
        return supabase;
    }
    if (isDemoMode === true) {
        return null;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        if (!window.sessionStorage.getItem('supabase-demo-mode-logged')) {
            console.warn("Supabase credentials not found. Running in offline demo mode. Booking data is mocked and will not be saved.");
            window.sessionStorage.setItem('supabase-demo-mode-logged', 'true');
        }
        isDemoMode = true;
        return null;
    }

    isDemoMode = false;
    supabase = createClient<Database>(supabaseUrl, supabaseKey);
    return supabase;
};

// --- Mock Data for Demo Mode ---
const mockAdminBookings: AdminBooking[] = [
    { id: 'demo-booking-1', payer_name: 'Alice Johnson', departure_date: '2025-07-20', total_guests: 2, status: 'confirmed', created_at: new Date('2025-06-10').toISOString() },
    { id: 'demo-booking-2', payer_name: 'Bob Williams', departure_date: '2025-07-22', total_guests: 4, status: 'pending', created_at: new Date('2025-06-11').toISOString() },
    { id: 'demo-booking-3', payer_name: 'Charlie Brown', departure_date: '2025-07-24', total_guests: 1, status: 'cancelled', created_at: new Date('2025-06-12').toISOString() },
    { id: 'demo-booking-4', payer_name: 'Diana Prince', departure_date: '2025-08-01', total_guests: 3, status: 'confirmed', created_at: new Date('2025-06-15').toISOString() },
];


export const getBookedDates = async (): Promise<Map<string, number>> => {
    const client = getSupabaseClient();
    if (!client) {
        // DEMO MODE: Return a map based on mock data, so calendar shows some booked dates
        await new Promise(resolve => setTimeout(resolve, 300));
        const capacityMap = new Map<string, number>();
        mockAdminBookings.forEach(booking => {
            if(booking.status === 'confirmed' || booking.status === 'pending') {
                 const currentGuests = capacityMap.get(booking.departure_date) || 0;
                 capacityMap.set(booking.departure_date, currentGuests + booking.total_guests);
            }
        });
        return capacityMap;
    }
    
    const { data, error } = await client
        .from('bookings')
        .select('departure_date, total_guests')
        .in('status', ['pending', 'confirmed']);

    if (error) {
        console.error('Error fetching booking capacity:', error.message);
        throw new Error('FETCH_CAPACITY_FAILED');
    }

    const capacityMap = new Map<string, number>();
    if (data) {
        for (const booking of data) {
            const date = booking.departure_date;
            const guests = booking.total_guests;
            if (date && typeof guests === 'number') {
                const currentGuests = capacityMap.get(date) || 0;
                capacityMap.set(date, currentGuests + guests);
            }
        }
    }
    return capacityMap;
};

export interface BookingData {
    departure_date: string;
    return_date: string;
    adults: number;
    children: number;
    total_guests: number;
    total_price: number;
    payer_name: string;
    payer_email: string;
    payer_whatsapp: string;
    guest_details: GuestDetails[];
    itinerary?: any;
    language_preference?: string;
}

export const createBooking = async (bookingData: BookingData): Promise<{ id: string }> => {
    const client = getSupabaseClient();
    if (!client) {
        // DEMO MODE: Return a fake booking ID.
        await new Promise(resolve => setTimeout(resolve, 500));
        return { id: `demo-booking-${Date.now()}` };
    }

    console.log('Attempting to create booking with data:', bookingData);

    const { data, error } = await client
        .from('bookings')
        .insert([{ ...bookingData, status: 'pending' }])
        .select('id')
        .maybeSingle();

    if (error) {
        console.error('Error creating booking - Full error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        if (error.code === '23505') {
             throw new Error('UNIQUE_VIOLATION');
        }
        throw new Error('CREATE_BOOKING_FAILED');
    }

    if (!data) throw new Error('CREATE_BOOKING_FAILED_NO_ID');

    console.log('Booking created successfully:', data);
    return data;
};

export const getBookingById = async (id: string): Promise<BookingDetails | null> => {
    const client = getSupabaseClient();
    if (!client) {
        // DEMO MODE
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockBooking = mockAdminBookings.find(b => b.id === id);
        if (mockBooking) {
            return {
                id: mockBooking.id,
                departure_date: mockBooking.departure_date,
                total_guests: mockBooking.total_guests,
                total_price: mockBooking.total_guests * 250000, // Approximate price
                status: mockBooking.status,
            };
        }
        // For easy testing of not found.
        if (id.startsWith('demo-booking-')) return null;

        // For super easy testing
        if (id === '12345') {
            return { id: '12345', departure_date: '2025-08-15', total_guests: 2, total_price: 674000, status: 'confirmed' };
        }
        return null;
    }
    
    const { data, error } = await client
        .from('bookings')
        .select('id, departure_date, total_guests, total_price, status')
        .eq('id', id)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = "The result contains 0 rows"
        console.error('Error fetching booking by ID:', error);
        throw new Error('FETCH_BY_ID_FAILED');
    }
    return data;
};

export const cancelBooking = async (id: string): Promise<Database['public']['Tables']['bookings']['Row']> => {
    const client = getSupabaseClient();
    if (!client) {
        // DEMO MODE
        await new Promise(resolve => setTimeout(resolve, 500));
        const bookingToCancel = mockAdminBookings.find(b => b.id === id) || {
            id: id,
            payer_name: 'Demo User',
            departure_date: '2025-08-15',
            total_guests: 2,
            status: 'pending' as BookingStatus,
            created_at: new Date().toISOString()
        };

        return {
            id: bookingToCancel.id,
            created_at: new Date().toISOString(),
            departure_date: bookingToCancel.departure_date,
            return_date: new Date(new Date(bookingToCancel.departure_date).getTime() + 86400000).toISOString().split('T')[0],
            adults: bookingToCancel.total_guests,
            children: 0,
            total_guests: bookingToCancel.total_guests,
            total_price: bookingToCancel.total_guests * 250000,
            payer_name: bookingToCancel.payer_name,
            payer_email: 'demo@example.com',
            payer_whatsapp: '3101234567',
            guest_details: [{name: 'Demo User', idType: 'Passport', idNumber: 'DEMO123'}],
            status: 'cancelled'
        };
    }

    const { data, error } = await client
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error cancelling booking:', error);
        throw new Error('CANCEL_BOOKING_FAILED');
    }
    if (!data) throw new Error('CANCEL_BOOKING_NOT_FOUND');

    return data;
};

// --- Admin Functions ---

export const getAllBookings = async (): Promise<AdminBooking[]> => {
    const client = getSupabaseClient();
    if (!client) {
        // DEMO MODE
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...mockAdminBookings];
    }

    const { data, error } = await client
        .from('bookings')
        .select('id, created_at, payer_name, departure_date, total_guests, status')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all bookings:', error);
        throw new Error('FETCH_ALL_BOOKINGS_FAILED');
    }

    return data || [];
};

export const updateBookingStatus = async (id: string, status: BookingStatus): Promise<AdminBooking> => {
    const client = getSupabaseClient();
    if (!client) {
        // DEMO MODE
        await new Promise(resolve => setTimeout(resolve, 500));
        const bookingIndex = mockAdminBookings.findIndex(b => b.id === id);
        if (bookingIndex !== -1) {
            mockAdminBookings[bookingIndex].status = status;
            return { ...mockAdminBookings[bookingIndex] };
        }
        // Fallback for newly created demo bookings not in the initial list
        return {
            id: id,
            payer_name: 'New Demo User',
            departure_date: '2025-09-01',
            total_guests: 2,
            status: status,
            created_at: new Date().toISOString(),
        };
    }

    const { data, error } = await client
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select('id, created_at, payer_name, departure_date, total_guests, status')
        .single();

    if (error) {
        console.error('Error updating booking status:', error);
        throw new Error('UPDATE_STATUS_FAILED');
    }

    if (!data) {
        throw new Error('UPDATE_STATUS_FAILED_NOT_FOUND');
    }

    return data;
};

// --- Pricing Functions ---

let cachedPricing: PricingConfig | null = null;
let lastPricingFetch: number = 0;
const PRICING_CACHE_TTL = 60000;

export const getCurrentPricing = async (): Promise<PricingConfig> => {
    const now = Date.now();
    if (cachedPricing && (now - lastPricingFetch < PRICING_CACHE_TTL)) {
        return cachedPricing;
    }

    const client = getSupabaseClient();
    if (!client) {
        return {
            id: 'demo-pricing',
            created_at: new Date().toISOString(),
            price_per_night: 250000,
            service_fee: 50000,
            transport_cost_adult: 90000,
            transport_cost_child: 70000,
            insurance_cost_person: 12000,
            max_capacity: 20,
            whatsapp_number: '573184131391',
            is_active: true,
            updated_at: new Date().toISOString(),
            updated_by: 'system'
        };
    }

    const { data, error } = await client
        .from('pricing_config')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching pricing config:', error);
        throw new Error('FETCH_PRICING_FAILED');
    }

    if (!data) {
        throw new Error('NO_ACTIVE_PRICING_CONFIG');
    }

    cachedPricing = data;
    lastPricingFetch = now;
    return data;
};

export const updatePricing = async (updates: Partial<PricingConfig>): Promise<PricingConfig> => {
    const client = getSupabaseClient();
    if (!client) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            id: 'demo-pricing',
            created_at: new Date().toISOString(),
            ...updates as any,
            whatsapp_number: '573184131391',
            is_active: true,
            updated_at: new Date().toISOString(),
            updated_by: 'admin'
        };
    }

    const currentPricing = await getCurrentPricing();

    const { data, error } = await client
        .from('pricing_config')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', currentPricing.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating pricing config:', error);
        throw new Error('UPDATE_PRICING_FAILED');
    }

    if (!data) {
        throw new Error('UPDATE_PRICING_NO_DATA');
    }

    cachedPricing = data;
    lastPricingFetch = Date.now();

    return data;
};

export const getPricingHistory = async (limit: number = 50): Promise<PricingHistory[]> => {
    const client = getSupabaseClient();
    if (!client) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [];
    }

    const { data, error } = await client
        .from('pricing_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching pricing history:', error);
        throw new Error('FETCH_PRICING_HISTORY_FAILED');
    }

    return data || [];
};
