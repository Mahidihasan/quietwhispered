import React from 'react';
import ReactDOM from 'react-dom';
import MarkdownRenderer from './shared/components/MarkdownRenderer.jsx';

// Test markdown content
const testMarkdown = `
# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text* with ~~strikethrough~~

- List item 1
- List item 2
- List item 3

1. Ordered item 1
2. Ordered item 2

> Blockquote with some text

\`\`\`javascript
// Code block
const hello = "world";
console.log(hello);
\`\`\`

[Link to Google](https://www.google.com)

![Image](https://via.placeholder.com/150)

| Table | Header |
|-------|--------|
| Cell  | Data   |
`;

const TestMarkdown = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Markdown Test</h1>
      <MarkdownRenderer content={testMarkdown} />
    </div>
  );
};

ReactDOM.render(<TestMarkdown />, document.getElementById('root'));