import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useState } from "react";
import { DarkTheme, LightTheme } from "./theme";

export const ThemeContext = createContext({
  theme: LightTheme,
  toggleTheme: () => {},
});

const STORAGE_KEY = "APP_THEME";

export const ThemeProvider = ({ children }: any) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedTheme !== null) {
          setIsDark(storedTheme === "dark");
        }
      } catch (error) {
        console.log("Failed to load theme:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  // Toggle + persist
  const toggleTheme = async () => {
    try {
      const next = !isDark;
      setIsDark(next);
      await AsyncStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch (error) {console.error("Failed to save theme:", error);}
  };
  if (!isLoaded) return null;

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