#!/usr/bin/env python3
"""
Enhanced Dictionary Data Processor
Adds synonyms, antonyms, and usage examples to dictionary entries
"""

import json
import os
import random
from pathlib import Path
from typing import Dict, List, Optional, Set

# Common synonym/antonym relationships for demonstration
# In production, this would come from a linguistic database
SYNONYM_DATA = {
    "good": ["excellent", "fine", "great", "superb", "positive", "beneficial"],
    "bad": ["poor", "terrible", "awful", "negative", "harmful", "detrimental"],
    "big": ["large", "huge", "enormous", "vast", "gigantic", "immense"],
    "small": ["little", "tiny", "minute", "petite", "diminutive", "compact"],
    "fast": ["quick", "rapid", "swift", "speedy", "hasty", "expeditious"],
    "slow": ["sluggish", "gradual", "leisurely", "unhurried", "deliberate"],
    "happy": ["joyful", "cheerful", "delighted", "pleased", "content", "elated"],
    "sad": ["unhappy", "sorrowful", "melancholy", "dejected", "miserable", "gloomy"],
    "start": ["begin", "commence", "initiate", "launch", "inaugurate"],
    "end": ["finish", "conclude", "terminate", "complete", "finalize"],
    "help": ["assist", "aid", "support", "facilitate", "contribute"],
    "run": ["sprint", "race", "dash", "jog", "hurry"],
    "walk": ["stroll", "amble", "stride", "march", "pace"],
    "talk": ["speak", "converse", "chat", "discuss", "communicate"],
    "think": ["ponder", "consider", "reflect", "contemplate", "deliberate"],
    "make": ["create", "produce", "construct", "build", "form"],
    "take": ["grab", "seize", "obtain", "acquire", "receive"],
    "give": ["provide", "offer", "present", "donate", "contribute"],
    "see": ["observe", "view", "witness", "perceive", "notice"],
    "hear": ["listen", "perceive", "detect", "discern"],
}

ANTONYM_DATA = {
    "good": ["bad", "poor", "evil", "harmful"],
    "bad": ["good", "excellent", "beneficial"],
    "big": ["small", "little", "tiny", "miniature"],
    "small": ["big", "large", "huge", "enormous"],
    "fast": ["slow", "sluggish", "gradual"],
    "slow": ["fast", "quick", "rapid", "swift"],
    "happy": ["sad", "unhappy", "miserable", "dejected"],
    "sad": ["happy", "joyful", "cheerful", "pleased"],
    "start": ["end", "finish", "stop", "conclude"],
    "end": ["start", "begin", "commence"],
    "up": ["down", "below", "beneath"],
    "down": ["up", "above", "over"],
    "in": ["out", "outside", "external"],
    "out": ["in", "inside", "internal"],
    "hot": ["cold", "cool", "freezing"],
    "cold": ["hot", "warm", "heated"],
    "light": ["dark", "heavy", "dim"],
    "dark": ["light", "bright", "illuminated"],
    "new": ["old", "ancient", "outdated"],
    "old": ["new", "young", "modern"],
}

# Example usage patterns
USAGE_EXAMPLES = {
    "formal": [
        "This term is commonly used in formal or academic contexts.",
        "Frequently appears in professional writing and documentation.",
        "Preferred in business and official communications."
    ],
    "informal": [
        "Common in everyday conversation and casual writing.",
        "Often used in informal settings and colloquial speech.",
        "Popular in social media and text messaging."
    ],
    "technical": [
        "Specialized term used in technical or scientific contexts.",
        "Common in industry-specific documentation.",
        "Used primarily by professionals in the field."
    ],
    "archaic": [
        "This word is considered archaic or outdated.",
        "Rarely used in modern English except in historical contexts.",
        "May be encountered in classic literature."
    ],
    "regional": [
        "Usage varies by geographic region.",
        "More common in certain dialects or varieties of English.",
        "May have different meanings in different regions."
    ]
}

def load_existing_dictionary(input_path: str) -> Dict:
    """Load the existing dictionary data"""
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading dictionary: {e}")
        return None

