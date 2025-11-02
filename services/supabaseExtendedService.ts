import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ItineraryDay } from '../types';

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Tipos extendidos para las nuevas tablas
export interface BookingComplete {
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
  itinerary: Json;
  status: 'pending' | 'confirmed' | 'cancelled';
  language_preference: string;
  last_modified: string;
  modified_by: string;
  notes: string | null;
}

export interface HeroImage {
  id: string;
  created_at: string;
  url: string;
  title: string;
  is_active: boolean;
  display_order: number;
  uploaded_by: string;
}

export interface BookingHistory {
  id: string;
  booking_id: string;
  created_at: string;
  action_type: 'created' | 'updated' | 'status_changed' | 'deleted' | 'cancelled';
  old_value: Json | null;
  new_value: Json | null;
  changed_by: string;
  notes: string | null;
}

export interface CommunicationLog {
  id: string;
  booking_id: string;
  created_at: string;
  communication_type: 'email' | 'whatsapp' | 'phone' | 'system';
  recipient: string;
  message_template: string | null;
  message_content: string;
  sent_by: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
}

export interface BookingNote {
  id: string;
  booking_id: string;
  created_at: string;
  note: string;
  created_by: string;
  is_important: boolean;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  alt_text: string;
  caption: string;
  likes: number;
  comments: number;
  order_position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

let supabase: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabase) return supabase;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
};

// ========== FUNCIONES DE GESTIÓN DE RESERVAS COMPLETAS ==========

/**
 * Obtiene una reserva completa con todos sus detalles
 */
export const getBookingComplete = async (id: string): Promise<BookingComplete | null> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching complete booking:', error);
    throw new Error('FETCH_COMPLETE_BOOKING_FAILED');
  }

  return data;
};

/**
 * Actualiza una reserva completa
 */
export const updateBooking = async (
  id: string,
  updates: Partial<BookingComplete>,
  modifiedBy: string = 'admin'
): Promise<BookingComplete> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('bookings')
    .update({ ...updates, modified_by: modifiedBy })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    throw new Error('UPDATE_BOOKING_FAILED');
  }

  if (!data) {
    throw new Error('UPDATE_BOOKING_NOT_FOUND');
  }

  return data as BookingComplete;
};

/**
 * Elimina una reserva permanentemente
 */
export const deleteBooking = async (id: string): Promise<void> => {
  const client = getSupabaseClient();

  const { error } = await client
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting booking:', error);
    throw new Error('DELETE_BOOKING_FAILED');
  }
};

/**
 * Obtiene el historial de cambios de una reserva
 */
export const getBookingHistory = async (bookingId: string): Promise<BookingHistory[]> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('booking_history')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching booking history:', error);
    throw new Error('FETCH_HISTORY_FAILED');
  }

  return data || [];
};

// ========== FUNCIONES DE GESTIÓN DE COMUNICACIONES ==========

/**
 * Registra una comunicación enviada a un cliente
 */
export const addCommunicationLog = async (
  bookingId: string,
  type: CommunicationLog['communication_type'],
  recipient: string,
  message: string,
  sentBy: string = 'admin',
  template?: string
): Promise<CommunicationLog> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('communication_log')
    .insert([{
      booking_id: bookingId,
      communication_type: type,
      recipient,
      message_content: message,
      sent_by: sentBy,
      message_template: template,
      status: 'sent'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding communication log:', error);
    throw new Error('ADD_COMMUNICATION_FAILED');
  }

  return data as CommunicationLog;
};

/**
 * Obtiene el log de comunicaciones de una reserva
 */
export const getCommunicationLog = async (bookingId: string): Promise<CommunicationLog[]> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('communication_log')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching communication log:', error);
    throw new Error('FETCH_COMMUNICATION_LOG_FAILED');
  }

  return data || [];
};

// ========== FUNCIONES DE GESTIÓN DE NOTAS ==========

/**
 * Añade una nota administrativa a una reserva
 */
