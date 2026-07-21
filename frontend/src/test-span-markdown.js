import React from 'react';
import ReactDOM from 'react-dom';
import MarkdownRenderer from './shared/components/MarkdownRenderer.jsx';

// Test case that reproduces the issue
const testContent = '<span style="color: #2980b9;">## What Happened</span>\n\nThis is some content that should be rendered as markdown.';

const TestSpanMarkdown = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Span with Markdown Test</h1>
      <h2>Original Content:</h2>
      <pre>{testContent}</pre>
      <h2>Rendered Output:</h2>
      <MarkdownRenderer content={testContent} />
    </div>
  );
};

ReactDOM.render(<TestSpanMarkdown />, document.getElementById('root'));