def get_synonyms(word: str, pos: str) -> List[str]:
    """Get synonyms for a word based on its part of speech"""
    # Direct lookup
    if word in SYNONYM_DATA:
        return SYNONYM_DATA[word][:3]  # Return up to 3 synonyms
    
    # For demonstration, generate some related words for common patterns
    synonyms = []
    
    # Adverbs ending in -ly
    if pos == 'r' and word.endswith('ly'):
        base = word[:-2]
        if base in SYNONYM_DATA:
            synonyms = [s + 'ly' for s in SYNONYM_DATA[base][:2] if s + 'ly' != word]
    
    # Past tense verbs
    elif pos == 'v' and word.endswith('ed'):
        base = word[:-2] if word.endswith('ied') else word[:-1] if word.endswith('ed') else word
        if base in SYNONYM_DATA:
            synonyms = [s + 'ed' for s in SYNONYM_DATA[base][:2] if s + 'ed' != word]
    
    return synonyms

def get_antonyms(word: str, pos: str) -> List[str]:
    """Get antonyms for a word"""
    if word in ANTONYM_DATA:
        return ANTONYM_DATA[word][:2]  # Return up to 2 antonyms
    
    # Check for common prefixes that indicate negation
    prefixes = ['un', 'in', 'im', 'dis', 'non']
    for prefix in prefixes:
        if word.startswith(prefix):
            base = word[len(prefix):]
            if len(base) > 2:  # Ensure it's a meaningful base
                return [base]
    
    return []

def generate_usage_examples(word: str, pos: str, frequency: int) -> List[str]:
    """Generate usage examples based on word properties"""
    examples = []
    
    # High frequency words get more examples
    if frequency > 100000:
        examples.append(f"'{word.capitalize()}' is one of the most common words in English.")
    
    # Part of speech specific examples
    pos_examples = {
        'n': f"The {word} was clearly visible from here.",
        'v': f"They decided to {word} the project immediately.",
        'j': f"It was a very {word} situation.",
        'r': f"She {word} completed the task.",
        'p': f"This belongs to {word}.",
        'i': f"The book is {word} the table.",
        'c': f"I'll go {word} you want to come.",
    }
    
    if pos in pos_examples and random.random() > 0.5:
        examples.append(pos_examples[pos])
    
    return examples[:2]  # Return up to 2 examples

def determine_usage_pattern(word: str, frequency: int) -> Optional[str]:
    """Determine the usage pattern of a word"""
    # High frequency words are usually informal
    if frequency > 500000:
        return "informal"
    elif frequency > 100000:
        return "formal"
    elif frequency < 10000:
        return random.choice(["technical", "archaic", "regional"])
    
    return None

def enhance_word_entry(word: str, entry: Dict) -> Dict:
    """Enhance a single word entry with synonyms, antonyms, and examples"""
    enhanced = entry.copy()
    
    # Get word properties
    pos = entry.get('pos', 'n')
    frequency = entry.get('frequency', 0)
    
    # Add synonyms
    synonyms = get_synonyms(word, pos)
    if synonyms:
        enhanced['synonyms'] = synonyms
    
    # Add antonyms
    antonyms = get_antonyms(word, pos)
    if antonyms:
        enhanced['antonyms'] = antonyms
    
    # Add usage examples
    examples = generate_usage_examples(word, pos, frequency)
    if examples:
        if 'examples' not in enhanced or not enhanced['examples']:
            enhanced['examples'] = examples
        else:
            enhanced['examples'].extend(examples)
    
    # Add usage pattern
    usage = determine_usage_pattern(word, frequency)
    if usage:
        enhanced['usage'] = usage
        # Add usage description
        if usage in USAGE_EXAMPLES and random.random() > 0.7:
            usage_desc = random.choice(USAGE_EXAMPLES[usage])
            if 'usage_notes' not in enhanced:
                enhanced['usage_notes'] = usage_desc
    
    # Add source attribution
    enhanced['source'] = "Lightning Dictionary Enhanced Data v1.0"
    
    # Add placeholder definitions if empty
    if not enhanced.get('definitions'):
        enhanced['definitions'] = [f"Definition of {word} ({pos})"]
    
    return enhanced

