// Test script for cross-reference functionality
// Run with: node test-cross-references.mjs

// Mock implementation for testing
const parseTextForWords = (text) => {
  const result = [];
  const wordPattern = /\b[a-zA-Z]+(?:[-'][a-zA-Z]+)*\b/g;
  let lastIndex = 0;
  let match;
  
  while ((match = wordPattern.exec(text)) !== null) {
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
};

const isValidWord = (word) => {
  return /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(word) && word.length > 1;
};

const normalizeWord = (word) => {
  return word.toLowerCase().replace(/['']/g, "'");
};

console.log('Testing Cross-Reference Word Parser\n');

// Test 1: Basic word parsing
console.log('Test 1: Basic word parsing');
const text1 = "The quick brown fox jumps over the lazy dog.";
const parsed1 = parseTextForWords(text1);
console.log('Input:', text1);
console.log('Parsed segments:', parsed1.length);
parsed1.forEach(segment => {
  console.log(`  "${segment.text}" - isWord: ${segment.isWord}`);
});

// Test 2: Complex text with punctuation
console.log('\nTest 2: Complex text with punctuation');
const text2 = "It's a well-known fact that mother-in-law visits aren't always fun!";
const parsed2 = parseTextForWords(text2);
console.log('Input:', text2);
console.log('Words found:', parsed2.filter(s => s.isWord).map(s => s.text));

// Test 3: Valid word detection
console.log('\nTest 3: Valid word detection');
const testWords = ['hello', 'a', 'mother-in-law', "it's", '123', 'test123', 'well-known'];
testWords.forEach(word => {
  console.log(`  "${word}" - isValid: ${isValidWord(word)}`);
});

// Test 4: Word normalization
console.log('\nTest 4: Word normalization');
const wordsToNormalize = ['Hello', 'WORLD', "it's", "don't", 'café'];
wordsToNormalize.forEach(word => {
  console.log(`  "${word}" -> "${normalizeWord(word)}"`);
});

// Test 5: Performance test
console.log('\nTest 5: Performance test');
const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(100);
const startTime = Date.now();
const parsedLong = parseTextForWords(longText);
const endTime = Date.now();
console.log(`Parsed ${longText.length} characters in ${endTime - startTime}ms`);
console.log(`Found ${parsedLong.filter(s => s.isWord).length} words`);

console.log('\n✅ All cross-reference parser tests completed!');