export const addBookingNote = async (
  bookingId: string,
  note: string,
  createdBy: string = 'admin',
  isImportant: boolean = false
): Promise<BookingNote> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('booking_notes')
    .insert([{
      booking_id: bookingId,
      note,
      created_by: createdBy,
      is_important: isImportant
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding booking note:', error);
    throw new Error('ADD_NOTE_FAILED');
  }

  return data as BookingNote;
};

/**
 * Obtiene las notas de una reserva
 */
export const getBookingNotes = async (bookingId: string): Promise<BookingNote[]> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('booking_notes')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching booking notes:', error);
    throw new Error('FETCH_NOTES_FAILED');
  }

  return data || [];
};

/**
 * Elimina una nota
 */
export const deleteBookingNote = async (noteId: string): Promise<void> => {
  const client = getSupabaseClient();

  const { error } = await client
    .from('booking_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('Error deleting note:', error);
    throw new Error('DELETE_NOTE_FAILED');
  }
};

// ========== FUNCIONES DE GESTIÓN DE IMÁGENES DEL HERO ==========

/**
 * Obtiene todas las imágenes del hero activas
 */
export const getHeroImages = async (activeOnly: boolean = false): Promise<HeroImage[]> => {
  const client = getSupabaseClient();

  let query = client
    .from('hero_images')
    .select('*')
    .order('display_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching hero images:', error);
    throw new Error('FETCH_HERO_IMAGES_FAILED');
  }

  return data || [];
};

/**
 * Añade una nueva imagen del hero
 */
export const addHeroImage = async (
  url: string,
  title: string,
  isActive: boolean = true,
  displayOrder: number = 0,
  uploadedBy: string = 'admin'
): Promise<HeroImage> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('hero_images')
    .insert([{
      url,
      title,
      is_active: isActive,
      display_order: displayOrder,
      uploaded_by: uploadedBy
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding hero image:', error);
    throw new Error('ADD_HERO_IMAGE_FAILED');
  }

  return data as HeroImage;
};

/**
 * Actualiza una imagen del hero
 */
export const updateHeroImage = async (
  id: string,
  updates: Partial<HeroImage>
): Promise<HeroImage> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('hero_images')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating hero image:', error);
    throw new Error('UPDATE_HERO_IMAGE_FAILED');
  }

  return data as HeroImage;
};

/**
 * Elimina una imagen del hero
 */
export const deleteHeroImage = async (id: string): Promise<void> => {
  const client = getSupabaseClient();

  const { error } = await client
    .from('hero_images')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting hero image:', error);
    throw new Error('DELETE_HERO_IMAGE_FAILED');
  }
};

/**
 * Actualiza el orden de visualización de las imágenes
 */
export const updateHeroImagesOrder = async (imageIds: string[]): Promise<void> => {
  const client = getSupabaseClient();

  const updates = imageIds.map((id, index) => ({
    id,
    display_order: index + 1
  }));

  for (const update of updates) {
    const { error } = await client
      .from('hero_images')
      .update({ display_order: update.display_order })
      .eq('id', update.id);

    if (error) {
      console.error('Error updating image order:', error);
      throw new Error('UPDATE_IMAGE_ORDER_FAILED');
    }
  }
};

// ========== FUNCIONES DE GESTIÓN DE IMÁGENES DE GALERÍA ==========

/**
 * Obtiene todas las imágenes de la galería
 */
export const getGalleryImages = async (activeOnly: boolean = false): Promise<GalleryImage[]> => {
  const client = getSupabaseClient();

  let query = client
    .from('gallery_images')
    .select('*')
    .order('order_position', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching gallery images:', error);
    throw new Error('FETCH_GALLERY_IMAGES_FAILED');
  }

  return data || [];
};

/**
 * Añade una nueva imagen a la galería
 */
