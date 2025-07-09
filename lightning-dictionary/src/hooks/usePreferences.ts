import { useState, useEffect, useCallback, useContext } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { preferenceManager } from '../utils/preference-manager';
import { UserPreferences, PreferenceProfile, DEFAULT_PROFILES } from '../types/user-preferences';
import { AppSettings } from '../types/settings';

interface AuthContext {
  token: string | null;
  user: any | null;
}

// Mock auth context - replace with actual auth context when available
const mockAuthContext: AuthContext = {
  token: null,
  user: null,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(preferenceManager.getPreferences());
  const [profiles, setProfiles] = useState<PreferenceProfile[]>(preferenceManager.getProfiles());
  const [activeProfile, setActiveProfile] = useState<PreferenceProfile | undefined>(preferenceManager.getActiveProfile());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Get auth context - replace with actual context
  const authContext = mockAuthContext;

  // Initialize preference manager with auth token when available
  useEffect(() => {
    if (authContext.token) {
      preferenceManager.enableSync(authContext.token);
      syncPreferences();
    } else {
      preferenceManager.disableSync();
    }
  }, [authContext.token]);

  // Sync preferences with backend
  const syncPreferences = useCallback(async () => {
    if (!authContext.token) return;
    
    setIsSyncing(true);
    try {
      const backendPrefs = await preferenceManager.fetchFromBackend();
      const merged = { ...preferences, ...backendPrefs };
      await preferenceManager.savePreferences(merged);
      setPreferences(merged);
      setLastSync(new Date());
    } catch (error) {
      console.error('Failed to sync preferences:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [authContext.token, preferences]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    setIsSaving(true);
    try {
      await preferenceManager.updatePreferences(updates);
      const newPrefs = preferenceManager.getPreferences();
      setPreferences(newPrefs);
      
      // Apply visual preferences immediately
      applyVisualPreferences(newPrefs);
      
      // Apply backend-specific preferences
      await applyBackendPreferences(newPrefs);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Profile management
  const createProfile = useCallback((name: string, description?: string) => {
    const profile = preferenceManager.createProfile(name, description);
    setProfiles(preferenceManager.getProfiles());
    return profile;
  }, []);

  const updateProfile = useCallback((id: string, updates: Partial<PreferenceProfile>) => {
    preferenceManager.updateProfile(id, updates);
    setProfiles(preferenceManager.getProfiles());
  }, []);

  const deleteProfile = useCallback((id: string) => {
    preferenceManager.deleteProfile(id);
    setProfiles(preferenceManager.getProfiles());
    setActiveProfile(preferenceManager.getActiveProfile());
  }, []);

  const applyProfile = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      await preferenceManager.applyProfile(id);
      const newPrefs = preferenceManager.getPreferences();
      setPreferences(newPrefs);
      setActiveProfile(preferenceManager.getActiveProfile());
      
      // Apply preferences
      applyVisualPreferences(newPrefs);
      await applyBackendPreferences(newPrefs);
    } catch (error) {
      console.error('Failed to apply profile:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Apply preset
  const applyPreset = useCallback(async (preset: keyof typeof DEFAULT_PROFILES) => {
    await updatePreferences(DEFAULT_PROFILES[preset]);
  }, [updatePreferences]);

  // Reset preferences
  const resetToDefaults = useCallback(async (preset: keyof typeof DEFAULT_PROFILES = 'default') => {
    setIsSaving(true);
    try {
      await preferenceManager.resetToDefaults(preset);
      const newPrefs = preferenceManager.getPreferences();
      setPreferences(newPrefs);
      
      // Apply preferences
      applyVisualPreferences(newPrefs);
      await applyBackendPreferences(newPrefs);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Export/Import
  const exportPreferences = useCallback((options?: {
    includeHistory?: boolean;
    includeProfiles?: boolean;
    format?: 'json' | 'csv';
  }) => {
    return preferenceManager.exportPreferences(options);
  }, []);

  const importPreferences = useCallback(async (data: string, options?: {
    mergeWithExisting?: boolean;
    importProfiles?: boolean;
  }) => {
    setIsLoading(true);
    try {
      await preferenceManager.importPreferences(data, options);
      setPreferences(preferenceManager.getPreferences());
      setProfiles(preferenceManager.getProfiles());
    } catch (error) {
      console.error('Failed to import preferences:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadPreferences = useCallback((filename?: string) => {
    preferenceManager.downloadAsFile(filename);
  }, []);

  const uploadPreferences = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      await preferenceManager.uploadFromFile(file);
      setPreferences(preferenceManager.getPreferences());
      setProfiles(preferenceManager.getProfiles());
    } catch (error) {
      console.error('Failed to upload preferences:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply visual preferences immediately
  const applyVisualPreferences = (prefs: UserPreferences) => {
    // Theme
    if (prefs.theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else if (prefs.theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
      }
    }

    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.fontSize = fontSizeMap[prefs.fontSize];

    // Font family
    if (prefs.fontFamily) {
      document.documentElement.style.fontFamily = prefs.fontFamily;
    }

    // Animations
    if (!prefs.animations || prefs.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // GPU acceleration
    if (!prefs.enableGPUAcceleration) {
      document.documentElement.style.setProperty('--gpu-acceleration', 'auto');
    } else {
      document.documentElement.style.setProperty('--gpu-acceleration', 'translateZ(0)');
    }
  };

  // Apply backend-specific preferences
  const applyBackendPreferences = async (prefs: UserPreferences) => {
    try {
      // Convert to AppSettings format for Tauri backend
      const backendSettings: AppSettings = {
        hotkey: {
          enabled: prefs.hotkeyEnabled,
          primary: prefs.primaryHotkey,
          secondary: prefs.secondaryHotkey,
        },
        appearance: {
          theme: prefs.theme,
          fontSize: prefs.fontSize,
          animations: prefs.animations,
          reducedMotion: prefs.reduceMotion,
        },
        cache: {
          maxSize: prefs.cacheSize,
          clearOnExit: prefs.clearCacheOnExit,
          preloadCommonWords: true,
          intelligentPrefetch: {
            enabled: prefs.prefetchEnabled,
            aggressiveness: prefs.prefetchAggressiveness,
            maxPredictions: 10,
          },
        },
        behavior: {
          closeOnClickOutside: prefs.closeOnClickOutside,
          closeOnEscape: prefs.closeOnEscape,
          copyOnSelect: prefs.copyOnSelect,
          showFrequency: prefs.showFrequency,
          autoSearch: prefs.autoSearch,
          autoSearchDelay: prefs.autoSearchDelay,
        },
        performance: {
          enableMetrics: prefs.showPerformanceWarnings,
          lowPowerMode: prefs.lowPowerMode,
          gpuAcceleration: prefs.enableGPUAcceleration,
        },
      };

      await invoke('save_settings', { settings: JSON.stringify(backendSettings) });
    } catch (error) {
      console.error('Failed to apply backend preferences:', error);
    }
  };

  // Apply preferences on mount
  useEffect(() => {
    applyVisualPreferences(preferences);
    applyBackendPreferences(preferences);
  }, []);

  return {
    preferences,
    profiles,
    activeProfile,
    isLoading,
    isSaving,
    isSyncing,
    lastSync,
    updatePreferences,
    createProfile,
    updateProfile,
    deleteProfile,
    applyProfile,
    applyPreset,
    resetToDefaults,
    exportPreferences,
    importPreferences,
    downloadPreferences,
    uploadPreferences,
    syncPreferences,
  };
}

// Hook for specific preference value
export function usePreference<K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] {
  const { preferences } = usePreferences();
  return preferences[key];
}