// Test script for cross-reference functionality
// Run with: node test-cross-references.js

const { parseTextForWords, isValidWord, normalizeWord, extractWordsFromText } = require('./src/utils/wordParser');

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

// Test 5: Extract all words from text
console.log('\nTest 5: Extract all words from text');
const text5 = "Learning JavaScript isn't difficult. You'll master it quickly with practice!";
const extracted = extractWordsFromText(text5);
console.log('Input:', text5);
console.log('Extracted words:', extracted);

// Test 6: Performance test
console.log('\nTest 6: Performance test');
const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(100);
const startTime = Date.now();
const parsedLong = parseTextForWords(longText);
const endTime = Date.now();
console.log(`Parsed ${longText.length} characters in ${endTime - startTime}ms`);
console.log(`Found ${parsedLong.filter(s => s.isWord).length} words`);

console.log('\n✅ All tests completed!');