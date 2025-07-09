export interface AppSettings {
  // Hotkey settings
  hotkey: {
    enabled: boolean;
    primary: string;
    secondary: string;
  };
  
  // Appearance settings
  appearance: {
    theme: 'dark' | 'light' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    animations: boolean;
    reducedMotion: boolean;
  };
  
  // Cache settings
  cache: {
    maxSize: number;
    clearOnExit: boolean;
    preloadCommon: boolean;
    enablePrefetch?: boolean;
    prefetchPriority?: 'low' | 'medium' | 'high';
    prefetchUseWorker?: boolean;
  };
  
  // Behavior settings
  behavior: {
    closeOnClickOutside: boolean;
    closeOnEscape: boolean;
    copyOnSelect: boolean;
    showFrequency: boolean;
    autoSearch: boolean;
    searchDelay: number;
  };
  
  // Performance settings
  performance: {
    enableMetrics: boolean;
    lowPowerMode: boolean;
    gpuAcceleration: boolean;
  };
  
  // Privacy settings
  privacy?: {
    enableHistory: boolean;
    privacyMode: boolean;
    syncHistory: boolean;
    autoClearAfter: 'never' | 'day' | 'week' | 'month' | 'year';
    allowAnalytics: boolean;
    allowCrashReports: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  hotkey: {
    enabled: true,
    primary: 'Alt+J',
    secondary: 'Ctrl+Shift+D'
  },
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    animations: true,
    reducedMotion: false
  },
  cache: {
    maxSize: 10000,
    clearOnExit: false,
    preloadCommon: true,
    enablePrefetch: true,
    prefetchPriority: 'medium',
    prefetchUseWorker: false
  },
  behavior: {
    closeOnClickOutside: true,
    closeOnEscape: true,
    copyOnSelect: false,
    showFrequency: true,
    autoSearch: true,
    searchDelay: 300
  },
  performance: {
    enableMetrics: true,
    lowPowerMode: false,
    gpuAcceleration: true
  },
  privacy: {
    enableHistory: true,
    privacyMode: false,
    syncHistory: true,
    autoClearAfter: 'never',
    allowAnalytics: false,
    allowCrashReports: true
  }
};