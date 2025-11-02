import React, { useState, useEffect } from 'react';
import { getCurrentPricing, updatePricing, getPricingHistory, PricingConfig, PricingHistory } from '../services/supabaseService';
import { useTranslation } from '../contexts/LanguageContext';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { TRIP_DURATION_NIGHTS } from '../constants';

const formatDate = (dateString: string, locale: string): string => {
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

const PricingManager: React.FC = () => {
    const { t, language } = useTranslation();
    const [pricing, setPricing] = useState<PricingConfig | null>(null);
    const [history, setHistory] = useState<PricingHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [formValues, setFormValues] = useState({
        price_per_night: 0,
        service_fee: 0,
        transport_cost_adult: 0,
        transport_cost_child: 0,
        insurance_cost_person: 0,
        max_capacity: 0
    });

    const [previewGuests, setPreviewGuests] = useState({ adults: 2, children: 0 });

    useEffect(() => {
        loadPricing();
        loadHistory();
    }, []);

    const loadPricing = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getCurrentPricing();
            setPricing(data);
            setFormValues({
                price_per_night: data.price_per_night,
                service_fee: data.service_fee,
                transport_cost_adult: data.transport_cost_adult,
                transport_cost_child: data.transport_cost_child,
                insurance_cost_person: data.insurance_cost_person,
                max_capacity: data.max_capacity
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? t(`errors.supabase.${err.message}`) : t('errors.unknown');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const data = await getPricingHistory(20);
            setHistory(data);
        } catch (err) {
            console.error('Error loading pricing history:', err);
        }
    };

    const handleInputChange = (field: keyof typeof formValues, value: string) => {
        const numValue = parseFloat(value) || 0;
        setFormValues(prev => ({ ...prev, [field]: numValue }));
    };

    const calculatePreview = () => {
        const totalGuests = previewGuests.adults + previewGuests.children;
        const accommodationCost = TRIP_DURATION_NIGHTS * totalGuests * formValues.price_per_night;
        const transportCost = (previewGuests.adults * formValues.transport_cost_adult) + (previewGuests.children * formValues.transport_cost_child);
        const insuranceCost = totalGuests * formValues.insurance_cost_person;
        const totalPrice = accommodationCost + transportCost + insuranceCost + formValues.service_fee;
        return { accommodationCost, transportCost, insuranceCost, totalPrice };
    };

    const preview = calculatePreview();

    const hasChanges = pricing && (
        pricing.price_per_night !== formValues.price_per_night ||
        pricing.service_fee !== formValues.service_fee ||
        pricing.transport_cost_adult !== formValues.transport_cost_adult ||
        pricing.transport_cost_child !== formValues.transport_cost_child ||
        pricing.insurance_cost_person !== formValues.insurance_cost_person ||
        pricing.max_capacity !== formValues.max_capacity
    );

    const handleSave = async () => {
        setShowConfirmModal(false);
        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const updated = await updatePricing({
                price_per_night: formValues.price_per_night,
                service_fee: formValues.service_fee,
                transport_cost_adult: formValues.transport_cost_adult,
                transport_cost_child: formValues.transport_cost_child,
                insurance_cost_person: formValues.insurance_cost_person,
                max_capacity: formValues.max_capacity,
                updated_by: 'admin'
            });

            setPricing(updated);
            setSuccessMessage(t('admin.pricing.successUpdate'));
            setTimeout(() => setSuccessMessage(null), 5000);
            await loadHistory();
        } catch (err) {
            const errorMessage = err instanceof Error ? t(`errors.supabase.${err.message}`) : t('errors.unknown');
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (pricing) {
            setFormValues({
                price_per_night: pricing.price_per_night,
                service_fee: pricing.service_fee,
                transport_cost_adult: pricing.transport_cost_adult,
                transport_cost_child: pricing.transport_cost_child,
                insurance_cost_person: pricing.insurance_cost_person,
                max_capacity: pricing.max_capacity
            });
        }
    };

    const getFieldLabel = (fieldName: string): string => {
        const labelMap: Record<string, string> = {
            price_per_night: t('admin.pricing.fields.pricePerNight'),
            service_fee: t('admin.pricing.fields.serviceFee'),
            transport_cost_adult: t('admin.pricing.fields.transportAdult'),
            transport_cost_child: t('admin.pricing.fields.transportChild'),
            insurance_cost_person: t('admin.pricing.fields.insurance'),
            max_capacity: t('admin.pricing.fields.maxCapacity')
        };
        return labelMap[fieldName] || fieldName;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-600"/>
                    <div>{successMessage}</div>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600"/>
                    <div>{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <CurrencyDollarIcon className="w-8 h-8 text-emerald-600" />
                        <h2 className="text-2xl font-bold text-slate-900">{t('admin.pricing.title')}</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('admin.pricing.fields.pricePerNight')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">COP</span>
                                <input
                                    type="number"
                                    value={formValues.price_per_night}
                                    onChange={(e) => handleInputChange('price_per_night', e.target.value)}
                                    className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{t('admin.pricing.descriptions.pricePerNight')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('admin.pricing.fields.serviceFee')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">COP</span>
                                <input
                                    type="number"
                                    value={formValues.service_fee}
                                    onChange={(e) => handleInputChange('service_fee', e.target.value)}
                                    className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{t('admin.pricing.descriptions.serviceFee')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {t('admin.pricing.fields.transportAdult')}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">COP</span>
                                    <input
                                        type="number"
                                        value={formValues.transport_cost_adult}
                                        onChange={(e) => handleInputChange('transport_cost_adult', e.target.value)}
                                        className="w-full pl-14 pr-2 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {t('admin.pricing.fields.transportChild')}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">COP</span>
                                    <input
                                        type="number"
                                        value={formValues.transport_cost_child}
                                        onChange={(e) => handleInputChange('transport_cost_child', e.target.value)}
                                        className="w-full pl-14 pr-2 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('admin.pricing.fields.insurance')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">COP</span>
                                <input
                                    type="number"
                                    value={formValues.insurance_cost_person}
                                    onChange={(e) => handleInputChange('insurance_cost_person', e.target.value)}
                                    className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{t('admin.pricing.descriptions.insurance')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('admin.pricing.fields.maxCapacity')}
                            </label>
                            <input
                                type="number"
                                value={formValues.max_capacity}
                                onChange={(e) => handleInputChange('max_capacity', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                                min="1"
                                step="1"
                            />
                            <p className="text-xs text-slate-500 mt-1">{t('admin.pricing.descriptions.maxCapacity')}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isSaving || !hasChanges}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isSaving ? t('admin.pricing.saving') : t('admin.pricing.save')}
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isSaving || !hasChanges}
                            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('admin.pricing.reset')}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">{t('admin.pricing.preview.title')}</h3>

                        <div className="mb-4 flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('bookingModal.adults')}</label>
                                <input
                                    type="number"
                                    value={previewGuests.adults}
                                    onChange={(e) => setPreviewGuests(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    min="0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('bookingModal.children')}</label>
                                <input
                                    type="number"
                                    value={previewGuests.children}
                                    onChange={(e) => setPreviewGuests(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-700">{t('bookingModal.priceSummary.accommodation', { nights: TRIP_DURATION_NIGHTS })}</span>
                                <span className="font-semibold text-slate-900">COP {preview.accommodationCost.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-700">{t('bookingModal.priceSummary.transport')}</span>
                                <span className="font-semibold text-slate-900">COP {preview.transportCost.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-700">{t('bookingModal.priceSummary.insurance')}</span>
                                <span className="font-semibold text-slate-900">COP {preview.insuranceCost.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-700">{t('bookingModal.priceSummary.serviceFee')}</span>
                                <span className="font-semibold text-slate-900">COP {formValues.service_fee.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t-2 border-emerald-300 mt-2">
                                <span className="font-bold text-slate-900">{t('bookingModal.priceSummary.total')}</span>
                                <span className="font-bold text-emerald-700 text-lg">COP {preview.totalPrice.toLocaleString('es-CO')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <ClockIcon className="w-6 h-6 text-slate-600" />
                            <h3 className="text-lg font-bold text-slate-900">{t('admin.pricing.history.title')}</h3>
                        </div>

                        {history.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">{t('admin.pricing.history.noChanges')}</p>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {history.map(item => (
                                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-slate-800 text-sm">{getFieldLabel(item.field_name)}</span>
                                            <span className="text-xs text-slate-500">{formatDate(item.created_at, language)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-slate-500 line-through">COP {item.old_value?.toLocaleString('es-CO') || '0'}</span>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-emerald-600 font-semibold">COP {item.new_value.toLocaleString('es-CO')}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{t('admin.pricing.history.changedBy')}: {item.changed_by}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">{t('admin.pricing.confirmModal.title')}</h3>
                        <p className="text-slate-600 mb-6">{t('admin.pricing.confirmModal.message')}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition"
                            >
                                {t('admin.pricing.confirmModal.confirm')}
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-6 rounded-lg transition"
                            >
                                {t('admin.pricing.confirmModal.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingManager;
