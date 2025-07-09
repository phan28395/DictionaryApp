import db from '../database/db';
import { UserPreferences } from '../types/auth';

export class PreferencesService {
  /**
   * Get user preferences with fallback to defaults
   */
  static async getUserPreferences(userId: number): Promise<UserPreferences> {
    const user = await db('users')
      .where({ id: userId })
      .select('preferences')
      .first();

    if (!user || !user.preferences) {
      return this.getDefaultPreferences();
    }

    // Merge stored preferences with defaults to ensure all fields exist
    return {
      ...this.getDefaultPreferences(),
      ...user.preferences,
    };
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: number,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    // Get current preferences
    const currentPrefs = await this.getUserPreferences(userId);
    
    // Merge with updates
    const updatedPrefs = {
      ...currentPrefs,
      ...preferences,
    };

    // Validate preferences
    if (!this.validatePreferences(updatedPrefs)) {
      throw new Error('Invalid preferences format');
    }

    // Update in database
    await db('users')
      .where({ id: userId })
      .update({
        preferences: JSON.stringify(updatedPrefs),
        updated_at: new Date(),
      });

    return updatedPrefs;
  }

  /**
   * Reset user preferences to defaults
   */
  static async resetUserPreferences(userId: number): Promise<UserPreferences> {
    const defaultPrefs = this.getDefaultPreferences();

    await db('users')
      .where({ id: userId })
      .update({
        preferences: JSON.stringify(defaultPrefs),
        updated_at: new Date(),
      });

    return defaultPrefs;
  }

  /**
   * Export user data including preferences and history
   */
  static async exportUserData(userId: number, includeHistory: boolean = true): Promise<any> {
    const user = await db('users')
      .where({ id: userId })
      .select('email', 'preferences', 'created_at')
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const exportData: any = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        email: user.email,
        joinDate: user.created_at,
      },
      preferences: user.preferences || this.getDefaultPreferences(),
    };

    if (includeHistory) {
      const history = await db('user_history')
        .where({ user_id: userId })
        .select('word', 'frequency', 'last_lookup', 'created_at')
        .orderBy('last_lookup', 'desc')
        .limit(1000); // Limit to prevent huge exports

      exportData.history = history || [];
    }

    return exportData;
  }

  /**
   * Import user preferences from export data
   */
  static async importUserPreferences(
    userId: number,
    importData: any,
    options: {
      mergeWithExisting?: boolean;
      importHistory?: boolean;
    } = {}
  ): Promise<void> {
    // Validate import data structure
    if (!importData.version || !importData.preferences) {
      throw new Error('Invalid import data format');
    }

    // Import preferences
    if (importData.preferences) {
      if (options.mergeWithExisting) {
        // Merge with existing
        const currentPrefs = await this.getUserPreferences(userId);
        const mergedPrefs = {
          ...currentPrefs,
          ...importData.preferences,
        };
        await db('users')
          .where({ id: userId })
          .update({
            preferences: JSON.stringify(mergedPrefs),
            updated_at: new Date(),
          });
      } else {
        // Replace entirely - merge with defaults to ensure all fields exist
        const fullPrefs = {
          ...this.getDefaultPreferences(),
          ...importData.preferences,
        };
        await db('users')
          .where({ id: userId })
          .update({
            preferences: JSON.stringify(fullPrefs),
            updated_at: new Date(),
          });
      }
    }

    // Import history if requested
    if (options.importHistory && importData.history) {
      // Clear existing history if not merging
      if (!options.mergeWithExisting) {
        await db('user_history').where({ user_id: userId }).del();
      }

      // Insert history items
      const historyItems = importData.history.map((item: any) => ({
        user_id: userId,
        word: item.word,
        frequency: item.frequency || 1,
        last_lookup: item.last_lookup || new Date(),
        created_at: item.created_at || new Date(),
      }));

      // Batch insert with conflict handling
      for (const item of historyItems) {
        await db('user_history')
          .insert(item)
          .onConflict(['user_id', 'word'])
          .merge({
            frequency: db.raw('user_history.frequency + excluded.frequency'),
            last_lookup: db.raw('excluded.last_lookup'),
          });
      }
    }
  }

  /**
   * Get preference statistics across all users
   */
  static async getPreferenceStats(): Promise<any> {
    const users = await db('users')
      .whereNotNull('preferences')
      .select('preferences');

    const stats = {
      totalUsers: users.length,
      themes: { light: 0, dark: 0, system: 0 },
      fontSize: { small: 0, medium: 0, large: 0 },
      prefetchEnabled: 0,
      historyEnabled: 0,
      keyboardShortcutsEnabled: 0,
    };

    users.forEach(user => {
      const prefs = user.preferences;
      if (prefs.theme) stats.themes[prefs.theme]++;
      if (prefs.fontSize) stats.fontSize[prefs.fontSize]++;
      if (prefs.prefetchEnabled) stats.prefetchEnabled++;
      if (prefs.historyEnabled) stats.historyEnabled++;
      if (prefs.keyboardShortcutsEnabled) stats.keyboardShortcutsEnabled++;
    });

    return stats;
  }

  /**
   * Validate preferences structure
   */
  private static validatePreferences(prefs: any): boolean {
    // Check required fields
    const requiredFields = ['theme', 'fontSize', 'prefetchEnabled', 'historyEnabled'];
    for (const field of requiredFields) {
      if (!(field in prefs)) {
        return false;
      }
    }

    // Validate enums
    if (!['light', 'dark', 'system'].includes(prefs.theme)) return false;
    if (!['small', 'medium', 'large'].includes(prefs.fontSize)) return false;
    if (!['low', 'medium', 'high'].includes(prefs.prefetchAggressiveness)) return false;

    // Validate booleans
    const booleanFields = [
      'prefetchEnabled', 'showExamples', 'showUsage', 
      'showSynonyms', 'showAntonyms', 'historyEnabled',
      'keyboardShortcutsEnabled'
    ];
    
    for (const field of booleanFields) {
      if (field in prefs && typeof prefs[field] !== 'boolean') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get default preferences
   */
  private static getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      fontSize: 'medium',
      prefetchEnabled: true,
      prefetchAggressiveness: 'medium',
      showExamples: true,
      showUsage: true,
      showSynonyms: true,
      showAntonyms: true,
      historyEnabled: true,
      keyboardShortcutsEnabled: true,
    };
  }

  /**
   * Migrate preferences to new format (for future updates)
   */
  static async migratePreferences(fromVersion: string, toVersion: string): Promise<void> {
    // This method would handle preference migrations between versions
    // For now, it's a placeholder for future use
    console.log(`Migrating preferences from ${fromVersion} to ${toVersion}`);
  }
}