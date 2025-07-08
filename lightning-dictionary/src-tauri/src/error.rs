use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DictionaryError {
    NetworkError {
        message: String,
        is_timeout: bool,
    },
    ApiError {
        status_code: Option<u16>,
        message: String,
    },
    CacheError {
        message: String,
    },
    WordNotFound {
        word: String,
    },
    ServiceUnavailable {
        service: String,
        retry_after: Option<u64>,
    },
    InvalidInput {
        message: String,
    },
}

impl fmt::Display for DictionaryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DictionaryError::NetworkError { message, is_timeout } => {
                if *is_timeout {
                    write!(f, "Network timeout: {}", message)
                } else {
                    write!(f, "Network error: {}", message)
                }
            }
            DictionaryError::ApiError { status_code, message } => {
                if let Some(code) = status_code {
                    write!(f, "API error ({}): {}", code, message)
                } else {
                    write!(f, "API error: {}", message)
                }
            }
            DictionaryError::CacheError { message } => {
                write!(f, "Cache error: {}", message)
            }
            DictionaryError::WordNotFound { word } => {
                write!(f, "Word '{}' not found in dictionary", word)
            }
            DictionaryError::ServiceUnavailable { service, retry_after } => {
                if let Some(seconds) = retry_after {
                    write!(f, "{} service temporarily unavailable. Try again in {} seconds", service, seconds)
                } else {
                    write!(f, "{} service temporarily unavailable", service)
                }
            }
            DictionaryError::InvalidInput { message } => {
                write!(f, "Invalid input: {}", message)
            }
        }
    }
}

impl std::error::Error for DictionaryError {}

pub type DictionaryResult<T> = Result<T, DictionaryError>;

impl DictionaryError {
    pub fn user_message(&self) -> String {
        match self {
            DictionaryError::NetworkError { is_timeout, .. } => {
                if *is_timeout {
                    "Request timed out. Please check your internet connection.".to_string()
                } else {
                    "Unable to connect to dictionary service. Please check your internet connection.".to_string()
                }
            }
            DictionaryError::ApiError { status_code, .. } => {
                match status_code {
                    Some(429) => "Too many requests. Please wait a moment and try again.".to_string(),
                    Some(500..=599) => "Dictionary service is experiencing issues. Please try again later.".to_string(),
                    _ => "Unable to fetch word definition. Please try again.".to_string(),
                }
            }
            DictionaryError::CacheError { .. } => {
                "Error accessing local cache. The app may run slower than usual.".to_string()
            }
            DictionaryError::WordNotFound { word } => {
                format!("'{}' not found in dictionary", word)
            }
            DictionaryError::ServiceUnavailable { .. } => {
                "Dictionary service is temporarily unavailable. Please try again later.".to_string()
            }
            DictionaryError::InvalidInput { .. } => {
                "Please enter a valid word to look up.".to_string()
            }
        }
    }

    pub fn should_retry(&self) -> bool {
        matches!(self, 
            DictionaryError::NetworkError { .. } |
            DictionaryError::ApiError { status_code: Some(500..=599), .. } |
            DictionaryError::ServiceUnavailable { .. }
        )
    }

    pub fn log_error(&self) {
        match self {
            DictionaryError::NetworkError { .. } |
            DictionaryError::ApiError { .. } |
            DictionaryError::ServiceUnavailable { .. } => {
                eprintln!("[ERROR] {}", self);
            }
            DictionaryError::CacheError { .. } => {
                eprintln!("[WARN] {}", self);
            }
            DictionaryError::WordNotFound { .. } |
            DictionaryError::InvalidInput { .. } => {
                println!("[INFO] {}", self);
            }
        }
    }
}

impl From<reqwest::Error> for DictionaryError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            DictionaryError::NetworkError {
                message: "Request timed out".to_string(),
                is_timeout: true,
            }
        } else if err.is_connect() {
            DictionaryError::NetworkError {
                message: format!("Connection failed: {}", err),
                is_timeout: false,
            }
        } else if let Some(status) = err.status() {
            DictionaryError::ApiError {
                status_code: Some(status.as_u16()),
                message: format!("HTTP {}: {}", status, err),
            }
        } else {
            DictionaryError::NetworkError {
                message: err.to_string(),
                is_timeout: false,
            }
        }
    }
}