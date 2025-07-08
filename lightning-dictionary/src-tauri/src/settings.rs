use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub hotkey: HotkeySettings,
    pub appearance: AppearanceSettings,
    pub cache: CacheSettings,
    pub behavior: BehaviorSettings,
    pub performance: PerformanceSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeySettings {
    pub enabled: bool,
    pub primary: String,
    pub secondary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    pub theme: String,
    pub font_size: String,
    pub animations: bool,
    pub reduced_motion: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheSettings {
    pub max_size: usize,
    pub clear_on_exit: bool,
    pub preload_common: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorSettings {
    pub close_on_click_outside: bool,
    pub close_on_escape: bool,
    pub copy_on_select: bool,
    pub show_frequency: bool,
    pub auto_search: bool,
    pub search_delay: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSettings {
    pub enable_metrics: bool,
    pub low_power_mode: bool,
    pub gpu_acceleration: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            hotkey: HotkeySettings {
                enabled: true,
                primary: "Alt+J".to_string(),
                secondary: "Ctrl+Shift+D".to_string(),
            },
            appearance: AppearanceSettings {
                theme: "dark".to_string(),
                font_size: "medium".to_string(),
                animations: true,
                reduced_motion: false,
            },
            cache: CacheSettings {
                max_size: 10_000,
                clear_on_exit: false,
                preload_common: true,
            },
            behavior: BehaviorSettings {
                close_on_click_outside: true,
                close_on_escape: true,
                copy_on_select: false,
                show_frequency: true,
                auto_search: true,
                search_delay: 300,
            },
            performance: PerformanceSettings {
                enable_metrics: true,
                low_power_mode: false,
                gpu_acceleration: true,
            },
        }
    }
}

pub struct SettingsManager {
    settings_path: PathBuf,
    current_settings: Settings,
}

impl SettingsManager {
    pub fn new(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let app_dir = app_handle.path()
            .app_config_dir()
            .map_err(|_| "Failed to get app config directory")?;
        
        // Create directory if it doesn't exist
        fs::create_dir_all(&app_dir)?;
        
        let settings_path = app_dir.join("settings.json");
        
        // Load existing settings or use defaults
        let current_settings = if settings_path.exists() {
            let contents = fs::read_to_string(&settings_path)?;
            serde_json::from_str(&contents).unwrap_or_default()
        } else {
            Settings::default()
        };
        
        Ok(Self {
            settings_path,
            current_settings,
        })
    }
    
    pub fn get_settings(&self) -> &Settings {
        &self.current_settings
    }
    
    pub fn save_settings(&mut self, settings_json: &str) -> Result<(), Box<dyn std::error::Error>> {
        // Parse and validate settings
        let new_settings: Settings = serde_json::from_str(settings_json)?;
        
        // Save to file
        let contents = serde_json::to_string_pretty(&new_settings)?;
        fs::write(&self.settings_path, contents)?;
        
        // Update current settings
        self.current_settings = new_settings;
        
        Ok(())
    }
    
    pub fn get_settings_json(&self) -> Result<String, Box<dyn std::error::Error>> {
        Ok(serde_json::to_string(&self.current_settings)?)
    }
}

// Tauri commands
#[tauri::command]
pub fn get_settings(app_handle: AppHandle) -> Result<String, String> {
    let manager = SettingsManager::new(&app_handle)
        .map_err(|e| e.to_string())?;
    
    manager.get_settings_json()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_settings(app_handle: AppHandle, settings: String) -> Result<(), String> {
    let mut manager = SettingsManager::new(&app_handle)
        .map_err(|e| e.to_string())?;
    
    manager.save_settings(&settings)
        .map_err(|e| e.to_string())
}