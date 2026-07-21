import { processContent, bbcodeToMarkdown } from './shared/utils/markdownPreprocessor';

// Test the preprocessing
const testInput = '<mark style="background:#d4a574">Today I decided to leave my phone in my backpack and simply walk without a destination.</mark>';

console.log('Input:', testInput);
console.log('bbcodeToMarkdown result:', bbcodeToMarkdown(testInput));
console.log('processContent result:', processContent(testInput));