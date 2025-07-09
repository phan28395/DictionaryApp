# Lightning Dictionary API Documentation

Version: 2.0.0  
Base URL: `http://localhost:8000/api/v1`

## Overview

The Lightning Dictionary API provides fast, efficient access to dictionary data with enhanced features including user authentication, search suggestions, AI-powered enhancements, and performance monitoring. Built with Fastify for optimal performance, the API supports <30ms response times even under load.

## Authentication

The API uses JWT (JSON Web Token) authentication for protected endpoints. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Authentication is optional for most dictionary endpoints but required for user-specific features.

## Rate Limiting

- Anonymous users: 100 requests per minute
- Authenticated users: 1000 requests per minute
- Batch operations count as single requests

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2025-01-09T12:00:00Z",
    "version": "2.0.0"
  }
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## Endpoints

### Health Check

#### GET /api/v1/health

Check API server status and version.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "2.0.0",
    "uptime": 3600,
    "features": {
      "search": true,
      "ai": true,
      "auth": true,
      "redis": true
    }
  }
}
```

### Dictionary Endpoints

#### GET /api/v1/word/:word

Get definition for a single word.

**Parameters:**
- `word` (string, required): The word to look up

**Response:**
```json
{
  "success": true,
  "data": {
    "word": "example",
    "phonetic": "/ɪɡˈzɑːmpl/",
    "origin": "Late Middle English",
    "meanings": [
      {
        "partOfSpeech": "noun",
        "definitions": [
          {
            "definition": "A thing characteristic of its kind...",
            "example": "It's a good example of how they can work together",
            "synonyms": ["specimen", "sample", "exemplar"],
            "antonyms": []
          }
        ]
      }
    ],
    "translations": { ... }
  }
}
```

#### GET /api/v1/word/enhanced/:word

Get enhanced definition with all available data.

**Parameters:**
- `word` (string, required): The word to look up
- `includeAI` (boolean, optional): Include AI enhancements (requires auth)

**Response:**
```json
{
  "success": true,
  "data": {
    "word": "example",
    "phonetic": "/ɪɡˈzɑːmpl/",
    "origin": "Late Middle English",
    "meanings": [...],
    "synonyms": ["specimen", "sample", "exemplar"],
    "antonyms": ["counterexample"],
    "relatedWords": ["exemplify", "exemplar"],
    "usageFrequency": "common",
    "difficulty": "intermediate",
    "aiEnhancements": {
      "contextDefinition": "...",
      "etymology": "...",
      "usageExamples": [...]
    }
  }
}
```

#### POST /api/v1/words/batch

Get definitions for multiple words (max 50).

**Request Body:**
```json
{
  "words": ["example", "dictionary", "api"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "words": {
      "example": { ... },
      "dictionary": { ... },
      "api": { ... }
    },
    "found": 3,
    "notFound": []
  }
}
```

### Search Endpoints

#### GET /api/v1/search/basic

Basic word search with optional filters.

**Query Parameters:**
- `q` (string, required): Search query
- `limit` (number, optional): Max results (default: 20, max: 100)
- `offset` (number, optional): Pagination offset
- `partOfSpeech` (string, optional): Filter by part of speech

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "word": "example",
        "phonetic": "/ɪɡˈzɑːmpl/",
        "primaryDefinition": "A thing characteristic of its kind..."
      }
    ],
    "total": 42,
    "hasMore": true
  }
}
```

#### GET /api/v1/search/suggestions

Get search suggestions with fuzzy matching and typo correction.

**Query Parameters:**
- `q` (string, required): Search query
- `limit` (number, optional): Max suggestions (default: 10)
- `fuzzy` (boolean, optional): Enable fuzzy matching (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "word": "example",
        "score": 0.95,
        "distance": 1,
        "isExact": false
      }
    ],
    "query": "exampl",
    "corrected": "example"
  }
}
```

#### GET /api/v1/search/autocomplete

Fast prefix-based autocomplete.

**Query Parameters:**
- `prefix` (string, required): Word prefix (min 2 chars)
- `limit` (number, optional): Max results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "completions": ["example", "examples", "exemplar", "exemplify"],
    "prefix": "exam"
  }
}
```

#### GET /api/v1/search/contains

Search for words containing a substring.

**Query Parameters:**
- `substring` (string, required): Substring to search
- `limit` (number, optional): Max results (default: 20)

### Authentication Endpoints

