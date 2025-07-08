import { memo, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
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
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'cache' | 'advanced'>('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { containerRef } = useKeyboardNavigation({
    onEscape: onClose,
    enableFocusTrap: true
  });

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

              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={settings.cache.preloadCommon}
                  onChange={(e) => updateSettings('cache', { preloadCommon: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Preload common words on startup
              </label>
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