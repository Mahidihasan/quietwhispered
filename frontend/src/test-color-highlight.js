import React from 'react';
import ReactDOM from 'react-dom';
import MarkdownRenderer from './shared/components/MarkdownRenderer.jsx';

// Test case that reproduces the issue with both color and highlighting
const testContent = `
# Test Journal Entry

## What Happened
<span style="color: #2980b9;">Today I decided to leave my phone in my backpack</span> and simply walk without a destination.

<mark style="background:#d4a574">This is some highlighted text that should have a background color.</mark>

## Regular markdown content
This should render normally with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

## Mixed content
Here's some <span style="color: #e74c3c;">colored text</span> mixed with <mark style="background:#f1c40f">highlighted text</mark> and **bold** text.
`;

const TestColorHighlight = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Color and Highlight Test</h1>
      <h2>Original Content:</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>
        {testContent}
      </pre>
      <h2>Rendered Output:</h2>
      <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '3px' }}>
        <MarkdownRenderer content={testContent} />
      </div>
    </div>
  );
};

ReactDOM.render(<TestColorHighlight />, document.getElementById('root'));