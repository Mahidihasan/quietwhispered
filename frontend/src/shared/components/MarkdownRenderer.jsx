import React, { useMemo, Component } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import { FiLink, FiCode, FiType } from 'react-icons/fi';
import { processContent, extractCustomBlocks } from '../utils/markdownPreprocessor';
import MediaCard from './MediaCard.jsx';
import SpotifyPlayer from './SpotifyPlayer.jsx';
import { getMediaType } from '../utils/mediaUtils';

/**
 * Error boundary to catch ReactMarkdown rendering crashes
 * (known incompatibilities between react-markdown@8 and remark-gfm@4 dependencies)
 */
class MarkdownErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('MarkdownRenderer crashed, rendering plain text fallback:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="markdown-fallback">{this.props.content}</div>;
    }
    return this.props.children;
  }
}

/**
 * MarkdownRenderer
 * 
 * Renders journal entry content with full Markdown + HTML support.
 * Falls back to plain text if ReactMarkdown crashes.
 * 
 * Uses rehypeRaw to render HTML tags from toolbar (span, mark, u, etc.)
 * alongside standard Markdown syntax.
 * 
 * Pre-processes content to convert BBCode/custom syntax to standard Markdown:
 * - [b] → **, [i] → *, [s] → ~~ (markdown equivalents)
 * - [u], [color], [size], [font], [mark] → HTML tags (preserved for rehypeRaw)
 * - [link=url]text[/link] → [text](url)
 * - [image:url|caption] → ![caption](url)
 * - [video:url], [embed:url] → rendered as custom MediaCard components
 * - [quote]text[/quote] → > text
 * - [align=...]text[/align] → text (alignment stripped)
 * - [code]...[/code] → ``` code blocks
 * - [list=style]/[/list]/[*] → standard markdown lists
 */

const PlainTextFallback = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n').map((line, i) => {
    // Strip BBCode tags for plain text view
    const cleaned = line
      .replace(/\[[^\]]*\]/g, '')
      .replace(/<\/?[^>]+>/g, '')
      .trim();
    return cleaned ? <p key={i} className="markdown-fallback-paragraph">{cleaned}</p> : <br key={i} />;
  });
  return <div className="markdown-content markdown-fallback">{lines}</div>;
};

/**
 * Get bullet style CSS class based on the bullet style setting
 */
const getBulletStyleClass = (style) => {
  if (!style || style === 'default') return '';
  return `bullet-style-${style}`;
};

/**
 * Get quote style CSS class based on the quote style setting
 */
const getQuoteStyleClass = (style) => {
  if (!style || style === 'minimal') return 'quote-style-minimal';
  return `quote-style-${style}`;
};

