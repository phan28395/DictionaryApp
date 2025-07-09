# AI Integration Documentation

## Overview

The Lightning Dictionary AI Infrastructure provides intelligent enhancements to word definitions through a flexible, provider-agnostic architecture. This document details the integration points, configuration options, and development guidelines.

## Architecture

### Components

1. **AI Service** (`api/src/services/ai-service.ts`)
   - Central orchestrator for AI requests
   - Provider management and fallback handling
   - Metrics collection and cost tracking

2. **AI Providers** 
   - Mock Provider (development)
   - OpenAI Provider (future)
   - Anthropic Provider (future)
   - DeepSeek Provider (future)

3. **Frontend Integration**
   - `AIEnhancement` component for UI display
   - `useAI` hook for programmatic access
   - Settings UI for configuration

### Data Flow

```
User Request → Frontend → API Endpoint → AI Service → Provider → Response
                                              ↓
                                        Fallback Provider
```

## API Endpoints

### GET /api/v1/ai/status
Check AI service availability and features.

**Response:**
```json
{
  "available": true,
  "enabled": true,
  "fallbackMode": false,
  "provider": "mock",
  "features": ["context_definition", "smart_summary", ...],
  "lastError": null
}
```

### POST /api/v1/ai/enhance
Enhance a single word with AI features.

**Request:**
```json
{
  "word": "example",
  "context": {
    "surroundingSentence": "This is an example sentence.",
    "documentTitle": "AI Documentation",
    "previousLookups": ["test", "sample"]
  },
  "features": {
    "contextualDefinitions": true,
    "difficultyAssessment": true,
    "usageExamples": true
  }
}
```

**Response:**
```json
{
  "enhancement": {
    "word": "example",
    "contextualMeaning": "In this context, 'example' refers to...",
    "confidence": 0.92,
    "difficultyLevel": "intermediate",
    "usageInContext": "The example demonstrates...",
    "relatedConcepts": ["sample", "instance", "case"]
  },
  "status": {
    "available": true,
    "enabled": true,
    "fallbackMode": false,
    "provider": "mock"
  },
  "processingTime": 245
}
```

### POST /api/v1/ai/batch-enhance
Enhance multiple words (max 10 per request).

### GET /api/v1/ai/metrics
Get service metrics and cost estimates.

### POST /api/v1/ai/feedback
Submit quality feedback for improvements.

## Features

### Available AI Features

1. **Context Definition** (`context_definition`)
   - Provides meaning based on surrounding text
   - Considers sentence and paragraph context

2. **Smart Summary** (`smart_summary`)
   - Concise, intelligent word summaries
   - Focuses on most relevant aspects

3. **Usage Examples** (`usage_examples`)
   - AI-generated contextual examples
   - Domain-specific when applicable

4. **Etymology Insights** (`etymology`)
   - Word origin and evolution
   - Related historical meanings

5. **Difficulty Assessment** (`difficulty_level`)
   - Rates word complexity
   - Suggests simpler alternatives

6. **Related Concepts** (`related_concepts`)
   - Semantically similar words
   - Conceptual connections

7. **Translation Context** (`translation_context`)
   - Context-aware translations
   - Idiomatic usage notes

## Configuration

### User Settings

Access via Settings → AI tab:

- **Enable/Disable AI**: Master toggle
- **Feature Selection**: Choose active features
- **Provider Selection**: Choose AI backend
- **API Key**: For external providers
- **Cost Limit**: Monthly spending cap
- **Cache Control**: Performance optimization
- **Confidence Display**: Show/hide confidence scores

### Developer Configuration

```typescript
// Default AI settings
{
  enabled: false,  // Disabled by default
  features: {
    contextualDefinitions: true,
    smartSummaries: true,
    etymologyInsights: true,
    difficultyAssessment: true,
    usageExamples: true,
    relatedConcepts: true,
    translationContext: false
  },
  provider: 'mock',
  useFallback: true,
  cacheResults: true,
  maxCostPerMonth: 10,
  showConfidence: true,
  autoEnhance: false
}
```

