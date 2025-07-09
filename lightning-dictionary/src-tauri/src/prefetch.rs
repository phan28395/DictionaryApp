use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};

use crate::dictionary::DictionaryService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrefetchRequest {
    pub words: Vec<String>,
    pub priority: PrefetchPriority,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PrefetchPriority {
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrefetchStats {
    pub total_prefetched: usize,
    pub cache_hits_from_prefetch: usize,
    pub prefetch_queue_size: usize,
    pub active_prefetches: usize,
}

pub struct PrefetchManager {
    dictionary_service: Arc<DictionaryService>,
    prefetch_queue: Arc<RwLock<VecDeque<(String, PrefetchPriority)>>>,
    active_prefetches: Arc<RwLock<HashSet<String>>>,
    stats: Arc<RwLock<PrefetchStats>>,
    max_concurrent_prefetch: usize,
    prefetch_delay_ms: u64,
}

impl PrefetchManager {
    pub fn new(dictionary_service: Arc<DictionaryService>) -> Self {
        Self {
            dictionary_service,
            prefetch_queue: Arc::new(RwLock::new(VecDeque::new())),
            active_prefetches: Arc::new(RwLock::new(HashSet::new())),
            stats: Arc::new(RwLock::new(PrefetchStats {
                total_prefetched: 0,
                cache_hits_from_prefetch: 0,
                prefetch_queue_size: 0,
                active_prefetches: 0,
            })),
            max_concurrent_prefetch: 3,
            prefetch_delay_ms: 100,
        }
    }

    /// Add words to the prefetch queue
    pub async fn queue_prefetch(&self, request: PrefetchRequest) -> Result<(), String> {
        let mut queue = self.prefetch_queue.write().await;
        
        for word in request.words {
            // Skip if already being prefetched
            let active = self.active_prefetches.read().await;
            if !active.contains(&word) {
                queue.push_back((word, request.priority.clone()));
            }
        }
        
        // Sort queue by priority
        let mut sorted_queue: Vec<_> = queue.drain(..).collect();
        sorted_queue.sort_by(|a, b| {
            match (&a.1, &b.1) {
                (PrefetchPriority::High, PrefetchPriority::High) => std::cmp::Ordering::Equal,
                (PrefetchPriority::High, _) => std::cmp::Ordering::Less,
                (_, PrefetchPriority::High) => std::cmp::Ordering::Greater,
                (PrefetchPriority::Medium, PrefetchPriority::Medium) => std::cmp::Ordering::Equal,
                (PrefetchPriority::Medium, PrefetchPriority::Low) => std::cmp::Ordering::Less,
                (PrefetchPriority::Low, PrefetchPriority::Medium) => std::cmp::Ordering::Greater,
                (PrefetchPriority::Low, PrefetchPriority::Low) => std::cmp::Ordering::Equal,
            }
        });
        
        *queue = sorted_queue.into_iter().collect();
        
        // Update stats
        let mut stats = self.stats.write().await;
        stats.prefetch_queue_size = queue.len();
        
        Ok(())
    }

    /// Start the prefetch worker
    pub async fn start_prefetch_worker(self: Arc<Self>) {
        tokio::spawn(async move {
            loop {
                self.clone().process_prefetch_queue().await;
                sleep(Duration::from_millis(self.prefetch_delay_ms)).await;
            }
        });
    }

    /// Process items from the prefetch queue
    async fn process_prefetch_queue(self: Arc<Self>) {
        let active_count = self.active_prefetches.read().await.len();
        
        if active_count >= self.max_concurrent_prefetch {
            return;
        }
        
        let available_slots = self.max_concurrent_prefetch - active_count;
        let mut words_to_prefetch = Vec::new();
        
        {
            let mut queue = self.prefetch_queue.write().await;
            for _ in 0..available_slots {
                if let Some((word, _priority)) = queue.pop_front() {
                    words_to_prefetch.push(word);
                } else {
                    break;
                }
            }
        }
        
        // Prefetch words concurrently
        let prefetch_tasks: Vec<_> = words_to_prefetch
            .into_iter()
            .map(|word| {
                let self_clone = self.clone();
                tokio::spawn(async move {
                    self_clone.prefetch_word(word).await;
                })
            })
            .collect();
        
        // Wait for all prefetch tasks to complete
        for task in prefetch_tasks {
            let _ = task.await;
        }
    }

    /// Prefetch a single word
    async fn prefetch_word(&self, word: String) {
        // Mark as active
        {
            let mut active = self.active_prefetches.write().await;
            active.insert(word.clone());
            
            let mut stats = self.stats.write().await;
            stats.active_prefetches = active.len();
        }
        
        // Use dictionary service to fetch (it handles caching internally)
        match self.dictionary_service.lookup_word(&word) {
            Ok(_definition) => {
                // Word successfully fetched and cached by dictionary service
                let mut stats = self.stats.write().await;
                stats.total_prefetched += 1;
            }
            Err(e) => {
                eprintln!("Prefetch error for word '{}': {:?}", word, e);
            }
        }
        
        // Remove from active set
        {
            let mut active = self.active_prefetches.write().await;
            active.remove(&word);
            
            let mut stats = self.stats.write().await;
            stats.active_prefetches = active.len();
        }
    }

    /// Get prefetch statistics
    pub async fn get_stats(&self) -> PrefetchStats {
        self.stats.read().await.clone()
    }

    /// Clear prefetch queue
    pub async fn clear_queue(&self) {
        let mut queue = self.prefetch_queue.write().await;
        queue.clear();
        
        let mut stats = self.stats.write().await;
        stats.prefetch_queue_size = 0;
    }

    /// Track cache hit from prefetch
    pub async fn track_cache_hit(&self, word: &str) {
        // This would be called when a word is found in cache that was prefetched
        let mut stats = self.stats.write().await;
        stats.cache_hits_from_prefetch += 1;
    }
}

/// Tauri command to queue words for prefetch
#[tauri::command]
pub async fn queue_prefetch(
    words: Vec<String>,
    priority: String,
    prefetch_manager: State<'_, Arc<PrefetchManager>>,
) -> Result<(), String> {
    let priority = match priority.as_str() {
        "high" => PrefetchPriority::High,
        "medium" => PrefetchPriority::Medium,
        "low" => PrefetchPriority::Low,
        _ => PrefetchPriority::Medium,
    };
    
    let request = PrefetchRequest { words, priority };
    prefetch_manager.queue_prefetch(request).await
}

/// Tauri command to get prefetch statistics
#[tauri::command]
pub async fn get_prefetch_stats(
    prefetch_manager: State<'_, Arc<PrefetchManager>>,
) -> Result<PrefetchStats, String> {
    Ok(prefetch_manager.get_stats().await)
}

/// Tauri command to clear prefetch queue
#[tauri::command]
pub async fn clear_prefetch_queue(
    prefetch_manager: State<'_, Arc<PrefetchManager>>,
) -> Result<(), String> {
    prefetch_manager.clear_queue().await;
    Ok(())
}