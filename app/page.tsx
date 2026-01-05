'use client';

import {

    IconCalendar,
    IconCopy,
    IconDeviceFloppy,
    IconDownload,
    IconEye,
    IconFileSpreadsheet,
    IconFileText,
    IconLoader2,
    IconPhoto,
    IconRocket,
    IconTrash,

} from '@tabler/icons-react';
import type React from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { TimesheetGrid } from '@/components/TimesheetGrid';
import { getMonthDays } from '@/lib/timesheetUtils';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import {
    type TimesheetData,
    type TimesheetEntry,
} from '@/lib/pdfGenerator';
import { type Language, TRANSLATIONS } from '@/lib/translations';
import { usePersistedData } from '@/lib/usePersistedData';


export default function TimesheetV2() {
    const [lang, setLang] = useState<Language>('EN');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [client, setClient] = useState('');
    const [person, setPerson] = useState('');
    const [customRef, setCustomRef] = useState('');
    const [defaultProj, setDefaultProj] = useState('');
    const [defaultHours, setDefaultHours] = useState('8');
    // const [entries] state removed in favor of persistedData.entries
    const [isExporting, setIsExporting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [logo, setLogo] = useState<string | null>(null);
    const [holidayBank, setHolidayBank] = useState<string>('PL');

    // React 19 Resource Pattern - Compiler handles memoization
    const daysPromise = getMonthDays(year, month, holidayBank, lang);

    // Persistence hook
    const {
        data: persistedData,
        isLoaded,
        saveData,
        saveEntry,
        clearData,
        saveTemplate,
        deleteTemplate,
    } = usePersistedData();

    // Track if we've restored data to prevent save loop
    const hasRestoredRef = useRef(false);

    // Restore persisted data on load (only once)
    useEffect(() => {
        if (isLoaded && !hasRestoredRef.current) {
            hasRestoredRef.current = true;
            setClient(persistedData.client);
            setPerson(persistedData.person);
            setCustomRef(persistedData.customRef || '');
            setDefaultProj(persistedData.defaultProj);
            setDefaultHours(persistedData.defaultHours);
            setLang(persistedData.lang);
            setLang(persistedData.lang);
            setLogo(persistedData.logo);
            setHolidayBank(persistedData.holidayBank || 'PL');
        }
    }, [isLoaded, persistedData]);



    // Auto-save form fields (only after initial restore)
    useEffect(() => {
        if (isLoaded && hasRestoredRef.current) {
            saveData({ client, person, customRef, defaultProj, defaultHours, lang, logo, holidayBank });
        }
    }, [
        client,
        person,
        customRef,
        defaultProj,
        defaultHours,
        lang,
        logo,
        holidayBank,
        isLoaded,
        saveData,
    ]);

    const t = TRANSLATIONS[lang];



    const handleApplyAll = async () => {
        const days = await daysPromise;
        const newEntries = { ...persistedData.entries };
        let changed = false;

        for (const day of days) {
            if (!day.isWeekend && !day.isHoliday) {
                const current = newEntries[day.date];
                if (!current?.project || !current?.hours) {
                    newEntries[day.date] = {
                        project: defaultProj || current?.project || '',
                        hours: defaultHours || current?.hours || ''
                    };
                    changed = true;
                }
            }
        }

        if (changed) {
            saveData({ entries: newEntries });
        }
    };

    const handleCopyPreviousMonth = async () => {
        // Calculate previous month
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        const currentDays = await daysPromise;
        const newEntries = { ...persistedData.entries };
        let changed = false;

        for (const day of currentDays) {
            if (!day.isWeekend && !day.isHoliday) {
                // Find matching day from previous month
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
    };

    const handleEntryChange = (
        date: string,
        field: 'project' | 'hours',
        value: string,
    ) => {
        // We can just call saveEntry because we have the date
        // But saveEntry needs the OTHER field too?
        // Wait, saveEntry implementation:
        // setData(prev => ({ ...prev, entries: { ...prev.entries, [date]: { project, hours } } }))
        // It overwrites the whole entry object for that date.
        // So I must provide BOTH fields every time.
        // I need to look up current value.

        const current = persistedData.entries[date] || { project: '', hours: '' };
        const project = field === 'project' ? value : current.project;
        const hours = field === 'hours' ? value : current.hours;

        saveEntry(date, project, hours);
    };

    const getFullEntries = async () => {
        const days = await daysPromise;
        return days.map(d => {
            const userEntry = persistedData.entries[d.date];
            return {
                date: d.date,
                day: d.dayName + (d.holidayName ? ` (${d.holidayName})` : ''),
                project: userEntry?.project || '',
                hours: userEntry?.hours || '',
                isWeekend: d.isWeekend,
                isHoliday: d.isHoliday
            };
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogo(null);
    };

    const handleDownload = async () => {
        setIsExporting(true);
        try {
            const entries = await getFullEntries();
            const data: TimesheetData = {
                client,
                person,
                year,
                month,
                entries,
                ...(logo ? { logo } : {}),
            };
            const { generatePDF } = await import('@/lib/pdfGenerator');
            await generatePDF(data, lang, true);
        } catch (error) {
            console.error('PDF Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        const entries = await getFullEntries();
        const data: TimesheetData = { client, person, year, month, entries };
        const { generateExcel } = await import('@/lib/excelGenerator');
        generateExcel(data, lang);
    };

    const handleExportCSV = async () => {
        const entries = await getFullEntries();
        const data: TimesheetData = { client, person, year, month, entries };
        const { generateCSV } = await import('@/lib/excelGenerator');
        generateCSV(data, lang);
    };

    const handlePreview = async () => {
        setIsExporting(true);
        try {
            const entries = await getFullEntries();
            const data: TimesheetData = {
                client,
                person,
                year,
                month,
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
            console.error('PDF Preview failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S - Download PDF
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                handleDownload();
            }
            // Ctrl+P - Preview PDF
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                handlePreview();
            }
            // Ctrl+Shift+A - Apply to all
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                handleApplyAll();
            }
            // Esc - Close dialog
            if (e.key === 'Escape' && isPreviewOpen) {
                setIsPreviewOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDownload, handlePreview, handleApplyAll, isPreviewOpen]);

    const totalHours = Object.values(persistedData.entries).reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);

    // Check if any entries have been filled (non-empty project or hours)
    const hasFilledEntries = Object.values(persistedData.entries).some(
        (e) => e.project.trim() !== '' || e.hours.trim() !== '',
    );

    return (
        <div className="h-screen bg-background p-4 md:p-8 font-inter selection:bg-primary/20 selection:text-primary overflow-hidden flex flex-col">
            <div className="max-w-5xl mx-auto w-full h-full flex flex-col space-y-8">
                {/* Modern Header */}
                <header className="flex flex-col lg:flex-row gap-4 items-center justify-between px-1 py-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <IconCalendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">
                                {t.title}
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                {t.branding}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/40">
                        {/* Total Hours Badge */}
                        <div className="px-3 py-1 bg-background rounded-md shadow-sm border border-border/50 flex flex-col items-center min-w-[80px]">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold leading-none mb-0.5">{t.total}</span>
                            <span className="text-lg font-bold tabular-nums leading-none text-foreground">{totalHours.toFixed(1)}</span>
                        </div>

                        <Separator orientation="vertical" className="h-8 mx-1" />

                        {/* Primary Actions */}
                        <Button
                            onClick={handlePreview}
                            disabled={isExporting}
                            variant="secondary"
                            size="sm"
                            className="h-9 text-xs font-semibold"
                        >
                            {isExporting ? <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <IconEye className="w-3.5 h-3.5 mr-2" />}
                            {t.preview}
                        </Button>
                        <Button
                            onClick={handleDownload}
                            disabled={isExporting || !hasFilledEntries}
                            size="sm"
                            className="h-9 text-xs font-semibold"
                        >
                            {isExporting ? <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <IconDownload className="w-3.5 h-3.5 mr-2" />}
                            {t.download}
                        </Button>

                        {/* Secondary Actions Menu or Inline */}
                        <div className="flex gap-1 ml-1">
                            <Button
                                onClick={handleExportExcel}
                                variant="outline"
                                size="icon"
                                className="w-9 h-9"
                                title={t.exportExcel}
                            >
                                <IconFileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button
                                onClick={handleExportCSV}
                                variant="outline"
                                size="icon"
                                className="w-9 h-9"
                                title={t.exportCSV}
                            >
                                <IconFileText className="w-4 h-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Compact Control Panel */}
                <div className="flex flex-col gap-3 bg-muted/20 border border-border/60 rounded-xl p-3 shadow-sm shrink-0">
                    {/* Row 1: Identity & Context */}
                    <div className="grid grid-cols-12 gap-3 items-end">
                        {/* Logo Upload - Compact */}
                        <div className="col-span-12 sm:col-span-1 flex flex-col gap-1.5">
                            <Label className="text-[10px] font-medium text-muted-foreground uppercase">{t.logo}</Label>
                            <div className="relative">
                                {logo ? (
                                    <div className="w-9 h-9 relative group rounded-md border overflow-hidden bg-background">
                                        <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                                        <button onClick={handleRemoveLogo} className="absolute inset-0 bg-destructive/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                            <IconTrash className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-md border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center cursor-pointer relative">
                                        <IconPhoto className="w-4 h-4 text-muted-foreground" />
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Client */}
                        <div className="col-span-6 sm:col-span-3 lg:col-span-3 space-y-1.5">
                            <Label htmlFor="client" className="text-xs font-medium text-muted-foreground">{t.client}</Label>
                            <Input
                                id="client"
                                value={client}
                                onChange={e => setClient(e.target.value)}
                                className="h-9 text-sm bg-background"
                                placeholder="Client Name"
                            />
                        </div>

                        {/* Person */}
                        <div className="col-span-6 sm:col-span-3 lg:col-span-3 space-y-1.5">
                            <Label htmlFor="person" className="text-xs font-medium text-muted-foreground">{t.person}</Label>
                            <Input
                                id="person"
                                value={person}
                                onChange={e => setPerson(e.target.value)}
                                className="h-9 text-sm bg-background"
                                placeholder="Consultant Name"
                            />
                        </div>

                        {/* Document Ref */}
                        <div className="col-span-6 sm:col-span-2 space-y-1.5">
                            <Label htmlFor="ref" className="text-xs font-medium text-muted-foreground">{t.documentRef}</Label>
                            <Input
                                id="ref"
                                value={customRef}
                                onChange={e => setCustomRef(e.target.value)}
                                className="h-9 text-sm bg-background font-mono text-[11px]"
                                placeholder="Auto-gen"
                            />
                        </div>

                        {/* Year/Month/Lang Group */}
                        <div className="col-span-6 sm:col-span-3 flex gap-2">
                            <div className="space-y-1.5 flex-1">
                                <Label className="text-xs font-medium text-muted-foreground">{t.year}</Label>
                                <Select value={year.toString()} onValueChange={v => v && setYear(parseInt(v))}>
                                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <Label className="text-xs font-medium text-muted-foreground">{t.month}</Label>
                                <Select value={month.toString()} onValueChange={v => v && setMonth(parseInt(v))}>
                                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <SelectItem key={m} value={m.toString()}>
                                                {new Date(2000, m - 1).toLocaleString(lang === 'PL' ? 'pl-PL' : 'en-US', { month: 'short' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 w-[70px]">
                                <Label className="text-xs font-medium text-muted-foreground">{t.lang}</Label>
                                <Select value={lang} onValueChange={v => setLang(v as Language)}>
                                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PL">PL</SelectItem>
                                        <SelectItem value="EN">EN</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 w-[70px]">
                                <Label className="text-xs font-medium text-muted-foreground">Bank</Label>
                                <Select value={holidayBank} onValueChange={v => v && setHolidayBank(v)}>
                                    <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['PL', 'DE', 'GB', 'US', 'FR', 'ES', 'IT', 'NL', 'BE'].map(code => (
                                            <SelectItem key={code} value={code}>{code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Row 2: Tools & Actions */}
                    <div className="flex flex-col sm:flex-row items-end gap-3 justify-between">
                        <div className="flex items-end gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <div className="space-y-1.5 min-w-[140px]">
                                <Label className="text-xs font-medium text-muted-foreground">Default Project</Label>
                                <Input
                                    value={defaultProj}
                                    onChange={e => setDefaultProj(e.target.value)}
                                    className="h-9 text-sm bg-background"
                                    placeholder="e.g. Internal"
                                />
                            </div>
                            <div className="space-y-1.5 w-[80px]">
                                <Label className="text-xs font-medium text-muted-foreground">Hours</Label>
                                <Input
                                    value={defaultHours}
                                    onChange={e => setDefaultHours(e.target.value)}
                                    className="h-9 text-sm bg-background text-center"
                                    placeholder="8"
                                />
                            </div>
                            <Button onClick={handleApplyAll} variant="secondary" size="sm" className="h-9 px-3 text-xs font-medium shrink-0">
                                <IconRocket className="w-3.5 h-3.5 mr-1.5" />
                                {t.apply}
                            </Button>
                            <Button onClick={handleCopyPreviousMonth} variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium shrink-0 border border-transparent hover:border-border/50">
                                <IconCopy className="w-3.5 h-3.5 mr-1.5" />
                                {t.copyPreviousMonth}
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                onClick={() => {
                                    const name = prompt('Template name:');
                                    if (name) {
                                        if (name) {
                                            saveTemplate(name, persistedData.entries);
                                        }
                                    }
                                }}
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs"
                                disabled={!hasFilledEntries}
                            >
                                <IconDeviceFloppy className="w-3.5 h-3.5 mr-1.5" />
                                {t.saveTemplate}
                            </Button>

                            <Button
                                onClick={() => { if (confirm('Clear all?')) { clearData(); window.location.reload(); } }}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                title={t.clearData}
                            >
                                <IconTrash className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Table Area */}
                <div className="bg-background rounded-xl border border-border/60 flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
                    <div className="overflow-y-auto w-full h-full custom-scrollbar">
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse font-bold tracking-widest text-xs">
                                LOADING CALENDAR...
                            </div>
                        }>
                            <TimesheetGrid
                                daysPromise={daysPromise}
                                userData={persistedData.entries}
                                onEntryChange={handleEntryChange}
                                labels={{
                                    date: t.date,
                                    day: t.day,
                                    project: t.project,
                                    hours: t.hours
                                }}
                            />
                        </Suspense>
                    </div>
                </div >

                <footer className="text-center pb-4 opacity-30 select-none cursor-default shrink-0">
                    <p className="text-[9px] font-serif italic text-muted-foreground tracking-[1em] uppercase">
                        Private Edition | 2026
                    </p>
                </footer>

                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-[98vw] w-[1400px] h-[98vh] bg-card p-0 overflow-hidden border-border border-4 shadow-2xl flex flex-col">
                        <DialogHeader className="p-4 border-b border-border bg-muted/30 shrink-0">
                            <div className="flex justify-between items-center pr-8 w-full">
                                <DialogTitle className="text-sm font-black uppercase tracking-widest leading-none">
                                    {t.preview}
                                </DialogTitle>
                                <Button
                                    onClick={handleDownload}
                                    size="sm"
                                    className="bg-primary text-primary-foreground h-9 px-4 text-[10px] font-black uppercase tracking-wider"
                                >
                                    <IconDeviceFloppy className="w-4 h-4 mr-2" />
                                    {t.download}
                                </Button>
                            </div>
                        </DialogHeader>
                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-950 p-4 min-h-0 h-full">
                            {previewUrl ? (
                                <iframe
                                    src={`${previewUrl}#toolbar=0&view=FitH`}
                                    className="w-full h-full border-2 border-border shadow-inner bg-white dark:bg-zinc-950"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                                    <IconLoader2 className="w-8 h-8 animate-spin" />
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
}
