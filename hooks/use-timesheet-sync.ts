import { useEffect, useRef } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { type PersistedData } from '@/lib/usePersistedData';
import { useEffectEvent } from './use-effect-event';
import { type TimesheetSettings } from '@/components/timesheet/schema';

interface UseTimesheetSyncProps {
    isLoaded: boolean;
    persistedData: PersistedData;
    // biome-ignore lint/suspicious/noExplicitAny: generated types
    methods: UseFormReturn<any>;
    saveData: (data: Partial<PersistedData>) => void;
}

export function useTimesheetSync({
    isLoaded,
    persistedData,
    methods,
    saveData,
}: UseTimesheetSyncProps) {
    const { reset, watch, getValues } = methods;
    const hasRestoredRef = useRef(false);

    // Stable sync handler
    const syncToForm = useEffectEvent(() => {
        if (persistedData) {
            hasRestoredRef.current = true;
            reset({
                lang: persistedData.lang || 'EN',
                year: persistedData.year || 2025,
                month: persistedData.month || 1,
                client: persistedData.client || '',
                person: persistedData.person || '',
                customRef: persistedData.customRef || '',
                defaultProj: persistedData.defaultProj || '',
                defaultHours: persistedData.defaultHours || '8',
                holidayBank: persistedData.holidayBank || 'PL',
                logo: persistedData.logo || null,
            });
        }
    });

    const syncToStorage = useEffectEvent((values: TimesheetSettings) => {
        if (!hasRestoredRef.current) return;

        // biome-ignore lint/suspicious/noExplicitAny: generic types
        const cleanData = { ...values, logo: (values as any).logo ?? null };
        // biome-ignore lint/suspicious/noExplicitAny: generic types
        saveData(cleanData as any);
    });

    // Initial Restore
    useEffect(() => {
        if (isLoaded && !hasRestoredRef.current) {
            syncToForm();
        }
    }, [isLoaded, syncToForm]);

    // Fallback hydration fix
    useEffect(() => {
        if (isLoaded && !hasRestoredRef.current) {
            const now = new Date();
            reset((prev: any) => ({
                ...prev,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
            }));
        }
    }, [isLoaded, reset]);

    // Auto-save
    useEffect(() => {
        const subscription = watch((value) => {
            syncToStorage(value as TimesheetSettings);
        });
        return () => subscription.unsubscribe();
    }, [watch, syncToStorage]);
}
