// User preferences that sync across devices when logged in
export interface UserPreferences {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  fontFamily?: string;
  animations: boolean;
  reduceMotion: boolean;
  
  // Prefetch and performance
  prefetchEnabled: boolean;
  prefetchAggressiveness: 'low' | 'medium' | 'high';
  cacheSize: number;
  clearCacheOnExit: boolean;
  lowPowerMode: boolean;
  enableGPUAcceleration: boolean;
  
  // Display preferences
  showExamples: boolean;
  showUsage: boolean;
  showSynonyms: boolean;
  showAntonyms: boolean;
  showFrequency: boolean;
  expandDefinitionsByDefault: boolean;
  groupByPartOfSpeech: boolean;
  
  // Behavior preferences
  historyEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  closeOnClickOutside: boolean;
  closeOnEscape: boolean;
  copyOnSelect: boolean;
  autoSearch: boolean;
  autoSearchDelay: number;
  
  // Hotkey preferences
  hotkeyEnabled: boolean;
  primaryHotkey: string;
  secondaryHotkey: string;
  
  // Navigation preferences
  navigationHistorySize: number;
  showNavigationButtons: boolean;
  showBreadcrumbs: boolean;
  
  // Export/Import preferences
  defaultExportFormat: 'json' | 'csv';
  includeHistoryInExport: boolean;
  includeSettingsInExport: boolean;
  
  // Notification preferences
  showUpdateNotifications: boolean;
  showTips: boolean;
  showPerformanceWarnings: boolean;
  
  // Privacy preferences
  analyticsEnabled: boolean;
  errorReportingEnabled: boolean;
  shareUsageData: boolean;
}

