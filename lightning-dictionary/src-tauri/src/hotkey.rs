// src-tauri/src/hotkey.rs
use global_hotkey::{GlobalHotKeyManager, HotKey, KeyCode, Modifiers};

pub fn setup_hotkey() -> Result<(), Box<dyn std::error::Error>> {
    let manager = GlobalHotKeyManager::new()?;
    let hotkey = HotKey::new(
        Modifiers::ALT,    // Changed from CONTROL
        KeyCode::KeyJ      // Changed from KeyD
    );
    
    manager.register(hotkey, || {
        // Get selected text
        // Show popup window
    })?;
    
    Ok(())
}