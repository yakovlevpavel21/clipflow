import { useEffect, useState } from 'react';

export function useTheme() {
  // Устанавливаем начальное состояние из localStorage или дефолт 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (theme === 'dark') {
      root.classList.add('dark');
      metaThemeColor?.setAttribute('content', '#1a1f2e'); 
    } else {
      root.classList.remove('dark');
      metaThemeColor?.setAttribute('content', '#ffffff');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}