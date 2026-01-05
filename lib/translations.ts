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
    saveTemplate: string;
    loadTemplate: string;
    noEntriesFilled: string;
    documentRef: string;
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
    EN: {
        title: 'Timesheet Pro',
        settings: 'Settings',
        client: 'Client',
        person: 'Consultant',
        year: 'Year',
        month: 'Month',
        lang: 'Language',
        defaultProj: 'Default project',
        defaultHours: 'Default hours',
        apply: 'Apply to all',
        generate: 'Generate',
        download: 'Download PDF',
        preview: 'Live Preview',
        dailyEntries: 'Activities',
        date: 'Date',
        day: 'Day',
        project: 'Project name',
        hours: 'Hours',
        total: 'Total hours:',
        contractor: 'Contractor',
        recipient: 'Recipient',
        timesheetLabel: 'TIMESHEET',
        branding: 'Logo',
        logo: 'Company logo',
        clearData: 'Clear data',
        exportExcel: 'Excel',
        exportCSV: 'CSV',
        copyPreviousMonth: 'Copy previous month',
        saveTemplate: 'Save template',
        loadTemplate: 'Load template',
        noEntriesFilled: 'Fill in entries first',
        documentRef: 'Document Ref',
    },
    PL: {
        title: 'Karta czasu pracy',
        settings: 'Konfiguracja',
        client: 'Klient',
        person: 'Konsultant',
        year: 'Rok',
        month: 'Miesiąc',
        lang: 'Język',
        defaultProj: 'Domyślny projekt',
        defaultHours: 'Godziny domyślne',
        apply: 'Zastosuj do wszystkich dni',
        generate: 'Wygeneruj',
        download: 'Pobierz PDF',
        preview: 'Podgląd na żywo',
        dailyEntries: 'Wpisy dzienne',
        date: 'Data',
        day: 'Dzień',
        project: 'Nazwa projektu',
        hours: 'Godziny',
        total: 'Suma godzin',
        contractor: 'Wykonawca',
        recipient: 'Odbiorca',
        timesheetLabel: 'KARTA CZASU PRACY',
        branding: 'Logo',
        logo: 'Logo firmy',
        clearData: 'Wyczyść dane',
        exportExcel: 'Excel',
        exportCSV: 'CSV',
        copyPreviousMonth: 'Kopiuj poprzedni miesiąc',
        saveTemplate: 'Zapisz szablon',
        loadTemplate: 'Wczytaj szablon',
        noEntriesFilled: 'Najpierw wypełnij wpisy',
        documentRef: 'Numer Ref.',
    }

};
