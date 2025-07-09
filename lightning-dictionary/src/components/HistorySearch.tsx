import React, { useState, useCallback, useEffect } from 'react';
import { useHistoryStatistics } from '../hooks/useHistory';
import './HistorySearch.css';

interface HistorySearchProps {
  onSearch: (searchTerm: string) => void;
  onDateFilterChange: (filter: 'all' | 'today' | 'week' | 'month' | 'custom') => void;
  onCustomDateRange?: (startDate: string, endDate: string) => void;
}

export const HistorySearch: React.FC<HistorySearchProps> = ({
  onSearch,
  onDateFilterChange,
  onCustomDateRange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showStatistics, setShowStatistics] = useState(false);

  const { statistics, isLoading: statsLoading } = useHistoryStatistics();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleDateFilterChange = useCallback(
    (filter: string) => {
      onDateFilterChange(filter as any);
      if (filter === 'custom') {
        setShowAdvanced(true);
      }
    },
    [onDateFilterChange]
  );

  const handleCustomDateSubmit = useCallback(() => {
    if (customStartDate && customEndDate && onCustomDateRange) {
      onCustomDateRange(customStartDate, customEndDate);
    }
  }, [customStartDate, customEndDate, onCustomDateRange]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="history-search">
      <div className="search-section">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search words, definitions, or context..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button className="clear-search" onClick={handleClearSearch}>
              ×
            </button>
          )}
        </div>

        <button
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        <button
          className="stats-toggle"
          onClick={() => setShowStatistics(!showStatistics)}
        >
          Statistics
        </button>
      </div>

      {showAdvanced && (
        <div className="advanced-options">
          <div className="date-filters">
            <h4>Date Range</h4>
            <div className="date-preset-buttons">
              <button
                className="date-preset"
                onClick={() => handleDateFilterChange('all')}
              >
                All Time
              </button>
              <button
                className="date-preset"
                onClick={() => handleDateFilterChange('today')}
              >
                Today
              </button>
              <button
                className="date-preset"
                onClick={() => handleDateFilterChange('week')}
              >
                This Week
              </button>
              <button
                className="date-preset"
                onClick={() => handleDateFilterChange('month')}
              >
                This Month
              </button>
              <button
                className="date-preset"
                onClick={() => handleDateFilterChange('custom')}
              >
                Custom Range
              </button>
            </div>

            <div className="custom-date-range">
              <div className="date-input-group">
                <label htmlFor="start-date">From:</label>
                <input
                  type="date"
                  id="start-date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label htmlFor="end-date">To:</label>
                <input
                  type="date"
                  id="end-date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                />
              </div>
              <button className="apply-date-range" onClick={handleCustomDateSubmit}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatistics && statistics && !statsLoading && (
        <div className="history-statistics">
          <h3>Your Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{statistics.totalLookups}</div>
              <div className="stat-label">Total Lookups</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{statistics.uniqueWords}</div>
              <div className="stat-label">Unique Words</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {statistics.lastLookup
                  ? new Date(statistics.lastLookup).toLocaleDateString()
                  : 'Never'}
              </div>
              <div className="stat-label">Last Lookup</div>
            </div>
          </div>

          {statistics.topWords.length > 0 && (
            <div className="top-words">
              <h4>Most Looked Up Words</h4>
              <div className="word-list">
                {statistics.topWords.slice(0, 10).map((item: any, index: number) => (
                  <div key={item.word} className="word-stat">
                    <span className="word-rank">{index + 1}.</span>
                    <span className="word-name">{item.word}</span>
                    <span className="word-count">{item.count} times</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};