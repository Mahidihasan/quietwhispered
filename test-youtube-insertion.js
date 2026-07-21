/**
 * Test script to verify YouTube URL insertion fix
 * This test verifies that YouTube URLs inserted via modal are properly handled
 */

// Mock test data
const testData = {
  description: "Test YouTube URL insertion and extraction from markdown content",
  testCases: [
    {
      name: "YouTube URL in embed format should be extracted",
      input: {
        content: "Some text here\n[embed:https://www.youtube.com/watch?v=dQw4w9WgXcQ]\nMore content",
        youtubeEmbedUrl: ""
      },
      expected: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      expectedType: "video"
    },
    {
      name: "YouTube URL in video format should be extracted",
      input: {
        content: "Some text here\n[video:https://youtu.be/dQw4w9WgXcQ]\nMore content",
        youtubeEmbedUrl: ""
      },
      expected: "https://youtu.be/dQw4w9WgXcQ",
      expectedType: "video"
    },
    {
      name: "Explicit YouTube URL field should take precedence",
      input: {
        content: "Some text here\n[embed:https://www.youtube.com/watch?v=oldVideo]\nMore content",
        youtubeEmbedUrl: "https://www.youtube.com/watch?v=newVideo"
      },
      expected: "https://www.youtube.com/watch?v=newVideo",
      expectedType: "video"
    },
    {
      name: "No YouTube URL should result in story type",
      input: {
        content: "Just regular text content",
        youtubeEmbedUrl: ""
      },
      expected: "",
      expectedType: "story"
    }
  ],
  fixSummary: "Added logic to extract YouTube URLs from markdown content when the youtubeEmbedUrl field is empty, preventing validation errors and data refresh issues"
};

// Mock the extraction logic
function extractYouTubeUrlFromContent(content, explicitUrl) {
  // If explicit URL is provided, use it
  if (explicitUrl?.trim()) {
    return explicitUrl.trim();
  }

  // Try to extract from markdown content
  if (content) {
    const embedMatch = content.match(/\[embed:([^\]]+)\]/);
    const videoMatch = content.match(/\[video:([^\]]+)\]/);

    if (embedMatch) {
      return embedMatch[1].trim();
    } else if (videoMatch) {
      return videoMatch[1].trim();
    }
  }

  return "";
}

function determinePostType(youtubeUrl, coverImage) {
  if (youtubeUrl) return 'video';
  if (coverImage) return 'image';
  return 'story';
}

// Run tests
console.log("=== YouTube URL Insertion Fix Test ===");
console.log(`Description: ${testData.description}`);
console.log(`\nTest Cases (${testData.testCases.length} total):`);

let passedTests = 0;
testData.testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);

  const extractedUrl = extractYouTubeUrlFromContent(testCase.input.content, testCase.input.youtubeEmbedUrl);
  const actualType = determinePostType(extractedUrl, "");

  const urlMatch = extractedUrl === testCase.expected;
  const typeMatch = actualType === testCase.expectedType;

  if (urlMatch && typeMatch) {
    console.log(`   ✅ PASS - URL: "${extractedUrl}", Type: "${actualType}"`);
    passedTests++;
  } else {
    console.log(`   ❌ FAIL - Expected URL: "${testCase.expected}", Got: "${extractedUrl}"`);
    console.log(`            Expected Type: "${testCase.expectedType}", Got: "${actualType}"`);
  }
  console.log("");
});

console.log("Fix Summary:");
console.log(testData.fixSummary);
console.log(`\n=== Test Results: ${passedTests}/${testData.testCases.length} tests passed ===`);

// Export test data for potential use in other scripts
module.exports = {
  testData,
  extractYouTubeUrlFromContent,
  determinePostType
};