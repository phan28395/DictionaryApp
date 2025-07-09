import { invoke } from '@tauri-apps/api/tauri';

export interface HistoryEntry {
  id: string;
  word: string;
  timestamp: string;
  context?: string;
  definition?: string;
  language?: string;
  userId?: string;
}

export interface HistoryFilter {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

export class HistoryManager {
  private static instance: HistoryManager;
  private localHistory: HistoryEntry[] = [];
  private maxLocalEntries = 10000;
  private syncInterval: NodeJS.Timeout | null = null;
  private isPrivacyMode = false;
  private authToken: string | null = null;

  private constructor() {
    this.loadLocalHistory();
    this.startSyncInterval();
  }

  static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager();
    }
    return HistoryManager.instance;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      this.syncWithCloud();
    }
  }

  setPrivacyMode(enabled: boolean) {
    this.isPrivacyMode = enabled;
    if (enabled) {
      this.clearLocalHistory();
    }
  }

  async addEntry(word: string, context?: string, definition?: string) {
    if (this.isPrivacyMode) {
      return;
    }

    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      word,
      timestamp: new Date().toISOString(),
      context,
      definition,
      language: 'en',
    };

    this.localHistory.unshift(entry);

    // Limit local history size
    if (this.localHistory.length > this.maxLocalEntries) {
      this.localHistory = this.localHistory.slice(0, this.maxLocalEntries);
    }

    await this.saveLocalHistory();

    // Sync to cloud if logged in
    if (this.authToken) {
      this.syncEntryToCloud(entry);
    }
  }

  async getHistory(filter?: HistoryFilter): Promise<HistoryEntry[]> {
    let history = [...this.localHistory];

    if (filter) {
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        history = history.filter(
          entry =>
            entry.word.toLowerCase().includes(term) ||
            entry.context?.toLowerCase().includes(term) ||
            entry.definition?.toLowerCase().includes(term)
        );
      }

      if (filter.startDate) {
        history = history.filter(
          entry => new Date(entry.timestamp) >= new Date(filter.startDate!)
        );
      }

      if (filter.endDate) {
        history = history.filter(
          entry => new Date(entry.timestamp) <= new Date(filter.endDate!)
        );
      }

      if (filter.language) {
        history = history.filter(entry => entry.language === filter.language);
      }

      if (filter.offset !== undefined) {
        history = history.slice(filter.offset);
      }

      if (filter.limit !== undefined) {
        history = history.slice(0, filter.limit);
      }
    }

    return history;
  }

  async exportHistory(format: 'json' | 'csv'): Promise<string> {
    const history = await this.getHistory();

    if (format === 'json') {
      return JSON.stringify(history, null, 2);
    } else {
      // CSV format
      const headers = ['ID', 'Word', 'Timestamp', 'Context', 'Definition', 'Language'];
      const rows = history.map(entry => [
        entry.id,
        entry.word,
        entry.timestamp,
        entry.context || '',
        entry.definition || '',
        entry.language || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return csvContent;
    }
  }

  async clearHistory(beforeDate?: string) {
    if (beforeDate) {
      const cutoffDate = new Date(beforeDate);
      this.localHistory = this.localHistory.filter(
        entry => new Date(entry.timestamp) >= cutoffDate
      );
    } else {
      this.localHistory = [];
    }

    await this.saveLocalHistory();

    if (this.authToken) {
      await this.clearCloudHistory(beforeDate);
    }
  }

  async getStatistics() {
    const history = await this.getHistory();
    const wordFrequency: Record<string, number> = {};
    const dailyActivity: Record<string, number> = {};

    history.forEach(entry => {
      // Word frequency
      wordFrequency[entry.word] = (wordFrequency[entry.word] || 0) + 1;

      // Daily activity
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    // Sort by frequency
    const topWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    return {
      totalLookups: history.length,
      uniqueWords: Object.keys(wordFrequency).length,
      topWords,
      dailyActivity,
      lastLookup: history[0]?.timestamp,
    };
  }

  private async loadLocalHistory() {
    try {
      const stored = localStorage.getItem('wordHistory');
      if (stored) {
        this.localHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load local history:', error);
      this.localHistory = [];
    }
  }

  private async saveLocalHistory() {
    try {
      localStorage.setItem('wordHistory', JSON.stringify(this.localHistory));
    } catch (error) {
      console.error('Failed to save local history:', error);
    }
  }

  private async clearLocalHistory() {
    this.localHistory = [];
    localStorage.removeItem('wordHistory');
  }

  private startSyncInterval() {
    // Sync every 5 minutes if logged in
    this.syncInterval = setInterval(() => {
      if (this.authToken && !this.isPrivacyMode) {
        this.syncWithCloud();
      }
    }, 5 * 60 * 1000);
  }

  private async syncEntryToCloud(entry: HistoryEntry) {
    if (!this.authToken || this.isPrivacyMode) return;

    try {
      const response = await fetch('http://localhost:3001/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ entry }),
      });

      if (!response.ok) {
        console.error('Failed to sync entry to cloud');
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }

  private async syncWithCloud() {
    if (!this.authToken || this.isPrivacyMode) return;

    try {
      // Get cloud history
      const response = await fetch('http://localhost:3001/api/history', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        const cloudHistory = await response.json();
        // Merge with local history (implementation depends on conflict resolution strategy)
        this.mergeHistories(cloudHistory);
      }
    } catch (error) {
      console.error('Error syncing with cloud:', error);
    }
  }

  private mergeHistories(cloudHistory: HistoryEntry[]) {
    // Simple merge strategy: combine and deduplicate by ID
    const historyMap = new Map<string, HistoryEntry>();

    // Add local entries
    this.localHistory.forEach(entry => {
      historyMap.set(entry.id, entry);
    });

    // Add cloud entries (will overwrite local if same ID)
    cloudHistory.forEach(entry => {
      historyMap.set(entry.id, entry);
    });

    // Convert back to array and sort by timestamp
    this.localHistory = Array.from(historyMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit size
    if (this.localHistory.length > this.maxLocalEntries) {
      this.localHistory = this.localHistory.slice(0, this.maxLocalEntries);
    }

    this.saveLocalHistory();
  }

  private async clearCloudHistory(beforeDate?: string) {
    if (!this.authToken) return;

    try {
      const url = beforeDate
        ? `http://localhost:3001/api/history?beforeDate=${beforeDate}`
        : 'http://localhost:3001/api/history';

      await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });
    } catch (error) {
      console.error('Error clearing cloud history:', error);
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const historyManager = HistoryManager.getInstance();