// Preference profiles for quick switching
export interface PreferenceProfile {
  id: string;
  name: string;
  description?: string;
  preferences: UserPreferences;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default preference profiles
export const DEFAULT_PROFILES: Record<string, Partial<UserPreferences>> = {
  default: {
    theme: 'system',
    fontSize: 'medium',
    animations: true,
    reduceMotion: false,
    prefetchEnabled: true,
    prefetchAggressiveness: 'medium',
    cacheSize: 10000,
    clearCacheOnExit: false,
    lowPowerMode: false,
    enableGPUAcceleration: true,
    showExamples: true,
    showUsage: true,
    showSynonyms: true,
    showAntonyms: true,
    showFrequency: true,
    expandDefinitionsByDefault: false,
    groupByPartOfSpeech: true,
    historyEnabled: true,
    keyboardShortcutsEnabled: true,
    closeOnClickOutside: true,
    closeOnEscape: true,
    copyOnSelect: false,
    autoSearch: true,
    autoSearchDelay: 300,
    hotkeyEnabled: true,
    primaryHotkey: 'Alt+J',
    secondaryHotkey: 'Ctrl+Shift+D',
    navigationHistorySize: 50,
    showNavigationButtons: true,
    showBreadcrumbs: true,
    defaultExportFormat: 'json',
    includeHistoryInExport: true,
    includeSettingsInExport: true,
    showUpdateNotifications: true,
    showTips: true,
    showPerformanceWarnings: true,
    analyticsEnabled: false,
    errorReportingEnabled: false,
    shareUsageData: false,
  },
  minimal: {
    animations: false,
    reduceMotion: true,
    prefetchEnabled: false,
    showExamples: false,
    showUsage: false,
    showSynonyms: false,
    showAntonyms: false,
    showFrequency: false,
    expandDefinitionsByDefault: false,
    historyEnabled: false,
    showNavigationButtons: false,
    showBreadcrumbs: false,
    showTips: false,
    showPerformanceWarnings: false,
  },
  powerUser: {
    prefetchAggressiveness: 'high',
    cacheSize: 20000,
    expandDefinitionsByDefault: true,
    navigationHistorySize: 100,
    keyboardShortcutsEnabled: true,
    showPerformanceWarnings: true,
    analyticsEnabled: true,
    errorReportingEnabled: true,
  },
  privacy: {
    historyEnabled: false,
    analyticsEnabled: false,
    errorReportingEnabled: false,
    shareUsageData: false,
    clearCacheOnExit: true,
  },
};

// Helper function to merge preferences with defaults
export function mergeWithDefaults(partial: Partial<UserPreferences>): UserPreferences {
  return {
    ...DEFAULT_PROFILES.default,
    ...partial,
  } as UserPreferences;
}

// Helper function to validate preferences
export function validatePreferences(prefs: any): prefs is UserPreferences {
  // Basic type checking
  if (typeof prefs !== 'object' || prefs === null) {
    return false;
  }
  
  // Check required fields exist and have correct types
  const requiredBooleans = [
    'animations', 'reduceMotion', 'prefetchEnabled', 'clearCacheOnExit',
    'lowPowerMode', 'enableGPUAcceleration', 'showExamples', 'showUsage',
    'showSynonyms', 'showAntonyms', 'showFrequency', 'expandDefinitionsByDefault',
    'groupByPartOfSpeech', 'historyEnabled', 'keyboardShortcutsEnabled',
    'closeOnClickOutside', 'closeOnEscape', 'copyOnSelect', 'autoSearch',
    'hotkeyEnabled', 'showNavigationButtons', 'showBreadcrumbs',
    'includeHistoryInExport', 'includeSettingsInExport', 'showUpdateNotifications',
    'showTips', 'showPerformanceWarnings', 'analyticsEnabled',
    'errorReportingEnabled', 'shareUsageData'
  ];
  
  for (const field of requiredBooleans) {
    if (typeof prefs[field] !== 'boolean') {
      return false;
    }
  }
  
  // Check enums
  if (!['light', 'dark', 'system'].includes(prefs.theme)) return false;
  if (!['small', 'medium', 'large'].includes(prefs.fontSize)) return false;
  if (!['low', 'medium', 'high'].includes(prefs.prefetchAggressiveness)) return false;
  if (!['json', 'csv'].includes(prefs.defaultExportFormat)) return false;
  
  // Check numbers
  const requiredNumbers = ['cacheSize', 'autoSearchDelay', 'navigationHistorySize'];
  for (const field of requiredNumbers) {
    if (typeof prefs[field] !== 'number' || prefs[field] < 0) {
      return false;
    }
  }
  
  // Check strings
  const requiredStrings = ['primaryHotkey', 'secondaryHotkey'];
  for (const field of requiredStrings) {
    if (typeof prefs[field] !== 'string') {
      return false;
    }
  }
  
  return true;
}

// Convert between backend and frontend preference formats
export function toBackendFormat(prefs: UserPreferences): any {
  return {
    theme: prefs.theme,
    fontSize: prefs.fontSize,
    prefetchEnabled: prefs.prefetchEnabled,
    prefetchAggressiveness: prefs.prefetchAggressiveness,
    showExamples: prefs.showExamples,
    showUsage: prefs.showUsage,
    showSynonyms: prefs.showSynonyms,
    showAntonyms: prefs.showAntonyms,
    historyEnabled: prefs.historyEnabled,
    keyboardShortcutsEnabled: prefs.keyboardShortcutsEnabled,
    // Include any additional fields the backend expects
  };
}

export function fromBackendFormat(backendPrefs: any): Partial<UserPreferences> {
  return {
    theme: backendPrefs.theme,
    fontSize: backendPrefs.fontSize,
    prefetchEnabled: backendPrefs.prefetchEnabled,
    prefetchAggressiveness: backendPrefs.prefetchAggressiveness,
    showExamples: backendPrefs.showExamples,
    showUsage: backendPrefs.showUsage,
    showSynonyms: backendPrefs.showSynonyms,
    showAntonyms: backendPrefs.showAntonyms,
    historyEnabled: backendPrefs.historyEnabled,
    keyboardShortcutsEnabled: backendPrefs.keyboardShortcutsEnabled,
  };
}