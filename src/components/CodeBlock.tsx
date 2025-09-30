import React from 'react';

import { CodeBlock as UiCodeBlock } from '@/components/ui/code-block';

type Language = 'javascript' | 'html' | 'css';

interface CodeBlockProps {
  code: string;
  language?: Language;
  filename?: string;
  highlightLines?: number[];
}

function unescapeCode(code: string): string {
  let cleanCode = code;
  let previous: string;
  const escapePatterns = [
    { regex: /\\"/g, repl: '"' },
    { regex: /\\'/g, repl: "'" },
    { regex: /\\\\/g, repl: '\\' },
    { regex: /\\n/g, repl: '\n' },
    { regex: /\\t/g, repl: '\t' },
    { regex: /\\r/g, repl: '\r' },
    { regex: /\\b/g, repl: '\b' },
    { regex: /\\f/g, repl: '\f' },
    { regex: /\\u([0-9a-fA-F]{4})/g, repl: (match: string, p1: string) => String.fromCharCode(parseInt(p1, 16)) },
    // Handle potential triple escapes like \\\""
    { regex: /\\\\"/g, repl: '\\"' },
    { regex: /\\\\'/g, repl: "\\'" },
  ];

  // Iteratively unescape until no more changes
  do {
    previous = cleanCode;
    escapePatterns.forEach(({ regex, repl }) => {
      if (typeof repl === 'string') {
        cleanCode = cleanCode.replace(regex, repl);
      } else {
        cleanCode = cleanCode.replace(regex, repl as (match: string, p1: string) => string);
      }
    });
  } while (cleanCode !== previous && cleanCode.length < 100000); // Prevent infinite loop

  return cleanCode;
}

const DEFAULT_FILENAMES: Record<Language, string> = {
  javascript: 'snippet.js',
  html: 'snippet.html',
  css: 'snippet.css',
};

export function CodeBlock({
  code,
  language = 'javascript',
  filename,
  highlightLines,
}: CodeBlockProps) {
  const cleanCode = React.useMemo(() => unescapeCode(code), [code]);
  const resolvedFilename = filename ?? DEFAULT_FILENAMES[language] ?? 'snippet.txt';

  return (
    <UiCodeBlock
      language={language}
      filename={resolvedFilename}
      code={cleanCode}
      highlightLines={highlightLines}
    />
  );
}
