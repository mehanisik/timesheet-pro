'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full"
            >
                <IconSun className="w-4 h-4" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full hover:bg-background border border-transparent hover:border-border/50"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={
                theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
            }
        >
            {theme === 'dark' ? (
                <IconSun className="w-4 h-4 text-muted-foreground" />
            ) : (
                <IconMoon className="w-4 h-4 text-muted-foreground" />
            )}
        </Button>
    );
}
