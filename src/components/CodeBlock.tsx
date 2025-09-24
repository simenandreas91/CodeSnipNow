import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: 'javascript' | 'html' | 'css';
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
    // Handle potential triple escapes like \\\"
    { regex: /\\\\"/g, repl: '\\"' },
    { regex: /\\\\'/g, repl: "\\'" }
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

export function CodeBlock({ code, language = 'javascript' }: CodeBlockProps) {
  const cleanCode = unescapeCode(code);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="bg-slate-700 px-4 py-2 text-sm text-slate-300 border-b border-slate-600">
        {language.toUpperCase()}
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-slate-100 leading-relaxed">
          <code>{cleanCode}</code>
        </pre>
      </div>
    </div>
  );
}
