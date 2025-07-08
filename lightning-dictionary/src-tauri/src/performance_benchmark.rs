#[cfg(test)]
mod tests {
    use super::*;
    use crate::cache::create_cache;
    use crate::dictionary::DictionaryService;
    use crate::performance::PERF_TRACKER;
    use std::time::Instant;

    #[test]
    fn test_cache_performance_benchmark() {
        // Create a cache with 10,000 capacity
        let cache = create_cache(10_000);
        let dictionary_service = Arc::new(DictionaryService::new(
            cache.clone(),
            "http://localhost:3001".to_string()
        ));

        // Pre-populate cache with test data
        let test_words = vec![
            ("example", "noun", vec!["a thing characteristic of its kind"]),
            ("test", "verb", vec!["to try out", "to examine"]),
            ("performance", "noun", vec!["the action of performing a task"]),
            ("cache", "noun", vec!["a store of things"]),
            ("memory", "noun", vec!["the faculty by which the mind stores info"]),
        ];

        {
            let mut cache_lock = cache.lock().unwrap();
            for (word, pos, defs) in test_words {
                cache_lock.insert(word.to_string(), Definition {
                    word: word.to_string(),
                    pronunciation: None,
                    pos: pos.to_string(),
                    definitions: defs.iter().map(|s| s.to_string()).collect(),
                    frequency: None,
                });
            }
        }

        // Benchmark cache hits
        println!("\n=== Cache Hit Performance ===");
        let mut cache_times = Vec::new();
        
        for _ in 0..100 {
            PERF_TRACKER.mark("hotkey_pressed");
            PERF_TRACKER.mark("text_captured");
            
            let start = Instant::now();
            let _ = dictionary_service.lookup_word("example");
            let duration = start.elapsed();
            
            cache_times.push(duration.as_micros() as f64 / 1000.0); // Convert to ms
        }

        cache_times.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let avg_cache = cache_times.iter().sum::<f64>() / cache_times.len() as f64;
        let p95_cache = cache_times[(cache_times.len() as f64 * 0.95) as usize];
        let p99_cache = cache_times[(cache_times.len() as f64 * 0.99) as usize];

        println!("Average cache hit time: {:.3}ms", avg_cache);
        println!("P95 cache hit time: {:.3}ms", p95_cache);
        println!("P99 cache hit time: {:.3}ms", p99_cache);
        println!("Min cache hit time: {:.3}ms", cache_times[0]);
        println!("Max cache hit time: {:.3}ms", cache_times[cache_times.len() - 1]);

        // Assert performance targets
        assert!(avg_cache < 1.0, "Average cache hit time should be < 1ms");
        assert!(p95_cache < 2.0, "P95 cache hit time should be < 2ms");
        assert!(p99_cache < 5.0, "P99 cache hit time should be < 5ms");
    }

    #[test]
    fn test_end_to_end_performance() {
        // Get overall performance stats
        let stats = PERF_TRACKER.get_stats();
        
        if stats.count > 0 {
            println!("\n=== End-to-End Performance Stats ===");
            println!("Total measurements: {}", stats.count);
            println!("Average total time: {:.2}ms", stats.avg_total_ms);
            println!("P95 total time: {:.2}ms", stats.p95_total_ms);
            println!("P99 total time: {:.2}ms", stats.p99_total_ms);
            println!("Cache hit rate: {:.1}%", stats.cache_hit_rate);
            
            println!("\nBreakdown:");
            println!("  Text capture: {:.2}ms", stats.breakdown.text_capture_ms);
            println!("  Cache lookup: {:.2}ms", stats.breakdown.cache_lookup_ms);
            println!("  API call (avg): {:.2}ms", stats.breakdown.api_call_ms);
            
            // Performance assertions
            assert!(stats.avg_total_ms < 50.0, "Average total time should be < 50ms");
            assert!(stats.p95_total_ms < 100.0, "P95 total time should be < 100ms");
        }
    }

    #[test]
    fn test_performance_under_load() {
        let cache = create_cache(10_000);
        let dictionary_service = Arc::new(DictionaryService::new(
            cache.clone(),
            "http://localhost:3001".to_string()
        ));

        // Simulate rapid lookups
        println!("\n=== Performance Under Load ===");
        let start = Instant::now();
        let num_lookups = 1000;
        
        for i in 0..num_lookups {
            let word = format!("word{}", i % 100);
            let _ = dictionary_service.lookup_word(&word);
        }
        
        let total_time = start.elapsed();
        let avg_time = total_time.as_millis() as f64 / num_lookups as f64;
        
        println!("Total time for {} lookups: {:?}", num_lookups, total_time);
        println!("Average time per lookup: {:.3}ms", avg_time);
        println!("Throughput: {:.0} lookups/second", 1000.0 / avg_time);
        
        // Assert reasonable performance under load
        assert!(avg_time < 10.0, "Average lookup time under load should be < 10ms");
    }
}