use std::time::Instant;
use crate::cache::{DictionaryCache, Definition};

pub fn run_cache_benchmarks() {
    println!("\n=== Dictionary Cache Benchmarks ===\n");
    
    benchmark_insertion_time();
    benchmark_lookup_time();
    benchmark_lru_performance();
    benchmark_memory_efficiency();
}

fn benchmark_insertion_time() {
    println!("1. Insertion Performance Test");
    let mut cache = DictionaryCache::new(10_000);
    
    let mut times = Vec::new();
    
    for i in 0..10_000 {
        let definition = create_test_definition(&format!("word{}", i));
        
        let start = Instant::now();
        cache.insert(format!("word{}", i), definition);
        let elapsed = start.elapsed();
        
        times.push(elapsed.as_nanos());
    }
    
    let avg_time = times.iter().sum::<u128>() / times.len() as u128;
    let max_time = times.iter().max().unwrap();
    let min_time = times.iter().min().unwrap();
    
    println!("  - Average insertion time: {} ns", avg_time);
    println!("  - Max insertion time: {} ns", max_time);
    println!("  - Min insertion time: {} ns", min_time);
    println!("  - Total insertions: {}", cache.size());
    println!();
}

fn benchmark_lookup_time() {
    println!("2. Lookup Performance Test");
    let mut cache = DictionaryCache::new(10_000);
    
    // Pre-populate cache
    for i in 0..10_000 {
        let definition = create_test_definition(&format!("word{}", i));
        cache.insert(format!("word{}", i), definition);
    }
    
    let mut times = Vec::new();
    
    // Test cache hits
    for i in 0..1000 {
        let word = format!("word{}", i * 10);
        
        let start = Instant::now();
        let _ = cache.get(&word);
        let elapsed = start.elapsed();
        
        times.push(elapsed.as_nanos());
    }
    
    let avg_time = times.iter().sum::<u128>() / times.len() as u128;
    let max_time = times.iter().max().unwrap();
    
    println!("  - Average lookup time: {} ns ({:.3} µs)", avg_time, avg_time as f64 / 1000.0);
    println!("  - Max lookup time: {} ns ({:.3} µs)", max_time, *max_time as f64 / 1000.0);
    println!("  - Target: <1ms (1,000,000 ns)");
    println!("  - Status: {}", if avg_time < 1_000_000 { "✓ PASS" } else { "✗ FAIL" });
    println!();
}

fn benchmark_lru_performance() {
    println!("3. LRU Eviction Performance Test");
    let mut cache = DictionaryCache::new(1000);
    
    // Fill cache to capacity
    for i in 0..1000 {
        let definition = create_test_definition(&format!("word{}", i));
        cache.insert(format!("word{}", i), definition);
    }
    
    let mut eviction_times = Vec::new();
    
    // Trigger evictions
    for i in 1000..2000 {
        let definition = create_test_definition(&format!("word{}", i));
        
        let start = Instant::now();
        cache.insert(format!("word{}", i), definition);
        let elapsed = start.elapsed();
        
        eviction_times.push(elapsed.as_nanos());
    }
    
    let avg_eviction_time = eviction_times.iter().sum::<u128>() / eviction_times.len() as u128;
    
    println!("  - Average eviction + insertion time: {} ns", avg_eviction_time);
    println!("  - Cache size maintained at: {}", cache.size());
    println!();
}

fn benchmark_memory_efficiency() {
    println!("4. Memory Usage Test");
    let mut cache = DictionaryCache::new(10_000);
    
    // Add words with varying definition sizes
    for i in 0..10_000 {
        let mut definition = create_test_definition(&format!("word{}", i));
        
        // Vary definition sizes
        if i % 10 == 0 {
            // Large definition
            for j in 0..5 {
                definition.definitions.push(format!("Additional definition {} for word{}", j, i));
            }
        }
        
        cache.insert(format!("word{}", i), definition);
    }
    
    let stats = cache.get_stats();
    let mb_used = stats.memory_usage_estimate as f64 / (1024.0 * 1024.0);
    let avg_per_word = stats.memory_usage_estimate / stats.size;
    
    println!("  - Total memory usage: {:.2} MB", mb_used);
    println!("  - Average memory per word: {} bytes", avg_per_word);
    println!("  - Cache capacity: {} words", stats.capacity);
    println!("  - Current size: {} words", stats.size);
    println!("  - Target: <50MB for 10,000 words");
    println!("  - Status: {}", if mb_used < 50.0 { "✓ PASS" } else { "✗ FAIL" });
}

fn create_test_definition(word: &str) -> Definition {
    Definition {
        word: word.to_string(),
        pronunciation: Some(format!("/{}/", word)),
        pos: "noun".to_string(),
        definitions: vec![
            format!("Primary definition for {}", word),
            format!("Secondary definition for {}", word),
        ],
        frequency: Some((word.len() * 100) as u32),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_benchmarks_run() {
        // This just ensures benchmarks can run without panicking
        run_cache_benchmarks();
    }
}