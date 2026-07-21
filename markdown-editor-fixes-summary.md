# Markdown Editor Fixes - Summary

## Table of Contents
- [Modal Overlay Visibility Fix](#modal-overlay-visibility-fix)
- [YouTube URL Insertion Fix](#youtube-url-insertion-fix)

## Modal Overlay Visibility Fix

### Problem Description
The `md-url-modal-overlay` components (video and embed modals) were only appearing in the "Write" tab of the markdown editor, but not in the "Source" tab. When users clicked the video or embed buttons while in the Source tab, the modals would not appear.

### Root Cause Analysis
The issue was in the `LiveMarkdownEditor.jsx` file where the modal overlay components were conditionally rendered inside the `!showSource` block (lines 882-1069 in the original code). This meant they were only rendered when `showSource` was `false` (i.e., in the Write tab).

```jsx
{!showSource && (
  <div className="md-live-edit-area">
    {/* Modal overlays were here - only visible in Write tab */}
    {videoModal.open && <div className="md-url-modal-overlay">...</div>}
    {embedModal.open && <div className="md-url-modal-overlay">...</div>}
  </div>
)}
```

### Solution Implemented
Moved the modal overlay components outside of the conditional rendering blocks so they appear in both tabs:

1. **Moved modal overlays**: Extracted the video and embed modal components from inside the `!showSource` block
2. **Placed them at the editor body level**: Positioned the modals at the same level as the conditional tab content
3. **Maintained functionality**: All modal functionality (opening, closing, insertion) remains unchanged

### Code Changes
#### Before (Problematic Code)
```jsx
<div className="md-editor-body">
  {showSource && (
    <textarea ... />
  )}

  {!showSource && (
    <div className="md-live-edit-area">
      {/* Modals only visible in Write tab */}
      {videoModal.open && <div className="md-url-modal-overlay">...</div>}
      {embedModal.open && <div className="md-url-modal-overlay">...</div>}
    </div>
  )}
</div>
```

#### After (Fixed Code)
```jsx
<div className="md-editor-body">
  {showSource && (
    <textarea ... />
  )}

  {/* Modals now visible in both tabs */}
  {videoModal.open && (
    <div className="md-url-modal-overlay" onClick={() => setVideoModal({ open: false, value: '' })}>
      {/* Video modal content */}
    </div>
  )}

  {embedModal.open && (
    <div className="md-url-modal-overlay" onClick={() => setEmbedModal({ open: false, value: '' })}>
      {/* Embed modal content */}
    </div>
  )}

  {!showSource && (
    <div className="md-live-edit-area">
      {/* Write tab content */}
    </div>
  )}
</div>
```

### Testing Results
✅ **All test cases pass**:
- Video modal appears in Write tab
- Video modal appears in Source tab
- Embed modal appears in Write tab
- Embed modal appears in Source tab

### Impact
- **User Experience**: Users can now insert videos and embeds from both Write and Source tabs
- **Consistency**: Modal behavior is now consistent across all editor tabs
- **Functionality**: All existing functionality remains intact
- **Performance**: No performance impact as the modals only render when their respective state is `open`

## YouTube URL Insertion Fix

### Problem Description
When users inserted YouTube URLs via the embed/video modal, the URLs were being added to the markdown content using `[embed:url]` or `[video:url]` format, but the `youtubeEmbedUrl` field in the form data remained empty. This caused validation errors ("Function updateDoc() called with invalid data. Unsupported field value: undefined") and resulted in the entry data being refreshed instead of saved.

### Root Cause Analysis
The issue was in the `PostEditor.jsx` component where YouTube URLs were being handled in two different ways:

1. **In markdown content**: Using `[embed:youtube-url]` or `[video:youtube-url]` format (from modal insertion)
2. **In form data**: Using the `youtubeEmbedUrl` field (from sidebar input)

When the form was submitted, only the `youtubeEmbedUrl` field from form data was being used, but if users inserted YouTube URLs via the modal, this field would be empty, causing the validation error.

### Solution Implemented
Added logic to extract YouTube URLs from markdown content when the `youtubeEmbedUrl` field is empty:

1. **Extract from markdown**: Parse the content for `[embed:url]` or `[video:url]` patterns
2. **Fallback logic**: Use explicit `youtubeEmbedUrl` field if provided (sidebar input takes precedence)
3. **Update payload**: Ensure the extracted URL is used in the final payload

### Code Changes
#### Added Extraction Logic
```javascript
// Extract YouTube URL from markdown content if not already in form data
let finalYoutubeEmbedUrl = youtubeEmbedUrl;
if (!finalYoutubeEmbedUrl && formData.content) {
    // Look for [embed:youtube-url] or [video:youtube-url] patterns
    const embedMatch = formData.content.match(/\[embed:([^\]]+)\]/);
    const videoMatch = formData.content.match(/\[video:([^\]]+)\]/);
    if (embedMatch) {
        finalYoutubeEmbedUrl = embedMatch[1].trim();
    } else if (videoMatch) {
        finalYoutubeEmbedUrl = videoMatch[1].trim();
    }
}

// Update payload with extracted URL
const payload = {
    // ... other fields
    youtubeEmbedUrl: finalYoutubeEmbedUrl,
    type: finalYoutubeEmbedUrl ? 'video' : postType,
    media: finalYoutubeEmbedUrl || mediaUrl,
    // ... other fields
};
```

### Testing Results
✅ **All test cases pass**:
- YouTube URL in embed format is extracted correctly
- YouTube URL in video format is extracted correctly
- Explicit YouTube URL field takes precedence over embedded URLs
- No YouTube URL results in correct post type (story)

### Impact
- **Bug Fix**: Eliminates the "Unsupported field value: undefined" validation error
- **Data Integrity**: Prevents entry data from being refreshed instead of saved
- **User Experience**: YouTube URLs inserted via modal now work correctly
- **Backward Compatibility**: Existing functionality with sidebar YouTube URL input remains unchanged

## Files Modified
- `admin/src/components/LiveMarkdownEditor.jsx` - Modal overlay visibility fix
- `admin/src/components/PostEditor.jsx` - YouTube URL extraction logic
- `test-editor-functionality.js` - Test script for modal overlay fix
- `test-youtube-insertion.js` - Test script for YouTube URL fix
- `markdown-editor-fixes-summary.md` - This documentation

## Verification
Both fixes have been tested and verified to work correctly:

1. **Modal Overlay Fix**: Users can now insert videos/embeds from both Write and Source tabs
2. **YouTube URL Fix**: YouTube URLs inserted via modal are properly extracted and saved, preventing validation errors and data refresh issues

The fixes maintain all existing functionality while resolving the reported issues.
