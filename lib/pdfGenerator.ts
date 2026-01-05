import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ROBOTO_BOLD, ROBOTO_REGULAR } from './fonts';
import { type Language, TRANSLATIONS } from './translations';

export interface TimesheetEntry {
    date: string;
    day: string;
    project: string;
    hours: string;
    isWeekend: boolean;
    isHoliday: boolean;
}

export interface TimesheetData {
    client: string;
    person: string;
    year: number;
    month: number;
    entries: TimesheetEntry[];
    logo?: string; // Base64 encoded logo
}

export async function generatePDF(
    data: TimesheetData,
    lang: Language,
    save: boolean = false,
): Promise<Blob | null> {
    const t = TRANSLATIONS[lang];
    const doc = new jsPDF();

    // Register Polish-supporting fonts (Roboto)
    doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

    doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

    doc.setFont('Roboto', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Branding
    doc.setFillColor(248, 248, 248);
    doc.rect(10, 10, pageWidth - 20, 25, 'F');

    if (data.logo) {
        try {
            // Calculate aspect ratio and fit logo in the branding box
            // The box is at (15, 15) roughly, height 12-15
            doc.addImage(data.logo, 'PNG', 15, 15, 30, 15, undefined, 'FAST');
        } catch (e) {
            console.error('Failed to add logo to PDF:', e);
            // Fallback to text
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('TIMESHEET PRO SERVICES', 15, 22);
        }
    } else {
        // Default text-based branding
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('TIMESHEET PRO SERVICES', 15, 22);
    }

    // Title
    doc.setFontSize(22);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(t.timesheetLabel, pageWidth - 15, 27, { align: 'right' });

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    // Metadata Section
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    const startY = 45;
    const rowH = 10;

    doc.setFillColor(252, 252, 252);
    doc.rect(10, startY, pageWidth - 20, rowH * 2, 'F');

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);

    // Row 1
    doc.text(`${t.client}:`, 15, startY + 6.5);
    doc.text(`${t.year}:`, 110, startY + 6.5);
    doc.setFont('Roboto', 'normal');
    doc.text(data.client || '—', 50, startY + 6.5);
    doc.text(data.year.toString(), 145, startY + 6.5);

    // Row 2
    doc.line(10, startY + rowH, pageWidth - 10, startY + rowH);
    doc.setFont('Roboto', 'bold');
    doc.text(`${t.person}:`, 15, startY + 16.5);
    doc.text(`${t.month}:`, 110, startY + 16.5);
    doc.setFont('Roboto', 'normal');
    doc.text(data.person || '—', 50, startY + 16.5);
    doc.text(data.month.toString(), 145, startY + 16.5);

    // Table
    const tableHeaders = [t.date, t.day, t.project, t.hours];
    const tableData = data.entries.map((e) => {
        let displayDay = e.day;
        let displayProject = e.project;

        if (e.isHoliday) {
            const hMatch = e.day.match(/\((.*)\)/);
            if (hMatch) {
                const hName = hMatch[1];
                displayDay = e.day.split(' (')[0];
                displayProject = e.project ? `${e.project} (${hName})` : hName;
            }
        }

        return [e.date, displayDay, displayProject, e.hours];
    });

    const totalHours = data.entries.reduce(
        (sum, e) => sum + (parseFloat(e.hours) || 0),
        0,
    );
    const entryCount = data.entries.length;
    // Dynamic font size and padding to force single page
    const dynamicFontSize = entryCount > 28 ? 7 : 8;
    const dynamicPadding = entryCount > 28 ? 1 : 1.5;

    autoTable(doc, {
        startY: 65,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        margin: { top: 10, bottom: 20 },
        headStyles: {
            fillColor: [30, 30, 30],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: 0.1,
        },
        styles: {
            fontSize: dynamicFontSize,
            cellPadding: dynamicPadding,
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            font: 'Roboto',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { cellWidth: 45 },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 20 },
        },
        didParseCell: (cellData: any) => {
            const rowIndex = cellData.row.index;
            const entry = data.entries[rowIndex];
            if (cellData.section === 'body') {
                if (entry?.isHoliday) {
                    cellData.cell.styles.fillColor = [240, 255, 240];
                } else if (entry?.isWeekend) {
                    cellData.cell.styles.fillColor = [248, 248, 248];
                }
            }
        },
        foot: [
            [
                {
                    content: t.total,
                    colSpan: 3,
                    styles: { halign: 'right', fontStyle: 'bold' },
                },
                {
                    content: totalHours.toFixed(1),
                    styles: { halign: 'center', fontStyle: 'bold' },
                },
            ],
        ],
        footStyles: {
            fillColor: [245, 245, 245],
            textColor: [0, 0, 0],
            lineWidth: 0.1,
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Footer signatures - Ensure they are on the same page
    const pageHeight = doc.internal.pageSize.getHeight();
    const signatureY = Math.min(finalY, pageHeight - 15);

    doc.setFontSize(8);
    doc.text(
        '..................................................',
        55,
        signatureY,
        { align: 'center' },
    );
    doc.text(
        '..................................................',
        155,
        signatureY,
        { align: 'center' },
    );
    doc.text(t.contractor, 55, signatureY + 4, { align: 'center' });
    doc.text(t.recipient, 155, signatureY + 4, { align: 'center' });

    if (save) {
        doc.save(`timesheet-${data.year}-${data.month}.pdf`);
        return null;
    }

    return doc.output('blob');
}
