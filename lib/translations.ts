export type Language = 'EN' | 'PL';

export interface TranslationStrings {
    title: string;
    settings: string;
    client: string;
    person: string;
    year: string;
    month: string;
    lang: string;
    defaultProj: string;
    defaultHours: string;
    apply: string;
    generate: string;
    download: string;
    preview: string;
    dailyEntries: string;
    date: string;
    day: string;
    project: string;
    hours: string;
    total: string;
    contractor: string;
    recipient: string;
    timesheetLabel: string;
    branding: string;
    logo: string;
    clearData: string;
    exportExcel: string;
    exportCSV: string;
    copyPreviousMonth: string;
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
    EN: {
        title: 'Timesheet Pro',
        settings: 'Configuration',
        client: 'Client',
        person: 'Consultant',
        year: 'Year',
        month: 'Month',
        lang: 'Language',
        defaultProj: 'Default Project',
        defaultHours: 'Default Hours',
        apply: 'Apply to All',
        generate: 'Generate',
        download: 'Download PDF',
        preview: 'Live Preview',
        dailyEntries: 'Activities',
        date: 'Date',
        day: 'Day',
        project: 'Project Name',
        hours: 'Hours',
        total: 'Total Hours:',
        contractor: 'Contractor',
        recipient: 'Recipient',
        timesheetLabel: 'TIMESHEET',
        branding: 'Minimalist Monochrome Branding',
        logo: 'Company Logo',
        clearData: 'Clear Data',
        exportExcel: 'Excel',
        exportCSV: 'CSV',
        copyPreviousMonth: 'Copy Previous',
    },
    PL: {
        title: 'Karta Pracy',
        settings: 'Konfiguracja',
        client: 'Klient',
        person: 'Konsultant',
        year: 'Rok',
        month: 'Miesiąc',
        lang: 'Język',
        defaultProj: 'Domyślny Projekt',
        defaultHours: 'Domyślne Godziny',
        apply: 'Zastosuj do wszystkich',
        generate: 'Generuj',
        download: 'Pobierz PDF',
        preview: 'Podgląd na żywo',
        dailyEntries: 'Działania',
        date: 'Data',
        day: 'Dzień',
        project: 'Nazwa Projektu',
        hours: 'Godziny',
        total: 'Suma godzin:',
        contractor: 'Wykonawca',
        recipient: 'Odbiorca',
        timesheetLabel: 'KARTA PRACY',
        branding: 'Logo Minimalistyczne',
        logo: 'Logo Firmy',
        clearData: 'Wyczyść dane',
        exportExcel: 'Excel',
        exportCSV: 'CSV',
        copyPreviousMonth: 'Kopiuj poprz.',
    },
};
