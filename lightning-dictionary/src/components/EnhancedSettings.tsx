import { memo, useState, useRef } from 'react';
import { usePreferences } from '../hooks/usePreferences';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { DEFAULT_PROFILES } from '../types/user-preferences';
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

export const EnhancedSettings = memo(({ isOpen, onClose }: SettingsProps) => {
  const {
    preferences,
    profiles,
    activeProfile,
    isSaving,
    updatePreferences,
    createProfile,
    deleteProfile,
    applyProfile,
    applyPreset,
    resetToDefaults,
    downloadPreferences,
    uploadPreferences,
  } = usePreferences();

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'cache' | 'advanced' | 'profiles'>('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { containerRef } = useKeyboardNavigation({
    onEscape: onClose,
    enableFocusTrap: true
  });

  if (!isOpen) return null;

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadPreferences(file);
        setShowImportDialog(false);
      } catch (error) {
        alert('Failed to import preferences: ' + error);
      }
    }
  };

  const handleExport = () => {
    const filename = `dictionary-preferences-${new Date().toISOString().split('T')[0]}.json`;
    downloadPreferences(filename);
  };

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      createProfile(newProfileName.trim(), `Created on ${new Date().toLocaleDateString()}`);
      setNewProfileName('');
      setShowCreateProfile(false);
    }
  };

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
          maxWidth: '700px',
          maxHeight: '85vh',
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isSaving && <span style={{ color: '#4a9eff', fontSize: '0.8rem' }}>Saving...</span>}
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
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #333',
          padding: '0 1.5rem',
          overflowX: 'auto'
        }}>
          <SettingsTab label="General" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
          <SettingsTab label="Appearance" isActive={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
          <SettingsTab label="Cache" isActive={activeTab === 'cache'} onClick={() => setActiveTab('cache')} />
          <SettingsTab label="Profiles" isActive={activeTab === 'profiles'} onClick={() => setActiveTab('profiles')} />
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
            <div className="settings-section animate-fade-in">
              <h3>Hotkeys</h3>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.hotkeyEnabled}
                  onChange={(e) => updatePreferences({ hotkeyEnabled: e.target.checked })}
                />
                Enable global hotkeys
              </label>
              
              <h3>Behavior</h3>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.closeOnClickOutside}
                  onChange={(e) => updatePreferences({ closeOnClickOutside: e.target.checked })}
                />
                Close popup when clicking outside
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.closeOnEscape}
                  onChange={(e) => updatePreferences({ closeOnEscape: e.target.checked })}
                />
                Close popup on Escape key
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.copyOnSelect}
                  onChange={(e) => updatePreferences({ copyOnSelect: e.target.checked })}
                />
                Copy text on selection
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.historyEnabled}
                  onChange={(e) => updatePreferences({ historyEnabled: e.target.checked })}
                />
                Track word lookup history
              </label>
              
              <h3>Display Options</h3>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.showExamples}
                  onChange={(e) => updatePreferences({ showExamples: e.target.checked })}
                />
                Show usage examples
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.showSynonyms}
                  onChange={(e) => updatePreferences({ showSynonyms: e.target.checked })}
                />
                Show synonyms
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.showAntonyms}
                  onChange={(e) => updatePreferences({ showAntonyms: e.target.checked })}
                />
                Show antonyms
              </label>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="settings-section animate-fade-in">
              <h3>Theme</h3>
              <select 
                value={preferences.theme}
                onChange={(e) => updatePreferences({ theme: e.target.value as any })}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              
              <h3>Font Size</h3>
              <select 
                value={preferences.fontSize}
                onChange={(e) => updatePreferences({ fontSize: e.target.value as any })}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              
              <h3>Animations</h3>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.animations}
                  onChange={(e) => updatePreferences({ animations: e.target.checked })}
                />
                Enable animations
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.reduceMotion}
                  onChange={(e) => updatePreferences({ reduceMotion: e.target.checked })}
                />
                Reduce motion (for accessibility)
              </label>
            </div>
          )}

          {/* Cache Tab */}
          {activeTab === 'cache' && (
            <div className="settings-section animate-fade-in">
              <h3>Cache Settings</h3>
              <label>
                Cache size (words):
                <input
                  type="number"
                  value={preferences.cacheSize}
                  onChange={(e) => updatePreferences({ cacheSize: parseInt(e.target.value) || 10000 })}
                  min="1000"
                  max="50000"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </label>
              
              <h3>Prefetch</h3>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.prefetchEnabled}
                  onChange={(e) => updatePreferences({ prefetchEnabled: e.target.checked })}
                />
                Enable intelligent prefetching
              </label>
              
              {preferences.prefetchEnabled && (
                <label>
                  Prefetch aggressiveness:
                  <select 
                    value={preferences.prefetchAggressiveness}
                    onChange={(e) => updatePreferences({ prefetchAggressiveness: e.target.value as any })}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                  >
                    <option value="low">Low (Conservative)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Aggressive)</option>
                  </select>
                </label>
              )}
            </div>
          )}

          {/* Profiles Tab */}
          {activeTab === 'profiles' && (
            <div className="settings-section animate-fade-in">
              <h3>Preference Profiles</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Switch between different preference configurations
              </p>
              
              {/* Quick Presets */}
              <div style={{ marginBottom: '2rem' }}>
                <h4>Quick Presets</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => applyPreset('default')}
                    className="button-press"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => applyPreset('minimal')}
                    className="button-press"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Minimal
                  </button>
                  <button
                    onClick={() => applyPreset('powerUser')}
                    className="button-press"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Power User
                  </button>
                  <button
                    onClick={() => applyPreset('privacy')}
                    className="button-press"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#333',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Privacy Focus
                  </button>
                </div>
              </div>

              {/* Custom Profiles */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4>Custom Profiles</h4>
                  <button
                    onClick={() => setShowCreateProfile(true)}
                    className="button-press"
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: '#4a9eff',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    + New Profile
                  </button>
                </div>
                
                {showCreateProfile && (
                  <div style={{ marginBottom: '1rem', padding: '1rem', background: '#2a2a2a', borderRadius: '4px' }}>
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="Profile name"
                      style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleCreateProfile}
                        className="button-press"
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#4a9eff',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateProfile(false);
                          setNewProfileName('');
                        }}
                        className="button-press"
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#666',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {profiles.filter(p => !p.isDefault).map(profile => (
                  <div 
                    key={profile.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      background: activeProfile?.id === profile.id ? '#2a2a2a' : 'transparent',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{profile.name}</div>
                      {profile.description && (
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{profile.description}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => applyProfile(profile.id)}
                        className="button-press"
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: activeProfile?.id === profile.id ? '#4a9eff' : '#333',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {activeProfile?.id === profile.id ? 'Active' : 'Apply'}
                      </button>
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="button-press"
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#d32f2f',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="settings-section animate-fade-in">
              <h3>Performance</h3>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.lowPowerMode}
                  onChange={(e) => updatePreferences({ lowPowerMode: e.target.checked })}
                />
                Low power mode
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.enableGPUAcceleration}
                  onChange={(e) => updatePreferences({ enableGPUAcceleration: e.target.checked })}
                />
                Enable GPU acceleration
              </label>
              
              <h3>Import/Export</h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={handleExport}
                  className="button-press"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#4a9eff',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Export Preferences
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="button-press"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#666',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Import Preferences
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </div>
              
              <h3>Privacy</h3>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.analyticsEnabled}
                  onChange={(e) => updatePreferences({ analyticsEnabled: e.target.checked })}
                />
                Share anonymous usage data
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.errorReportingEnabled}
                  onChange={(e) => updatePreferences({ errorReportingEnabled: e.target.checked })}
                />
                Enable error reporting
              </label>
              
              <h3>Reset Options</h3>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="button-press"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#d32f2f',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Reset All Settings
                </button>
              ) : (
                <div style={{ 
                  padding: '1rem', 
                  background: '#2a2a2a', 
                  borderRadius: '4px',
                  border: '1px solid #d32f2f'
                }}>
                  <p style={{ marginBottom: '1rem' }}>Are you sure you want to reset all settings to defaults?</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        resetToDefaults();
                        setShowResetConfirm(false);
                      }}
                      className="button-press"
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#d32f2f',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="button-press"
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#666',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
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
          justifyContent: 'flex-end',
          gap: '0.5rem'
        }}>
          <button
            onClick={onClose}
            className="button-press"
            style={{
              padding: '0.5rem 1.5rem',
              background: '#333',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});