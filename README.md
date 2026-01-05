# Timesheet Pro V2

A minimalist, professional timesheet application built with Next.js 15 and React 19.

## Features

- **Monthly Timesheet Management** - Track daily hours with project assignments
- **Polish Holiday Support** - Automatic Polish public holiday detection
- **Multi-language** - Polish and English interface
- **PDF Export** - Generate professional single-page PDF timesheets
- **Excel/CSV Export** - Export data to Excel or CSV formats
- **Custom Logo** - Upload your company logo for personalized PDFs
- **Data Persistence** - Auto-save to localStorage, restore on reload
- **Keyboard Shortcuts** - Ctrl+S (download), Ctrl+P (preview), Ctrl+Shift+A (apply all)
- **Copy Previous Month** - Copy entries from previous month
- **Dark Mode** - Clean dark theme with sharp, minimalist design

## Tech Stack

- **Framework**: Next.js 16, React 19
- **Styling**: Tailwind CSS v4, Shadcn UI (Base UI)
- **PDF Generation**: jsPDF with autoTable
- **Excel**: xlsx library
- **Linting/Formatting**: Biome
- **Package Manager**: Bun

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Lint code
bun run lint

# Format code
bun run format

# Build for production
bun run build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Download PDF |
| `Ctrl+P` | Preview PDF |
| `Ctrl+Shift+A` | Apply defaults to all |
| `Esc` | Close preview dialog |

## Project Structure

```
timesheet-v2/
├── app/                 # Next.js app directory
│   ├── page.tsx         # Main timesheet component
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Global styles & theme
├── components/          # Shadcn UI components
├── lib/                 # Utilities and services
│   ├── pdfGenerator.ts  # PDF generation with Roboto font
│   ├── excelGenerator.ts # Excel/CSV export
│   ├── translations.ts  # i18n strings
│   ├── holidayService.ts # Polish holiday API
│   ├── usePersistedData.ts # localStorage hook
│   └── fonts.ts         # Embedded Roboto fonts (base64)
└── biome.json           # Biome config
```

## License

Private / Personal Use
