import {
    IconChevronDown,
    IconCopy,
    IconDeviceFloppy,
    IconRocket,
    IconSettings,
    IconTrash,
} from '@tabler/icons-react';
import type React from 'react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { TRANSLATIONS } from '@/lib/translations';
import type { TimesheetSettings } from './schema';

interface TimesheetControlsProps {
    onApplyAll: () => void;
    onCopyPreviousMonth: () => void;
    onOpenTemplates: () => void;
    onClearData: () => void;
}

export function TimesheetControls({
    onApplyAll,
    onCopyPreviousMonth,
    onOpenTemplates,
    onClearData,
}: TimesheetControlsProps) {
    const { control, watch, setValue } = useFormContext<TimesheetSettings>();
    const lang = watch('lang') || 'EN';
    const logo = watch('logo');
    const t = TRANSLATIONS[lang];
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue('logo', reader.result as string, {
                    shouldDirty: true,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-muted/20 rounded-xl border border-border/50">
            {/* Primary fields — always visible */}
            <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6 lg:col-span-3 space-y-0.5">
                    <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                        {t.client}
                    </Label>
                    <Controller
                        control={control}
                        name="client"
                        render={({ field }) => (
                            <Input
                                {...field}
                                className="h-7 text-xs px-2"
                                placeholder="Client Name"
                            />
                        )}
                    />
                </div>
                <div className="col-span-6 lg:col-span-3 space-y-0.5">
                    <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                        {t.person}
                    </Label>
                    <Controller
                        control={control}
                        name="person"
                        render={({ field }) => (
                            <Input
                                {...field}
                                className="h-7 text-xs px-2"
                                placeholder="Your Name"
                            />
                        )}
                    />
                </div>
                <div className="col-span-8 lg:col-span-4 space-y-0.5">
                    <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                        {t.defaultProj}
                    </Label>
                    <Controller
                        control={control}
                        name="defaultProj"
                        render={({ field }) => (
                            <Input
                                {...field}
                                className="h-7 text-xs px-2"
                                placeholder="Default Project"
                            />
                        )}
                    />
                </div>
                <div className="col-span-4 lg:col-span-2 space-y-0.5">
                    <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                        {t.defaultHours}
                    </Label>
                    <Controller
                        control={control}
                        name="defaultHours"
                        render={({ field }) => (
                            <Input
                                {...field}
                                className="h-7 text-xs px-2"
                                placeholder="8"
                            />
                        )}
                    />
                </div>
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1">
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onApplyAll}
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs px-3"
                    >
                        <IconRocket className="w-3.5 h-3.5 mr-1.5" />
                        {t.apply}
                    </Button>
                    <Button
                        onClick={onCopyPreviousMonth}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-3 border border-transparent hover:border-border/40"
                    >
                        <IconCopy className="w-3.5 h-3.5 mr-1.5" />
                        {t.copyPreviousMonth}
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setSettingsOpen((v) => !v)}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 gap-1.5"
                    >
                        <IconSettings className="w-3.5 h-3.5" />
                        {t.settings}
                        <IconChevronDown
                            className={`w-3 h-3 transition-transform ${settingsOpen ? 'rotate-180' : ''}`}
                        />
                    </Button>
                    <Button
                        onClick={onOpenTemplates}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-3"
                    >
                        <IconDeviceFloppy className="w-3.5 h-3.5 mr-1.5" />
                        {t.saveTemplate}
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Button
                        onClick={onClearData}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title={t.clearData}
                    >
                        <IconTrash className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Collapsible settings panel */}
            {settingsOpen && (
                <div className="grid grid-cols-12 gap-2 pt-2 border-t border-border/30 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="col-span-4 lg:col-span-1 space-y-0.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                            {t.year}
                        </Label>
                        <Controller
                            control={control}
                            name="year"
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="number"
                                    className="h-7 text-xs px-2"
                                    onChange={(e) =>
                                        field.onChange(
                                            parseInt(e.target.value, 10) ||
                                                2025,
                                        )
                                    }
                                    value={field.value ?? ''}
                                />
                            )}
                        />
                    </div>
                    <div className="col-span-8 lg:col-span-2 space-y-0.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                            {t.month}
                        </Label>
                        <Controller
                            control={control}
                            name="month"
                            render={({ field }) => (
                                <Select
                                    value={String(field.value)}
                                    onValueChange={(v) =>
                                        field.onChange(parseInt(v || '1', 10))
                                    }
                                >
                                    <SelectTrigger className="h-7 text-xs px-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from(
                                            { length: 12 },
                                            (_, i) => i + 1,
                                        ).map((m) => (
                                            <SelectItem
                                                key={m}
                                                value={String(m)}
                                            >
                                                {new Date(
                                                    2000,
                                                    m - 1,
                                                ).toLocaleString(
                                                    lang === 'PL'
                                                        ? 'pl-PL'
                                                        : 'en-US',
                                                    { month: 'long' },
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="col-span-4 lg:col-span-1 space-y-0.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                            {t.lang}
                        </Label>
                        <Controller
                            control={control}
                            name="lang"
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="h-7 text-xs px-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EN">EN</SelectItem>
                                        <SelectItem value="PL">PL</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="col-span-8 lg:col-span-2 space-y-0.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                            Region
                        </Label>
                        <Controller
                            control={control}
                            name="holidayBank"
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="h-7 text-xs px-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PL">
                                            Poland (PL)
                                        </SelectItem>
                                        <SelectItem value="US">
                                            USA (US)
                                        </SelectItem>
                                        <SelectItem value="GB">
                                            UK (GB)
                                        </SelectItem>
                                        <SelectItem value="DE">
                                            Germany (DE)
                                        </SelectItem>
                                        <SelectItem value="FR">
                                            France (FR)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="col-span-12 lg:col-span-2 space-y-0.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                            {t.documentRef}
                        </Label>
                        <Controller
                            control={control}
                            name="customRef"
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    className="h-7 text-xs px-2 font-mono"
                                    placeholder="Ref..."
                                />
                            )}
                        />
                    </div>
                    <div className="col-span-12 lg:col-span-4 space-y-0.5">
                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                            {t.branding}
                        </Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="h-7 text-[10px] px-2 py-1 leading-tight file:mr-2 file:py-0 file:px-2 file:rounded-sm file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                            </div>
                            {logo && (
                                <div className="flex items-center gap-1 bg-background border px-2 rounded-md">
                                    <img
                                        src={logo}
                                        alt="Logo"
                                        className="h-4 object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setValue('logo', null, {
                                                shouldDirty: true,
                                            })
                                        }
                                        className="text-destructive hover:text-destructive/80"
                                    >
                                        <IconTrash className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
