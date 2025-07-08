mod hotkey_v2;
mod cache;
mod api_client;
mod dictionary;
mod error;
mod performance;
mod settings;

#[cfg(test)]
mod cache_benchmark;

use hotkey_v2::HotkeyManager;
use cache::{create_cache, ThreadSafeCache, Definition};
use dictionary::DictionaryService;
use performance::{PERF_TRACKER, PerformanceStats};
use settings::{get_settings, save_settings};
use std::sync::Arc;
use serde::Serialize;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Serialize)]
struct LookupResult {
    success: bool,
    data: Option<Definition>,
    error: Option<String>,
}

#[tauri::command]
fn lookup_word(word: &str, state: tauri::State<AppState>) -> LookupResult {
    match state.dictionary_service.lookup_word(word) {
        Ok(definition) => LookupResult {
            success: true,
            data: Some(definition),
            error: None,
        },
        Err(e) => LookupResult {
            success: false,
            data: None,
            error: Some(e.user_message()),
        }
    }
}

#[tauri::command]
fn cache_stats(state: tauri::State<AppState>) -> String {
    let cache = state.cache.lock().unwrap();
    let stats = cache.get_stats();
    serde_json::to_string(&stats).unwrap_or_else(|_| "{}".to_string())
}

#[derive(Serialize)]
struct SearchResult {
    success: bool,
    data: Vec<String>,
    error: Option<String>,
}

#[tauri::command]
fn search_words(query: &str, state: tauri::State<AppState>) -> SearchResult {
    match state.dictionary_service.search_words(query) {
        Ok(results) => SearchResult {
            success: true,
            data: results,
            error: None,
        },
        Err(e) => SearchResult {
            success: false,
            data: vec![],
            error: Some(e.user_message()),
        }
    }
}

#[tauri::command]
fn get_performance_stats() -> PerformanceStats {
    PERF_TRACKER.get_stats()
}

#[tauri::command]
fn reset_performance_stats() {
    PERF_TRACKER.reset();
}

struct AppState {
    cache: ThreadSafeCache,
    dictionary_service: Arc<DictionaryService>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize tokio runtime for async operations
    let runtime = tokio::runtime::Runtime::new().expect("Failed to create tokio runtime");
    
    // Create cache with 10,000 word capacity
    let cache = create_cache(10_000);
    
    // Enter runtime context for DictionaryService
    let _guard = runtime.enter();
    
    // Create dictionary service with API client
    let api_base_url = std::env::var("DICTIONARY_API_URL")
        .unwrap_or_else(|_| "http://localhost:3001".to_string());
    let dictionary_service = Arc::new(DictionaryService::new(cache.clone(), api_base_url));
    
    let app_state = AppState {
        cache: cache.clone(),
        dictionary_service,
    };
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![greet, lookup_word, cache_stats, search_words, get_performance_stats, reset_performance_stats, get_settings, save_settings])
        .setup(move |app| {
            // Get the app handle and then the state
            let handle = app.handle();
            let dict_service = handle.state::<AppState>().dictionary_service.clone();
            
            // Setup hotkey manager with dictionary service
            match HotkeyManager::setup(app, dict_service) {
                Ok(_) => println!("Hotkey manager setup successfully"),
                Err(e) => eprintln!("Failed to setup hotkey manager: {}", e),
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
