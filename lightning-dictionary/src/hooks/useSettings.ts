import { useState, useEffect, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';
import { invoke } from '@tauri-apps/api/core';

const SETTINGS_KEY = 'lightning-dictionary-settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage and backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First try localStorage for quick load
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }

        // Then try to load from backend (more reliable)
        try {
          const backendSettings = await invoke<string>('get_settings');
          if (backendSettings) {
            const parsed = JSON.parse(backendSettings);
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            // Sync to localStorage
            localStorage.setItem(SETTINGS_KEY, backendSettings);
          }
        } catch (err) {
          console.log('No backend settings found, using defaults');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to both localStorage and backend
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setIsSaving(true);
    try {
      // Save to localStorage immediately for fast feedback
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);

      // Save to backend
      await invoke('save_settings', { settings: JSON.stringify(newSettings) });

      // Apply settings that need immediate effect
      applySettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update a specific setting category
  const updateSettings = useCallback((
    category: keyof AppSettings,
    updates: Partial<AppSettings[keyof AppSettings]>
  ) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        ...updates
      }
    };
    return saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    return saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Apply settings that need immediate effect
  const applySettings = (newSettings: AppSettings) => {
    // Apply theme
    if (newSettings.appearance.theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.fontSize = fontSizeMap[newSettings.appearance.fontSize];

    // Apply reduced motion
    if (newSettings.appearance.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Apply GPU acceleration
    if (!newSettings.performance.gpuAcceleration) {
      document.documentElement.style.setProperty('--gpu-acceleration', 'auto');
    } else {
      document.documentElement.style.setProperty('--gpu-acceleration', 'translateZ(0)');
    }
  };

  // Apply settings on load
  useEffect(() => {
    if (!isLoading) {
      applySettings(settings);
    }
  }, [settings, isLoading]);

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
    resetSettings
  };
}

// Hook for specific setting value
export function useSetting<K extends keyof AppSettings>(
  category: K
): AppSettings[K] {
  const { settings } = useSettings();
  return settings[category];
}