import React, { useState } from 'react';
import { Loader2, Filter, UserCheck, Eye, Search } from 'lucide-react';
import { useSpecializedAreas } from '../hooks/useSpecializedAreas';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationModal } from './IntegrationModal';
import { Pagination } from './Pagination';
import type { SpecializedArea, SpecializedAreaSubtype } from '../types/snippet';

export function SpecializedAreasGrid() {
  const {
    specializedAreas,
    loading,
    currentPage,
    totalCount,
    totalPages,
    searchQuery,
    selectedSubtype,
    viewMySpecializedAreas,
    availableSubtypes,
    subtypesLoading,
    handleSearch,
    handleSubtypeChange,
    handleViewMyChange,
    handlePageChange,
    ITEMS_PER_PAGE
  } = useSpecializedAreas();
  const [selectedSpecializedArea, setSelectedSpecializedArea] = useState<SpecializedArea | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading specialized areas...</span>
        </div>
      </div>
    );
  }

  if (specializedAreas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🤔</div>
        <h3 className="text-xl font-semibold text-white mb-2">No specialized areas found</h3>
        <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search specialized areas by title, description, or code..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedSubtype}
            onChange={(e) => handleSubtypeChange(e.target.value as SpecializedAreaSubtype | '')}
            disabled={subtypesLoading}
            className="bg-slate-700/50 border border-slate-600/50 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">All Types</option>
            {availableSubtypes.map((subtype) => (
              <option key={subtype} value={subtype}>
                {subtype}
              </option>
            ))}
          </select>
          {subtypesLoading && (
            <span className="text-xs text-slate-400">Loading types...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewMyChange(!viewMySpecializedAreas)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMySpecializedAreas
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/30'
            }`}
          >
            {viewMySpecializedAreas ? <UserCheck className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {viewMySpecializedAreas ? 'My Specialized Areas' : 'Public Specialized Areas'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {specializedAreas.map((specializedArea) => (
          <IntegrationCard
            key={specializedArea.id}
            integration={specializedArea}
            onClick={() => setSelectedSpecializedArea(specializedArea)}
            fallbackLabel="Specialized Area"
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      )}

      {selectedSpecializedArea && (
        <IntegrationModal
          integration={selectedSpecializedArea}
          onClose={() => setSelectedSpecializedArea(null)}
          entityLabel="Specialized Area"
        />
      )}
    </div>
  );
}
