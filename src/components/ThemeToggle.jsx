// src/components/ThemeToggle.jsx
import React from "react";
import { useTheme } from "../theme";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type='button'
      className='theme-toggle'
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
};

export default ThemeToggle;
