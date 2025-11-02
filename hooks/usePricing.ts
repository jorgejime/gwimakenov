import { useState, useEffect } from 'react';
import { getCurrentPricing, PricingConfig } from '../services/supabaseService';
import {
    PRICE_PER_NIGHT,
    SERVICE_FEE,
    TRANSPORT_COST_ADULT,
    TRANSPORT_COST_CHILD,
    INSURANCE_COST_PERSON,
    MAX_CAPACITY
} from '../constants';

export const usePricing = () => {
    const [pricing, setPricing] = useState<PricingConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadPricing = async () => {
            try {
                setIsLoading(true);
                const data = await getCurrentPricing();
                if (mounted) {
                    setPricing(data);
                    setError(null);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Error loading pricing:', err);
                    setError(err as Error);
                    setPricing({
                        id: 'fallback',
                        created_at: new Date().toISOString(),
                        price_per_night: PRICE_PER_NIGHT,
                        service_fee: SERVICE_FEE,
                        transport_cost_adult: TRANSPORT_COST_ADULT,
                        transport_cost_child: TRANSPORT_COST_CHILD,
                        insurance_cost_person: INSURANCE_COST_PERSON,
                        max_capacity: MAX_CAPACITY,
                        is_active: true,
                        updated_at: new Date().toISOString(),
                        updated_by: 'system'
                    });
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadPricing();

        return () => {
            mounted = false;
        };
    }, []);

    return {
        pricing: pricing || {
            id: 'default',
            created_at: new Date().toISOString(),
            price_per_night: PRICE_PER_NIGHT,
            service_fee: SERVICE_FEE,
            transport_cost_adult: TRANSPORT_COST_ADULT,
            transport_cost_child: TRANSPORT_COST_CHILD,
            insurance_cost_person: INSURANCE_COST_PERSON,
            max_capacity: MAX_CAPACITY,
            is_active: true,
            updated_at: new Date().toISOString(),
            updated_by: 'system'
        },
        isLoading,
        error
    };
};
