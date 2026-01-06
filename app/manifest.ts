import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Timesheet Pro V2',
        short_name: 'Timesheet',
        description:
            'Advanced monochrome timesheet management for professionals.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo.png', // Assuming a larger version or reusing for now
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
