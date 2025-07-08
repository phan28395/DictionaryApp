use tauri::{AppHandle, Manager, Runtime, Emitter, WebviewUrl, WebviewWindowBuilder};
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
    
    // Create or show popup window
    create_popup_window(app);
    
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
                                
                                // Create popup window first
                                create_popup_window(&app_handle);
                                
                                // Check cache
                                let mut cache_guard = cache.lock().unwrap();
                                if let Some(definition) = cache_guard.get(&current) {
                                    println!("Cache hit for clipboard word!");
                                    let _ = app_handle.emit("word-definition", serde_json::json!({
                                        "word": current,
                                        "definition": definition,
                                        "from_cache": true,
                                        "lookup_time_ms": 0
                                    }));
                                } else {
                                    println!("Cache miss for clipboard word: {}", current);
                                    let _ = app_handle.emit("word-definition", serde_json::json!({
                                        "word": current,
                                        "definition": null,
                                        "from_cache": false,
                                        "lookup_time_ms": 0
                                    }));
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

fn create_popup_window<R: Runtime>(app: &AppHandle<R>) {
    // Check if popup window already exists
    if let Some(window) = app.get_webview_window("popup") {
        println!("Popup window already exists, showing it");
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }
    
    println!("Creating new popup window");
    
    // Safety check: Don't create popup window if we're just starting up
    // This prevents accidental popup creation during development
    static STARTUP_DELAY: std::sync::Once = std::sync::Once::new();
    static mut STARTUP_COMPLETE: bool = false;
    
    STARTUP_DELAY.call_once(|| {
        std::thread::spawn(|| {
            std::thread::sleep(std::time::Duration::from_secs(2));
            unsafe { STARTUP_COMPLETE = true; }
        });
    });
    
    unsafe {
        if !STARTUP_COMPLETE {
            println!("Skipping popup creation during startup phase");
            return;
        }
    }
    
    // Get cursor position
    let (cursor_x, cursor_y) = get_cursor_position();
    
    // Popup dimensions
    let popup_width = 400.0;
    let popup_height = 300.0;
    
    // Calculate position near cursor (offset to avoid overlapping)
    let offset_x = 20.0;
    let offset_y = 20.0;
    let position_x = cursor_x + offset_x;
    let position_y = cursor_y + offset_y;
    
    // Get primary monitor to ensure popup stays on screen
    if let Some(primary_monitor) = app.primary_monitor().ok().flatten() {
        let monitor_size = primary_monitor.size();
        let monitor_pos = primary_monitor.position();
        
        // Adjust position if popup would go off screen
        let adjusted_x = if position_x + popup_width > (monitor_pos.x as f64 + monitor_size.width as f64) {
            cursor_x - popup_width - offset_x
        } else {
            position_x
        };
        
        let adjusted_y = if position_y + popup_height > (monitor_pos.y as f64 + monitor_size.height as f64) {
            cursor_y - popup_height - offset_y
        } else {
            position_y
        };
        
        let window = WebviewWindowBuilder::new(
            app,
            "popup",
            WebviewUrl::App("/popup.html".into())
        )
        .title("Lightning Dictionary")
        .decorations(true)  // Show window decorations so user can close
        .always_on_top(true)
        .skip_taskbar(true)
        .inner_size(popup_width, popup_height)
        .position(adjusted_x, adjusted_y)
        .resizable(true)  // Allow resizing
        .closable(true)  // Ensure window can be closed
        .focused(true)    // Give focus to window
        .build();
        
        match window {
            Ok(window) => {
                println!("Popup window created successfully at ({}, {})", adjusted_x, adjusted_y);
                let _ = window.show();
                let _ = window.set_focus();
            }
            Err(e) => {
                eprintln!("Failed to create popup window: {}", e);
            }
        }
    } else {
        // Fallback if we can't get monitor info
        let window = WebviewWindowBuilder::new(
            app,
            "popup",
            WebviewUrl::App("/popup.html".into())
        )
        .title("Lightning Dictionary")
        .decorations(true)  // Show window decorations so user can close
        .always_on_top(true)
        .skip_taskbar(true)
        .inner_size(popup_width, popup_height)
        .position(position_x, position_y)
        .resizable(true)  // Allow resizing
        .closable(true)  // Ensure window can be closed
        .focused(true)    // Give focus to window
        .build();
        
        match window {
            Ok(window) => {
                println!("Popup window created successfully");
                let _ = window.show();
                let _ = window.set_focus();
            }
            Err(e) => {
                eprintln!("Failed to create popup window: {}", e);
            }
        }
    }
}

fn get_cursor_position() -> (f64, f64) {
    // Try to get cursor position using platform-specific methods
    #[cfg(target_os = "linux")]
    {
        // Try using xdotool to get cursor position
        use std::process::Command;
        if let Ok(output) = Command::new("xdotool")
            .args(&["getmouselocation", "--shell"])
            .output() {
            if let Ok(text) = String::from_utf8(output.stdout) {
                let mut x = 0.0;
                let mut y = 0.0;
                for line in text.lines() {
                    if line.starts_with("X=") {
                        if let Ok(val) = line[2..].parse::<f64>() {
                            x = val;
                        }
                    } else if line.starts_with("Y=") {
                        if let Ok(val) = line[2..].parse::<f64>() {
                            y = val;
                        }
                    }
                }
                return (x, y);
            }
        }
    }
    
    // Fallback position if we can't get cursor position
    (100.0, 100.0)
}