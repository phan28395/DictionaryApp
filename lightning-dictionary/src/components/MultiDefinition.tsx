import React, { useState, useMemo } from 'react';
import { EnhancedWordDefinition, POSGroup, Definition } from '../types/enhanced-dictionary';
import { CrossReference } from './CrossReference';
import './MultiDefinition.css';

interface MultiDefinitionProps {
  definition: EnhancedWordDefinition;
  onWordClick?: (word: string) => void;
  expandAll?: boolean;
}

interface POSGroupProps {
  group: POSGroup;
  word: string;
  onWordClick?: (word: string) => void;
  defaultExpanded?: boolean;
}

interface DefinitionItemProps {
  definition: Definition;
  index: number;
  onWordClick?: (word: string) => void;
  currentWord: string;
}

const DefinitionItem: React.FC<DefinitionItemProps> = ({ definition, index, onWordClick, currentWord }) => {
  const excludeWords = useMemo(() => {
    const words = new Set<string>();
    words.add(currentWord.toLowerCase());
    const variations = [
      currentWord,
      currentWord + 's',
      currentWord + 'es',
      currentWord + 'ed',
      currentWord + 'ing',
      currentWord.replace(/y$/, 'ies'),
      currentWord.replace(/y$/, 'ied')
    ];
    variations.forEach(word => words.add(word.toLowerCase()));
    return words;
  }, [currentWord]);
  return (
    <div className="definition-item">
      <div className="definition-number">{index + 1}.</div>
      <div className="definition-content">
        <div className="definition-text">
          <CrossReference
            text={definition.text}
            onWordClick={onWordClick}
            excludeWords={excludeWords}
          />
        </div>
        
        {definition.examples && definition.examples.length > 0 && (
          <div className="definition-examples">
            {definition.examples.map((example, i) => (
              <p key={i} className="example-text">
                <span className="example-label">Example:</span>
                <CrossReference
                  text={example}
                  onWordClick={onWordClick}
                  excludeWords={excludeWords}
                  className="example-cross-reference"
                />
              </p>
            ))}
          </div>
        )}
        
        {definition.synonyms && definition.synonyms.length > 0 && (
          <div className="definition-synonyms">
            <span className="synonym-label">Synonyms:</span>
            {definition.synonyms.map((synonym, i) => (
              <span key={i}>
                <button
                  className="synonym-link"
                  onClick={() => onWordClick?.(synonym)}
                  aria-label={`Look up ${synonym}`}
                >
                  {synonym}
                </button>
                {i < definition.synonyms!.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
        
        {definition.antonyms && definition.antonyms.length > 0 && (
          <div className="definition-antonyms">
            <span className="antonym-label">Antonyms:</span>
            {definition.antonyms.map((antonym, i) => (
              <span key={i}>
                <button
                  className="antonym-link"
                  onClick={() => onWordClick?.(antonym)}
                  aria-label={`Look up ${antonym}`}
                >
                  {antonym}
                </button>
                {i < definition.antonyms!.length - 1 && ', '}
              </span>
            ))}
          </div>
        )}
        
        {definition.usage && (
          <div className="definition-usage">
            <span className="usage-label">Usage:</span>
            <CrossReference
              text={definition.usage}
              onWordClick={onWordClick}
              excludeWords={excludeWords}
              className="usage-cross-reference"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const POSGroupComponent: React.FC<POSGroupProps> = ({ 
  group, 
  word, 
  onWordClick, 
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="pos-group">
      <button
        className="pos-header"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={`${word}-${group.pos}-definitions`}
      >
        <span className="pos-label">{group.pos}</span>
        <span className="definition-count">({group.definitions.length})</span>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div 
          id={`${word}-${group.pos}-definitions`}
          className="definitions-list"
        >
          {group.definitions.map((def, index) => (
            <DefinitionItem
              key={def.id}
              definition={def}
              index={index}
              onWordClick={onWordClick}
              currentWord={word}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const MultiDefinition: React.FC<MultiDefinitionProps> = ({ 
  definition, 
  onWordClick,
  expandAll = true 
}) => {
  // Sort POS groups by number of definitions (most definitions first)
  const sortedGroups = useMemo(() => {
    return [...definition.posGroups].sort((a, b) => 
      b.definitions.length - a.definitions.length
    );
  }, [definition.posGroups]);
  
  return (
    <div className="multi-definition-container">
      <div className="word-header">
        <h2 className="word-title">{definition.word}</h2>
        {definition.pronunciations && definition.pronunciations.length > 0 && (
          <div className="pronunciations">
            {definition.pronunciations.map((pron, index) => (
              <span key={index} className="pronunciation">{pron}</span>
            ))}
          </div>
        )}
      </div>
      
      {definition.etymology && (
        <div className="etymology">
          <span className="etymology-label">Origin:</span> {definition.etymology}
        </div>
      )}
      
      <div className="pos-groups">
        {sortedGroups.map((group) => (
          <POSGroupComponent
            key={group.pos}
            group={group}
            word={definition.word}
            onWordClick={onWordClick}
            defaultExpanded={expandAll}
          />
        ))}
      </div>
      
      {definition.relatedWords && definition.relatedWords.length > 0 && (
        <div className="related-words">
          <h3 className="related-words-title">Related Words</h3>
          <div className="related-words-list">
            {definition.relatedWords.map((word, index) => (
              <button
                key={index}
                className="related-word-link"
                onClick={() => onWordClick?.(word)}
                aria-label={`Look up ${word}`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="definition-footer">
        <span className="word-rank">Rank: #{definition.rank}</span>
        <span className="word-frequency">Frequency: {definition.frequency.toLocaleString()}</span>
        <span className="total-definitions">
          {definition.totalDefinitions} definition{definition.totalDefinitions !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default MultiDefinition;