export interface Holiday {
    date: string;
    localName: string;
    name: string;
}

interface CachedHolidays {
    data: Record<string, string>;
    fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const SUPPORTED_COUNTRIES = new Set(['PL', 'US', 'GB', 'DE', 'FR']);

export async function fetchHolidays(
    year: number,
    countryCode: string = 'PL',
): Promise<Record<string, string>> {
    const code = countryCode.toUpperCase();
    if (!SUPPORTED_COUNTRIES.has(code)) {
        console.warn(`Unsupported country code: ${code}, falling back to PL`);
        return fetchHolidays(year, 'PL');
    }

    const cacheKey = `holidays-v2-${year}-${code}`;

    try {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed: CachedHolidays = JSON.parse(cached);
                if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
                    return parsed.data;
                }
                localStorage.removeItem(cacheKey);
            }
        }
    } catch {
        // Corrupted cache — ignore and re-fetch
    }

    try {
        const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${year}/${code}`,
        );
        if (!response.ok) {
            throw new Error(`Holiday API returned ${response.status}`);
        }
        const data: Holiday[] = await response.json();

        const mapped = data.reduce(
            (acc, h) => {
                acc[h.date] = h.localName;
                return acc;
            },
            {} as Record<string, string>,
        );

        if (typeof window !== 'undefined') {
            try {
                const cacheEntry: CachedHolidays = {
                    data: mapped,
                    fetchedAt: Date.now(),
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
            } catch {
                // localStorage full — not critical
            }
        }
        return mapped;
    } catch (error) {
        console.error(`Failed to fetch holidays for ${code}/${year}:`, error);

        // Try to use expired cache as fallback
        if (typeof window !== 'undefined') {
            try {
                const stale = localStorage.getItem(cacheKey);
                if (stale) {
                    const parsed: CachedHolidays = JSON.parse(stale);
                    return parsed.data;
                }
            } catch {
                // nothing to do
            }
        }

        return {};
    }
}
