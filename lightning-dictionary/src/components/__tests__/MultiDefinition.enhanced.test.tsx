import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultiDefinition } from '../MultiDefinition';
import { EnhancedWordDefinition } from '../../types/enhanced-dictionary';

describe('MultiDefinition Enhanced Features', () => {
  const mockOnWordClick = jest.fn();
  
  const enhancedDefinition: EnhancedWordDefinition = {
    word: 'example',
    rank: 523,
    frequency: 245678,
    pronunciations: ['/ɪɡˈzæmpəl/', '/ɪɡˈzɑːmpəl/'],
    etymology: 'From Latin exemplum, from eximere "to take out"',
    posGroups: [
      {
        pos: 'noun',
        definitions: [
          {
            id: 'example-noun-0',
            text: 'A thing characteristic of its kind or illustrating a general rule',
            examples: ['This painting is a good example of his early work'],
            synonyms: ['instance', 'case', 'illustration'],
            antonyms: ['exception', 'anomaly'],
            usage: 'formal',
            source: 'Lightning Dictionary Enhanced Data v1.0'
          },
          {
            id: 'example-noun-1',
            text: 'A person or thing regarded as an excellent model to copy',
            examples: ['She set a good example for her younger siblings'],
            synonyms: ['model', 'pattern', 'paradigm'],
            source: 'Lightning Dictionary Enhanced Data v1.0'
          }
        ]
      },
      {
        pos: 'verb',
        definitions: [
          {
            id: 'example-verb-0',
            text: 'To illustrate or demonstrate something',
            examples: ['The teacher exampled the concept with a diagram'],
            usage: 'rare',
            source: 'Lightning Dictionary Enhanced Data v1.0'
          }
        ]
      }
    ],
    relatedWords: ['exemplify', 'exemplary', 'exemplification'],
    totalDefinitions: 3
  };

  beforeEach(() => {
    mockOnWordClick.mockClear();
  });

  describe('Synonyms Display', () => {
    it('should display synonyms when available', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      expect(screen.getByText('Synonyms:')).toBeInTheDocument();
      expect(screen.getByText('instance')).toBeInTheDocument();
      expect(screen.getByText('case')).toBeInTheDocument();
      expect(screen.getByText('illustration')).toBeInTheDocument();
    });

    it('should make synonyms clickable', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      const synonymLink = screen.getByRole('button', { name: 'Look up instance' });
      fireEvent.click(synonymLink);
      
      expect(mockOnWordClick).toHaveBeenCalledWith('instance');
    });

    it('should not display synonyms section when no synonyms exist', () => {
      const definitionWithoutSynonyms = {
        ...enhancedDefinition,
        posGroups: [{
          pos: 'noun',
          definitions: [{
            id: 'test-noun-0',
            text: 'Test definition without synonyms',
          }]
        }]
      };
      
      render(<MultiDefinition definition={definitionWithoutSynonyms} />);
      expect(screen.queryByText('Synonyms:')).not.toBeInTheDocument();
    });
  });

  describe('Antonyms Display', () => {
    it('should display antonyms when available', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      expect(screen.getByText('Antonyms:')).toBeInTheDocument();
      expect(screen.getByText('exception')).toBeInTheDocument();
      expect(screen.getByText('anomaly')).toBeInTheDocument();
    });

    it('should make antonyms clickable', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      const antonymLink = screen.getByRole('button', { name: 'Look up exception' });
      fireEvent.click(antonymLink);
      
      expect(mockOnWordClick).toHaveBeenCalledWith('exception');
    });
  });

  describe('Usage Information', () => {
    it('should display usage information when available', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      expect(screen.getAllByText('Usage:')[0]).toBeInTheDocument();
      expect(screen.getByText('formal')).toBeInTheDocument();
      expect(screen.getByText('rare')).toBeInTheDocument();
    });

    it('should not display usage section when no usage info exists', () => {
      const definitionWithoutUsage = {
        ...enhancedDefinition,
        posGroups: [{
          pos: 'noun',
          definitions: [{
            id: 'test-noun-0',
            text: 'Test definition without usage',
          }]
        }]
      };
      
      render(<MultiDefinition definition={definitionWithoutUsage} />);
      expect(screen.queryByText('Usage:')).not.toBeInTheDocument();
    });
  });

  describe('Source Attribution', () => {
    it('should display source attribution when available', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      expect(screen.getAllByText('Source:')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Lightning Dictionary Enhanced Data v1.0')).toHaveLength(3);
    });

    it('should not display source section when no source exists', () => {
      const definitionWithoutSource = {
        ...enhancedDefinition,
        posGroups: [{
          pos: 'noun',
          definitions: [{
            id: 'test-noun-0',
            text: 'Test definition without source',
          }]
        }]
      };
      
      render(<MultiDefinition definition={definitionWithoutSource} />);
      expect(screen.queryByText('Source:')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced Examples', () => {
    it('should display multiple examples when available', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      expect(screen.getByText('This painting is a good example of his early work')).toBeInTheDocument();
      expect(screen.getByText('She set a good example for her younger siblings')).toBeInTheDocument();
      expect(screen.getByText('The teacher exampled the concept with a diagram')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should display all enhanced fields together correctly', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      // Check that all enhanced features are displayed
      expect(screen.getByText('example')).toBeInTheDocument();
      expect(screen.getByText('Origin:')).toBeInTheDocument();
      expect(screen.getByText('From Latin exemplum, from eximere "to take out"')).toBeInTheDocument();
      expect(screen.getByText('Synonyms:')).toBeInTheDocument();
      expect(screen.getByText('Antonyms:')).toBeInTheDocument();
      expect(screen.getAllByText('Usage:')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Source:')[0]).toBeInTheDocument();
      expect(screen.getByText('Related Words')).toBeInTheDocument();
    });

    it('should handle clicking on related words', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      const relatedWordLink = screen.getByRole('button', { name: 'Look up exemplify' });
      fireEvent.click(relatedWordLink);
      
      expect(mockOnWordClick).toHaveBeenCalledWith('exemplify');
    });
  });

  describe('Performance', () => {
    it('should render large definitions efficiently', () => {
      const largeDefinition = {
        ...enhancedDefinition,
        posGroups: Array(10).fill(null).map((_, i) => ({
          pos: 'noun' as const,
          definitions: Array(5).fill(null).map((_, j) => ({
            id: `test-noun-${i}-${j}`,
            text: `Definition ${i}-${j}`,
            examples: [`Example ${i}-${j}`],
            synonyms: ['synonym1', 'synonym2', 'synonym3'],
            antonyms: ['antonym1', 'antonym2'],
            usage: 'common',
            source: 'Test Source'
          }))
        }))
      };

      const startTime = performance.now();
      render(<MultiDefinition definition={largeDefinition} onWordClick={mockOnWordClick} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<MultiDefinition definition={enhancedDefinition} onWordClick={mockOnWordClick} />);
      
      // Check synonym links
      expect(screen.getByRole('button', { name: 'Look up instance' })).toBeInTheDocument();
      
      // Check antonym links
      expect(screen.getByRole('button', { name: 'Look up exception' })).toBeInTheDocument();
      
      // Check related word links
      expect(screen.getByRole('button', { name: 'Look up exemplify' })).toBeInTheDocument();
    });
  });
});