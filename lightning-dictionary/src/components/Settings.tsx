import { memo, useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { historyManager } from '../utils/history-manager';
import '../styles/animations.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tab component
const SettingsTab = memo(({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`settings-tab button-press color-transition ${isActive ? 'active' : ''}`}
    style={{
      padding: '0.75rem 1.5rem',
      background: isActive ? '#333' : 'transparent',
      border: 'none',
      borderBottom: isActive ? '2px solid #4a9eff' : '2px solid transparent',
      color: isActive ? '#fff' : '#888',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.2s ease'
    }}
  >
    {label}
  </button>
));

export const Settings = memo(({ isOpen, onClose }: SettingsProps) => {
  const { settings, updateSettings, resetSettings, isSaving } = useSettings();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'cache' | 'privacy' | 'ai' | 'advanced'>('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { containerRef } = useKeyboardNavigation({
    onEscape: onClose,
    enableFocusTrap: true
  });

  // Sync privacy mode with history manager
  useEffect(() => {
    if (settings.privacy) {
      historyManager.setPrivacyMode(settings.privacy.privacyMode);
    }
  }, [settings.privacy?.privacyMode]);

  if (!isOpen) return null;

  return (
    <div className="settings-overlay animate-fade-in" onClick={onClose}>
      <div 
        ref={containerRef}
        className="settings-container animate-slide-up hardware-accelerated"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Settings</h2>
          <button
            onClick={onClose}
            className="button-press"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #333',
          padding: '0 1.5rem'
        }}>
          <SettingsTab label="General" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
          <SettingsTab label="Appearance" isActive={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
          <SettingsTab label="Cache" isActive={activeTab === 'cache'} onClick={() => setActiveTab('cache')} />
          <SettingsTab label="Privacy" isActive={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} />
          <SettingsTab label="AI" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <SettingsTab label="Advanced" isActive={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} />
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="animate-fade-in">
              <h3 style={{ marginTop: 0 }}>Hotkeys</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={settings.hotkey.enabled}
                  onChange={(e) => updateSettings('hotkey', { enabled: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable global hotkeys
              </label>

              <div style={{ marginBottom: '1.5rem', opacity: settings.hotkey.enabled ? 1 : 0.5 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Primary hotkey:
                </label>
                <input
                  type="text"
                  value={settings.hotkey.primary}
                  onChange={(e) => updateSettings('hotkey', { primary: e.target.value })}
                  disabled={!settings.hotkey.enabled}
                  style={{
                    width: '200px',
                    padding: '0.5rem',
                    background: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
              </div>

              <h3>Behavior</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.behavior.closeOnClickOutside}
                  onChange={(e) => updateSettings('behavior', { closeOnClickOutside: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Close popup when clicking outside
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.behavior.showFrequency}
                  onChange={(e) => updateSettings('behavior', { showFrequency: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Show word frequency rank
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.behavior.autoSearch}
                  onChange={(e) => updateSettings('behavior', { autoSearch: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Auto-search while typing
              </label>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="animate-fade-in">
              <h3 style={{ marginTop: 0 }}>Theme</h3>
              
              <select
                value={settings.appearance.theme}
                onChange={(e) => updateSettings('appearance', { theme: e.target.value as any })}
                style={{
                  width: '200px',
                  padding: '0.5rem',
                  background: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  marginBottom: '1.5rem'
                }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>

              <h3>Font Size</h3>
              
              <select
                value={settings.appearance.fontSize}
                onChange={(e) => updateSettings('appearance', { fontSize: e.target.value as any })}
                style={{
                  width: '200px',
                  padding: '0.5rem',
                  background: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  marginBottom: '1.5rem'
                }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>

              <h3>Animations</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.appearance.animations}
                  onChange={(e) => updateSettings('appearance', { animations: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable animations
              </label>

              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.appearance.reducedMotion}
                  onChange={(e) => updateSettings('appearance', { reducedMotion: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Reduce motion (accessibility)
              </label>
            </div>
          )}

          {/* Cache Tab */}
          {activeTab === 'cache' && (
            <div className="animate-fade-in">
              <h3 style={{ marginTop: 0 }}>Cache Settings</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Maximum cache size (words):
                </label>
                <input
                  type="number"
                  value={settings.cache.maxSize}
                  onChange={(e) => updateSettings('cache', { maxSize: parseInt(e.target.value) || 1000 })}
                  min="100"
                  max="50000"
                  style={{
                    width: '200px',
                    padding: '0.5rem',
                    background: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.cache.clearOnExit}
                  onChange={(e) => updateSettings('cache', { clearOnExit: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Clear cache on exit
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.cache.preloadCommon}
                  onChange={(e) => updateSettings('cache', { preloadCommon: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Preload common words on startup
              </label>

              <h3>Intelligent Prefetch</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.cache.enablePrefetch ?? true}
                  onChange={(e) => updateSettings('cache', { enablePrefetch: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable intelligent word prefetching
              </label>

              <div style={{ opacity: settings.cache.enablePrefetch ?? true ? 1 : 0.5 }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Prefetch aggressiveness:
                  </label>
                  <select
                    value={settings.cache.prefetchPriority ?? 'medium'}
                    onChange={(e) => updateSettings('cache', { prefetchPriority: e.target.value as any })}
                    disabled={!(settings.cache.enablePrefetch ?? true)}
                    style={{
                      width: '200px',
                      padding: '0.5rem',
                      background: '#2a2a2a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  >
                    <option value="low">Conservative (fewer prefetches)</option>
                    <option value="medium">Balanced</option>
                    <option value="high">Aggressive (more prefetches)</option>
                  </select>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.cache.prefetchUseWorker ?? false}
                    onChange={(e) => updateSettings('cache', { prefetchUseWorker: e.target.checked })}
                    disabled={!(settings.cache.enablePrefetch ?? true)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Use background worker for prefetch (experimental)
                </label>

                <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.5rem' }}>
                  Prefetch learns from your lookup patterns to predict and cache words you're likely to need next, 
                  improving response time.
                </p>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="animate-fade-in">
              <h3 style={{ marginTop: 0 }}>History Settings</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.privacy?.enableHistory ?? true}
                  onChange={(e) => updateSettings('privacy', { enableHistory: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable word lookup history
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.privacy?.privacyMode ?? false}
                  onChange={(e) => updateSettings('privacy', { privacyMode: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Privacy mode (disable all tracking)
              </label>

              <div style={{ opacity: settings.privacy?.enableHistory && !settings.privacy?.privacyMode ? 1 : 0.5, marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.privacy?.syncHistory ?? true}
                    onChange={(e) => updateSettings('privacy', { syncHistory: e.target.checked })}
                    disabled={!settings.privacy?.enableHistory || settings.privacy?.privacyMode}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Sync history across devices (when logged in)
                </label>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Auto-clear history after:
                  </label>
                  <select
                    value={settings.privacy?.autoClearAfter ?? 'never'}
                    onChange={(e) => updateSettings('privacy', { autoClearAfter: e.target.value })}
                    disabled={!settings.privacy?.enableHistory || settings.privacy?.privacyMode}
                    style={{
                      width: '200px',
                      padding: '0.5rem',
                      background: '#2a2a2a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  >
                    <option value="never">Never</option>
                    <option value="day">1 Day</option>
                    <option value="week">1 Week</option>
                    <option value="month">1 Month</option>
                    <option value="year">1 Year</option>
                  </select>
                </div>
              </div>

              <h3>Data Collection</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.privacy?.allowAnalytics ?? false}
                  onChange={(e) => updateSettings('privacy', { allowAnalytics: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Allow anonymous usage analytics
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.privacy?.allowCrashReports ?? true}
                  onChange={(e) => updateSettings('privacy', { allowCrashReports: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Send crash reports
              </label>

              <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '1rem' }}>
                Your privacy is important to us. We never share your personal data with third parties.
                All data is encrypted and stored securely.
              </p>

              <h3>Data Management</h3>
              
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to clear all history?')) {
                    await historyManager.clearHistory();
                    alert('History cleared successfully');
                  }
                }}
                className="button-press color-transition"
                style={{
                  background: '#8b0000',
                  border: 'none',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                  marginRight: '0.5rem'
                }}
              >
                Clear All History
              </button>

              <button
                onClick={async () => {
                  try {
                    const data = await historyManager.exportHistory('json');
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `word-history-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Failed to export data:', err);
                    alert('Failed to export data');
                  }
                }}
                className="button-press color-transition"
                style={{
                  background: '#444',
                  border: 'none',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '0.5rem'
                }}
              >
                Export My Data
              </button>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div className="animate-fade-in">
              <h3 style={{ marginTop: 0 }}>AI Enhancement</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={settings.ai?.enabled ?? false}
                  onChange={(e) => updateSettings('ai', { enabled: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable AI-enhanced features
              </label>

              <div style={{ opacity: settings.ai?.enabled ? 1 : 0.5 }}>
                <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>AI Features</h4>
                
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.features.contextualDefinitions ?? true}
                    onChange={(e) => updateSettings('ai', { 
                      features: { ...settings.ai?.features, contextualDefinitions: e.target.checked }
                    })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Contextual definitions based on sentence
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.features.smartSummaries ?? true}
                    onChange={(e) => updateSettings('ai', { 
                      features: { ...settings.ai?.features, smartSummaries: e.target.checked }
                    })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Smart word summaries
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.features.etymologyInsights ?? true}
                    onChange={(e) => updateSettings('ai', { 
                      features: { ...settings.ai?.features, etymologyInsights: e.target.checked }
                    })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Etymology insights
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.features.difficultyAssessment ?? true}
                    onChange={(e) => updateSettings('ai', { 
                      features: { ...settings.ai?.features, difficultyAssessment: e.target.checked }
                    })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Word difficulty assessment
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.features.usageExamples ?? true}
                    onChange={(e) => updateSettings('ai', { 
                      features: { ...settings.ai?.features, usageExamples: e.target.checked }
                    })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  AI-generated usage examples
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.features.relatedConcepts ?? true}
                    onChange={(e) => updateSettings('ai', { 
                      features: { ...settings.ai?.features, relatedConcepts: e.target.checked }
                    })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Related concepts discovery
                </label>

                <h4 style={{ marginBottom: '0.5rem' }}>AI Provider</h4>
                
                <select
                  value={settings.ai?.provider ?? 'mock'}
                  onChange={(e) => updateSettings('ai', { provider: e.target.value as any })}
                  disabled={!settings.ai?.enabled}
                  style={{
                    width: '200px',
                    padding: '0.5rem',
                    background: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    marginBottom: '1rem'
                  }}
                >
                  <option value="mock">Mock (Development)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="deepseek">DeepSeek</option>
                </select>

                {settings.ai?.provider !== 'mock' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      API Key:
                    </label>
                    <input
                      type="password"
                      value={settings.ai?.apiKey ?? ''}
                      onChange={(e) => updateSettings('ai', { apiKey: e.target.value })}
                      disabled={!settings.ai?.enabled}
                      placeholder="Enter your API key"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                    />
                  </div>
                )}

                <h4 style={{ marginBottom: '0.5rem' }}>Options</h4>
                
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.useFallback ?? true}
                    onChange={(e) => updateSettings('ai', { useFallback: e.target.checked })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Use fallback when AI unavailable
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.cacheResults ?? true}
                    onChange={(e) => updateSettings('ai', { cacheResults: e.target.checked })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Cache AI results for performance
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.showConfidence ?? true}
                    onChange={(e) => updateSettings('ai', { showConfidence: e.target.checked })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Show AI confidence levels
                </label>

                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={settings.ai?.autoEnhance ?? false}
                    onChange={(e) => updateSettings('ai', { autoEnhance: e.target.checked })}
                    disabled={!settings.ai?.enabled}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Auto-enhance all definitions
                </label>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Monthly cost limit ($):
                  </label>
                  <input
                    type="number"
                    value={settings.ai?.maxCostPerMonth ?? 10}
                    onChange={(e) => updateSettings('ai', { maxCostPerMonth: parseFloat(e.target.value) || 0 })}
                    disabled={!settings.ai?.enabled}
                    min="0"
                    max="100"
                    step="0.5"
                    style={{
                      width: '100px',
                      padding: '0.5rem',
                      background: '#2a2a2a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  />
                </div>

                <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '1rem' }}>
                  AI features enhance dictionary lookups with contextual understanding, smart summaries, 
                  and intelligent insights. Currently in preview mode with mock responses.
                </p>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="animate-fade-in">
              <h3 style={{ marginTop: 0 }}>Performance</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.performance.enableMetrics}
                  onChange={(e) => updateSettings('performance', { enableMetrics: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Enable performance metrics
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.performance.gpuAcceleration}
                  onChange={(e) => updateSettings('performance', { gpuAcceleration: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Hardware acceleration
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings.performance.lowPowerMode}
                  onChange={(e) => updateSettings('performance', { lowPowerMode: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Low power mode (reduces animations)
              </label>

              <h3>Reset</h3>
              
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="button-press color-transition"
                  style={{
                    background: '#8b0000',
                    border: 'none',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Reset to Defaults
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#ff6b6b' }}>Are you sure?</span>
                  <button
                    onClick={() => {
                      resetSettings();
                      setShowResetConfirm(false);
                    }}
                    className="button-press"
                    style={{
                      background: '#8b0000',
                      border: 'none',
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="button-press"
                    style={{
                      background: '#444',
                      border: 'none',
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            {isSaving ? 'Saving...' : 'Changes are saved automatically'}
          </span>
          <button
            onClick={onClose}
            className="button-press color-transition"
            style={{
              background: '#4a9eff',
              border: 'none',
              color: '#fff',
              padding: '0.5rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
});

Settings.displayName = 'Settings';