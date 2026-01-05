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

    // Calculate statistics
    const totalHours = data.entries.reduce(
        (sum, e) => sum + (Number.parseFloat(e.hours) || 0),
        0,
    );
    const workingDays = data.entries.filter(
        (e) => !e.isWeekend && !e.isHoliday && Number.parseFloat(e.hours) > 0,
    ).length;
    const weekendDays = data.entries.filter((e) => e.isWeekend).length;
    const holidays = data.entries.filter(
        (e) => e.isHoliday && !e.isWeekend,
    ).length;
    const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;

    // Generate document reference
    const docRef = `TS-${data.year}${String(data.month).padStart(2, '0')}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    const generatedDate = new Date().toLocaleDateString(
        lang === 'PL' ? 'pl-PL' : 'en-US',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        },
    );
    const monthName = new Date(data.year, data.month - 1).toLocaleDateString(
        lang === 'PL' ? 'pl-PL' : 'en-US',
        { month: 'long', year: 'numeric' },
    );

    // ========== HEADER SECTION ==========
    // Background
    doc.setFillColor(25, 25, 25);
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Logo or company name
    if (data.logo) {
        try {
            doc.addImage(data.logo, 'PNG', 12, 8, 28, 16, undefined, 'FAST');
        } catch {
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.setFont('Roboto', 'bold');
            doc.text('TIMESHEET PRO', 12, 18);
        }
    } else {
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont('Roboto', 'bold');
        doc.text('TIMESHEET PRO', 12, 18);
    }

    // Title and document info
    doc.setFontSize(18);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(t.timesheetLabel, pageWidth - 12, 15, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`Ref: ${docRef}`, pageWidth - 12, 22, { align: 'right' });
    doc.text(generatedDate, pageWidth - 12, 27, { align: 'right' });

    // ========== INFO CARDS SECTION ==========
    const cardY = 38;
    const cardH = 22;

    // Client/Person Card (Left)
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(10, cardY, (pageWidth - 30) / 2, cardH, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('Roboto', 'normal');
    doc.text(t.client.toUpperCase(), 15, cardY + 6);
    doc.text(t.person.toUpperCase(), 15, cardY + 15);

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.setFont('Roboto', 'bold');
    doc.text(data.client || '—', 50, cardY + 6);
    doc.text(data.person || '—', 50, cardY + 15);

    // Period/Stats Card (Right)
    const rightCardX = 10 + (pageWidth - 30) / 2 + 10;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(rightCardX, cardY, (pageWidth - 30) / 2, cardH, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('Roboto', 'normal');
    doc.text(lang === 'PL' ? 'OKRES' : 'PERIOD', rightCardX + 5, cardY + 6);

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.setFont('Roboto', 'bold');
    doc.text(monthName, rightCardX + 35, cardY + 6);

    // Stats row
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('Roboto', 'normal');
    const statsText =
        lang === 'PL'
            ? `${workingDays} dni roboczych • ${weekendDays} weekendów • ${holidays} świąt • Śr. ${avgHoursPerDay.toFixed(1)}h/dzień`
            : `${workingDays} work days • ${weekendDays} weekends • ${holidays} holidays • Avg ${avgHoursPerDay.toFixed(1)}h/day`;
    doc.text(statsText, rightCardX + 5, cardY + 15);

    // ========== TABLE SECTION ==========
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

    const entryCount = data.entries.length;
    // Dynamic sizing for single page
    const dynamicFontSize = entryCount > 28 ? 6.5 : entryCount > 25 ? 7 : 7.5;
    const dynamicPadding = entryCount > 28 ? 0.8 : entryCount > 25 ? 1 : 1.2;

    autoTable(doc, {
        startY: cardY + cardH + 4,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        margin: { left: 10, right: 10, bottom: 28 },
        headStyles: {
            fillColor: [35, 35, 35],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7,
            cellPadding: 2,
        },
        styles: {
            fontSize: dynamicFontSize,
            cellPadding: dynamicPadding,
            lineWidth: 0.1,
            lineColor: [220, 220, 220],
            font: 'Roboto',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 18 },
            1: { cellWidth: 35, fontSize: dynamicFontSize - 0.5 },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 16 },
        },
        alternateRowStyles: {
            fillColor: [252, 252, 252],
        },
        // biome-ignore lint/suspicious/noExplicitAny: jspdf-autotable types
        didParseCell: (cellData: any) => {
            const rowIndex = cellData.row.index;
            const entry = data.entries[rowIndex];
            if (cellData.section === 'body') {
                if (entry?.isHoliday) {
                    cellData.cell.styles.fillColor = [232, 245, 233];
                    cellData.cell.styles.textColor = [46, 125, 50];
                } else if (entry?.isWeekend) {
                    cellData.cell.styles.fillColor = [245, 245, 245];
                    cellData.cell.styles.textColor = [150, 150, 150];
                }
            }
        },
        foot: [
            [
                {
                    content: t.total,
                    colSpan: 3,
                    styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 },
                },
                {
                    content: `${totalHours.toFixed(1)}h`,
                    styles: {
                        halign: 'center',
                        fontStyle: 'bold',
                        fontSize: 8,
                    },
                },
            ],
        ],
        footStyles: {
            fillColor: [240, 240, 240],
            textColor: [30, 30, 30],
            lineWidth: 0.1,
        },
    });

    // biome-ignore lint/suspicious/noExplicitAny: jspdf types
    const finalY = (doc as any).lastAutoTable.finalY;
    const pageHeight = doc.internal.pageSize.getHeight();

    // ========== FOOTER SECTION ==========
    // Signature area - positioned at bottom
    const signatureY = Math.min(finalY + 8, pageHeight - 22);

    // Signature lines
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(25, signatureY + 6, 85, signatureY + 6);
    doc.line(125, signatureY + 6, 185, signatureY + 6);

    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(t.contractor, 55, signatureY + 11, { align: 'center' });
    doc.text(t.recipient, 155, signatureY + 11, { align: 'center' });

    // Bottom info bar
    doc.setFillColor(248, 248, 248);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');

    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(`Document: ${docRef}`, 10, pageHeight - 3);
    doc.text(
        `Generated: ${new Date().toISOString()}`,
        pageWidth / 2,
        pageHeight - 3,
        {
            align: 'center',
        },
    );
    doc.text('Page 1 of 1', pageWidth - 10, pageHeight - 3, { align: 'right' });

    if (save) {
        doc.save(`timesheet-${data.year}-${data.month}.pdf`);
        return null;
    }

    return doc.output('blob');
}