const MarkdownContent = ({ content, className, customBlockMap, consumedLines, contentLines, options }) => {
  if (!content) return null;

  const elements = [];
  let markdownBuffer = [];
  let currentAlign = null;
  let currentListStyle = null;

  const flushMarkdown = () => {
    if (markdownBuffer.length > 0) {
      const mdContent = markdownBuffer.join('\n');
      elements.push(
        <ReactMarkdown
          key={`md-${elements.length}`}
          className={`markdown-content ${className}`}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ node, children, ...props }) => (
              <h1 {...props} className="markdown-heading-1">{children}</h1>
            ),
            h2: ({ node, children, ...props }) => (
              <h2 {...props} className="markdown-heading-2">{children}</h2>
            ),
            h3: ({ node, children, ...props }) => (
              <h3 {...props} className="markdown-heading-3">{children}</h3>
            ),
            h4: ({ node, children, ...props }) => (
              <h4 {...props} className="markdown-heading-4">{children}</h4>
            ),
            h5: ({ node, children, ...props }) => (
              <h5 {...props} className="markdown-heading-5">{children}</h5>
            ),
            h6: ({ node, children, ...props }) => (
              <h6 {...props} className="markdown-heading-6">{children}</h6>
            ),
            p: ({ node, children, ...props }) => {
              const style = currentAlign ? { textAlign: currentAlign } : {};
              return <p {...props} className="markdown-paragraph" style={style}>{children}</p>;
            },
            span: ({ node, children, ...props }) => {
              // Preserve span tags with style attributes (for colored text, font size, etc.)
              return <span {...props} className="markdown-inline-html">{children}</span>;
            },
            mark: ({ node, children, ...props }) => {
              // Preserve mark tags with style attributes (for highlighting)
              return <mark {...props} className="markdown-highlight">{children}</mark>;
            },
            u: ({ node, children, ...props }) => {
              return <u {...props} className="markdown-underline">{children}</u>;
            },
            a: ({ node, children, href, ...props }) => {
              const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
              return (
                <a
                  {...props}
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="markdown-link"
                >
                  {children}
                  {isExternal && <FiLink className="external-link-icon" />}
                </a>
              );
            },
            img: ({ node, src, alt, ...props }) => (
              <span className="markdown-image-wrapper">
                <img {...props} src={src} alt={alt || ''} className="markdown-image" />
                {alt && <em className="markdown-image-caption">{alt}</em>}
              </span>
            ),
            ul: ({ node, children, ...props }) => {
              const styleClass = getBulletStyleClass(options?.bulletStyle || currentListStyle);
              return (
                <ul {...props} className={`markdown-list ${styleClass}`.trim()}>{children}</ul>
              );
            },
            ol: ({ node, children, ...props }) => (
              <ol {...props} className="markdown-list">{children}</ol>
            ),
            li: ({ node, children, ...props }) => {
              const { ordered, ...rest } = props;
              return (
                <li {...rest} className="markdown-list-item">{children}</li>
              );
            },
            blockquote: ({ node, children, ...props }) => {
              const styleClass = getQuoteStyleClass(options?.quoteStyle);
              return (
                <blockquote {...props} className={`markdown-blockquote ${styleClass}`.trim()}>
                  <FiType className="blockquote-icon" />
                  <div className="blockquote-content">{children}</div>
                </blockquote>
              );
            },
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match) {
                return (
                  <div className="markdown-code-block">
                    <div className="code-header">
                      <FiCode className="code-icon" />
                      <span className="code-language">{match[1]}</span>
                    </div>
                    <SyntaxHighlighter language={match[1]} {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return (
                <code {...props} className={`markdown-inline-code ${className || ''}`}>
                  {children}
                </code>
              );
            },
            table: ({ node, children, ...props }) => (
              <div className="markdown-table-container">
                <table {...props} className="markdown-table">{children}</table>
              </div>
            ),
            th: ({ node, children, ...props }) => (
              <th {...props} className="markdown-table-header">{children}</th>
            ),
            td: ({ node, children, ...props }) => (
              <td {...props} className="markdown-table-cell">{children}</td>
            ),
            hr: () => <hr className="markdown-hr" />,
            input: ({ node, checked, ...props }) => (
              <input
                {...props}
                type="checkbox"
                checked={checked}
                readOnly
                className="markdown-task-checkbox"
              />
            ),
            del: ({ children, ...props }) => <del className="markdown-strikethrough" {...props}>{children}</del>,
            em: ({ children, ...props }) => <em className="markdown-italic" {...props}>{children}</em>,
            strong: ({ children, ...props }) => <strong className="markdown-bold" {...props}>{children}</strong>,
          }}
        >
          {mdContent}
        </ReactMarkdown>
      );
      markdownBuffer = [];
    }
  };

  for (let i = 0; i < contentLines.length; i++) {
    if (consumedLines.has(i)) {
      flushMarkdown();
      const block = customBlockMap[i];
      if (block) {
        if (block.type === 'video' || block.type === 'embed') {
          const mediaType = getMediaType(block.src);
          if (mediaType === 'youtube') {
            elements.push(
              <div key={`custom-${i}`} className="entry-media inline-media is-video">
                <MediaCard
                  src={block.src}
                  alt="YouTube video"
                  className="dotted-frame"
                />
              </div>
            );
          } else if (mediaType === 'spotify') {
            elements.push(
              <div key={`custom-${i}`} className="entry-media inline-media is-spotify">
                <SpotifyPlayer url={block.src} compact={true} />
              </div>
            );
          } else {
            elements.push(
              <div key={`custom-${i}`} className="entry-media inline-media is-video">
                <MediaCard
                  src={block.src}
                  alt="Embedded media"
                  className="dotted-frame"
                />
              </div>
            );
          }
        } else if (block.type === 'image') {
          elements.push(
            <div key={`custom-${i}`} className="entry-media inline-media">
              <MediaCard
                src={block.src}
                alt={block.caption || 'Image'}
                caption={block.caption || undefined}
                className="polaroid-card"
              />
            </div>
          );
        } else if (block.type === 'align-start') {
          currentAlign = block.align;
        } else if (block.type === 'align-end') {
          currentAlign = null;
        } else if (block.type === 'list-style') {
          currentListStyle = block.style;
        }
      }
    } else {
      markdownBuffer.push(contentLines[i]);
    }
  }
  flushMarkdown();

  return <>{elements}</>;
};

const MarkdownRenderer = ({ content, className = '', bulletStyle, quoteStyle }) => {
  // Always process content through the preprocessing pipeline
  const { processedContent, customBlocks } = useMemo(() => {
    if (!content) return { processedContent: '', customBlocks: [] };
    const preprocessed = processContent(content);
    const { processedContent, blocks } = extractCustomBlocks(preprocessed);
    return { processedContent, customBlocks: blocks };
  }, [content]);

  const customBlockMap = useMemo(() => {
    const map = {};
    customBlocks.forEach((block) => {
      map[block.line] = block;
    });
    return map;
  }, [customBlocks]);

  const consumedLines = useMemo(() => {
    return new Set(customBlocks.map(b => b.line));
  }, [customBlocks]);

  const contentLines = useMemo(() => {
    return processedContent.split('\n');
  }, [processedContent]);

  const options = useMemo(() => ({
    bulletStyle: bulletStyle || 'default',
    quoteStyle: quoteStyle || 'minimal',
  }), [bulletStyle, quoteStyle]);

  if (!content) return null;

  return (
    <MarkdownErrorBoundary content={processedContent} fallback={<PlainTextFallback content={processedContent} />}>
      <MarkdownContent
        content={processedContent}
        className={className}
        customBlockMap={customBlockMap}
        consumedLines={consumedLines}
        contentLines={contentLines}
        options={options}
      />
    </MarkdownErrorBoundary>
  );
};

export default MarkdownRenderer;