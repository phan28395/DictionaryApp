use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Definition {
    pub word: String,
    pub pronunciation: Option<String>,
    pub pos: String, // part of speech
    pub definitions: Vec<String>,
    pub frequency: Option<u32>,
}

#[derive(Debug)]
struct CacheEntry {
    definition: Definition,
    last_accessed: Instant,
}

pub struct DictionaryCache {
    words: HashMap<String, CacheEntry>,
    lru_order: VecDeque<String>,
    max_size: usize,
}

impl DictionaryCache {
    pub fn new(max_size: usize) -> Self {
        Self {
            words: HashMap::with_capacity(max_size),
            lru_order: VecDeque::with_capacity(max_size),
            max_size,
        }
    }

    pub fn get(&mut self, word: &str) -> Option<Definition> {
        if let Some(entry) = self.words.get_mut(word) {
            entry.last_accessed = Instant::now();
            
            // Move to front of LRU queue
            if let Some(pos) = self.lru_order.iter().position(|w| w == word) {
                self.lru_order.remove(pos);
            }
            self.lru_order.push_front(word.to_string());
            
            Some(entry.definition.clone())
        } else {
            None
        }
    }

    pub fn insert(&mut self, word: String, definition: Definition) {
        // Check if we need to evict
        if self.words.len() >= self.max_size && !self.words.contains_key(&word) {
            // Remove least recently used
            if let Some(lru_word) = self.lru_order.pop_back() {
                self.words.remove(&lru_word);
            }
        }

        // Remove from LRU queue if already exists
        if let Some(pos) = self.lru_order.iter().position(|w| w == &word) {
            self.lru_order.remove(pos);
        }

        // Add to front of LRU queue
        self.lru_order.push_front(word.clone());

        // Insert into cache
        self.words.insert(word, CacheEntry {
            definition,
            last_accessed: Instant::now(),
        });
    }

    pub fn size(&self) -> usize {
        self.words.len()
    }

    pub fn clear(&mut self) {
        self.words.clear();
        self.lru_order.clear();
    }

    pub fn contains(&self, word: &str) -> bool {
        self.words.contains_key(word)
    }

    pub fn get_stats(&self) -> CacheStats {
        CacheStats {
            size: self.words.len(),
            capacity: self.max_size,
            memory_usage_estimate: self.estimate_memory_usage(),
        }
    }

    fn estimate_memory_usage(&self) -> usize {
        // Rough estimation of memory usage
        let mut total = 0;
        
        for (word, entry) in &self.words {
            // String key
            total += word.len() + 24; // String overhead
            
            // Definition
            total += entry.definition.word.len() + 24;
            total += entry.definition.pronunciation.as_ref().map_or(0, |p| p.len() + 24);
            total += entry.definition.pos.len() + 24;
            
            // Vec of definitions
            for def in &entry.definition.definitions {
                total += def.len() + 24;
            }
            total += entry.definition.definitions.len() * 8; // Vec overhead
            
            // Other fields
            total += 16; // Instant
            total += 4; // Option<u32>
        }
        
        // LRU queue
        total += self.lru_order.len() * (8 + 24); // pointer + String overhead
        
        total
    }
}

#[derive(Debug, Serialize)]
pub struct CacheStats {
    pub size: usize,
    pub capacity: usize,
    pub memory_usage_estimate: usize,
}

// Thread-safe cache wrapper
pub type ThreadSafeCache = Arc<Mutex<DictionaryCache>>;

pub fn create_cache(max_size: usize) -> ThreadSafeCache {
    Arc::new(Mutex::new(DictionaryCache::new(max_size)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_operations() {
        let mut cache = DictionaryCache::new(3);
        
        let def1 = Definition {
            word: "test".to_string(),
            pronunciation: Some("test".to_string()),
            pos: "noun".to_string(),
            definitions: vec!["a test definition".to_string()],
            frequency: Some(100),
        };
        
        cache.insert("test".to_string(), def1.clone());
        assert_eq!(cache.size(), 1);
        assert!(cache.contains("test"));
        
        let retrieved = cache.get("test");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().word, "test");
    }

    #[test]
    fn test_lru_eviction() {
        let mut cache = DictionaryCache::new(2);
        
        let def1 = Definition {
            word: "one".to_string(),
            pronunciation: None,
            pos: "noun".to_string(),
            definitions: vec!["first".to_string()],
            frequency: None,
        };
        
        let def2 = Definition {
            word: "two".to_string(),
            pronunciation: None,
            pos: "noun".to_string(),
            definitions: vec!["second".to_string()],
            frequency: None,
        };
        
        let def3 = Definition {
            word: "three".to_string(),
            pronunciation: None,
            pos: "noun".to_string(),
            definitions: vec!["third".to_string()],
            frequency: None,
        };
        
        cache.insert("one".to_string(), def1);
        cache.insert("two".to_string(), def2);
        
        // Access "one" to make it more recent
        cache.get("one");
        
        // Insert "three", should evict "two"
        cache.insert("three".to_string(), def3);
        
        assert_eq!(cache.size(), 2);
        assert!(cache.contains("one"));
        assert!(!cache.contains("two"));
        assert!(cache.contains("three"));
    }

    #[test]
    fn test_cache_stats() {
        let mut cache = DictionaryCache::new(100);
        
        for i in 0..10 {
            let def = Definition {
                word: format!("word{}", i),
                pronunciation: Some(format!("pronunciation{}", i)),
                pos: "noun".to_string(),
                definitions: vec![format!("definition{}", i)],
                frequency: Some(i),
            };
            cache.insert(format!("word{}", i), def);
        }
        
        let stats = cache.get_stats();
        assert_eq!(stats.size, 10);
        assert_eq!(stats.capacity, 100);
        assert!(stats.memory_usage_estimate > 0);
    }
}