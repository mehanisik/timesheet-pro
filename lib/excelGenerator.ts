import * as XLSX from 'xlsx';
import type { TimesheetData } from './pdfGenerator';
import type { Language } from './translations';
import { TRANSLATIONS } from './translations';

export function generateExcel(data: TimesheetData, lang: Language): void {
    const t = TRANSLATIONS[lang];

    const workedDays = data.entries.filter(
        (e) => !e.isWeekend && !e.isHoliday && e.project.trim() !== '',
    ).length;
    const totalHours = data.entries.reduce(
        (sum, e) => sum + (Number.parseFloat(e.hours) || 0),
        0,
    );

    const headerRows: (string | number)[][] = [
        [t.client, data.client],
        [t.person, data.person],
        [t.period, `${data.month.toString().padStart(2, '0')}/${data.year}`],
        [],
        [t.date, t.day, t.projectShort, t.hours],
    ];

    const dataRows = data.entries.map((entry) => [
        entry.date,
        entry.day.split(' (')[0],
        entry.project,
        Number.parseFloat(entry.hours) || 0,
    ]);

    const summaryRows: (string | number)[][] = [
        [],
        ['', '', t.totalShort, totalHours],
        ['', '', lang === 'PL' ? 'Dni roboczych' : 'Working days', workedDays],
    ];

    const allRows = [...headerRows, ...dataRows, ...summaryRows];

    const ws = XLSX.utils.aoa_to_sheet(allRows);

    ws['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 42 }, { wch: 12 }];

    const headerRowIdx = 4;
    for (let c = 0; c < 4; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c });
        if (ws[cellRef]) {
            ws[cellRef].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: '191919' } },
            };
        }
    }

    const totalRowIdx = headerRows.length + dataRows.length + 1;
    for (let c = 0; c < 4; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: totalRowIdx, c });
        if (ws[cellRef]) {
            ws[cellRef].s = { font: { bold: true } };
        }
    }

    const hoursCol = 3;
    for (
        let r = headerRows.length;
        r < headerRows.length + dataRows.length;
        r++
    ) {
        const cellRef = XLSX.utils.encode_cell({ r, c: hoursCol });
        if (ws[cellRef]) {
            ws[cellRef].z = '0.0';
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

    const filename = `timesheet_${data.year}_${data.month.toString().padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, filename);
}

export function generateCSV(data: TimesheetData, lang: Language): void {
    const t = TRANSLATIONS[lang];

    const totalHours = data.entries.reduce(
        (sum, e) => sum + (Number.parseFloat(e.hours) || 0),
        0,
    );

    const headers = [t.date, t.day, t.projectShort, t.hours].join(',');
    const rows = data.entries.map((entry) =>
        [
            entry.date,
            `"${entry.day.split(' (')[0]}"`,
            `"${entry.project.replace(/"/g, '""')}"`,
            entry.hours,
        ].join(','),
    );

    const totalRow = ['', '', `"${t.totalShort}"`, totalHours.toFixed(1)].join(
        ',',
    );

    const csvContent = [headers, ...rows, '', totalRow].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timesheet_${data.year}_${data.month.toString().padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
