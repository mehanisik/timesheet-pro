import { useState, useCallback } from 'react';
import { type UseFormGetValues } from 'react-hook-form';
import { type PersistedData } from '@/lib/usePersistedData';
import { type DayInfo } from '@/lib/timesheetUtils';
import { type TimesheetData } from '@/lib/pdfGenerator';
import { useEffectEvent } from './use-effect-event';

interface UseTimesheetActionsProps {
    daysPromise: Promise<DayInfo[]>;
    persistedData: PersistedData;
    saveData: (data: Partial<PersistedData>) => void;
    saveEntry: (date: string, project: string, hours: string) => void;
    // biome-ignore lint/suspicious/noExplicitAny: generic types
    getValues: UseFormGetValues<any>;
    lang: string;
}

export function useTimesheetActions({
    daysPromise,
    persistedData,
    saveData,
    saveEntry,
    getValues,
    lang,
}: UseTimesheetActionsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const getFullEntries = async () => {
        const days = await daysPromise;
        return days.map((d) => {
            const userEntry = persistedData.entries[d.date];
            return {
                date: d.date,
                day: d.dayName + (d.holidayName ? ` (${d.holidayName})` : ''),
                project: userEntry?.project || '',
                hours: userEntry?.hours || '',
                isWeekend: d.isWeekend,
                isHoliday: d.isHoliday,
            };
        });
    };

    const handleEntryChange = useEffectEvent((date: string, field: 'project' | 'hours', value: string) => {
        const current = persistedData.entries[date] || { project: '', hours: '' };
        const project = field === 'project' ? value : current.project;
        const hours = field === 'hours' ? value : current.hours;
        saveEntry(date, project, hours);
    });

    const handleApplyAll = useEffectEvent(async () => {
        const days = await daysPromise;
        const newEntries = { ...persistedData.entries };
        const { defaultProj, defaultHours } = getValues();
        let changed = false;

        for (const day of days) {
            if (!day.isWeekend && !day.isHoliday) {
                const current = newEntries[day.date];
                if (!current?.project || !current?.hours) {
                    newEntries[day.date] = {
                        project: defaultProj || current?.project || '',
                        hours: defaultHours || current?.hours || '',
                    };
                    changed = true;
                }
            }
        }

        if (changed) {
            saveData({ entries: newEntries });
        }
    });

    const handleCopyPreviousMonth = useEffectEvent(async () => {
        const { month, year } = getValues();
        let prevMonth = (month || 1) - 1;
        let prevYear = year || 2025;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear = prevYear - 1;
        }

        const currentDays = await daysPromise;
        const newEntries = { ...persistedData.entries };
        let changed = false;

        for (const day of currentDays) {
            if (!day.isWeekend && !day.isHoliday) {
                const dayNum = parseInt(day.date.split('-')[2], 10);
                const prevDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const prevEntry = persistedData.entries[prevDate];

                if (prevEntry) {
                    newEntries[day.date] = {
                        project: prevEntry.project,
                        hours: prevEntry.hours,
                    };
                    changed = true;
                }
            }
        }

        if (changed) {
            saveData({ entries: newEntries });
        }
    });

    const handleDownload = useEffectEvent(async () => {
        setIsExporting(true);
        try {
            const entries = await getFullEntries();
            // biome-ignore lint/suspicious/noExplicitAny: generic types
            const { client, person, year, month, logo } = getValues() as any;
            const data: TimesheetData = {
                client: client || '',
                person: person || '',
                year: year || 2025,
                month: month || 1,
                entries,
                ...(logo ? { logo } : {}),
            };
            const { generatePDF } = await import('@/lib/pdfGenerator');
            // biome-ignore lint/suspicious/noExplicitAny: generic types
            await generatePDF(data, lang as any, true);
        } catch (error) {
            console.error('PDF Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    });

    const handlePreview = useEffectEvent(async () => {
        setIsExporting(true);
        try {
            // biome-ignore lint/suspicious/noExplicitAny: generic types
            const { client, person, year, month, logo } = getValues() as any;
            const entries = await getFullEntries();
            const data: TimesheetData = {
                client: client || '',
                person: person || '',
                year: year || 2025,
                month: month || 1,
                entries,
                ...(logo ? { logo } : {}),
            };
            const { generatePDF } = await import('@/lib/pdfGenerator');
            // biome-ignore lint/suspicious/noExplicitAny: generic types
            const blob = await generatePDF(data, lang as any, false);
            if (blob) {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setIsPreviewOpen(true);
            }
        } catch (error) {
            console.error('PDF Preview failed:', error);
        } finally {
            setIsExporting(false);
        }
    });

    const handleExportExcel = useEffectEvent(async () => {
        // biome-ignore lint/suspicious/noExplicitAny: generic types
        const { client, person, year, month } = getValues() as any;
        const entries = await getFullEntries();
        const data: TimesheetData = { client, person, year, month, entries };
        const { generateExcel } = await import('@/lib/excelGenerator');
        // biome-ignore lint/suspicious/noExplicitAny: generic types
        generateExcel(data, lang as any);
    });

    const handleExportCSV = useEffectEvent(async () => {
        // biome-ignore lint/suspicious/noExplicitAny: generic types
        const { client, person, year, month } = getValues() as any;
        const entries = await getFullEntries();
        const data: TimesheetData = { client, person, year, month, entries };
        const { generateCSV } = await import('@/lib/excelGenerator');
        // biome-ignore lint/suspicious/noExplicitAny: generic types
        generateCSV(data, lang as any);
    });

    return {
        isExporting,
        previewUrl,
        isPreviewOpen,
        setIsPreviewOpen,
        handleEntryChange,
        handleApplyAll,
        handleCopyPreviousMonth,
        handleDownload,
        handlePreview,
        handleExportExcel,
        handleExportCSV,
    };
}
