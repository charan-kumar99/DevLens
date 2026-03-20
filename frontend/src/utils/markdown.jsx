/**
 * Removes markdown syntax from text (e.g., **bold** becomes bold)
 */
export function cleanMarkdown(text) {
  if (!text) return null;
  return text.replace(/\*\*/g, '');
}

/**
 * Renders markdown text with basic formatting (bold, italic)
 * Returns an array of React elements
 */
export function renderMarkdown(text) {
  if (!text) return null;
  
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * Splits text on double newlines and renders as paragraphs
 */
export function renderParagraphs(text, className = '') {
  if (!text) return null;
  
  const cleaned = cleanMarkdown(text);
  const paragraphs = cleaned.split(/\n\n+/);
  
  return paragraphs.map((para, i) => (
    <p key={i} className={className}>
      {para.trim()}
    </p>
  ));
}
