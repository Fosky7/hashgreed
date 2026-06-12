import React, { useState, useEffect } from 'react';

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedPreference = localStorage.getItem('theme');
    if (storedPreference === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors duration-300 ease-in-out text-[var(--color-primary)]"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 18v1m-9-10h1m18 0h1M6.343 6.343l1.414 1.414m11.314 0l1.414-1.414M6 12H3m18 0h3M6.343 17.677l1.414-1.414M17.657 17.677l-1.414-1.414M12 15v3m0 0v-3m0 0H9m3 3h3"></path></svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A11 11 0 018.5 7.538L3 11.27V13a9 9 0 006.448 8.928M6.5 19.676A9 9 0 0013 22v-1.512M8.5 7.538V3a9 9 0 00-3.148 4.262M17.484 18.148a9 9 0 005.738-7.512M11 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      )}
    </button>
  );
};

export default ThemeToggle;
