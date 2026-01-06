import { z } from 'zod';

export const languageSchema = z.enum(['PL', 'EN']);
export type Language = z.infer<typeof languageSchema>;

export const timesheetSettingsSchema = z.object({
    lang: languageSchema.default('EN'),
    year: z.coerce
        .number()
        .min(2000)
        .max(2100)
        .default(new Date().getFullYear()),
    month: z.coerce
        .number()
        .min(1)
        .max(12)
        .default(new Date().getMonth() + 1),
    client: z.string().default(''),
    person: z.string().default(''),
    customRef: z.string().optional().default(''),
    defaultProj: z.string().optional().default(''),
    defaultHours: z.string().default('8'),
    holidayBank: z.string().default('PL'),
    logo: z.string().nullable(),
});

export type TimesheetSettings = z.infer<typeof timesheetSettingsSchema>;
