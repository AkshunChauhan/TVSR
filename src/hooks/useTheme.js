import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = (e) => {
            const isDarkMode = e.matches;
            setIsDark(isDarkMode);
            document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        };

        // Set initial theme
        updateTheme(mediaQuery);

        // Listen for changes
        mediaQuery.addEventListener('change', updateTheme);

        return () => mediaQuery.removeEventListener('change', updateTheme);
    }, []);

    return isDark;
};
