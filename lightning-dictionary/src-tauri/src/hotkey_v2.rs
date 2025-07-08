use tauri::{AppHandle, Manager, Runtime, Emitter};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use arboard::Clipboard;
use std::sync::{Arc, Mutex};
use crate::cache::ThreadSafeCache;
use serde_json;

pub struct HotkeyManager {
    _is_wayland: bool,
    _app_handle: Option<AppHandle>,
}

impl HotkeyManager {
    pub fn setup<R: Runtime>(app: &tauri::App<R>, cache: ThreadSafeCache) -> Result<(), Box<dyn std::error::Error>> {
        let app_handle = app.handle().clone();
        
        // Try to register global shortcuts using the official plugin
        match register_shortcuts(&app_handle, cache.clone()) {
            Ok(_) => {
                println!("✓ Global shortcuts registered successfully");
                if std::env::var("XDG_SESSION_TYPE").unwrap_or_default() == "wayland" {
                    println!("⚠️  Note: You're on Wayland. Shortcuts may not work!");
                    // Emit event to show alternative UI
                    let _ = app_handle.emit("wayland-detected", ());
                    
                    // Start clipboard monitoring as fallback
                    if let Ok(monitor) = ClipboardMonitor::new() {
                        monitor.start_monitoring(app_handle.clone(), cache.clone());
                        println!("✓ Started clipboard monitoring for Wayland");
                    }
                }
            }
            Err(e) => {
                println!("✗ Failed to register global shortcuts: {}", e);
                // Emit event to show alternative UI
                let _ = app_handle.emit("shortcut-registration-failed", e.to_string());
                
                // Start clipboard monitoring as fallback
                if let Ok(monitor) = ClipboardMonitor::new() {
                    monitor.start_monitoring(app_handle.clone(), cache.clone());
                    println!("✓ Started clipboard monitoring as fallback");
                }
            }
        }
        
        Ok(())
    }
}

fn register_shortcuts<R: Runtime>(app: &AppHandle<R>, cache: ThreadSafeCache) -> Result<(), Box<dyn std::error::Error>> {
    // Register Alt+J
    let shortcut1 = Shortcut::new(Some(Modifiers::ALT), Code::KeyJ);
    let cache1 = cache.clone();
    app.global_shortcut().on_shortcut(shortcut1.clone(), move |app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            println!("Alt+J pressed!");
            handle_hotkey_press(app, cache1.clone());
        }
    })?;
    
    // Register Ctrl+Shift+D as fallback
    let shortcut2 = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyD);
    let cache2 = cache.clone();
    app.global_shortcut().on_shortcut(shortcut2.clone(), move |app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            println!("Ctrl+Shift+D pressed!");
            handle_hotkey_press(app, cache2.clone());
        }
    })?;
    
    println!("Registered shortcuts: Alt+J and Ctrl+Shift+D");
    
    Ok(())
}

fn handle_hotkey_press<R: Runtime>(app: &AppHandle<R>, cache: ThreadSafeCache) {
    let start_time = std::time::Instant::now();
    
    // Show the window
    if let Some(window) = app.get_webview_window("main") {
        println!("Showing and focusing window");
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.set_always_on_top(true);
    }
    
    // Try to get selected text
    match get_selected_text() {
        Ok(text) if !text.is_empty() => {
            println!("Selected text: {}", text);
            
            // Check cache first
            let mut cache_guard = cache.lock().unwrap();
            if let Some(definition) = cache_guard.get(&text) {
                let lookup_time = start_time.elapsed();
                println!("Cache hit! Lookup time: {:?}", lookup_time);
                
                // Emit definition with timing info
                let _ = app.emit("word-definition", serde_json::json!({
                    "word": text,
                    "definition": definition,
                    "from_cache": true,
                    "lookup_time_ms": lookup_time.as_millis()
                }));
            } else {
                println!("Cache miss for word: {}", text);
                // For now, emit that we need to fetch from API
                let _ = app.emit("word-definition", serde_json::json!({
                    "word": text,
                    "definition": null,
                    "from_cache": false,
                    "lookup_time_ms": start_time.elapsed().as_millis()
                }));
            }
        }
        Ok(_) => {
            println!("No text selected");
            // Send empty selection event
            let _ = app.emit("no-selection", ());
        }
        Err(e) => {
            println!("Error getting selected text: {}", e);
            let _ = app.emit("selection-error", e.to_string());
        }
    }
}

fn get_selected_text() -> Result<String, Box<dyn std::error::Error>> {
    // Save current clipboard
    let mut clipboard = Clipboard::new()?;
    let original = clipboard.get_text().unwrap_or_default();
    
    // Clear clipboard
    clipboard.set_text("")?;
    
    // Send Ctrl+C
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdotool")
            .args(&["key", "ctrl+c"])
            .output()?;
        std::thread::sleep(std::time::Duration::from_millis(50));
    }
    
    // Get new clipboard content
    let selected = clipboard.get_text().unwrap_or_default();
    
    // Restore original
    if !original.is_empty() {
        let _ = clipboard.set_text(&original);
    }
    
    Ok(selected)
}

// Alternative method: Clipboard monitoring for Wayland users
pub struct ClipboardMonitor {
    clipboard: Arc<Mutex<Clipboard>>,
    last_content: Arc<Mutex<String>>,
}

impl ClipboardMonitor {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(Self {
            clipboard: Arc::new(Mutex::new(Clipboard::new()?)),
            last_content: Arc::new(Mutex::new(String::new())),
        })
    }
    
    pub fn start_monitoring<R: Runtime>(&self, app_handle: AppHandle<R>, cache: ThreadSafeCache) {
        let clipboard = self.clipboard.clone();
        let last_content = self.last_content.clone();
        
        println!("Starting clipboard monitoring thread...");
        
        std::thread::spawn(move || {
            println!("Clipboard monitor thread started");
            let mut check_count = 0;
            
            loop {
                std::thread::sleep(std::time::Duration::from_millis(500));
                check_count += 1;
                
                if check_count % 10 == 0 {
                    println!("Clipboard monitor: still running (checked {} times)", check_count);
                }
                
                if let Ok(mut clip) = clipboard.lock() {
                    if let Ok(current) = clip.get_text() {
                        let mut last = last_content.lock().unwrap();
                        
                        // Check if clipboard changed
                        if current != *last {
                            println!("Clipboard changed to: '{}'", current);
                            
                            if is_single_word(&current) {
                                println!("Valid word detected: {}", current);
                                
                                // Check cache
                                let mut cache_guard = cache.lock().unwrap();
                                if let Some(definition) = cache_guard.get(&current) {
                                    println!("Cache hit for clipboard word!");
                                    let _ = app_handle.emit("clipboard-definition", serde_json::json!({
                                        "word": current,
                                        "definition": definition,
                                        "from_cache": true
                                    }));
                                } else {
                                    println!("Cache miss for clipboard word: {}", current);
                                    let _ = app_handle.emit("clipboard-word", current.clone());
                                }
                            } else {
                                println!("Not a single word, ignoring");
                            }
                            
                            *last = current;
                        }
                    } else {
                        println!("Failed to read clipboard");
                    }
                } else {
                    println!("Failed to lock clipboard");
                }
            }
        });
        
        println!("Clipboard monitoring thread spawned");
    }
}

fn is_single_word(text: &str) -> bool {
    let trimmed = text.trim();
    !trimmed.is_empty() && 
    trimmed.split_whitespace().count() == 1 && 
    trimmed.len() < 50 &&
    trimmed.chars().all(|c| c.is_alphabetic() || c == '-' || c == '\'')
}