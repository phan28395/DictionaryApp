export interface ParsedWord {
  text: string;
  isWord: boolean;
  original: string;
}

export const WORD_PATTERN = /\b[a-zA-Z]+(?:[-'][a-zA-Z]+)*\b/g;

export function parseTextForWords(text: string): ParsedWord[] {
  const result: ParsedWord[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  const pattern = new RegExp(WORD_PATTERN);
  
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({
        text: text.substring(lastIndex, match.index),
        isWord: false,
        original: text.substring(lastIndex, match.index)
      });
    }
    
    result.push({
      text: match[0],
      isWord: true,
      original: match[0]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    result.push({
      text: text.substring(lastIndex),
      isWord: false,
      original: text.substring(lastIndex)
    });
  }
  
  return result;
}

export function isValidWord(word: string): boolean {
  return /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(word) && word.length > 1;
}

export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/['']/g, "'");
}

export function extractWordsFromText(text: string): string[] {
  const matches = text.match(WORD_PATTERN) || [];
  return matches
    .filter(word => isValidWord(word))
    .map(word => normalizeWord(word));
}

export function highlightWord(text: string, word: string): string {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\b${escapedWord}\\b`, 'gi');
  return text.replace(pattern, '<mark>$&</mark>');
}