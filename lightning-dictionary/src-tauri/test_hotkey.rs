// Minimal test for global-hotkey crate
use global_hotkey::{GlobalHotKeyManager, hotkey::{HotKey, Code, Modifiers}};

fn main() {
    println!("Testing global-hotkey crate...");
    println!("Display server: {}", std::env::var("XDG_SESSION_TYPE").unwrap_or_default());
    
    // Try to create manager
    let manager = match GlobalHotKeyManager::new() {
        Ok(m) => {
            println!("✓ GlobalHotKeyManager created successfully");
            m
        },
        Err(e) => {
            println!("✗ Failed to create GlobalHotKeyManager: {}", e);
            return;
        }
    };
    
    // Try to register a simple hotkey
    let hotkey = HotKey::new(Some(Modifiers::ALT), Code::KeyJ);
    match manager.register(hotkey) {
        Ok(_) => println!("✓ Hotkey Alt+J registered successfully"),
        Err(e) => {
            println!("✗ Failed to register hotkey: {}", e);
            return;
        }
    }
    
    println!("\nListening for Alt+J... (Press Ctrl+C to exit)");
    
    // Listen for events
    loop {
        if let Ok(event) = global_hotkey::GlobalHotKeyEvent::receiver().recv() {
            println!("Event received: {:?}", event);
            if event.state == global_hotkey::HotKeyState::Pressed {
                println!("HOTKEY PRESSED!");
            }
        }
    }
}