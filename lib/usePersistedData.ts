import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'timesheet-pro-data';

export interface PersistedData {
    client: string;
    person: string;
    defaultProj: string;
    defaultHours: string;
    lang: 'PL' | 'EN';
    logo: string | null;
    holidayBank: string;
    customRef?: string;
    year: number;
    month: number;
    entries: Record<string, { project: string; hours: string }>; // keyed by date
    templates: Record<
        string,
        {
            name: string;
            entries: Record<string, { project: string; hours: string }>;
        }
    >;
}

const defaultData: PersistedData = {
    client: '',
    person: '',
    defaultProj: '',
    defaultHours: '8',
    lang: 'PL',
    logo: null,
    holidayBank: 'PL',
    customRef: '',
    year: 2025,
    month: 1,
    entries: {},
    templates: {},
};

export function usePersistedData() {
    const [data, setData] = useState<PersistedData>(defaultData);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setData({ ...defaultData, ...parsed });
            }
        } catch (e) {
            console.error('Failed to load persisted data:', e);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage on change
    const saveData = useCallback((newData: Partial<PersistedData>) => {
        setData((prev) => {
            const updated = { ...prev, ...newData };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to save data:', e);
            }
            return updated;
        });
    }, []);

    // Save entry data (project/hours) by date
    const saveEntry = useCallback(
        (date: string, project: string, hours: string) => {
            setData((prev) => {
                const updated = {
                    ...prev,
                    entries: {
                        ...prev.entries,
                        [date]: { project, hours },
                    },
                };
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch (e) {
                    console.error('Failed to save entry:', e);
                }
                return updated;
            });
        },
        [],
    );

    // Clear all data
    const clearData = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setData(defaultData);
        } catch (e) {
            console.error('Failed to clear data:', e);
        }
    }, []);

    // Save current entries as a template
    const saveTemplate = useCallback(
        (
            name: string,
            entries: Record<string, { project: string; hours: string }>,
        ) => {
            setData((prev) => {
                const id = Date.now().toString();
                const updated = {
                    ...prev,
                    templates: {
                        ...prev.templates,
                        [id]: { name, entries },
                    },
                };
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch (e) {
                    console.error('Failed to save template:', e);
                }
                return updated;
            });
        },
        [],
    );

    // Delete a template
    const deleteTemplate = useCallback((id: string) => {
        setData((prev) => {
            const { [id]: _, ...rest } = prev.templates;
            const updated = { ...prev, templates: rest };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('Failed to delete template:', e);
            }
            return updated;
        });
    }, []);

    return {
        data,
        isLoaded,
        saveData,
        saveEntry,
        clearData,
        saveTemplate,
        deleteTemplate,
    };
}
