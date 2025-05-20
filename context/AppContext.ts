import React, { createContext, useState, useEffect, ReactNode } from 'react'; // Import ReactNode
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppContextProps { // Define the type for the context value
  theme: string;
  language: string;
  setTheme: (newTheme: string) => void;
  setLanguage: (newLanguage: string) => void;
}

export const AppContext = createContext<AppContextProps>({ // Use the interface here
  theme: 'Gelap',
  language: 'English',
  setTheme: () => {},
  setLanguage: () => {},
});

const STORAGE_KEY_THEME = '@settings:selectedRefloTheme';
const STORAGE_KEY_LANGUAGE = '@settings:selectedRefloLanguage';
const DEFAULT_THEME = 'Gelap';
const DEFAULT_LANGUAGE = 'English';

interface AppProviderProps { // Define the props for AppProvider
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => { // Use the interface
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(STORAGE_KEY_THEME);
        if (storedTheme) {
          setTheme(storedTheme);
        }
        const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
        if (storedLanguage) {
          setLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const updateTheme = async (newTheme: string) => {
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_THEME, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const updateLanguage = async (newLanguage: string) => {
    setLanguage(newLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  return (
    <AppContext.Provider value={{ theme, language, setTheme: updateTheme, setLanguage: updateLanguage }}>
      {children}
    </AppContext.Provider>
  );
};
