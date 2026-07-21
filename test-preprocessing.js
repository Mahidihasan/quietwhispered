// Simple test to check if preprocessing works
const testInput = '<mark style="background:#d4a574">Today I decided to leave my phone in my backpack and simply walk without a destination.</mark>';

console.log('Testing mark tag preprocessing...');
console.log('Input:', testInput);

// Simple regex test
const markRegex = /<mark[^>]*style="background:\s*([^"]+)"[^>]*>(.*?)<\/mark>/gi;
const match = markRegex.exec(testInput);

if (match) {
  console.log('Regex match found!');
  console.log('Background color:', match[1]);
  console.log('Content:', match[2]);
  console.log('Replacement would be:', `{{highlight:${match[1]}|${match[2]}}}`);
} else {
  console.log('No match found - regex may not be working');
}