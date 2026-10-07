// src/theme.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Chart as ChartJS } from "chart.js";

const chartColors = {
  light: { text: "#59636e", grid: "rgba(31, 35, 40, 0.1)", surface: "#ffffff" },
  dark: { text: "#9198a1", grid: "rgba(240, 246, 252, 0.1)", surface: "#161b22" },
};

// Chart.js не читает CSS-переменные, поэтому цвета подписей и сетки задаём через defaults
export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  ChartJS.defaults.color = chartColors[theme].text;
  ChartJS.defaults.borderColor = chartColors[theme].grid;
  ChartJS.defaults.elements.arc.borderColor = chartColors[theme].surface;
};

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage недоступен — берём системную тему
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const ThemeContext = createContext({ theme: "light", setTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    return initial;
  });

  // defaults должны смениться до перерисовки графиков
  const setTheme = (next) => {
    applyTheme(next);
    setThemeState(next);
  };

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // тема просто не запомнится
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
