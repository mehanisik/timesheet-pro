import { fetchHolidays } from './holidayService';

export interface DayInfo {
    date: string; // YYYY-MM-DD
    dayName: string; // Monday, Tuesday...
    isWeekend: boolean;
    holidayName: string | null;
    isHoliday: boolean;
}

export async function getMonthDays(
    year: number,
    month: number,
    countryCode: string,
    lang: string,
): Promise<DayInfo[]> {
    const holidays = await fetchHolidays(year, countryCode);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: DayInfo[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day, 12, 0, 0);
        const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const holidayName = holidays[isoDate] || null;

        days.push({
            date: isoDate,
            dayName: date.toLocaleDateString(
                lang === 'PL' ? 'pl-PL' : 'en-US',
                { weekday: 'long' },
            ),
            isWeekend,
            holidayName,
            isHoliday: !!holidayName,
        });
    }

    return days;
}
