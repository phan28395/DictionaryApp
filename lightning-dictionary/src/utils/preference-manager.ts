import { 
  UserPreferences, 
  PreferenceProfile, 
  DEFAULT_PROFILES,
  mergeWithDefaults,
  validatePreferences,
  toBackendFormat,
  fromBackendFormat
} from '../types/user-preferences';

const PREFERENCES_KEY = 'user_preferences';
const PROFILES_KEY = 'preference_profiles';
const ACTIVE_PROFILE_KEY = 'active_preference_profile';

export class PreferenceManager {
  private static instance: PreferenceManager;
  private preferences: UserPreferences;
  private profiles: Map<string, PreferenceProfile>;
  private activeProfileId: string | null = null;
  private syncEnabled: boolean = false;
  private authToken: string | null = null;

  private constructor() {
    this.preferences = this.loadPreferences();
    this.profiles = this.loadProfiles();
    this.activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
  }

  static getInstance(): PreferenceManager {
    if (!PreferenceManager.instance) {
      PreferenceManager.instance = new PreferenceManager();
    }
    return PreferenceManager.instance;
  }

  // Enable sync with backend when user is authenticated
  enableSync(authToken: string): void {
    this.authToken = authToken;
    this.syncEnabled = true;
  }

  disableSync(): void {
    this.authToken = null;
    this.syncEnabled = false;
  }

  // Load preferences from localStorage
  private loadPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (validatePreferences(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    return mergeWithDefaults({});
  }

  // Load preference profiles from localStorage
  private loadProfiles(): Map<string, PreferenceProfile> {
    const profiles = new Map<string, PreferenceProfile>();
    
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([id, profile]) => {
          profiles.set(id, profile as PreferenceProfile);
        });
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }

    // Ensure default profiles exist
    if (!profiles.has('default')) {
      profiles.set('default', {
        id: 'default',
        name: 'Default',
        description: 'Balanced settings for most users',
        preferences: mergeWithDefaults(DEFAULT_PROFILES.default),
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return profiles;
  }

  // Save preferences to localStorage and optionally sync with backend
  async savePreferences(prefs: UserPreferences): Promise<void> {
    this.preferences = prefs;
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));

    if (this.syncEnabled && this.authToken) {
      try {
        await this.syncWithBackend(prefs);
      } catch (error) {
        console.error('Failed to sync preferences with backend:', error);
      }
    }
  }

  // Sync preferences with backend
  private async syncWithBackend(prefs: UserPreferences): Promise<void> {
    const response = await fetch('/api/auth/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(toBackendFormat(prefs)),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync preferences: ${response.statusText}`);
    }
  }

  // Fetch preferences from backend
  async fetchFromBackend(): Promise<Partial<UserPreferences>> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }

    const data = await response.json();
    return fromBackendFormat(data.user.preferences);
  }

  // Get current preferences
  getPreferences(): UserPreferences {
    return this.preferences;
  }

  // Update specific preference category
  async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
    const newPrefs = { ...this.preferences, ...updates };
    await this.savePreferences(newPrefs);
  }

  // Profile management
  createProfile(name: string, description?: string): PreferenceProfile {
    const id = `profile_${Date.now()}`;
    const profile: PreferenceProfile = {
      id,
      name,
      description,
      preferences: { ...this.preferences },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(id, profile);
    this.saveProfiles();
    return profile;
  }

  updateProfile(id: string, updates: Partial<PreferenceProfile>): void {
    const profile = this.profiles.get(id);
    if (profile && !profile.isDefault) {
      const updated = {
        ...profile,
        ...updates,
        updatedAt: new Date(),
      };
      this.profiles.set(id, updated);
      this.saveProfiles();
    }
  }

  deleteProfile(id: string): void {
    const profile = this.profiles.get(id);
    if (profile && !profile.isDefault) {
      this.profiles.delete(id);
      if (this.activeProfileId === id) {
        this.activeProfileId = 'default';
        localStorage.setItem(ACTIVE_PROFILE_KEY, 'default');
      }
      this.saveProfiles();
    }
  }

  getProfiles(): PreferenceProfile[] {
    return Array.from(this.profiles.values());
  }

  getProfile(id: string): PreferenceProfile | undefined {
    return this.profiles.get(id);
  }

  // Apply a profile
  async applyProfile(id: string): Promise<void> {
    const profile = this.profiles.get(id);
    if (profile) {
      this.activeProfileId = id;
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
      await this.savePreferences(profile.preferences);
    }
  }

  getActiveProfile(): PreferenceProfile | undefined {
    if (this.activeProfileId) {
      return this.profiles.get(this.activeProfileId);
    }
    return this.profiles.get('default');
  }

  // Save profiles to localStorage
  private saveProfiles(): void {
    const obj: Record<string, PreferenceProfile> = {};
    this.profiles.forEach((profile, id) => {
      obj[id] = profile;
    });
    localStorage.setItem(PROFILES_KEY, JSON.stringify(obj));
  }

  // Export preferences
  exportPreferences(options: {
    includeHistory?: boolean;
    includeProfiles?: boolean;
    format?: 'json' | 'csv';
  } = {}): string {
    const data: any = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      preferences: this.preferences,
    };

    if (options.includeProfiles) {
      data.profiles = Array.from(this.profiles.values());
      data.activeProfileId = this.activeProfileId;
    }

    if (options.includeHistory) {
      // History would be fetched from backend if needed
      data.history = [];
    }

    if (options.format === 'csv') {
      // Convert to CSV format (simplified)
      const rows = [
        ['Setting', 'Value'],
        ...Object.entries(this.preferences).map(([key, value]) => [
          key,
          JSON.stringify(value),
        ]),
      ];
      return rows.map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  // Import preferences
  async importPreferences(data: string, options: {
    mergeWithExisting?: boolean;
    importProfiles?: boolean;
  } = {}): Promise<void> {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.preferences) {
        if (validatePreferences(parsed.preferences)) {
          if (options.mergeWithExisting) {
            await this.updatePreferences(parsed.preferences);
          } else {
            await this.savePreferences(parsed.preferences);
          }
        }
      }

      if (options.importProfiles && parsed.profiles) {
        parsed.profiles.forEach((profile: PreferenceProfile) => {
          if (!profile.isDefault) {
            this.profiles.set(profile.id, {
              ...profile,
              createdAt: new Date(profile.createdAt),
              updatedAt: new Date(profile.updatedAt),
            });
          }
        });
        this.saveProfiles();
      }
    } catch (error) {
      throw new Error(`Failed to import preferences: ${error}`);
    }
  }

  // Reset to defaults
  async resetToDefaults(profileName: keyof typeof DEFAULT_PROFILES = 'default'): Promise<void> {
    const defaults = mergeWithDefaults(DEFAULT_PROFILES[profileName]);
    await this.savePreferences(defaults);
  }

  // Quick preset application
  async applyPreset(preset: keyof typeof DEFAULT_PROFILES): Promise<void> {
    const presetPrefs = DEFAULT_PROFILES[preset];
    await this.updatePreferences(presetPrefs);
  }

  // Download preferences as file
  downloadAsFile(filename: string = 'dictionary-preferences.json'): void {
    const data = this.exportPreferences({
      includeProfiles: true,
      format: 'json',
    });
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Upload preferences from file
  async uploadFromFile(file: File): Promise<void> {
    const text = await file.text();
    await this.importPreferences(text, {
      mergeWithExisting: false,
      importProfiles: true,
    });
  }
}

// Export singleton instance
export const preferenceManager = PreferenceManager.getInstance();