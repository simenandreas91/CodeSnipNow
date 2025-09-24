import React from 'react';
import { SnippetCard } from './SnippetCard';
import { Loader2 } from 'lucide-react';
import type { Snippet } from '../types/snippet';

interface SnippetGridProps {
  snippets: Snippet[];
  loading: boolean;
  onSnippetClick: (snippet: Snippet) => void;
}

export function SnippetGrid({ snippets, loading, onSnippetClick }: SnippetGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading snippets...</span>
        </div>
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-white mb-2">No snippets found</h3>
        <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {snippets.map((snippet) => (
        <SnippetCard
          key={snippet.id}
          snippet={snippet}
          onClick={() => onSnippetClick(snippet)}
        />
      ))}
    </div>
  );
}