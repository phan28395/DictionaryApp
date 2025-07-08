use crate::cache::{ThreadSafeCache, Definition};
use crate::api_client::DictionaryApiClient;
use crate::error::{DictionaryError, DictionaryResult};
use crate::performance::PERF_TRACKER;
use std::sync::Arc;
use std::time::Instant;
use tokio::runtime::Handle;

pub struct DictionaryService {
    cache: ThreadSafeCache,
    api_client: Arc<DictionaryApiClient>,
    runtime_handle: Handle,
}

impl DictionaryService {
    pub fn new(cache: ThreadSafeCache, api_base_url: String) -> Self {
        let api_client = Arc::new(DictionaryApiClient::new(api_base_url));
        let runtime_handle = Handle::current();
        
        Self {
            cache,
            api_client,
            runtime_handle,
        }
    }

    /// Look up a word with fallback strategy:
    /// 1. Check memory cache first (instant)
    /// 2. If not found, fetch from API
    /// 3. Cache the result for future lookups
    pub fn lookup_word(&self, word: &str) -> DictionaryResult<Definition> {
        PERF_TRACKER.mark("cache_lookup_start");
        
        // First, check the cache
        let _cache_hit = {
            match self.cache.lock() {
                Ok(mut cache) => {
                    if let Some(definition) = cache.get(word) {
                        PERF_TRACKER.mark("cache_lookup_end");
                        println!("Cache hit for word: {}", word);
                        PERF_TRACKER.mark("backend_complete");
                        PERF_TRACKER.measure_backend(true, None);
                        return Ok(definition);
                    }
                    false
                },
                Err(e) => {
                    // Log cache error but continue with API lookup
                    let error = DictionaryError::CacheError {
                        message: format!("Failed to acquire cache lock: {}", e),
                    };
                    error.log_error();
                    false
                }
            }
        };
        
        PERF_TRACKER.mark("cache_lookup_end");

        // Cache miss - try to fetch from API
        println!("Cache miss for word: {}. Fetching from API...", word);
        
        // Use blocking to run async code in sync context
        let api_client = self.api_client.clone();
        let word_str = word.to_string();
        
        let api_start = Instant::now();
        let result = self.runtime_handle.block_on(async move {
            api_client.get_definition(&word_str).await
        });
        let api_duration = api_start.elapsed();

        match result {
            Ok(Some(api_def)) => {
                // Convert API definition to our format
                let mut definition: Definition = api_def.into();
                definition.word = word.to_string();
                
                // Try to cache the result (but don't fail if cache has issues)
                match self.cache.lock() {
                    Ok(mut cache) => {
                        cache.insert(word.to_string(), definition.clone());
                    },
                    Err(e) => {
                        eprintln!("Warning: Failed to cache word '{}': {}", word, e);
                    }
                }
                
                println!("Successfully fetched and cached word: {}", word);
                PERF_TRACKER.mark("backend_complete");
                PERF_TRACKER.measure_backend(false, Some(api_duration));
                Ok(definition)
            },
            Ok(None) => {
                Err(DictionaryError::WordNotFound {
                    word: word.to_string(),
                })
            },
            Err(e) => {
                e.log_error();
                Err(e)
            }
        }
    }

    /// Search for words with a given prefix
    pub fn search_words(&self, query: &str) -> DictionaryResult<Vec<String>> {
        // For now, we'll just use the API search
        // In a future enhancement, we could also search cached words
        
        let api_client = self.api_client.clone();
        let query_str = query.to_string();
        
        let result = self.runtime_handle.block_on(async move {
            api_client.search(&query_str).await
        });

        match result {
            Ok(results) => {
                Ok(results.into_iter()
                    .map(|r| r.word)
                    .collect())
            },
            Err(e) => {
                e.log_error();
                // For search, we're more forgiving - return empty results instead of error
                Ok(vec![])
            }
        }
    }
}