export const addGalleryImage = async (
  url: string,
  title: string,
  altText: string,
  caption: string,
  likes: number = 0,
  comments: number = 0,
  orderPosition: number,
  isActive: boolean = true
): Promise<GalleryImage> => {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('gallery_images')
    .insert([{
      url,
      title,
      alt_text: altText,
      caption,
      likes,
      comments,
      order_position: orderPosition,
      is_active: isActive
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding gallery image:', error);
    throw new Error('ADD_GALLERY_IMAGE_FAILED');
  }

  return data as GalleryImage;
};

/**
 * Actualiza una imagen de la galería
 */
export const updateGalleryImage = async (
  id: string,
  updates: Partial<GalleryImage>
): Promise<GalleryImage> => {
  const client = getSupabaseClient();

  const allowedFields = ['url', 'title', 'alt_text', 'caption', 'likes', 'comments', 'order_position', 'is_active'];
  const updateData: any = {};

  allowedFields.forEach(field => {
    if (field in updates) {
      updateData[field] = (updates as any)[field];
    }
  });

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await client
    .from('gallery_images')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating gallery image:', error);
    throw new Error('UPDATE_GALLERY_IMAGE_FAILED');
  }

  if (!data) {
    throw new Error('UPDATE_GALLERY_IMAGE_NOT_FOUND');
  }

  return data as GalleryImage;
};

/**
 * Elimina una imagen de la galería
 */
export const deleteGalleryImage = async (id: string): Promise<void> => {
  const client = getSupabaseClient();

  const { error } = await client
    .from('gallery_images')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting gallery image:', error);
    throw new Error('DELETE_GALLERY_IMAGE_FAILED');
  }
};

/**
 * Actualiza el orden de las imágenes de la galería
 */
export const updateGalleryImagesOrder = async (imageIds: string[]): Promise<void> => {
  const client = getSupabaseClient();

  const updates = imageIds.map((id, index) => ({
    id,
    order_position: index + 1
  }));

  for (const update of updates) {
    const { error } = await client
      .from('gallery_images')
      .update({
        order_position: update.order_position,
        updated_at: new Date().toISOString()
      })
      .eq('id', update.id);

    if (error) {
      console.error('Error updating gallery image order:', error);
      throw new Error('UPDATE_GALLERY_ORDER_FAILED');
    }
  }
};

// ========== FUNCIONES DE ESTADÍSTICAS ==========

/**
 * Obtiene estadísticas del dashboard
 */
export const getDashboardStats = async () => {
  const client = getSupabaseClient();

  // Contar reservas por estado
  const { data: statusData, error: statusError } = await client
    .from('bookings')
    .select('status');

  if (statusError) {
    console.error('Error fetching status stats:', statusError);
    throw new Error('FETCH_STATS_FAILED');
  }

  const stats = {
    total: statusData?.length || 0,
    pending: statusData?.filter(b => b.status === 'pending').length || 0,
    confirmed: statusData?.filter(b => b.status === 'confirmed').length || 0,
    cancelled: statusData?.filter(b => b.status === 'cancelled').length || 0,
  };

  // Calcular ingresos totales
  const { data: revenueData, error: revenueError } = await client
    .from('bookings')
    .select('total_price, status')
    .in('status', ['confirmed', 'pending']);

  if (revenueError) {
    console.error('Error fetching revenue stats:', revenueError);
  }

  const totalRevenue = revenueData?.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0) || 0;

  // Calcular ocupación próxima (próximos 30 días)
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const future = futureDate.toISOString().split('T')[0];

  const { data: upcomingData, error: upcomingError } = await client
    .from('bookings')
    .select('total_guests')
    .gte('departure_date', today)
    .lte('departure_date', future)
    .in('status', ['confirmed', 'pending']);

  if (upcomingError) {
    console.error('Error fetching upcoming stats:', upcomingError);
  }

  const upcomingGuests = upcomingData?.reduce((sum, b) => sum + (b.total_guests || 0), 0) || 0;

  return {
    ...stats,
    totalRevenue,
    upcomingGuests
  };
};
