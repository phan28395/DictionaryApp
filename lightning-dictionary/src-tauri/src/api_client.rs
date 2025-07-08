use std::time::Duration;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use crate::error::{DictionaryError, DictionaryResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordDefinition {
    pub rank: u32,
    pub pos: String,
    pub frequency: u64,
    pub definitions: Vec<String>,
    pub pronunciation: Option<String>,
    pub examples: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub word: String,
    pub rank: u32,
    pub pos: String,
    pub frequency: u64,
}

pub struct DictionaryApiClient {
    client: Client,
    base_url: String,
    max_retries: u32,
}

impl DictionaryApiClient {
    pub fn new(base_url: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_millis(100)) // 100ms timeout as per requirements
            .build()
            .expect("Failed to create HTTP client");
        
        Self {
            client,
            base_url,
            max_retries: 2,
        }
    }

    pub async fn get_definition(&self, word: &str) -> DictionaryResult<Option<WordDefinition>> {
        // Validate input
        if word.trim().is_empty() {
            return Err(DictionaryError::InvalidInput {
                message: "Word cannot be empty".to_string(),
            });
        }
        
        let url = format!("{}/api/v1/define/{}", self.base_url, word);
        let mut last_error = None;
        
        for attempt in 0..=self.max_retries {
            match self.make_request::<WordDefinition>(&url).await {
                Ok(response) => {
                    if response.success {
                        return Ok(response.data);
                    } else {
                        // API returned an error (like word not found)
                        if response.error.as_ref().map(|e| e.contains("not found")).unwrap_or(false) {
                            return Err(DictionaryError::WordNotFound {
                                word: word.to_string(),
                            });
                        }
                        return Ok(None);
                    }
                },
                Err(e) => {
                    last_error = Some(e);
                    if attempt < self.max_retries {
                        // Log retry attempt
                        println!("Retry attempt {} for word '{}' after error", attempt + 1, word);
                        tokio::time::sleep(Duration::from_millis(50)).await;
                    }
                }
            }
        }
        
        // All retries exhausted
        Err(last_error.unwrap())
    }

    pub async fn search(&self, query: &str) -> DictionaryResult<Vec<SearchResult>> {
        if query.trim().is_empty() {
            return Ok(vec![]); // Empty query returns empty results
        }
        
        let url = format!("{}/api/v1/search?q={}", self.base_url, urlencoding::encode(query));
        let mut last_error = None;
        
        for attempt in 0..=self.max_retries {
            match self.make_request::<Vec<SearchResult>>(&url).await {
                Ok(response) => {
                    if response.success {
                        return Ok(response.data.unwrap_or_default());
                    } else {
                        return Ok(vec![]);
                    }
                },
                Err(e) => {
                    last_error = Some(e);
                    if attempt < self.max_retries {
                        println!("Retry attempt {} for search query '{}' after error", attempt + 1, query);
                        tokio::time::sleep(Duration::from_millis(50)).await;
                    }
                }
            }
        }
        
        // Log the error but return empty results for search (more forgiving than definition lookup)
        if let Some(error) = last_error {
            error.log_error();
        }
        Ok(vec![])
    }

    async fn make_request<T: for<'de> Deserialize<'de>>(&self, url: &str) -> DictionaryResult<ApiResponse<T>> {
        let response = self.client
            .get(url)
            .send()
            .await
            .map_err(DictionaryError::from)?;
        
        // Check status code before parsing JSON
        let status = response.status();
        if status.is_server_error() {
            return Err(DictionaryError::ServiceUnavailable {
                service: "Dictionary API".to_string(),
                retry_after: response.headers()
                    .get("retry-after")
                    .and_then(|v| v.to_str().ok())
                    .and_then(|s| s.parse().ok()),
            });
        }
        
        response.json::<ApiResponse<T>>()
            .await
            .map_err(|e| DictionaryError::ApiError {
                status_code: Some(status.as_u16()),
                message: format!("Failed to parse API response: {}", e),
            })
    }
}

// Convert API definition to our internal Definition format
impl From<WordDefinition> for crate::cache::Definition {
    fn from(api_def: WordDefinition) -> Self {
        crate::cache::Definition {
            word: String::new(), // Will be set by caller
            definitions: if api_def.definitions.is_empty() {
                vec![format!("{} (rank: {}, frequency: {})", api_def.pos, api_def.rank, api_def.frequency)]
            } else {
                api_def.definitions
            },
            pos: api_def.pos,
            pronunciation: api_def.pronunciation,
            frequency: Some(api_def.frequency as u32),
        }
    }
}