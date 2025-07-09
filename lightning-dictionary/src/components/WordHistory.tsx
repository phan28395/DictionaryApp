import React, { useState, useMemo } from 'react';
import { useHistory } from '../hooks/useHistory';
import { HistoryEntry, HistoryFilter } from '../utils/history-manager';
import { formatDistanceToNow } from 'date-fns';
import './WordHistory.css';

interface WordHistoryProps {
  onWordClick?: (word: string) => void;
  onClose?: () => void;
}

export const WordHistory: React.FC<WordHistoryProps> = ({ onWordClick, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const filter = useMemo<HistoryFilter>(() => {
    const baseFilter: HistoryFilter = {};

    if (searchTerm) {
      baseFilter.searchTerm = searchTerm;
    }

    const now = new Date();
    switch (dateFilter) {
      case 'today':
        baseFilter.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'week':
        baseFilter.startDate = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
      case 'month':
        baseFilter.startDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
    }

    return baseFilter;
  }, [searchTerm, dateFilter]);

  const { history, isLoading, error, clearHistory, exportHistory, refresh } = useHistory(
    filter,
    { autoRefresh: true, refreshInterval: 10000 }
  );

  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryEntry[]> = {};
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    history.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      let groupKey: string;

      if (entryDate >= today) {
        groupKey = 'Today';
      } else if (entryDate >= yesterday) {
        groupKey = 'Yesterday';
      } else {
        groupKey = entryDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(entry);
    });

    return groups;
  }, [history]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const data = await exportHistory(format);
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `word-history-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
    } catch (err) {
      console.error('Failed to export history:', err);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      await clearHistory();
    }
  };

  const handleWordClick = (word: string) => {
    if (onWordClick) {
      onWordClick(word);
    }
  };

  return (
    <div className="word-history">
      <div className="word-history-header">
        <h2>Word History</h2>
        <button className="close-button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="word-history-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <button
            className={`filter-button ${dateFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDateFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${dateFilter === 'today' ? 'active' : ''}`}
            onClick={() => setDateFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-button ${dateFilter === 'week' ? 'active' : ''}`}
            onClick={() => setDateFilter('week')}
          >
            This Week
          </button>
          <button
            className={`filter-button ${dateFilter === 'month' ? 'active' : ''}`}
            onClick={() => setDateFilter('month')}
          >
            This Month
          </button>
        </div>

        <div className="action-buttons">
          <button className="action-button" onClick={() => setShowExportDialog(true)}>
            Export
          </button>
          <button className="action-button" onClick={refresh}>
            Refresh
          </button>
          <button className="action-button danger" onClick={handleClearHistory}>
            Clear All
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">Loading history...</div>
      ) : (
        <div className="history-content">
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="empty-state">
              <p>No history found</p>
              <p className="empty-state-hint">
                Your word lookup history will appear here
              </p>
            </div>
          ) : (
            Object.entries(groupedHistory).map(([groupKey, entries]) => (
              <div key={groupKey} className="history-group">
                <h3 className="group-header">{groupKey}</h3>
                <div className="history-entries">
                  {entries.map(entry => (
                    <div key={entry.id} className="history-entry">
                      <div className="entry-main">
                        <button
                          className="word-link"
                          onClick={() => handleWordClick(entry.word)}
                        >
                          {entry.word}
                        </button>
                        <span className="timestamp">
                          {formatDistanceToNow(new Date(entry.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {entry.context && (
                        <div className="entry-context">{entry.context}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showExportDialog && (
        <div className="dialog-overlay" onClick={() => setShowExportDialog(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <h3>Export History</h3>
            <p>Choose export format:</p>
            <div className="dialog-buttons">
              <button className="dialog-button" onClick={() => handleExport('json')}>
                Export as JSON
              </button>
              <button className="dialog-button" onClick={() => handleExport('csv')}>
                Export as CSV
              </button>
              <button
                className="dialog-button cancel"
                onClick={() => setShowExportDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};