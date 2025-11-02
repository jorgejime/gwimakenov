import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, EnvelopeIcon, PhoneIcon, TrashIcon, PencilIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../contexts/LanguageContext';
import type { ItineraryDay } from '../types';
import {
  getBookingComplete,
  getBookingHistory,
  getCommunicationLog,
  getBookingNotes,
  addCommunicationLog,
  addBookingNote,
  deleteBookingNote,
  updateBooking,
  deleteBooking,
  type BookingComplete,
  type BookingHistory,
  type CommunicationLog,
  type BookingNote
} from '../services/supabaseExtendedService';
import { WHATSAPP_CONFIRMATION_NUMBER } from '../constants';

interface BookingDetailModalProps {
  bookingId: string;
  onClose: () => void;
  onBookingUpdated: () => void;
}

const formatDate = (dateString: string, locale: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const formatDateTime = (dateString: string, locale: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ bookingId, onClose, onBookingUpdated }) => {
  const { t, language } = useTranslation();
  const [booking, setBooking] = useState<BookingComplete | null>(null);
  const [history, setHistory] = useState<BookingHistory[]>([]);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'communications' | 'notes'>('details');
  const [newNote, setNewNote] = useState('');
  const [isImportantNote, setIsImportantNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState<Partial<BookingComplete>>({});

  useEffect(() => {
    loadBookingData();
  }, [bookingId]);

  const loadBookingData = async () => {
    setIsLoading(true);
    try {
      const [bookingData, historyData, commData, notesData] = await Promise.all([
        getBookingComplete(bookingId),
        getBookingHistory(bookingId),
        getCommunicationLog(bookingId),
        getBookingNotes(bookingId)
      ]);

      setBooking(bookingData);
      setHistory(historyData);
      setCommunications(commData);
      setNotes(notesData);

      if (bookingData) {
        setEditedBooking(bookingData);
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;

    setIsSavingNote(true);
    try {
      await addBookingNote(bookingId, newNote, 'admin', isImportantNote);
      setNewNote('');
      setIsImportantNote(false);
      const updatedNotes = await getBookingNotes(bookingId);
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm(t('admin.bookingDetail.confirmDeleteNote'))) return;

    try {
      await deleteBookingNote(noteId);
      const updatedNotes = await getBookingNotes(bookingId);
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleSaveEdits = async () => {
    if (!booking) return;

    try {
      await updateBooking(bookingId, editedBooking, 'admin');
      setIsEditing(false);
      await loadBookingData();
      onBookingUpdated();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleDeleteBooking = async () => {
    if (!window.confirm(t('admin.bookingDetail.confirmDelete'))) return;
    if (!window.confirm(t('admin.bookingDetail.confirmDeleteFinal'))) return;

    try {
      await deleteBooking(bookingId);
      onBookingUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleContactWhatsApp = () => {
    if (!booking) return;

    const message = `${t('admin.bookingDetail.whatsappMessage', {
      name: booking.payer_name,
      id: booking.id.substring(0, 8)
    })}`;

    const url = `https://wa.me/${booking.payer_whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    addCommunicationLog(bookingId, 'whatsapp', booking.payer_whatsapp, message, 'admin', 'manual_contact');
  };

  const handleContactEmail = () => {
    if (!booking) return;

    const subject = t('admin.bookingDetail.emailSubject', { id: booking.id.substring(0, 8) });
    const body = t('admin.bookingDetail.emailMessage', { name: booking.payer_name });
    const url = `mailto:${booking.payer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');

    addCommunicationLog(bookingId, 'email', booking.payer_email, body, 'admin', 'manual_contact');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
          <p className="text-center text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
          <p className="text-center text-red-600">{t('errors.bookingNotFound')}</p>
          <button onClick={onClose} className="mt-4 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg">
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  const guestDetails = Array.isArray(booking.guest_details) ? booking.guest_details : [];
  const itinerary = Array.isArray(booking.itinerary) ? booking.itinerary as ItineraryDay[] : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('admin.bookingDetail.title')}</h2>
            <p className="text-sm text-slate-500">ID: {booking.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 font-semibold text-sm whitespace-nowrap ${activeTab === 'details' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600'}`}
            >
              {t('admin.bookingDetail.tabs.details')}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-semibold text-sm whitespace-nowrap ${activeTab === 'history' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600'}`}
            >
              {t('admin.bookingDetail.tabs.history')} ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('communications')}
              className={`px-6 py-3 font-semibold text-sm whitespace-nowrap ${activeTab === 'communications' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600'}`}
            >
              {t('admin.bookingDetail.tabs.communications')} ({communications.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 font-semibold text-sm whitespace-nowrap ${activeTab === 'notes' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-600'}`}
            >
              {t('admin.bookingDetail.tabs.notes')} ({notes.length})
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">{t('admin.bookingDetail.payerInfo')}</h3>
                <div className="flex gap-2">
                  {!isEditing && (
                    <>
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <PencilIcon className="w-4 h-4" />
                        {t('admin.bookingDetail.edit')}
                      </button>
                      <button onClick={handleContactWhatsApp} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <PaperAirplaneIcon className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button onClick={handleContactEmail} className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700">
                        <EnvelopeIcon className="w-4 h-4" />
                        Email
                      </button>
                    </>
                  )}
                  {isEditing && (
                    <>
                      <button onClick={handleSaveEdits} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
                        {t('common.save')}
                      </button>
                      <button onClick={() => { setIsEditing(false); setEditedBooking(booking); }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">
                        {t('common.cancel')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.name')}</label>
                  {isEditing ? (
                    <input type="text" value={editedBooking.payer_name || ''} onChange={e => setEditedBooking({...editedBooking, payer_name: e.target.value})} className="w-full border border-slate-300 rounded p-2" />
                  ) : (
                    <p className="font-semibold text-slate-800">{booking.payer_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.email')}</label>
                  {isEditing ? (
                    <input type="email" value={editedBooking.payer_email || ''} onChange={e => setEditedBooking({...editedBooking, payer_email: e.target.value})} className="w-full border border-slate-300 rounded p-2" />
                  ) : (
                    <p className="font-semibold text-slate-800">{booking.payer_email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.whatsapp')}</label>
                  {isEditing ? (
                    <input type="tel" value={editedBooking.payer_whatsapp || ''} onChange={e => setEditedBooking({...editedBooking, payer_whatsapp: e.target.value})} className="w-full border border-slate-300 rounded p-2" />
                  ) : (
                    <p className="font-semibold text-slate-800">{booking.payer_whatsapp}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.language')}</label>
                  <p className="font-semibold text-slate-800">{booking.language_preference?.toUpperCase()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">{t('admin.bookingDetail.tripInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.departure')}</label>
                    <p className="font-semibold text-slate-800">{formatDate(booking.departure_date, language)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.return')}</label>
                    <p className="font-semibold text-slate-800">{formatDate(booking.return_date, language)}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.status')}</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t(`bookingStatus.${booking.status}`)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.adults')}</label>
                    <p className="font-semibold text-slate-800">{booking.adults}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.children')}</label>
                    <p className="font-semibold text-slate-800">{booking.children}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.totalGuests')}</label>
                    <p className="font-semibold text-slate-800">{booking.total_guests}</p>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-slate-500 mb-1">{t('admin.bookingDetail.fields.totalPrice')}</label>
                    <p className="font-bold text-emerald-600 text-xl">COP {Number(booking.total_price).toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>

              {guestDetails.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">{t('admin.bookingDetail.guestsInfo')}</h3>
                  <div className="space-y-2">
                    {guestDetails.map((guest: any, index: number) => (
                      <div key={index} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800">{guest.name}</p>
                          <p className="text-sm text-slate-600">{guest.idType}: {guest.idNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {itinerary.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">{t('admin.bookingDetail.itinerary')}</h3>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                    {itinerary.map((day, index) => (
                      <div key={index}>
                        <h4 className="font-bold text-emerald-700">{day.day}: {day.title}</h4>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {day.activities.map((activity, actIndex) => (
                            <li key={actIndex}>• {activity.time} - {activity.description}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {booking.notes && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">{t('admin.bookingDetail.internalNotes')}</h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <p className="text-slate-700">{booking.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-slate-500 py-8">{t('admin.bookingDetail.noHistory')}</p>
              ) : (
                history.map(item => (
                  <div key={item.id} className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800">{t(`admin.bookingDetail.actions.${item.action_type}`)}</span>
                      <span className="text-xs text-slate-500">{formatDateTime(item.created_at, language)}</span>
                    </div>
                    <p className="text-sm text-slate-600">{t('admin.bookingDetail.changedBy')}: {item.changed_by}</p>
                    {item.notes && <p className="text-sm text-slate-700 mt-2">{item.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4">
              {communications.length === 0 ? (
                <p className="text-center text-slate-500 py-8">{t('admin.bookingDetail.noCommunications')}</p>
              ) : (
                communications.map(comm => (
                  <div key={comm.id} className="border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {comm.communication_type === 'whatsapp' && <PaperAirplaneIcon className="w-5 h-5 text-green-600" />}
                        {comm.communication_type === 'email' && <EnvelopeIcon className="w-5 h-5 text-blue-600" />}
                        {comm.communication_type === 'phone' && <PhoneIcon className="w-5 h-5 text-purple-600" />}
                        <span className="font-bold text-slate-800">{t(`admin.bookingDetail.commTypes.${comm.communication_type}`)}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatDateTime(comm.created_at, language)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{t('admin.bookingDetail.sentTo')}: {comm.recipient}</p>
                    <p className="text-sm text-slate-700 bg-white p-2 rounded">{comm.message_content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-800 mb-3">{t('admin.bookingDetail.addNote')}</h3>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('admin.bookingDetail.notePlaceholder')}
                />
                <div className="flex justify-between items-center mt-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={isImportantNote}
                      onChange={e => setIsImportantNote(e.target.checked)}
                      className="rounded"
                    />
                    {t('admin.bookingDetail.markImportant')}
                  </label>
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote || !newNote.trim()}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400"
                  >
                    {isSavingNote ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </div>

              {notes.length === 0 ? (
                <p className="text-center text-slate-500 py-8">{t('admin.bookingDetail.noNotes')}</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className={`border-l-4 ${note.is_important ? 'border-red-400 bg-red-50' : 'border-slate-400 bg-slate-50'} p-4 rounded-r-lg`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs text-slate-500">{formatDateTime(note.created_at, language)}</span>
                        {note.is_important && <span className="ml-2 text-xs font-bold text-red-600">{t('admin.bookingDetail.important')}</span>}
                      </div>
                      <button onClick={() => handleDeleteNote(note.id)} className="text-red-600 hover:text-red-800">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-700">{note.note}</p>
                    <p className="text-xs text-slate-500 mt-2">{t('admin.bookingDetail.createdBy')}: {note.created_by}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-6 bg-slate-50 rounded-b-2xl flex justify-between items-center">
          <button
            onClick={handleDeleteBooking}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <TrashIcon className="w-4 h-4" />
            {t('admin.bookingDetail.deleteBooking')}
          </button>
          <button onClick={onClose} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 font-semibold">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
