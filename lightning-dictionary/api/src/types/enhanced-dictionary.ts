/**
 * Enhanced dictionary types for multi-definition support with POS grouping
 * (API version - shared with frontend)
 */

export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'pronoun' 
  | 'preposition' 
  | 'conjunction' 
  | 'interjection'
  | 'article'
  | 'determiner'
  | 'auxiliary';

// Mapping from single-letter codes to full POS names
export const POS_MAP: Record<string, PartOfSpeech> = {
  'n': 'noun',
  'v': 'verb',
  'j': 'adjective',
  'r': 'adverb',
  'p': 'pronoun',
  'i': 'preposition',
  'c': 'conjunction',
  'u': 'interjection',
  'a': 'article',
  'd': 'determiner',
  'x': 'auxiliary',
  'm': 'noun' // numeral, treating as noun
};

export interface Definition {
  id: string;
  text: string;
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  usage?: string;
  source?: string;
}

export interface POSGroup {
  pos: PartOfSpeech;
  definitions: Definition[];
  pronunciation?: string;
}

export interface EnhancedWordDefinition {
  word: string;
  rank: number;
  frequency: number;
  pronunciations?: string[];
  etymology?: string;
  posGroups: POSGroup[];
  relatedWords?: string[];
  totalDefinitions: number;
}

export interface MultiDefinitionResponse {
  success: boolean;
  data?: EnhancedWordDefinition;
  error?: string;
  cached: boolean;
  timestamp: number;
}

// Import from existing types
import { WordDefinition } from './dictionary';

// Utility function to convert legacy format to enhanced format
export function convertLegacyToEnhanced(
  word: string,
  legacy: WordDefinition & { synonyms?: string[]; antonyms?: string[]; usage?: string; source?: string }
): EnhancedWordDefinition {
  const pos = POS_MAP[legacy.pos] || 'noun';
  
  return {
    word,
    rank: legacy.rank,
    frequency: legacy.frequency,
    pronunciations: legacy.pronunciation ? [legacy.pronunciation] : [],
    posGroups: [{
      pos,
      definitions: legacy.definitions.map((text, index) => ({
        id: `${word}-${pos}-${index}`,
        text,
        examples: legacy.examples,
        synonyms: legacy.synonyms,
        antonyms: legacy.antonyms,
        usage: legacy.usage,
        source: legacy.source
      })),
      pronunciation: legacy.pronunciation
    }],
    totalDefinitions: legacy.definitions.length || 1
  };
}

// Mock data generator for development
export function generateMockDefinitions(word: string): EnhancedWordDefinition {
  const mockData: Record<string, EnhancedWordDefinition> = {
    'example': {
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
              usage: 'formal'
            },
            {
              id: 'example-noun-1',
              text: 'A person or thing regarded as an excellent model to copy',
              examples: ['She set a good example for her younger siblings'],
              synonyms: ['model', 'pattern', 'paradigm']
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
              usage: 'rare'
            }
          ]
        }
      ],
      relatedWords: ['exemplify', 'exemplary', 'exemplification'],
      totalDefinitions: 3
    },
    'run': {
      word: 'run',
      rank: 125,
      frequency: 1234567,
      pronunciations: ['/rʌn/'],
      posGroups: [
        {
          pos: 'verb',
          definitions: [
            {
              id: 'run-verb-0',
              text: 'Move at a speed faster than a walk',
              examples: ['She ran to catch the bus'],
              synonyms: ['sprint', 'race', 'dash']
            },
            {
              id: 'run-verb-1',
              text: 'Manage or be in charge of',
              examples: ['He runs a successful business'],
              synonyms: ['manage', 'direct', 'operate']
            },
            {
              id: 'run-verb-2',
              text: 'Function or operate',
              examples: ['The car runs on diesel'],
              synonyms: ['work', 'function', 'operate']
            }
          ]
        },
        {
          pos: 'noun',
          definitions: [
            {
              id: 'run-noun-0',
              text: 'An act or spell of running',
              examples: ['I went for a run this morning'],
              synonyms: ['jog', 'sprint', 'dash']
            },
            {
              id: 'run-noun-1',
              text: 'A continuous period or sequence',
              examples: ['The play had a successful run on Broadway'],
              synonyms: ['period', 'stretch', 'sequence']
            }
          ]
        }
      ],
      relatedWords: ['runner', 'running', 'runaway'],
      totalDefinitions: 5
    }
  };

  // Return mock data if available, otherwise generate basic structure
  if (mockData[word.toLowerCase()]) {
    return mockData[word.toLowerCase()];
  }

  // Generate basic structure for any word
  return {
    word,
    rank: Math.floor(Math.random() * 5000) + 1,
    frequency: Math.floor(Math.random() * 1000000) + 1000,
    pronunciations: [`/${word}/`],
    posGroups: [{
      pos: 'noun',
      definitions: [{
        id: `${word}-noun-0`,
        text: `Definition for ${word}`,
        examples: [`This is an example of ${word}`]
      }]
    }],
    totalDefinitions: 1
  };
}