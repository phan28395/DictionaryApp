use std::time::{Duration, Instant};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub hotkey_to_text_capture: Duration,
    pub text_capture_to_cache_lookup: Duration,
    pub cache_lookup_time: Duration,
    pub api_call_time: Option<Duration>,
    pub total_backend_time: Duration,
    pub cache_hit: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceStats {
    pub count: usize,
    pub avg_total_ms: f64,
    pub min_total_ms: f64,
    pub max_total_ms: f64,
    pub p50_total_ms: f64,
    pub p95_total_ms: f64,
    pub p99_total_ms: f64,
    pub cache_hit_rate: f64,
    pub breakdown: PerformanceBreakdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceBreakdown {
    pub text_capture_ms: f64,
    pub cache_lookup_ms: f64,
    pub api_call_ms: f64,
}

pub struct PerformanceTracker {
    marks: Mutex<HashMap<String, Instant>>,
    metrics: Mutex<Vec<PerformanceMetrics>>,
}

impl PerformanceTracker {
    pub fn new() -> Self {
        Self {
            marks: Mutex::new(HashMap::new()),
            metrics: Mutex::new(Vec::new()),
        }
    }

    pub fn mark(&self, name: &str) {
        let mut marks = self.marks.lock().unwrap();
        marks.insert(name.to_string(), Instant::now());
    }

    pub fn measure_backend(&self, cache_hit: bool, api_time: Option<Duration>) -> Option<PerformanceMetrics> {
        let marks = self.marks.lock().unwrap();
        
        let hotkey_pressed = marks.get("hotkey_pressed")?;
        let text_captured = marks.get("text_captured")?;
        let cache_lookup_start = marks.get("cache_lookup_start")?;
        let cache_lookup_end = marks.get("cache_lookup_end")?;
        let backend_complete = marks.get("backend_complete")?;

        let metrics = PerformanceMetrics {
            hotkey_to_text_capture: text_captured.duration_since(*hotkey_pressed),
            text_capture_to_cache_lookup: cache_lookup_start.duration_since(*text_captured),
            cache_lookup_time: cache_lookup_end.duration_since(*cache_lookup_start),
            api_call_time: api_time,
            total_backend_time: backend_complete.duration_since(*hotkey_pressed),
            cache_hit,
        };

        let mut all_metrics = self.metrics.lock().unwrap();
        all_metrics.push(metrics.clone());

        // Keep only last 1000 measurements
        if all_metrics.len() > 1000 {
            all_metrics.remove(0);
        }

        Some(metrics)
    }

    pub fn get_stats(&self) -> PerformanceStats {
        let metrics = self.metrics.lock().unwrap();
        
        if metrics.is_empty() {
            return PerformanceStats {
                count: 0,
                avg_total_ms: 0.0,
                min_total_ms: 0.0,
                max_total_ms: 0.0,
                p50_total_ms: 0.0,
                p95_total_ms: 0.0,
                p99_total_ms: 0.0,
                cache_hit_rate: 0.0,
                breakdown: PerformanceBreakdown {
                    text_capture_ms: 0.0,
                    cache_lookup_ms: 0.0,
                    api_call_ms: 0.0,
                },
            };
        }

        let mut totals: Vec<f64> = metrics.iter()
            .map(|m| m.total_backend_time.as_secs_f64() * 1000.0)
            .collect();
        totals.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let count = totals.len();
        let cache_hits = metrics.iter().filter(|m| m.cache_hit).count();
        
        let avg_text_capture = metrics.iter()
            .map(|m| m.hotkey_to_text_capture.as_secs_f64() * 1000.0)
            .sum::<f64>() / count as f64;
            
        let avg_cache_lookup = metrics.iter()
            .map(|m| m.cache_lookup_time.as_secs_f64() * 1000.0)
            .sum::<f64>() / count as f64;
            
        let api_calls: Vec<f64> = metrics.iter()
            .filter_map(|m| m.api_call_time.map(|t| t.as_secs_f64() * 1000.0))
            .collect();
        let avg_api_call = if api_calls.is_empty() {
            0.0
        } else {
            api_calls.iter().sum::<f64>() / api_calls.len() as f64
        };

        PerformanceStats {
            count,
            avg_total_ms: totals.iter().sum::<f64>() / count as f64,
            min_total_ms: totals[0],
            max_total_ms: totals[count - 1],
            p50_total_ms: totals[count / 2],
            p95_total_ms: totals[(count as f64 * 0.95) as usize],
            p99_total_ms: totals[(count as f64 * 0.99) as usize],
            cache_hit_rate: (cache_hits as f64 / count as f64) * 100.0,
            breakdown: PerformanceBreakdown {
                text_capture_ms: avg_text_capture,
                cache_lookup_ms: avg_cache_lookup,
                api_call_ms: avg_api_call,
            },
        }
    }

    pub fn reset(&self) {
        self.marks.lock().unwrap().clear();
        self.metrics.lock().unwrap().clear();
    }
}

lazy_static::lazy_static! {
    pub static ref PERF_TRACKER: PerformanceTracker = PerformanceTracker::new();
}