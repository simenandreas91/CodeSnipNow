import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: 'javascript' | 'html' | 'css';
}

export function CodeBlock({ code, language = 'javascript' }: CodeBlockProps) {
  // Simple syntax highlighting for JavaScript/ServiceNow scripts, HTML, and CSS
  const highlightCode = (code: string) => {
    // Clean up escaped characters from database storage
    let cleanCode = code
      // Handle escaped quotes and common characters
      .replace(/\\"/g, '"')        // Fix escaped double quotes
      .replace(/\\'/g, "'")        // Fix escaped single quotes
      .replace(/\\\\/g, '\\')      // Fix double backslashes
      // Clean up any remaining escape sequences for display
      .replace(/\\([>+/\[\](){}=!?:;,.-])/g, '$1'); // Remove backslashes before common symbols

    // ServiceNow specific keywords
    const snKeywords = /\b(gs\.|current\.|previous\.|GlideRecord|GlideSystem|GlideElement|GlideDateTime|GlideDuration)\b/g;
    const jsKeywords = /\b(function|var|let|const|if|else|for|while|return|new|this|true|false|null|undefined)\b/g;
    const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
    const comments = /(\/\*[\s\S]*?\*\/|\/\/.*$)/gm;
    const numbers = /\b\d+(\.\d+)?\b/g;

    // Apply HTML escaping for safe display
    let highlighted = cleanCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply syntax highlighting
    if (language === 'html') {
      highlighted = highlighted
        .replace(/(&lt;\/?[^&gt;]+&gt;)/g, '<span class="text-blue-400">$1</span>')
        .replace(/([\w-]+)=/g, '<span class="text-green-400">$1</span>=')
        .replace(/(=)(["'][^"']*["'])/g, '$1<span class="text-yellow-300">$2</span>');
    } else if (language === 'css') {
      highlighted = highlighted
        .replace(/([.#]?[\w-]+)\s*{/g, '<span class="text-blue-400">$1</span> {')
        .replace(/([\w-]+):/g, '<span class="text-green-400">$1</span>:')
        .replace(/:\s*([^;]+);/g, ': <span class="text-yellow-300">$1</span>;');
    } else {
      // JavaScript highlighting
    highlighted = highlighted
      .replace(comments, '<span class="text-green-400">$1</span>')
      .replace(strings, '<span class="text-yellow-300">$1</span>')
      .replace(jsKeywords, '<span class="text-blue-400">$1</span>')
      .replace(snKeywords, '<span class="text-purple-400">$1</span>')
      .replace(numbers, '<span class="text-orange-300">$1</span>');
    }

    return highlighted;
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="bg-slate-700 px-4 py-2 text-sm text-slate-300 border-b border-slate-600">
        {language.toUpperCase()}
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-slate-100 leading-relaxed">
          <code
            dangerouslySetInnerHTML={{
              __html: highlightCode(code)
            }}
          />
        </pre>
      </div>
    </div>
  );
}