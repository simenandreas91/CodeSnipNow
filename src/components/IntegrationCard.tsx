import React from 'react';
import { Code, Link, User } from 'lucide-react';
import type { Integration } from '../types/snippet';

interface IntegrationCardProps {
  integration: Integration;
  onClick: () => void;
}

export function IntegrationCard({ integration, onClick }: IntegrationCardProps) {
  return (
    <div
      className="group cursor-pointer rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 transition-all overflow-hidden shadow-lg hover:shadow-xl"
      onClick={onClick}
    >
      {/* Header with title and type badge */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white line-clamp-1">
            {integration.title}
          </h3>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
            {integration.type}
          </span>
        </div>

        {/* Description */}
        {integration.description && (
          <p className="text-slate-300 text-sm mb-4 line-clamp-2">
            {integration.description}
          </p>
        )}

        {/* Code preview */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">Code Preview</span>
          </div>
          <pre className="bg-slate-800/50 rounded-lg p-3 text-xs font-mono text-green-400 overflow-hidden max-h-20 line-clamp-4">
            {integration.code.substring(0, 200)}...
          </pre>
        </div>

        {/* Footer with repo_path and author */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          {integration.repo_path && (
            <div className="flex items-center gap-1">
              <Link className="h-3 w-3" />
              <span className="line-clamp-1">{integration.repo_path}</span>
            </div>
          )}
          {integration.author_id ? (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>User</span>
            </div>
          ) : (
            <span>Anonymous</span>
          )}
        </div>
      </div>
    </div>
  );
}
