import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL('https://timesheet-v2.vercel.app'),
    title: {
        default: 'Timesheet Pro V2 | Minimalist & Professional Timesheet Generator',
        template: '%s | Timesheet Pro V2',
    },
    description:
        'Free professional timesheet generator for freelancers and contractors. Create, manage, and export PDF/Excel timesheets with ease. No login required.',
    applicationName: 'Timesheet Pro V2',
    authors: [{ name: 'Timesheet Team' }],
    generator: 'Next.js',
    keywords: ['timesheet', 'invoice', 'freelancer', 'contractor', 'pdf generator', 'excel export', 'time tracking', 'work log'],
    referrer: 'origin-when-cross-origin',
    creator: 'Timesheet Team',
    publisher: 'Timesheet Team',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: 'Timesheet Pro V2 | Professional Timesheet Management',
        description: 'Generate professional timesheets in seconds. Export to PDF & Excel. Perfect for freelancers and IT consultants.',
        url: 'https://timesheet-v2.vercel.app',
        siteName: 'Timesheet Pro V2',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: '/og-image.png', // Ensure this exists or use a placeholder path
                width: 1200,
                height: 630,
                alt: 'Timesheet Pro V2 Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Timesheet Pro V2 | Minimalist Timesheet Generator',
        description: 'Create and export professional timesheets instantly. No account needed.',
        images: ['/og-image.png'], // Ensure this exists
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/apple-touch-icon.png', // Ensure this exists or remove if strict on 404s, but good for SEO config
    },
    manifest: '/manifest.json',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Timesheet Pro V2',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        description: 'A minimalist and professional timesheet management tool for freelancers and contractors.',
        featureList: 'PDF Export, Excel Export, CSV Export, Holiday Detection, Local Storage Persistence',
    };

    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
            >
                {children}
            </body>
        </html>
    );
}