#### POST /api/v1/auth/register

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "displayName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/v1/auth/login

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "user@example.com",
      "displayName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400
  }
}
```

#### POST /api/v1/auth/logout

Logout and invalidate session (requires auth).

#### GET /api/v1/auth/user

Get current user profile (requires auth).

#### PUT /api/v1/auth/user

Update user profile (requires auth).

#### GET /api/v1/auth/preferences

Get user preferences (requires auth).

#### PUT /api/v1/auth/preferences

Update user preferences (requires auth).

### History Endpoints (Requires Authentication)

#### GET /api/v1/history

Get user's word lookup history.

**Query Parameters:**
- `limit` (number, optional): Max results (default: 50)
- `offset` (number, optional): Pagination offset
- `startDate` (string, optional): ISO date string
- `endDate` (string, optional): ISO date string

#### POST /api/v1/history/clear

Clear user's history.

#### GET /api/v1/history/export

Export history in various formats.

**Query Parameters:**
- `format` (string, optional): Export format (json, csv)

### AI Enhancement Endpoints

#### POST /api/v1/ai/enhance/:word

Get AI-enhanced word information (requires auth).

**Request Body:**
```json
{
  "features": ["contextDefinition", "etymology", "usageExamples"],
  "context": "I saw an example in the textbook"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "word": "example",
    "enhancements": {
      "contextDefinition": "In the context of a textbook...",
      "etymology": "From Latin exemplum...",
      "usageExamples": [
        "The teacher provided several examples.",
        "This serves as a prime example."
      ]
    },
    "cost": 0.002
  }
}
```

### Performance & Monitoring

#### GET /api/v1/stats/performance

Get server performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "uptime": 3600,
    "requestsPerSecond": 42,
    "averageResponseTime": 25,
    "cacheHitRate": 0.85,
    "memoryUsage": {
      "used": 128,
      "total": 512
    },
    "connections": {
      "active": 15,
      "idle": 5
    }
  }
}
```

#### GET /api/v1/cache/stats

Get cache statistics.

#### POST /api/v1/cache/clear

Clear cache (requires admin auth).

## Error Codes

| Code | Description |
|------|-------------|
| `WORD_NOT_FOUND` | The requested word was not found in the dictionary |
| `AUTH_REQUIRED` | Authentication required for this endpoint |
| `AUTH_INVALID` | Invalid or expired authentication token |
| `RATE_LIMIT_EXCEEDED` | Too many requests, please slow down |
| `INVALID_REQUEST` | Request validation failed |
| `SERVER_ERROR` | Internal server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## Websocket Support

Connect to `ws://localhost:8000/ws` for real-time features:

- Word lookup notifications
- Collaborative features (future)
- Live performance metrics

## SDK & Examples

### JavaScript/TypeScript

```typescript
import { DictionaryClient } from '@lightning-dictionary/client';

const client = new DictionaryClient({
  baseUrl: 'http://localhost:8000/api/v1',
  token: 'your-jwt-token'
});

// Look up a word
const definition = await client.words.get('example');

// Search with suggestions
const suggestions = await client.search.suggestions('exampl');

// Batch lookup
const words = await client.words.batch(['example', 'dictionary']);
```

### cURL Examples

```bash
# Get word definition
curl http://localhost:8000/api/v1/word/example

# Search with suggestions
curl "http://localhost:8000/api/v1/search/suggestions?q=exampl"

# Authenticated request
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/history

# Register new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'
```

## Best Practices

1. **Caching**: Implement client-side caching for frequently accessed words
2. **Batch Requests**: Use batch endpoints when looking up multiple words
3. **Authentication**: Only authenticate when using user-specific features
4. **Error Handling**: Always handle potential errors gracefully
5. **Rate Limiting**: Implement exponential backoff on rate limit errors

## Migration from v1

### Breaking Changes

- Authentication now uses JWT instead of session cookies
- Response format standardized with `success`, `data`, `error` structure
- Some endpoints moved under `/search` namespace

### New Features in v2

- User accounts and authentication
- Search suggestions with fuzzy matching
- AI-powered enhancements
- Word history tracking
- Batch operations
- Performance monitoring
- Enhanced caching with Redis support

## Support

For API issues or questions:
- GitHub Issues: [lightning-dictionary/issues](https://github.com/lightning-dictionary/issues)
- Email: api-support@lightning-dictionary.com
- Documentation: [https://docs.lightning-dictionary.com](https://docs.lightning-dictionary.com)

---

Last updated: 2025-01-09