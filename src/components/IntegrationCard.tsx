import React from 'react';
import { Code, Link, User, Calendar, Zap, Server, Globe } from 'lucide-react';
import type { Integration } from '../types/snippet';

interface IntegrationCardProps {
  integration: Integration;
  onClick: () => void;
}

// Define colors for different integration types, similar to business rules
const INTEGRATION_TYPE_COLORS = {
  'Core ServiceNow APIs': 'from-orange-600 to-red-700',
  'Attachments': 'from-blue-600 to-blue-700',
  'AzureAD Integration': 'from-cyan-600 to-cyan-700',
  'REST API': 'from-purple-500 to-purple-600',
  'SOAP API': 'from-indigo-500 to-indigo-600',
  'Database': 'from-green-500 to-green-600',
  'File System': 'from-yellow-500 to-yellow-600',
  'Email': 'from-pink-500 to-pink-600',
  'default': 'from-slate-500 to-slate-600'
};

export function IntegrationCard({ integration, onClick }: IntegrationCardProps) {
  // Determine if this is a Core ServiceNow API based on the type or if it came from core_servicenow_apis table
  const isCoreServiceNowAPI = integration.type === 'core_servicenow_apis' || 
                              integration.type === 'Core ServiceNow APIs' ||
                              !integration.type; // Records from core_servicenow_apis might not have a type

  // Get the appropriate color scheme
  const colorClass = INTEGRATION_TYPE_COLORS[integration.type as keyof typeof INTEGRATION_TYPE_COLORS] || 
                     (isCoreServiceNowAPI ? INTEGRATION_TYPE_COLORS['Core ServiceNow APIs'] : INTEGRATION_TYPE_COLORS.default);

  // Display label - show "Core ServiceNow APIs" for items from that table
  const displayLabel = isCoreServiceNowAPI ? 'Core ServiceNow APIs' : integration.type;

  return (
    <div
      className="group cursor-pointer backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
      onClick={onClick}
    >
      {/* Header with title and type badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${colorClass}`}>
          {displayLabel}
        </div>
        {integration.is_public && (
          <div className="flex items-center gap-1 text-green-400">
            <Globe className="h-3 w-3" />
            <span className="text-xs">Public</span>
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
        {integration.title}
      </h3>

      {/* Description */}
      {integration.description && (
        <p className="text-slate-300 text-sm mb-4 line-clamp-2">
          {integration.description}
        </p>
      )}

      {/* ServiceNow API specific metadata */}
      {isCoreServiceNowAPI && (
        <div className="flex items-center gap-2 text-xs text-orange-400 mb-3">
          <Server className="h-3 w-3" />
          <span>ServiceNow Core API</span>
        </div>
      )}

      {/* Repository path if available */}
      {integration.repo_path && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Link className="h-3 w-3" />
          <span className="line-clamp-1">Path: {integration.repo_path}</span>
        </div>
      )}

      {/* Code preview */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Code className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400">Code Preview</span>
        </div>
        <pre className="bg-slate-800/50 rounded-lg p-3 text-xs font-mono text-green-400 overflow-hidden max-h-20 line-clamp-4">
          {integration.code.substring(0, 200)}{integration.code.length > 200 ? '...' : ''}
        </pre>
      </div>

      {/* Additional code section if available */}
      {integration.code2 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">Additional Code</span>
          </div>
          <pre className="bg-slate-800/50 rounded-lg p-3 text-xs font-mono text-blue-400 overflow-hidden max-h-16 line-clamp-3">
            {integration.code2.substring(0, 150)}{integration.code2.length > 150 ? '...' : ''}
          </pre>
        </div>
      )}

      {/* Footer with author and date */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/10 pt-4">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{integration.author_id ? 'User' : 'Anonymous'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(integration.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
