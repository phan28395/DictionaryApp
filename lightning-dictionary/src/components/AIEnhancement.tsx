import { memo, useState, useEffect } from 'react';
import { AIEnhancedDefinition, AIFeatureStatus } from '../types/ai-response';
import { useSettings } from '../hooks/useSettings';

interface AIEnhancementProps {
  word: string;
  context?: string;
  onEnhancedData?: (data: AIEnhancedDefinition) => void;
}

export const AIEnhancement = memo(({ word, context, onEnhancedData }: AIEnhancementProps) => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [enhancedData, setEnhancedData] = useState<AIEnhancedDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [featureStatus, setFeatureStatus] = useState<AIFeatureStatus>({
    available: true,
    enabled: settings.ai?.enabled ?? false,
    fallbackMode: false,
    provider: settings.ai?.provider
  });

  useEffect(() => {
    if (!settings.ai?.enabled || !word) return;

    const fetchEnhancement = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/v1/ai/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word,
            context,
            features: settings.ai.features
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch AI enhancement');
        }

        const data = await response.json();
        setEnhancedData(data.enhancement);
        setFeatureStatus(data.status);
        
        if (onEnhancedData) {
          onEnhancedData(data.enhancement);
        }
      } catch (err) {
        console.error('AI enhancement error:', err);
        setError('AI features temporarily unavailable');
        setFeatureStatus(prev => ({ ...prev, fallbackMode: true }));
      } finally {
        setLoading(false);
      }
    };

    if (settings.ai?.autoEnhance) {
      fetchEnhancement();
    }
  }, [word, context, settings.ai]);

  if (!settings.ai?.enabled) {
    return null;
  }

  return (
    <div className="ai-enhancement" style={{
      marginTop: '1rem',
      padding: '1rem',
      background: 'rgba(74, 158, 255, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(74, 158, 255, 0.3)'
    }}>
      {loading && (
        <div style={{ textAlign: 'center', color: '#888' }}>
          Loading AI insights...
        </div>
      )}

      {error && (
        <div style={{ color: '#ff6b6b', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {enhancedData && (
        <div className="animate-fade-in">
          {enhancedData.contextualMeaning && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#4a9eff' }}>Contextual Meaning:</strong>
              <p style={{ margin: '0.25rem 0', fontSize: '0.95rem' }}>
                {enhancedData.contextualMeaning}
              </p>
              {settings.ai?.showConfidence && enhancedData.confidence && (
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  Confidence: {Math.round(enhancedData.confidence * 100)}%
                </span>
              )}
            </div>
          )}

          {enhancedData.difficultyLevel && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#4a9eff' }}>Difficulty:</strong>{' '}
              <span style={{ 
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: getDifficultyColor(enhancedData.difficultyLevel),
                fontSize: '0.875rem'
              }}>
                {enhancedData.difficultyLevel}
              </span>
            </div>
          )}

          {enhancedData.usageInContext && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#4a9eff' }}>Usage in Context:</strong>
              <p style={{ margin: '0.25rem 0', fontSize: '0.95rem', fontStyle: 'italic' }}>
                "{enhancedData.usageInContext}"
              </p>
            </div>
          )}

          {enhancedData.relatedConcepts && enhancedData.relatedConcepts.length > 0 && (
            <div>
              <strong style={{ color: '#4a9eff' }}>Related Concepts:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {enhancedData.relatedConcepts.map((concept, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    className="hover-bg"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {featureStatus.fallbackMode && (
            <div style={{ 
              marginTop: '0.75rem', 
              fontSize: '0.75rem', 
              color: '#888',
              fontStyle: 'italic'
            }}>
              Using fallback mode • Provider: {featureStatus.provider}
            </div>
          )}
        </div>
      )}

      {!loading && !error && !enhancedData && !settings.ai?.autoEnhance && (
        <button
          onClick={() => {
            // Trigger manual enhancement
            const event = new CustomEvent('ai-enhance-request', { detail: { word, context } });
            window.dispatchEvent(event);
          }}
          style={{
            background: '#4a9eff',
            border: 'none',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
          className="button-press"
        >
          Get AI Insights
        </button>
      )}
    </div>
  );
});

AIEnhancement.displayName = 'AIEnhancement';

function getDifficultyColor(level: string): string {
  switch (level) {
    case 'beginner': return 'rgba(76, 175, 80, 0.2)';
    case 'intermediate': return 'rgba(255, 193, 7, 0.2)';
    case 'advanced': return 'rgba(255, 152, 0, 0.2)';
    case 'expert': return 'rgba(244, 67, 54, 0.2)';
    default: return 'rgba(158, 158, 158, 0.2)';
  }
}