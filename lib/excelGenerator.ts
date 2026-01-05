import * as XLSX from 'xlsx';
import type { TimesheetData } from './pdfGenerator';

export function generateExcel(data: TimesheetData, lang: 'PL' | 'EN'): void {
    const t = {
        PL: {
            date: 'Data',
            day: 'Dzień',
            project: 'Projekt',
            hours: 'Godziny',
            total: 'Suma',
            client: 'Klient',
            consultant: 'Konsultant',
            period: 'Okres',
        },
        EN: {
            date: 'Date',
            day: 'Day',
            project: 'Project',
            hours: 'Hours',
            total: 'Total',
            client: 'Client',
            consultant: 'Consultant',
            period: 'Period',
        },
    }[lang];

    // Create header rows
    const headerRows = [
        [t.client, data.client],
        [t.consultant, data.person],
        [t.period, `${data.month.toString().padStart(2, '0')}/${data.year}`],
        [], // Empty row
        [t.date, t.day, t.project, t.hours],
    ];

    // Create data rows
    const dataRows = data.entries.map((entry) => [
        entry.date,
        entry.day.split(' (')[0], // Remove holiday name for cleaner export
        entry.project,
        entry.hours,
    ]);

    // Calculate total
    const totalHours = data.entries.reduce(
        (sum, e) => sum + (Number.parseFloat(e.hours) || 0),
        0,
    );

    // Add total row
    const totalRow = ['', '', t.total, totalHours.toFixed(1)];

    // Combine all rows
    const allRows = [...headerRows, ...dataRows, [], totalRow];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Day
        { wch: 40 }, // Project
        { wch: 10 }, // Hours
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

    // Generate filename
    const filename = `timesheet_${data.year}_${data.month.toString().padStart(2, '0')}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
}

export function generateCSV(data: TimesheetData, lang: 'PL' | 'EN'): void {
    const t = {
        PL: {
            date: 'Data',
            day: 'Dzień',
            project: 'Projekt',
            hours: 'Godziny',
        },
        EN: {
            date: 'Date',
            day: 'Day',
            project: 'Project',
            hours: 'Hours',
        },
    }[lang];

    // Create CSV content
    const headers = [t.date, t.day, t.project, t.hours].join(',');
    const rows = data.entries.map((entry) =>
        [
            entry.date,
            `"${entry.day.split(' (')[0]}"`, // Quote to handle commas
            `"${entry.project}"`,
            entry.hours,
        ].join(','),
    );

    const csvContent = [headers, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timesheet_${data.year}_${data.month.toString().padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
