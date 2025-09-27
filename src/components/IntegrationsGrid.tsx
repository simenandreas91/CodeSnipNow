import React, { useState } from 'react';
import { useIntegrations } from '../hooks/useIntegrations';
import { IntegrationCard } from './IntegrationCard';
import { Pagination } from './Pagination';
import { Loader2, Filter, UserCheck, Eye, Search } from 'lucide-react';
import { IntegrationModal } from './IntegrationModal';
import type { Integration, IntegrationSubtype } from '../types/snippet';

export function IntegrationsGrid() {
  const {
    integrations,
    loading,
    currentPage,
    totalCount,
    totalPages,
    searchQuery,
    selectedSubtype,
    viewMyIntegrations,
    availableSubtypes,
    subtypesLoading,
    handleSearch,
    handleSubtypeChange,
    handleViewMyChange,
    handlePageChange,
    ITEMS_PER_PAGE
  } = useIntegrations();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading integrations...</span>
        </div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">??</div>
        <h3 className="text-xl font-semibold text-white mb-2">No integrations found</h3>
        <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search integrations by title, description, or code..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {/* Subtype Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedSubtype}
            onChange={(e) => handleSubtypeChange(e.target.value as IntegrationSubtype | '')}
            disabled={subtypesLoading}
            className="bg-slate-700/50 border border-slate-600/50 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewMyChange(!viewMyIntegrations)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              viewMyIntegrations
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/30'
            }`}
          >
            {viewMyIntegrations ? <UserCheck className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {viewMyIntegrations ? 'My Integrations' : 'Public Integrations'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onClick={() => setSelectedIntegration(integration)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      )}

      {selectedIntegration && (
        <IntegrationModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  );
}
