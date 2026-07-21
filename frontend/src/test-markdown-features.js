import React from 'react';
import ReactDOM from 'react-dom';
import MinimalMarkdownTest from './shared/components/MinimalMarkdownTest.jsx';

// Test all markdown features individually
const testCases = [
  {
    name: "Basic Heading",
    markdown: "# Heading 1\n## Heading 2\n### Heading 3"
  },
  {
    name: "Bold and Italic",
    markdown: "**Bold text** and *italic text* with ~~strikethrough~~"
  },
  {
    name: "Lists",
    markdown: "- List item 1\n- List item 2\n- List item 3\n\n1. Ordered item 1\n2. Ordered item 2"
  },
  {
    name: "Task Lists",
    markdown: "- [ ] Task 1\n- [x] Task 2 completed\n- [ ] Task 3"
  },
  {
    name: "Blockquotes",
    markdown: "> This is a blockquote\n> with multiple lines"
  },
  {
    name: "Inline Code",
    markdown: "Use `console.log()` for debugging"
  },
  {
    name: "Code Blocks",
    markdown: "```javascript\nconsole.log(\"Hello World\");\nconst x = 5;\n```"
  },
  {
    name: "Links",
    markdown: "[Google](https://www.google.com)"
  },
  {
    name: "Tables",
    markdown: "| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |"
  },
  {
    name: "Horizontal Rules",
    markdown: "---"
  },
  {
    name: "Mixed Content",
    markdown: "# Mixed Test\n\n**Bold** and *italic* text with a [link](https://example.com).\n\n- List item\n- Another item\n\n```js\ncode block\n```\n\n> Quote\n\n| Table | Header |\n|-------|---------|\n| Data  | Value   |"
  }
];

const TestMarkdownFeatures = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Markdown Feature Tests</h1>
      <p>Testing react-markdown without any plugins first...</p>

      {testCases.map((testCase, index) => (
        <div key={index} style={{ marginBottom: '40px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>{testCase.name}</h3>
          <h4>Markdown Source:</h4>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '3px', overflowX: 'auto' }}>
            {testCase.markdown}
          </pre>
          <h4>Rendered Output:</h4>
          <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '3px' }}>
            <MinimalMarkdownTest content={testCase.markdown} />
          </div>
        </div>
      ))}
    </div>
  );
};

ReactDOM.render(<TestMarkdownFeatures />, document.getElementById('root'));