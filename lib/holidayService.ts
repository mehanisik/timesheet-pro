export interface Holiday {
    date: string;
    localName: string;
    name: string;
}

export async function fetchHolidays(
    year: number,
    countryCode: string = 'PL',
): Promise<Record<string, string>> {
    const cacheKey = `holidays-${year}-${countryCode}`;
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
        );
        if (!response.ok) throw new Error('Failed to fetch holidays');
        const data: Holiday[] = await response.json();

        const mapped = data.reduce(
            (acc, h) => {
                acc[h.date] = h.localName;
                return acc;
            },
            {} as Record<string, string>,
        );

        localStorage.setItem(cacheKey, JSON.stringify(mapped));
        return mapped;
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return {};
    }
}
