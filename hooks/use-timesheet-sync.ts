import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { TimesheetSettings } from '@/components/timesheet/schema';
import type { PersistedData } from '@/hooks/use-persisted-data';
import { useEffectEvent } from './use-effect-event';

interface UseTimesheetSyncProps {
    isLoaded: boolean;
    persistedData: PersistedData;
    methods: UseFormReturn<TimesheetSettings>;
    saveData: (data: Partial<PersistedData>) => void;
}

export function useTimesheetSync({
    isLoaded,
    persistedData,
    methods,
    saveData,
}: UseTimesheetSyncProps) {
    const { reset, watch } = methods;
    const hasRestoredRef = useRef(false);

    const syncToForm = useEffectEvent(() => {
        if (persistedData) {
            hasRestoredRef.current = true;
            reset({
                lang: persistedData.lang || 'EN',
                year: persistedData.year || new Date().getFullYear(),
                month: persistedData.month || new Date().getMonth() + 1,
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
        const cleanData = { ...values, logo: values.logo ?? null };
        saveData(cleanData);
    });

    useEffect(() => {
        if (isLoaded && !hasRestoredRef.current) {
            syncToForm();
        }
    }, [isLoaded, syncToForm]);

    useEffect(() => {
        const subscription = watch((value) => {
            syncToStorage(value as TimesheetSettings);
        });
        return () => subscription.unsubscribe();
    }, [watch, syncToStorage]);
}
