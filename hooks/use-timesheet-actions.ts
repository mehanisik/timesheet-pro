import { useState } from 'react';
import type { UseFormGetValues } from 'react-hook-form';
import { toast } from 'sonner';
import type { TimesheetSettings } from '@/components/timesheet/schema';
import type { PersistedData } from '@/hooks/use-persisted-data';
import type { TimesheetData } from '@/lib/pdfGenerator';
import type { DayInfo } from '@/lib/timesheetUtils';
import type { Language } from '@/lib/translations';
import { useEffectEvent } from './use-effect-event';

interface UseTimesheetActionsProps {
    daysPromise: Promise<DayInfo[]>;
    persistedData: PersistedData;
    saveData: (data: Partial<PersistedData>) => void;
    saveEntry: (date: string, project: string, hours: string) => void;
    getValues: UseFormGetValues<TimesheetSettings>;
    lang: Language;
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
    const [exportError, setExportError] = useState<string | null>(null);

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

    const handleEntryChange = useEffectEvent(
        (date: string, field: 'project' | 'hours', value: string) => {
            const current = persistedData.entries[date] || {
                project: '',
                hours: '',
            };
            const project = field === 'project' ? value : current.project;
            const hours = field === 'hours' ? value : current.hours;
            saveEntry(date, project, hours);
        },
    );

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
            toast.success('Defaults applied to all working days');
        }
    });

    const handleCopyPreviousMonth = useEffectEvent(async () => {
        const { month, year } = getValues();
        let prevMonth = (month || 1) - 1;
        let prevYear = year || new Date().getFullYear();
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
            toast.success('Copied entries from previous month');
        } else {
            toast.info('No matching entries found in previous month');
        }
    });

    const handleDownload = useEffectEvent(async () => {
        setIsExporting(true);
        setExportError(null);
        try {
            const entries = await getFullEntries();
            const { client, person, year, month, logo } = getValues();
            const data: TimesheetData = {
                client: client || '',
                person: person || '',
                year: year || new Date().getFullYear(),
                month: month || 1,
                entries,
                ...(logo ? { logo } : {}),
            };
            const { generatePDF } = await import('@/lib/pdfGenerator');
            await generatePDF(data, lang, true);
            toast.success('PDF downloaded successfully');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'PDF export failed';
            setExportError(message);
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    });

    const handlePreview = useEffectEvent(async () => {
        setIsExporting(true);
        setExportError(null);
        try {
            const { client, person, year, month, logo } = getValues();
            const entries = await getFullEntries();
            const data: TimesheetData = {
                client: client || '',
                person: person || '',
                year: year || new Date().getFullYear(),
                month: month || 1,
                entries,
                ...(logo ? { logo } : {}),
            };
            const { generatePDF } = await import('@/lib/pdfGenerator');
            const blob = await generatePDF(data, lang, false);
            if (blob) {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setIsPreviewOpen(true);
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'PDF preview failed';
            setExportError(message);
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    });

    const handleExportExcel = useEffectEvent(async () => {
        setExportError(null);
        try {
            const { client, person, year, month } = getValues();
            const entries = await getFullEntries();
            const data: TimesheetData = {
                client,
                person,
                year,
                month,
                entries,
            };
            const { generateExcel } = await import('@/lib/excelGenerator');
            generateExcel(data, lang);
            toast.success('Excel file downloaded');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Excel export failed';
            setExportError(message);
            toast.error(message);
        }
    });

    const handleExportCSV = useEffectEvent(async () => {
        setExportError(null);
        try {
            const { client, person, year, month } = getValues();
            const entries = await getFullEntries();
            const data: TimesheetData = {
                client,
                person,
                year,
                month,
                entries,
            };
            const { generateCSV } = await import('@/lib/excelGenerator');
            generateCSV(data, lang);
            toast.success('CSV file downloaded');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'CSV export failed';
            setExportError(message);
            toast.error(message);
        }
    });

    const handleExportJSON = useEffectEvent(() => {
        try {
            const backup = {
                version: 1,
                exportedAt: new Date().toISOString(),
                data: persistedData,
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `timesheet-backup-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Backup exported successfully');
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'JSON export failed';
            toast.error(message);
        }
    });

    const handleImportJSON = useEffectEvent((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                const imported =
                    parsed.version && parsed.data ? parsed.data : parsed;
                if (!imported.entries || typeof imported.entries !== 'object') {
                    throw new Error('Invalid backup file: missing entries');
                }
                saveData(imported);
                toast.success('Data imported successfully');
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Failed to import data';
                toast.error(message);
            }
        };
        reader.readAsText(file);
    });

    return {
        isExporting,
        exportError,
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
        handleExportJSON,
        handleImportJSON,
    };
}
