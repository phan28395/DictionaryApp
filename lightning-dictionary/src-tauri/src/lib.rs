mod hotkey_v2;
mod cache;

#[cfg(test)]
mod cache_benchmark;

use hotkey_v2::HotkeyManager;
use cache::{create_cache, ThreadSafeCache, Definition};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn lookup_word(word: &str, state: tauri::State<AppState>) -> Option<Definition> {
    let mut cache = state.cache.lock().unwrap();
    cache.get(word)
}

#[tauri::command]
fn cache_stats(state: tauri::State<AppState>) -> String {
    let cache = state.cache.lock().unwrap();
    let stats = cache.get_stats();
    serde_json::to_string(&stats).unwrap_or_else(|_| "{}".to_string())
}

struct AppState {
    cache: ThreadSafeCache,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Create cache with 10,000 word capacity
    let cache = create_cache(10_000);
    let app_state = AppState {
        cache: cache.clone(),
    };
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![greet, lookup_word, cache_stats])
        .setup(move |app| {
            // Setup hotkey manager with cache
            match HotkeyManager::setup(app, cache.clone()) {
                Ok(_) => println!("Hotkey manager setup successfully"),
                Err(e) => eprintln!("Failed to setup hotkey manager: {}", e),
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
