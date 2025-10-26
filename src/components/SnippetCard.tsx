import { Calendar, User, Tag, Code2, Clock, Zap } from 'lucide-react';
import type { Snippet } from '../types/snippet';

interface SnippetCardProps {
  snippet: Snippet;
  onClick: () => void;
}

const ARTIFACT_TYPE_COLORS = {
  business_rule: 'from-blue-600 to-blue-700',
  client_script: 'from-cyan-600 to-cyan-700',
  script_include: 'from-purple-500 to-purple-600',
  ui_action: 'from-indigo-500 to-indigo-600',
  scheduled_job: 'from-slate-600 to-slate-700',
  transform_map: 'from-blue-500 to-teal-600',
  background_script: 'from-indigo-500 to-indigo-600',
  catalog_client_script: 'from-emerald-500 to-emerald-600',
  inbound_action: 'from-orange-500 to-orange-600',
  mail_script: 'from-green-500 to-green-600',
  service_portal_widget: 'from-pink-500 to-pink-600',
  integrations: 'from-violet-500 to-violet-600',
  specialized_areas: 'from-teal-500 to-emerald-600',
  core_servicenow_apis: 'from-orange-600 to-red-700',
  other: 'from-slate-500 to-slate-600',
};

const ARTIFACT_TYPE_LABELS = {
  business_rule: 'Business Rule',
  client_script: 'Client Script',
  script_include: 'Script Include',
  ui_action: 'UI Action',
  scheduled_job: 'Scheduled Job',
  transform_map: 'Transform Map',
  background_script: 'Background Script',
  catalog_client_script: 'Catalog Client Script',
  inbound_action: 'Inbound Action',
  mail_script: 'Mail Script',
  service_portal_widget: 'Service Portal Widget',
  integrations: 'Integrations',
  specialized_areas: 'Specialized Areas',
  core_servicenow_apis: 'Core ServiceNow APIs',
  other: 'Other',
};

export function SnippetCard({ snippet, onClick }: SnippetCardProps) {
  const colorClass = ARTIFACT_TYPE_COLORS[snippet.artifact_type as keyof typeof ARTIFACT_TYPE_COLORS] || ARTIFACT_TYPE_COLORS.other;
  const typeLabel = ARTIFACT_TYPE_LABELS[snippet.artifact_type as keyof typeof ARTIFACT_TYPE_LABELS] || 'Other';
  const isClientScript = snippet.artifact_type === 'client_script';
  const isCatalogClientScript = snippet.artifact_type === 'catalog_client_script';
  
  // For integrations and core ServiceNow APIs, display the subtype if available, otherwise fall back to the main type label
  const displayLabel = ['integrations', 'core_servicenow_apis', 'specialized_areas'].includes(snippet.artifact_type) && snippet.subtype
    ? snippet.subtype
    : typeLabel;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${colorClass}`}>
          {displayLabel}
        </div>
        {snippet.active && (
          <div className="flex items-center gap-1 text-green-400">
            <Zap className="h-3 w-3" />
            <span className="text-xs">Active</span>
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors line-clamp-2">
        {snippet.name}
      </h3>
      {snippet.artifact_type === 'service_portal_widget' && (
        <div className="text-xs text-slate-400 mb-2">Widget: {snippet.name}</div>
      )}
      <p className="text-sm text-slate-400 mb-4 line-clamp-3">
        {snippet.description}
      </p>

      {snippet.collection && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Code2 className="h-3 w-3" />
          <span>Table: {snippet.collection}</span>
        </div>
      )}

      {snippet.when && snippet.artifact_type === 'business_rule' && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Clock className="h-3 w-3" />
          <span>When: {snippet.when}</span>
        </div>
      )}

      {snippet.when && (isClientScript || isCatalogClientScript) && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Clock className="h-3 w-3" />
          <span>Type: {snippet.when}</span>
        </div>
      )}

      {snippet.field_name && snippet.artifact_type === 'client_script' && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Code2 className="h-3 w-3" />
          <span>Field: {snippet.field_name}</span>
        </div>
      )}

      {snippet.api_name && snippet.artifact_type === 'script_include' && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Code2 className="h-3 w-3" />
          <span>API: {snippet.api_name}</span>
        </div>
      )}

      {snippet.artifact_type === 'script_include' && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Clock className="h-3 w-3" />
          <span>Access: {snippet.access_level || 'Package Private'}</span>
        </div>
      )}

      {snippet.client_callable && snippet.artifact_type === 'script_include' && (
        <div className="flex items-center gap-2 text-xs text-green-400 mb-3">
          <Zap className="h-3 w-3" />
          <span>Client Callable</span>
        </div>
      )}

      {isClientScript && (snippet.ui_type_code !== undefined || snippet.ui_type) && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Clock className="h-3 w-3" />
          <span>
            UI: {snippet.ui_type && snippet.ui_type.trim().length > 0
              ? snippet.ui_type
              : snippet.ui_type_code === 10
                ? 'Desktop'
                : snippet.ui_type_code === 1
                  ? 'Mobile'
                  : 'All'}
          </span>
        </div>
      )}

      {isCatalogClientScript && snippet.ui_type && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Clock className="h-3 w-3" />
          <span>UI: {snippet.ui_type}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {snippet.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-slate-300 text-xs rounded-full"
          >
            <Tag className="h-2 w-2" />
            {tag}
          </span>
        ))}
        {snippet.tags.length > 3 && (
          <span className="text-xs text-slate-500">+{snippet.tags.length - 3} more</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/10 pt-4">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{snippet.created_by}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(snippet.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
