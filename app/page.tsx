'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconLoader2 } from '@tabler/icons-react';
import { Suspense, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { TimesheetGrid } from '@/components/timesheet-grid';
import { PreviewDialog } from '@/components/timesheet/preview-dialog';
import { timesheetSettingsSchema } from '@/components/timesheet/schema';
import { TimesheetControls } from '@/components/timesheet/timesheet-controls';
import { TimesheetHeader } from '@/components/timesheet/timesheet-header';
import { useTimesheetActions } from '@/hooks/use-timesheet-actions';
import { useTimesheetSync } from '@/hooks/use-timesheet-sync';
import { getMonthDays, type DayInfo } from '@/lib/timesheetUtils';
import { TRANSLATIONS } from '@/lib/translations';
import { usePersistedData } from '@/lib/usePersistedData';

export default function TimesheetV2() {
    const {
        data: persistedData,
        isLoaded,
        saveData,
        saveEntry,
        clearData,
        saveTemplate,
    } = usePersistedData();

    const methods = useForm({
        resolver: zodResolver(timesheetSettingsSchema),
        defaultValues: {
            lang: 'EN',
            year: 2025,
            month: 1,
            client: '',
            person: '',
            customRef: '',
            defaultProj: '',
            defaultHours: '8',
            holidayBank: 'PL',
            logo: null,
        },
        mode: 'onChange',
    });

    const { watch, getValues } = methods;

    // Sync Logic
    useTimesheetSync({
        isLoaded,
        persistedData,
        methods,
        saveData,
    });

    const watchedValues = watch();
    // biome-ignore lint/suspicious/noExplicitAny: generic types
    const { year, month, holidayBank, lang } = watchedValues as any;

    const t = TRANSLATIONS[(lang as 'EN' | 'PL') || 'EN'];

    const [daysPromise, setDaysPromise] = useState<Promise<DayInfo[]>>(() =>
        Promise.resolve([])
    );

    useEffect(() => {
        setDaysPromise(
            getMonthDays(
                year || 2025,
                month || 1,
                holidayBank || 'PL',
                lang || 'EN',
            ),
        );
    }, [year, month, holidayBank, lang]);

    const {
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
    } = useTimesheetActions({
        daysPromise,
        persistedData,
        saveData,
        saveEntry,
        getValues,
        lang: (lang as string) || 'EN',
    });

    // Derived State
    const totalHours = Object.values(persistedData.entries).reduce(
        (sum, e) => sum + (parseFloat(e.hours) || 0),
        0,
    );
    const hasFilledEntries = Object.values(persistedData.entries).some(
        (e) => e.project.trim() !== '' || e.hours.trim() !== '',
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleDownload();
            }
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                handlePreview();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                handleApplyAll();
            }
            if (e.key === 'Escape' && isPreviewOpen) {
                setIsPreviewOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDownload, handlePreview, handleApplyAll, isPreviewOpen]);

    return (
        <FormProvider {...methods}>
            <div className="h-screen bg-background p-4 md:p-8 font-inter selection:bg-primary/20 selection:text-primary overflow-hidden flex flex-col">
                <div className="max-w-5xl mx-auto w-full h-full flex flex-col space-y-4">
                    <TimesheetHeader
                        totalHours={totalHours}
                        isExporting={isExporting}
                        hasFilledEntries={hasFilledEntries}
                        onPreview={handlePreview}
                        onDownload={handleDownload}
                        onExportExcel={handleExportExcel}
                        onExportCSV={handleExportCSV}
                    />

                    <TimesheetControls
                        onApplyAll={handleApplyAll}
                        onCopyPreviousMonth={handleCopyPreviousMonth}
                        onSaveTemplate={(name) =>
                            saveTemplate(name, persistedData.entries)
                        }
                        onClearData={() => {
                            clearData();
                            window.location.reload();
                        }}
                    />

                    {/* Scrollable Table Area */}
                    <div className="bg-background rounded-xl border border-border/60 flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
                        <div className="overflow-y-auto w-full h-full custom-scrollbar">
                            <Suspense
                                fallback={
                                    <div className="flex items-center justify-center h-full flex-col gap-2">
                                        <IconLoader2 className="w-8 h-8 animate-spin text-primary/50" />
                                        <div className="text-muted-foreground font-bold tracking-widest text-xs">
                                            LOADING CALENDAR...
                                        </div>
                                    </div>
                                }
                            >
                                <TimesheetGrid
                                    daysPromise={daysPromise}
                                    userData={persistedData.entries}
                                    onEntryChange={handleEntryChange}
                                    labels={{
                                        date: t.date,
                                        day: t.day,
                                        project: t.project,
                                        hours: t.hours,
                                    }}
                                />
                            </Suspense>
                        </div>
                    </div>

                    <footer className="text-center pb-2 opacity-30 select-none cursor-default shrink-0">
                        <p className="text-[9px] font-serif italic text-muted-foreground tracking-[1em] uppercase">
                            Private Edition | {year || 2025}
                        </p>
                    </footer>

                    <PreviewDialog
                        open={isPreviewOpen}
                        onOpenChange={setIsPreviewOpen}
                        url={previewUrl}
                        onDownload={handleDownload}
                    />
                </div>
            </div>
        </FormProvider>
    );
}
