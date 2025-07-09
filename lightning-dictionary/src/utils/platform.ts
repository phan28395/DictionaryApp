/**
 * Platform detection and platform-specific utilities
 */

export type Platform = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'windows';
  }
  
  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'macos';
  }
  
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }
  
  return 'unknown';
}

/**
 * Get platform-specific keyboard shortcuts
 */
export function getPlatformShortcuts() {
  const platform = detectPlatform();
  
  const shortcuts = {
    windows: {
      openDictionary: 'Ctrl+Shift+D',
      searchFocus: 'Ctrl+K',
      historyBack: 'Alt+Left',
      historyForward: 'Alt+Right',
      settings: 'Ctrl+,',
      close: 'Alt+F4',
      copy: 'Ctrl+C',
      paste: 'Ctrl+V',
      selectAll: 'Ctrl+A'
    },
    macos: {
      openDictionary: '⌘+Shift+D',
      searchFocus: '⌘+K',
      historyBack: '⌘+[',
      historyForward: '⌘+]',
      settings: '⌘+,',
      close: '⌘+W',
      copy: '⌘+C',
      paste: '⌘+V',
      selectAll: '⌘+A'
    },
    linux: {
      openDictionary: 'Ctrl+Shift+D',
      searchFocus: 'Ctrl+K',
      historyBack: 'Alt+Left',
      historyForward: 'Alt+Right',
      settings: 'Ctrl+,',
      close: 'Ctrl+Q',
      copy: 'Ctrl+C',
      paste: 'Ctrl+V',
      selectAll: 'Ctrl+A'
    },
    unknown: {
      openDictionary: 'Ctrl+Shift+D',
      searchFocus: 'Ctrl+K',
      historyBack: 'Alt+Left',
      historyForward: 'Alt+Right',
      settings: 'Ctrl+,',
      close: 'Ctrl+W',
      copy: 'Ctrl+C',
      paste: 'Ctrl+V',
      selectAll: 'Ctrl+A'
    }
  };
  
  return shortcuts[platform];
}

/**
 * Get platform-specific modifier key name
 */
export function getModifierKeyName(): string {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'macos':
      return 'Cmd';
    case 'windows':
    case 'linux':
    default:
      return 'Ctrl';
  }
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  const platform = detectPlatform();
  
  if (platform === 'macos') {
    return shortcut
      .replace(/Cmd/g, '⌘')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/Ctrl/g, '⌃');
  }
  
  return shortcut;
}

/**
 * Check if platform supports specific features
 */
export function platformSupports(feature: string): boolean {
  const platform = detectPlatform();
  
  const featureSupport = {
    transparency: ['macos', 'windows'].includes(platform),
    systemTray: true, // All platforms support system tray
    touchBar: platform === 'macos',
    notifications: true,
    globalShortcuts: true,
    autoStart: true,
    fileAssociations: true
  };
  
  return featureSupport[feature as keyof typeof featureSupport] ?? false;
}

/**
 * Get platform-specific font stack
 */
export function getPlatformFontStack(): string {
  const platform = detectPlatform();
  
  const fonts = {
    windows: '"Segoe UI", system-ui, -apple-system, sans-serif',
    macos: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    linux: '"Ubuntu", "Noto Sans", "DejaVu Sans", system-ui, sans-serif',
    unknown: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  };
  
  return fonts[platform];
}

/**
 * Apply platform-specific styles
 */
export function applyPlatformStyles(): void {
  const platform = detectPlatform();
  const root = document.documentElement;
  
  // Add platform class to root element
  root.classList.add(`platform-${platform}`);
  
  // Apply platform-specific CSS variables
  root.style.setProperty('--platform-font-stack', getPlatformFontStack());
  
  // Platform-specific adjustments
  if (platform === 'macos') {
    root.style.setProperty('--titlebar-height', '28px');
    root.style.setProperty('--window-controls-width', '70px');
  } else if (platform === 'windows') {
    root.style.setProperty('--titlebar-height', '32px');
    root.style.setProperty('--window-controls-width', '138px');
  } else {
    root.style.setProperty('--titlebar-height', '32px');
    root.style.setProperty('--window-controls-width', '120px');
  }
}