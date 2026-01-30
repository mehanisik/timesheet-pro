import {
    IconCalendar,
    IconDatabaseExport,
    IconDatabaseImport,
    IconDownload,
    IconEye,
    IconFileSpreadsheet,
    IconFileText,
    IconLoader2,
} from '@tabler/icons-react';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TRANSLATIONS } from '@/lib/translations';
import type { TimesheetSettings } from './schema';

interface TimesheetHeaderProps {
    totalHours: number;
    isExporting: boolean;
    exportError: string | null;
    hasFilledEntries: boolean;
    onPreview: () => void;
    onDownload: () => void;
    onExportExcel: () => void;
    onExportCSV: () => void;
    onExportJSON: () => void;
    onImportJSON: (file: File) => void;
}

export function TimesheetHeader({
    totalHours,
    isExporting,
    exportError,
    hasFilledEntries,
    onPreview,
    onDownload,
    onExportExcel,
    onExportCSV,
    onExportJSON,
    onImportJSON,
}: TimesheetHeaderProps) {
    const { watch } = useFormContext<TimesheetSettings>();
    const lang = watch('lang') || 'EN';
    const t = TRANSLATIONS[lang];
    const importRef = useRef<HTMLInputElement>(null);

    return (
        <header className="flex flex-col lg:flex-row gap-2 items-center justify-between px-1 shrink-0">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                    <IconCalendar className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight leading-none">
                        {t.title}
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-medium">
                        {t.branding}
                    </p>
                </div>
                <ThemeToggle />
            </div>

            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/40">
                {/* Total Hours Badge */}
                <div className="px-2 py-0.5 bg-background rounded-md shadow-sm border border-border/50 flex flex-col items-center min-w-[70px]">
                    <span className="text-[9px] uppercase text-muted-foreground font-semibold leading-none mb-0.5">
                        {t.total}
                    </span>
                    <span className="text-base font-bold tabular-nums leading-none text-foreground">
                        {totalHours.toFixed(1)}
                    </span>
                </div>

                <Separator orientation="vertical" className="h-7 mx-0.5" />

                {/* Primary Actions */}
                <Button
                    onClick={onPreview}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs font-semibold px-2.5"
                >
                    {isExporting ? (
                        <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                        <IconEye className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {t.preview}
                </Button>
                <Button
                    onClick={onDownload}
                    disabled={isExporting || !hasFilledEntries}
                    size="sm"
                    className="h-8 text-xs font-semibold px-2.5"
                >
                    {isExporting ? (
                        <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                        <IconDownload className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {t.download}
                </Button>

                {/* Secondary Actions */}
                <div className="flex gap-0.5 ml-0.5">
                    <Button
                        onClick={onExportExcel}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full hover:bg-background border border-transparent hover:border-border/50"
                        title={t.exportExcel}
                    >
                        <IconFileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                        onClick={onExportCSV}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full hover:bg-background border border-transparent hover:border-border/50"
                        title={t.exportCSV}
                    >
                        <IconFileText className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <Separator
                        orientation="vertical"
                        className="h-5 mx-0.5 self-center"
                    />

                    <Button
                        onClick={onExportJSON}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full hover:bg-background border border-transparent hover:border-border/50"
                        title="Export backup (JSON)"
                    >
                        <IconDatabaseExport className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                        onClick={() => importRef.current?.click()}
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full hover:bg-background border border-transparent hover:border-border/50"
                        title="Import backup (JSON)"
                    >
                        <IconDatabaseImport className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <input
                        ref={importRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                onImportJSON(file);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            </div>
            {exportError && (
                <p className="text-xs text-destructive text-center w-full mt-1">
                    {exportError}
                </p>
            )}
        </header>
    );
}
