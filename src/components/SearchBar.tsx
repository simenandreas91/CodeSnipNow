import React from 'react';
import { Search, Filter, User } from 'lucide-react';
import { ARTIFACT_TYPES } from '../types/snippet';
import type { User as UserType } from '../types/snippet';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedArtifactType: string;
  onArtifactTypeChange: (type: string) => void;
  user?: UserType | null;
}

const FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  ...ARTIFACT_TYPES.map(type => ({ value: type.value, label: type.label })),
];

export function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  selectedArtifactType, 
  onArtifactTypeChange,
  user
}: SearchBarProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search snippets by name, description, or code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-slate-300">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter by type:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map((type) => (
            <button
              key={type.value}
              onClick={() => onArtifactTypeChange(type.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedArtifactType === type.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        
        {/* Personal filter section - visually separated */}
        {user && (
          <>
            <div className="w-px h-6 bg-white/20 mx-2"></div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onArtifactTypeChange('my_snippets')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  selectedArtifactType === 'my_snippets'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 border-purple-500'
                    : 'bg-white/5 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 border-purple-500/30'
                }`}
              >
                <User className="h-4 w-4" />
                My Snippets
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}