import React, { createContext, useState } from "react";
import { DarkTheme, LightTheme } from "./theme";

export const ThemeContext = createContext({
  theme: LightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children } : any) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    console.log('Theme toggled. New theme:', next ? 'Dark' : 'Light');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: isDark ? DarkTheme : LightTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};