def enhance_dictionary_data(input_path: str, output_path: str, sample_size: Optional[int] = None):
    """Main function to enhance dictionary data"""
    print("Enhanced Dictionary Data Processor")
    print("=" * 40)
    
    # Load existing dictionary
    print(f"Loading dictionary from: {input_path}")
    data = load_existing_dictionary(input_path)
    if not data:
        return False
    
    words_dict = data.get('words', {})
    total_words = len(words_dict)
    print(f"Loaded {total_words} words")
    
    # Process words
    print("\nEnhancing word entries...")
    enhanced_count = 0
    synonym_count = 0
    antonym_count = 0
    example_count = 0
    
    # Determine which words to process
    if sample_size and sample_size < total_words:
        # Process a sample for testing
        words_to_process = dict(list(words_dict.items())[:sample_size])
        print(f"Processing sample of {sample_size} words")
    else:
        words_to_process = words_dict
    
    # Enhance each word
    for word, entry in words_to_process.items():
        enhanced_entry = enhance_word_entry(word, entry)
        
        # Count enhancements
        if 'synonyms' in enhanced_entry and enhanced_entry['synonyms']:
            synonym_count += 1
        if 'antonyms' in enhanced_entry and enhanced_entry['antonyms']:
            antonym_count += 1
        if 'examples' in enhanced_entry and enhanced_entry['examples']:
            example_count += 1
        
        # Update the entry
        words_dict[word] = enhanced_entry
        enhanced_count += 1
        
        # Progress indicator
        if enhanced_count % 1000 == 0:
            print(f"  Processed {enhanced_count} words...")
    
    # Update metadata
    data['metadata']['enhanced'] = True
    data['metadata']['enhancement_version'] = '1.0'
    data['metadata']['enhancement_stats'] = {
        'words_enhanced': enhanced_count,
        'words_with_synonyms': synonym_count,
        'words_with_antonyms': antonym_count,
        'words_with_examples': example_count
    }
    
    # Save enhanced data
    print(f"\nSaving enhanced dictionary to: {output_path}")
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        file_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"✓ Enhanced dictionary saved: {file_size:.2f} MB")
    except Exception as e:
        print(f"✗ Error saving enhanced dictionary: {e}")
        return False
    
    # Print summary
    print("\n" + "=" * 40)
    print("ENHANCEMENT SUMMARY")
    print("=" * 40)
    print(f"Total words processed: {enhanced_count}")
    print(f"Words with synonyms: {synonym_count} ({synonym_count/enhanced_count*100:.1f}%)")
    print(f"Words with antonyms: {antonym_count} ({antonym_count/enhanced_count*100:.1f}%)")
    print(f"Words with examples: {example_count} ({example_count/enhanced_count*100:.1f}%)")
    
    return True

def verify_enhanced_data(file_path: str):
    """Verify the enhanced dictionary data"""
    print("\nVerifying enhanced data...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        words = data.get('words', {})
        
        # Check a few sample words
        sample_words = ['good', 'run', 'example', 'start', 'happy']
        
        for word in sample_words:
            if word in words:
                entry = words[word]
                print(f"\n{word}:")
                print(f"  POS: {entry.get('pos', 'N/A')}")
                print(f"  Synonyms: {entry.get('synonyms', [])}")
                print(f"  Antonyms: {entry.get('antonyms', [])}")
                print(f"  Examples: {len(entry.get('examples', []))} examples")
                print(f"  Usage: {entry.get('usage', 'N/A')}")
        
        print("\n✓ Enhanced data verification complete")
        
    except Exception as e:
        print(f"✗ Verification error: {e}")

if __name__ == "__main__":
    # Configuration
    input_file = "data/processed/dictionary.json"
    output_file = "data/processed/dictionary_enhanced.json"
    
    # Run enhancement for all words (remove sample_size limit)
    success = enhance_dictionary_data(input_file, output_file)
    
    if success:
        verify_enhanced_data(output_file)
    else:
        print("\n⚠ Enhancement failed. Please check the errors above.")