## Frontend Integration

### Using the AIEnhancement Component

```tsx
import { AIEnhancement } from './components/AIEnhancement';

<AIEnhancement 
  word="example"
  context="The surrounding sentence"
  onEnhancedData={(data) => console.log(data)}
/>
```

### Using the useAI Hook

```tsx
import { useAI } from './hooks/useAI';

function MyComponent() {
  const { enhance, enhancedData, loading, error } = useAI();
  
  const handleEnhance = async () => {
    const result = await enhance('word', {
      selectedText: 'context',
      userLevel: 'intermediate'
    });
  };
}
```

## Adding New Providers

1. Implement the `AIProvider` interface:

```typescript
export class MyAIProvider implements AIProvider {
  name = 'my-provider';
  
  async initialize(config: AIProviderConfig): Promise<void> {
    // Setup API client
  }
  
  async process(request: AIRequest): Promise<AIResponse> {
    // Process request and return response
  }
  
  isAvailable(): boolean {
    // Check if provider is ready
  }
  
  getCost(request: AIRequest): number {
    // Calculate request cost
  }
  
  getCapabilities(): AIFeature[] {
    // Return supported features
  }
}
```

2. Register in AI Service:

```typescript
const provider = new MyAIProvider();
await aiService.registerProvider('my-provider', provider, config);
```

## Fallback Behavior

The AI service implements automatic fallback:

1. **Primary Provider Fails** → Try secondary providers
2. **All Providers Fail** → Return graceful fallback response
3. **Feature Not Supported** → Use alternative feature or basic response

Fallback responses include:
- Clear messaging about degraded functionality
- Basic dictionary data when available
- Suggestions to try again later

## Performance Considerations

1. **Caching**
   - Results cached for 5 minutes by default
   - Cache key includes word + context
   - User can disable in settings

2. **Batching**
   - Batch requests when possible
   - Maximum 10 words per batch
   - Reduces API calls and costs

3. **Response Times**
   - Mock provider: 200-700ms
   - Target for real providers: <1000ms
   - Timeout after 5 seconds

## Cost Management

1. **Tracking**
   - Per-request cost calculation
   - Daily and monthly estimates
   - Feature-specific multipliers

2. **Limits**
   - User-defined monthly cap
   - Automatic cutoff when exceeded
   - Warning at 80% usage

3. **Optimization**
   - Cache to reduce repeat requests
   - Batch similar requests
   - Use appropriate features only

## Testing

Run the AI infrastructure tests:

```bash
./test-ai-infrastructure.mjs
```

Tests cover:
- Service availability
- Enhancement quality
- Batch processing
- Fallback mechanisms
- Error handling
- Performance metrics
- Caching behavior

## Future Enhancements

1. **Real AI Providers**
   - OpenAI GPT-4 integration
   - Anthropic Claude integration
   - DeepSeek for specialized tasks

2. **Advanced Features**
   - Multi-language support
   - Domain-specific models
   - User preference learning
   - Collaborative filtering

3. **Performance**
   - Edge caching
   - Request prediction
   - Preemptive enhancement
   - WebSocket streaming

## Troubleshooting

### AI Features Not Working
1. Check Settings → AI → Enable AI
2. Verify API endpoint accessibility
3. Check browser console for errors
4. Ensure provider is configured

### Slow Response Times
1. Enable caching in settings
2. Check network latency
3. Consider using batch requests
4. Monitor provider status

### Cost Concerns
1. Set monthly limit in settings
2. Disable auto-enhance
3. Use selective features
4. Monitor usage in metrics

## Security Considerations

1. **API Keys**
   - Stored securely in settings
   - Never exposed in frontend
   - Transmitted over HTTPS only

2. **User Data**
   - Context anonymized when possible
   - No PII in AI requests
   - Feedback is anonymous

3. **Rate Limiting**
   - Per-user request limits
   - Provider-level throttling
   - Graceful degradation