'use client';

import { use } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DayInfo } from '@/lib/timesheetUtils';

interface TimesheetGridProps {
    daysPromise: Promise<DayInfo[]>;
    userData: Record<string, { project: string; hours: string }>;
    onEntryChange: (date: string, field: 'project' | 'hours', value: string) => void;
    labels: {
        date: string;
        day: string;
        project: string;
        hours: string;
    };
}

export function TimesheetGrid({ daysPromise, userData, onEntryChange, labels }: TimesheetGridProps) {
    const days = use(daysPromise);

    return (
        <Table>
            <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent border-b border-border/60">
                    <TableHead className="w-[80px] h-9 pl-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{labels.date}</TableHead>
                    <TableHead className="w-[140px] h-9 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{labels.day}</TableHead>
                    <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{labels.project}</TableHead>
                    <TableHead className="w-[80px] h-9 pr-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">{labels.hours}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {days.map((day) => {
                    const entry = userData[day.date] || { project: '', hours: '' };
                    return (
                        <TableRow
                            key={day.date}
                            className={cn(
                                'group border-border/40 transition-colors hover:bg-muted/30 h-9',
                                day.isHoliday && 'bg-primary/5',
                                day.isWeekend && 'bg-muted/10',
                            )}
                        >
                            <TableCell className="font-mono text-[10px] text-muted-foreground pl-4 py-0 h-9 select-none">
                                {day.date.split('-').slice(1).join('/')}
                            </TableCell>
                            <TableCell className="py-0 h-9">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        'text-[10px] font-medium uppercase tracking-tight',
                                        day.isHoliday ? 'text-primary' : day.isWeekend ? 'text-muted-foreground/60' : 'text-foreground'
                                    )}>
                                        {day.dayName.split(' ')[0]}
                                    </span>
                                    {day.isHoliday && (
                                        <Badge variant="outline" className="text-[9px] font-semibold text-primary border-primary/20 bg-primary/5 px-1.5 py-0 h-4 leading-none rounded-sm">
                                            {day.holidayName || 'Holiday'}
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="py-0 h-9">
                                <input
                                    type="text"
                                    value={entry.project}
                                    onChange={(e) => onEntryChange(day.date, 'project', e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-medium text-foreground placeholder:text-muted-foreground/30 h-full"
                                    placeholder={!day.isWeekend && !day.isHoliday ? "..." : ""}
                                    aria-label={`Project for ${day.date}`}
                                />
                            </TableCell>
                            <TableCell className="pr-4 py-0 h-9">
                                <input
                                    type="text"
                                    value={entry.hours}
                                    onChange={(e) => onEntryChange(day.date, 'hours', e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-center tabular-nums font-semibold text-foreground h-full"
                                    placeholder={!day.isWeekend && !day.isHoliday ? "0" : ""}
                                    aria-label={`Hours for ${day.date}`}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
