'use client';

import {
    IconBuilding,
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
    IconUser,
} from '@tabler/icons-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { generateCSV, generateExcel } from '@/lib/excelGenerator';
import { fetchHolidays } from '@/lib/holidayService';
import {
    generatePDF,
    type TimesheetData,
    type TimesheetEntry,
} from '@/lib/pdfGenerator';
import { type Language, TRANSLATIONS } from '@/lib/translations';
import { usePersistedData } from '@/lib/usePersistedData';
import { cn } from '@/lib/utils';

export default function TimesheetV2() {
    const [lang, setLang] = useState<Language>('PL');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [client, setClient] = useState('');
    const [person, setPerson] = useState('');
    const [defaultProj, setDefaultProj] = useState('');
    const [defaultHours, setDefaultHours] = useState('8');
    const [entries, setEntries] = useState<TimesheetEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [logo, setLogo] = useState<string | null>(null);

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
            setDefaultProj(persistedData.defaultProj);
            setDefaultHours(persistedData.defaultHours);
            setLang(persistedData.lang);
            setLogo(persistedData.logo);
        }
    }, [isLoaded, persistedData]);

    // Keyboard shortcuts
    // biome-ignore lint/correctness/useExhaustiveDependencies: handlers are stable or deliberately use current state
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
    }, [isPreviewOpen]);

    // Auto-save form fields (only after initial restore)
    useEffect(() => {
        if (isLoaded && hasRestoredRef.current) {
            saveData({ client, person, defaultProj, defaultHours, lang, logo });
        }
    }, [
        client,
        person,
        defaultProj,
        defaultHours,
        lang,
        logo,
        isLoaded,
        saveData,
    ]);

    const t = TRANSLATIONS[lang];

    // Initialize/Update Entries
    const updateEntries = useCallback(async () => {
        setIsLoading(true);
        const fetchedHolidays = await fetchHolidays(year);

        const daysInMonth = new Date(year, month, 0).getDate();
        const newEntries: TimesheetEntry[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day, 12, 0, 0);
            const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const holidayName = fetchedHolidays[isoDate];
            const isHoliday = !!holidayName;

            newEntries.push({
                date: isoDate,
                day:
                    date.toLocaleDateString(lang === 'PL' ? 'pl-PL' : 'en-US', {
                        weekday: 'long',
                    }) + (isHoliday ? ` (${holidayName})` : ''),
                project: '',
                hours: '',
                isWeekend,
                isHoliday,
            });
        }

        // Restore persisted entry data
        const restoredEntries = newEntries.map((entry) => {
            const saved = persistedData.entries[entry.date];
            if (saved) {
                return { ...entry, project: saved.project, hours: saved.hours };
            }
            return entry;
        });

        setEntries(restoredEntries);
        setIsLoading(false);
    }, [year, month, lang, persistedData.entries]);

    useEffect(() => {
        updateEntries();
    }, [updateEntries]);

    const handleApplyAll = () => {
        setEntries((prev) =>
            prev.map((e) => {
                if (!e.isWeekend && !e.isHoliday) {
                    return {
                        ...e,
                        project: defaultProj || e.project,
                        hours: defaultHours || e.hours,
                    };
                }
                return e;
            }),
        );
    };

    const handleCopyPreviousMonth = () => {
        // Calculate previous month
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        // Get entries from previous month from persisted data
        setEntries((prev) =>
            prev.map((entry) => {
                // Find matching day from previous month
                const day = parseInt(entry.date.split('-')[2], 10);
                const prevDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const prevEntry = persistedData.entries[prevDate];

                if (prevEntry && !entry.isWeekend && !entry.isHoliday) {
                    // Save to persistence
                    saveEntry(entry.date, prevEntry.project, prevEntry.hours);
                    return {
                        ...entry,
                        project: prevEntry.project,
                        hours: prevEntry.hours,
                    };
                }
                return entry;
            }),
        );
    };

    const handleEntryChange = (
        index: number,
        field: keyof TimesheetEntry,
        value: string,
    ) => {
        setEntries((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // Persist entry data
            const entry = updated[index];
            saveEntry(entry.date, entry.project, entry.hours);

            return updated;
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
            const data: TimesheetData = {
                client,
                person,
                year,
                month,
                entries,
                logo: logo || undefined,
            };
            await generatePDF(data, lang, true);
        } catch (error) {
            console.error('PDF Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = () => {
        const data: TimesheetData = { client, person, year, month, entries };
        generateExcel(data, lang);
    };

    const handleExportCSV = () => {
        const data: TimesheetData = { client, person, year, month, entries };
        generateCSV(data, lang);
    };

    const handlePreview = async () => {
        setIsExporting(true);
        try {
            const data: TimesheetData = {
                client,
                person,
                year,
                month,
                entries,
                logo: logo || undefined,
            };
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

    const totalHours = useMemo(
        () => entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0),
        [entries],
    );

    // Check if any entries have been filled (non-empty project or hours)
    const hasFilledEntries = useMemo(
        () =>
            entries.some(
                (e) => e.project.trim() !== '' || e.hours.trim() !== '',
            ),
        [entries],
    );

    return (
        <div className="h-screen bg-background p-4 md:p-8 font-inter selection:bg-primary/20 selection:text-primary overflow-hidden flex flex-col">
            <div className="max-w-5xl mx-auto w-full h-full flex flex-col space-y-8">
                {/* Header - Simple & Clean with Actions at the Top */}
                <header className="flex flex-col md:flex-row justify-between items-center border-b-2 border-border pb-6 gap-8 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="bg-primary p-3 shadow-xl shadow-primary/10">
                            <IconCalendar className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none">
                                {t.title}
                            </h1>
                            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5">
                                {t.branding}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                        <div className="text-center sm:text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                {t.total}
                            </p>
                            <p className="text-4xl font-black text-foreground tabular-nums">
                                {totalHours.toFixed(1)}{' '}
                                <span className="text-sm font-medium text-muted-foreground">
                                    HRS
                                </span>
                            </p>
                        </div>

                        <Separator
                            orientation="vertical"
                            className="h-12 hidden sm:block"
                        />

                        <div className="flex gap-2">
                            <Button
                                onClick={handlePreview}
                                disabled={isExporting}
                                variant="outline"
                                size="lg"
                                className="h-12 px-6 font-bold tracking-tight active:scale-95 transition-all border-2"
                            >
                                {isExporting ? (
                                    <IconLoader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <IconEye className="w-5 h-5 mr-2" />
                                )}
                                PREVIEW
                            </Button>
                            <Button
                                onClick={handleDownload}
                                disabled={isExporting || !hasFilledEntries}
                                size="lg"
                                className="h-12 px-6 bg-primary text-primary-foreground hover:opacity-90 font-bold tracking-tight shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                    !hasFilledEntries
                                        ? t.noEntriesFilled
                                        : undefined
                                }
                            >
                                {isExporting ? (
                                    <IconLoader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <IconDownload className="w-5 h-5 mr-2" />
                                )}
                                {t.download}
                            </Button>
                            <Button
                                onClick={handleExportExcel}
                                variant="outline"
                                size="lg"
                                disabled={!hasFilledEntries}
                                className="h-12 px-4 font-bold tracking-tight active:scale-95 transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                    !hasFilledEntries
                                        ? t.noEntriesFilled
                                        : undefined
                                }
                            >
                                <IconFileSpreadsheet className="w-5 h-5 mr-2" />
                                {t.exportExcel}
                            </Button>
                            <Button
                                onClick={handleExportCSV}
                                variant="outline"
                                size="lg"
                                disabled={!hasFilledEntries}
                                className="h-12 px-4 font-bold tracking-tight active:scale-95 transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                    !hasFilledEntries
                                        ? t.noEntriesFilled
                                        : undefined
                                }
                            >
                                <IconFileText className="w-5 h-5 mr-2" />
                                {t.exportCSV}
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Configuration Area - Integrated & Minimal */}
                <Card className="border-border bg-card shadow-sm border-2 shrink-0">
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        {t.logo}
                                    </Label>
                                    <div className="flex items-center gap-3 h-10">
                                        {logo ? (
                                            <div className="relative group shrink-0 w-10 h-10 border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                                                <img
                                                    src={logo}
                                                    alt="Company Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <IconTrash className="w-4 h-4 text-primary-foreground" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative shrink-0 w-10 h-10 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer overflow-hidden">
                                                <IconPhoto className="w-4 h-4" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] text-muted-foreground uppercase font-black truncate">
                                                PNG/JPG MAX 300KB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        {t.client}
                                    </Label>
                                    <div className="relative">
                                        <IconBuilding className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={client}
                                            onChange={(e) =>
                                                setClient(e.target.value)
                                            }
                                            className="pl-10 h-10 bg-background border-2"
                                            placeholder="e.g. Acme Corp"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        {t.person}
                                    </Label>
                                    <div className="relative">
                                        <IconUser className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={person}
                                            onChange={(e) =>
                                                setPerson(e.target.value)
                                            }
                                            className="pl-10 h-10 bg-background border-2"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        {t.lang}
                                    </Label>
                                    <Select
                                        value={lang}
                                        onValueChange={(v) =>
                                            v && setLang(v as Language)
                                        }
                                    >
                                        <SelectTrigger className="h-10 bg-background border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PL">
                                                Polski
                                            </SelectItem>
                                            <SelectItem value="EN">
                                                English
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        {t.year}
                                    </Label>
                                    <Select
                                        value={year.toString()}
                                        onValueChange={(v) =>
                                            v && setYear(parseInt(v, 10))
                                        }
                                    >
                                        <SelectTrigger className="h-10 bg-background border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2024, 2025, 2026, 2027].map(
                                                (y) => (
                                                    <SelectItem
                                                        key={y}
                                                        value={y.toString()}
                                                    >
                                                        {y}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        {t.month}
                                    </Label>
                                    <Select
                                        value={month.toString()}
                                        onValueChange={(v) =>
                                            v && setMonth(parseInt(v, 10))
                                        }
                                    >
                                        <SelectTrigger className="h-10 bg-background border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(
                                                { length: 12 },
                                                (_, i) => i + 1,
                                            ).map((m) => (
                                                <SelectItem
                                                    key={m}
                                                    value={m.toString()}
                                                >
                                                    {new Date(
                                                        2000,
                                                        m - 1,
                                                    ).toLocaleString(
                                                        lang === 'PL'
                                                            ? 'pl-PL'
                                                            : 'en-US',
                                                        { month: 'short' },
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="flex flex-col md:flex-row items-end gap-8">
                            <div className="flex-1 grid grid-cols-2 gap-6 w-full">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        Default Project
                                    </Label>
                                    <Input
                                        value={defaultProj}
                                        onChange={(e) =>
                                            setDefaultProj(e.target.value)
                                        }
                                        className="h-10 bg-background border-2"
                                        placeholder="Internal Development"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">
                                        Default Hours
                                    </Label>
                                    <Input
                                        value={defaultHours}
                                        onChange={(e) =>
                                            setDefaultHours(e.target.value)
                                        }
                                        className="h-10 bg-background border-2"
                                        placeholder="8"
                                    />
                                </div>
                            </div>
                            <Button
                                onClick={handleApplyAll}
                                variant="secondary"
                                className="h-10 px-6 font-bold transition-all active:scale-95 w-full md:w-auto border-2"
                            >
                                <IconRocket className="w-5 h-5 mr-2" />
                                {t.apply}
                            </Button>
                            <Button
                                onClick={handleCopyPreviousMonth}
                                variant="outline"
                                className="h-10 px-4 font-bold transition-all active:scale-95 border-2"
                            >
                                <IconCopy className="w-4 h-4 mr-2" />
                                {t.copyPreviousMonth}
                            </Button>
                            <Button
                                onClick={() => {
                                    const name = prompt('Enter template name:');
                                    if (name) {
                                        // Convert current entries to format for template
                                        const templateEntries: Record<
                                            string,
                                            { project: string; hours: string }
                                        > = {};
                                        entries.forEach((e) => {
                                            if (e.project || e.hours) {
                                                templateEntries[e.date] = {
                                                    project: e.project,
                                                    hours: e.hours,
                                                };
                                            }
                                        });
                                        saveTemplate(name, templateEntries);
                                    }
                                }}
                                variant="outline"
                                disabled={!hasFilledEntries}
                                className="h-10 px-4 font-bold transition-all active:scale-95 border-2 disabled:opacity-50"
                                title={
                                    !hasFilledEntries
                                        ? t.noEntriesFilled
                                        : undefined
                                }
                            >
                                <IconDeviceFloppy className="w-4 h-4 mr-2" />
                                {t.saveTemplate}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (
                                        confirm(
                                            'Clear all saved data? This cannot be undone.',
                                        )
                                    ) {
                                        clearData();
                                        window.location.reload();
                                    }
                                }}
                                variant="ghost"
                                className="h-10 px-4 font-bold transition-all active:scale-95 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <IconTrash className="w-4 h-4 mr-2" />
                                {t.clearData}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table - High Precision */}
                <div className="bg-card border-2 border-border shadow-2xl shadow-foreground/5 overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto w-full h-full custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-muted/80 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b-2">
                                    <TableHead className="w-[100px] h-12 pl-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {t.date}
                                    </TableHead>
                                    <TableHead className="w-[180px] h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {t.day}
                                    </TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {t.project}
                                    </TableHead>
                                    <TableHead className="w-[100px] h-12 pr-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                                        {t.hours}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-32 text-center text-muted-foreground animate-pulse font-bold tracking-widest text-xs"
                                        >
                                            LOADING CALENDAR...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading &&
                                    entries.map((entry, idx) => (
                                        <TableRow
                                            key={idx}
                                            className={cn(
                                                'group border-border transition-colors hover:bg-muted/20',
                                                entry.isHoliday &&
                                                    'bg-primary/5',
                                                entry.isWeekend &&
                                                    'bg-muted/10',
                                            )}
                                        >
                                            <TableCell className="font-mono text-[10px] text-muted-foreground pl-8 select-none py-2">
                                                {entry.date
                                                    .split('-')
                                                    .slice(1)
                                                    .join('/')}
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            'text-[10px] font-bold uppercase tracking-tight',
                                                            entry.isHoliday
                                                                ? 'text-primary'
                                                                : entry.isWeekend
                                                                  ? 'text-muted-foreground/50'
                                                                  : 'text-foreground',
                                                        )}
                                                    >
                                                        {
                                                            entry.day.split(
                                                                ' ',
                                                            )[0]
                                                        }
                                                    </span>
                                                    {entry.isHoliday && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[7px] font-black text-primary border-primary/20 bg-primary/10 px-1 py-0 leading-none uppercase tracking-tighter rounded-none"
                                                        >
                                                            {entry.day.match(
                                                                /\((.*)\)/,
                                                            )?.[1] || 'Holiday'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <input
                                                    type="text"
                                                    value={entry.project}
                                                    onChange={(e) =>
                                                        handleEntryChange(
                                                            idx,
                                                            'project',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-sm font-medium text-foreground placeholder:text-muted-foreground/30"
                                                    placeholder="..."
                                                />
                                            </TableCell>
                                            <TableCell className="pr-8 py-2">
                                                <input
                                                    type="text"
                                                    value={entry.hours}
                                                    onChange={(e) =>
                                                        handleEntryChange(
                                                            idx,
                                                            'hours',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-sm text-center tabular-nums font-bold text-foreground"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

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
        </div>
    );
}
