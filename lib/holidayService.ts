export interface Holiday {
    date: string;
    localName: string;
    name: string;
}

export async function fetchHolidays(
    year: number,
): Promise<Record<string, string>> {
    try {
        const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/PL`,
        );
        if (!response.ok) throw new Error('Failed to fetch holidays');
        const data: Holiday[] = await response.json();

        return data.reduce(
            (acc, h) => {
                acc[h.date] = h.localName;
                return acc;
            },
            {} as Record<string, string>,
        );
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return {};
    }
}
