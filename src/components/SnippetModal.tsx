import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, Calendar, User, Tag, Code2, Clock, Zap, Shield, Edit, ChevronDown, Trash2, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown';
import { CodeBlock } from './CodeBlock';
import type { Snippet } from '../types/snippet';
import { ImageUploadModal } from './ImageUploadModal';
import { StorageService } from '../lib/storage';

interface SnippetModalProps {
  snippet: Snippet;
  onClose: () => void;
  user?: { id: string; username?: string; email?: string } | null;
  onUpdateSnippet?: (snippetId: string, updates: Partial<Snippet>) => Promise<void>;
  onDeleteSnippet?: (snippetId: string) => Promise<void>;
}

type FilterConditionItem = {
  field: string;
  operator: string;
  value: string;
  logical: 'AND' | 'OR';
  isEnd: boolean;
  isNewGroup: boolean;
};

type ParsedFilterCondition =
  | { kind: 'xml'; table?: string; items: FilterConditionItem[]; summary?: string }
  | { kind: 'raw'; raw: string };

const OPERATOR_LABELS: Record<string, string> = {
  '=': 'is',
  '!=': 'is not',
  '>': 'greater than',
  '<': 'less than',
  '>=': 'greater than or equal',
  '<=': 'less than or equal',
  STARTSWITH: 'starts with',
  ENDSWITH: 'ends with',
  LIKE: 'contains',
  'NOT LIKE': 'does not contain',
  ISEMPTY: 'is empty',
  'IS NOT EMPTY': 'is not empty',
  IN: 'is one of',
  'NOT IN': 'is not one of',
  ON: 'on',
  CHANGES: 'changes',
  'CHANGES TO': 'changes to',
  'CHANGES FROM': 'changes from',
  VALCHANGES: 'changes',
  EQ: 'is',
  NE: 'is not',
  GT: 'greater than',
  LT: 'less than',
  GE: 'greater than or equal',
  LE: 'less than or equal'
};

const mapOperatorLabel = (operator: string) => {
  if (!operator) return '';
  const label = OPERATOR_LABELS[operator.toUpperCase() as keyof typeof OPERATOR_LABELS];
  return label || operator;
};

const parseFilterCondition = (raw: string): ParsedFilterCondition => {
  if (!raw) {
    return { kind: 'raw', raw: '' };
  }

  const trimmed = raw.trim();

  if (typeof window !== 'undefined' && trimmed.startsWith('<filter_condition')) {
    try {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(trimmed, 'application/xml');
      if (!doc.querySelector('parsererror')) {
        const root = doc.documentElement;
        const items = Array.from(root.getElementsByTagName('item')).map(item => ({
          field: item.getAttribute('field') || '',
          operator: item.getAttribute('operator') || '',
          value: item.getAttribute('value') || '',
          logical: (item.getAttribute('or') === 'true' ? 'OR' : 'AND') as 'AND' | 'OR',
          isEnd: item.getAttribute('endquery') === 'true',
          isNewGroup: item.getAttribute('newquery') === 'true'
        }));
        return {
          kind: 'xml',
          table: root.getAttribute('table') || undefined,
          items,
          summary: (root.textContent || '').trim()
        };
      }
    } catch (error) {
      console.warn('Failed to parse filter condition XML', error);
    }
  }

  return { kind: 'raw', raw: trimmed };
};
const ENCODED_OPERATOR_CODES = Object.keys(OPERATOR_LABELS)
  .map(op => ({ op, code: op.replace(/\s+/g, '').toUpperCase() }))
  .sort((a, b) => b.code.length - a.code.length);

const ORDER_RELEVANT_TYPES = new Set(['business_rule', 'client_script', 'ui_action']);
const PRIORITY_RELEVANT_TYPES = new Set(['business_rule']);

const CLIENT_SCRIPT_TYPE_OPTIONS = [
  { value: 'onLoad', label: 'onLoad' },
  { value: 'onChange', label: 'onChange' },
  { value: 'onSubmit', label: 'onSubmit' },
  { value: 'onCellEdit', label: 'onCellEdit' }
] as const;

const CLIENT_SCRIPT_UI_TYPE_OPTIONS = [
  { value: '0', label: 'All (0)' },
  { value: '10', label: 'Desktop (10)' },
  { value: '1', label: 'Mobile (1)' }
] as const;

const SCRIPT_INCLUDE_ACCESS_LEVEL_OPTIONS = [
  { value: 'package_private', label: 'Package Private' },
  { value: 'public', label: 'Public' },
  { value: 'protected', label: 'Protected' },
  { value: 'private', label: 'Private' }
] as const;

const decodeEncodedToken = (token: string): Omit<FilterConditionItem, 'logical'> | null => {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return null;
  }

  const comparators = ['!=', '>=', '<=', '=', '>', '<'];
  for (const symbol of comparators) {
    const index = trimmedToken.indexOf(symbol);
    if (index > 0) {
      const field = trimmedToken.slice(0, index);
      const value = trimmedToken.slice(index + symbol.length);
      return {
        field,
        operator: symbol,
        value,
        isEnd: false,
        isNewGroup: false
      };
    }
  }

  const upper = trimmedToken.toUpperCase();
  for (const { op, code } of ENCODED_OPERATOR_CODES) {
    const index = upper.indexOf(code);
    if (index > 0) {
      const field = trimmedToken.slice(0, index);
      const value = trimmedToken.slice(index + code.length);
      return {
        field,
        operator: op,
        value,
        isEnd: false,
        isNewGroup: false
      };
    }
  }

  return null;
};

type SnippetEditState = {
  name: string;
  description: string;
  script: string;
  script_include: string;
  collection: string;
  condition: string;
  when: string;
  field_name: string;
  ui_type_code: string;
  messages: string;
  global: boolean;
  applies_extended: boolean;
  isolate_script: boolean;
  active: boolean;
  api_name: string;
  access_level: string;
  caller_access: string;
  client_callable: boolean;
  mobile_callable: boolean;
  sandbox_callable: boolean;
  sys_policy: string;
  order: string;
  priority: string;
  filter_condition: string;
  runsOnInsert: 'true' | 'false';
  runsOnUpdate: 'true' | 'false';
  runsOnDelete: 'true' | 'false';
  runsOnQuery: 'true' | 'false';
  tags: string[];
  html: string;
  css: string;
  client_script: string;
  server_script: string;
  data_table: string;
  link: string;
  option_schema: string;
  preview_image_url: string;
  preview_image_path: string;
};

const formatNumericField = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const stringifyOptionSchema = (schema: unknown): string => {
  if (schema === null || schema === undefined) {
    return '';
  }

  if (typeof schema === 'string') {
    return schema;
  }

  if (typeof schema === 'object') {
    try {
      return JSON.stringify(schema, null, 2);
    } catch (error) {
      console.warn('Failed to stringify option schema', error);
    }
  }

  return '';
};

const normalizeTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  if (typeof tags === 'string') {
    const trimmed = tags.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((tag): tag is string => typeof tag === 'string')
          .map(tag => tag.trim())
          .filter(Boolean);
      }
    } catch {
      // Not JSON, fall back to comma-separated parsing
    }

    return trimmed
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const buildEditState = (snippet: Snippet): SnippetEditState => ({
  name: snippet.name || '',
  description: snippet.description || '',
  script: snippet.script || '',
  script_include: snippet.script_include || '',
  collection: snippet.collection || '',
  condition: snippet.condition || '',
  when: snippet.when || (snippet.artifact_type === 'client_script' ? 'onLoad' : ''),
  field_name: snippet.field_name || '',
  ui_type_code: snippet.ui_type_code !== undefined ? String(snippet.ui_type_code) : '0',
  messages: snippet.messages || '',
  global: snippet.global || false,
  applies_extended: snippet.applies_extended || false,
  isolate_script: snippet.isolate_script !== false,
  active: snippet.active !== false,
  api_name: snippet.api_name || '',
  access_level: snippet.access_level || 'package_private',
  caller_access: snippet.caller_access || '',
  client_callable: snippet.client_callable || false,
  mobile_callable: snippet.mobile_callable || false,
  sandbox_callable: snippet.sandbox_callable || false,
  sys_policy: snippet.sys_policy || '',
  order: formatNumericField(snippet.order),
  priority: formatNumericField(snippet.priority),
  filter_condition: snippet.filter_condition || '',
  runsOnInsert: snippet.action_insert ? 'true' : 'false',
  runsOnUpdate: snippet.action_update ? 'true' : 'false',
  runsOnDelete: snippet.action_delete ? 'true' : 'false',
  runsOnQuery: snippet.action_query ? 'true' : 'false',
  tags: normalizeTags(snippet.tags),
  html: snippet.html || '',
  css: snippet.css || '',
  client_script: snippet.client_script || '',
  server_script: snippet.server_script || '',
  data_table: snippet.data_table || '',
  link: snippet.link || '',
  option_schema: stringifyOptionSchema(snippet.option_schema),
  preview_image_url: snippet.preview_image_url || '',
  preview_image_path: snippet.preview_image_path || ''
});

const parseEncodedQuery = (raw: string): FilterConditionItem[] => {
  const tokens = raw.split('^').map(token => token.trim()).filter(Boolean);
  const items: FilterConditionItem[] = [];
  let currentLogical: 'AND' | 'OR' = 'AND';

  tokens.forEach(token => {
    const upper = token.toUpperCase();
    if (upper === 'OR') {
      currentLogical = 'OR';
      return;
    }
    if (upper === 'AND') {
      currentLogical = 'AND';
      return;
    }
    if (upper === '(' || upper === ')') {
      return;
    }

    const decoded = decodeEncodedToken(token);
    if (!decoded) {
      return;
    }

    items.push({
      ...decoded,
      logical: items.length === 0 ? 'AND' : currentLogical
    });
    currentLogical = 'AND';
  });

  return items;
};



const FilterConditionDisplay: React.FC<{ value: string }> = ({ value }) => {
  const parsed = useMemo(() => parseFilterCondition(value), [value]);
  const items = useMemo<FilterConditionItem[]>(() => {
    if (parsed.kind === 'xml') {
      return parsed.items;
    }
    return parseEncodedQuery(parsed.raw);
  }, [parsed]);

  const formatFieldLabel = (field: string) => {
    if (!field) return '';
    return field
      .split('.')
      .join(' ')
      .split('_')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  if (!value.trim()) {
    return <p className="text-slate-500 italic">No filter condition provided.</p>;
  }

  if (items.length > 0) {
    return (
      <div className="space-y-2">
        {parsed.kind === 'xml' && parsed.table && (
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Table: <span className="text-blue-300 font-mono">{parsed.table}</span>
          </div>
        )}
        <div className="space-y-2">
          {items.map((item, idx) => {
            const label = mapOperatorLabel(item.operator);
            const nextLogical = idx < items.length - 1 ? items[idx + 1].logical : null;
            const showField = Boolean(item.field);
            const showValue = Boolean(item.value);
            const showLabel = Boolean(label && (showField || showValue));
            const showTags = item.isNewGroup || item.isEnd;
            if (!showField && !showValue && !showLabel && !showTags) {
              return null;
            }

            return (
              <div
                key={`${item.field || 'condition'}-${idx}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {showField && (
                    <span className="font-semibold text-blue-200">{formatFieldLabel(item.field)}</span>
                  )}
                  {showLabel && <span className="text-slate-300">{label}</span>}
                  {showValue && <span className="text-emerald-200 font-mono">{item.value}</span>}
                  {item.isNewGroup && <span className="text-xs text-amber-300">New group</span>}
                  {item.isEnd && <span className="text-xs text-slate-500">End</span>}
                </div>
                {nextLogical && (
                  <span className="px-2 py-1 text-[10px] uppercase tracking-wide rounded-full border border-white/20 bg-white/10 text-slate-200">
                    {nextLogical}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (parsed.kind === 'xml' && parsed.summary) {
    const summaryLines = parsed.summary
      .split('^')
      .map(segment => segment.trim())
      .filter(Boolean);

    if (summaryLines.length > 0) {
      return (
        <div className="space-y-1">
          {summaryLines.map((token, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200"
            >
              {token}
            </div>
          ))}
        </div>
      );
    }
  }

  const rawTokens = value.split('^').map(token => token.trim()).filter(Boolean);

  if (rawTokens.length > 0) {
    return (
      <div className="space-y-1">
        {rawTokens.map((token, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200"
          >
            {token}
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 whitespace-pre-wrap">
      {value}
    </pre>
  );
};

export function SnippetModal({ snippet, onClose, user, onUpdateSnippet, onDeleteSnippet }: SnippetModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedInclude, setCopiedInclude] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SnippetEditState>(() => buildEditState(snippet));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [optionSchemaError, setOptionSchemaError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const snippetTags = useMemo(() => normalizeTags(snippet.tags), [snippet.tags]);
  const hasOptionSchema = Boolean((editData.option_schema ?? '').trim());
  const supportsOrderField = ORDER_RELEVANT_TYPES.has(snippet.artifact_type);
  const supportsPriorityField = PRIORITY_RELEVANT_TYPES.has(snippet.artifact_type);

  // Update editData when snippet prop changes
  useEffect(() => {
    setEditData(buildEditState(snippet));
    setOptionSchemaError(null);
  }, [snippet]);

  const isAdmin = user?.email === 'simenstaabyknudsen@gmail.com';

  const formatWhenValue = (value?: string) => {
    if (!value) return 'Not set';
    if (snippet.artifact_type === 'client_script') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
  };

  const parseNumericInput = (value?: string) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = value.toString().trim();
    if (trimmed === '') return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const formatBooleanFlag = (value?: boolean | string | number) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return 'Yes';
    if (value === false || value === 'false' || value === 0 || value === '0') return 'No';
    return 'Not set';
  };

  const actionOptions = [
    { key: 'runsOnInsert', field: 'action_insert' as const, label: 'Insert' },
    { key: 'runsOnUpdate', field: 'action_update' as const, label: 'Update' },
    { key: 'runsOnDelete', field: 'action_delete' as const, label: 'Delete' },
    { key: 'runsOnQuery', field: 'action_query' as const, label: 'Query' }
  ] as const;

  const handleCopy = async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== 'function'
    ) {
      console.warn('Clipboard API not available in this environment.');
      return;
    }

    try {
      await navigator.clipboard.writeText(snippet.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy snippet script to clipboard:', error);
    }
  };

  const handleCopyScriptInclude = async () => {
    if (!snippet.script_include) {
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== 'function'
    ) {
      console.warn('Clipboard API not available in this environment.');
      return;
    }

    try {
      await navigator.clipboard.writeText(snippet.script_include);
      setCopiedInclude(true);
      setTimeout(() => setCopiedInclude(false), 2000);
    } catch (error) {
      console.error('Failed to copy script include to clipboard:', error);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteSnippet) return;
    const confirmed = window.confirm(`Delete snippet "${snippet.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDeleteSnippet(snippet.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete snippet:', error);
      alert('Failed to delete snippet. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!onUpdateSnippet) return;

    setOptionSchemaError(null);
    setSaving(true);
    try {
      const previousImagePath = snippet.preview_image_path || '';
      const updates: Partial<Snippet> = {
        artifact_type: snippet.artifact_type,
        name: editData.name,
        description: editData.description,
        collection: editData.collection,
        condition: editData.condition,
        filter_condition: editData.filter_condition,
        tags: editData.tags
      };

      const normalizedPreviewUrl = editData.preview_image_url || '';
      const normalizedPreviewPath = editData.preview_image_path || '';
      if (normalizedPreviewUrl !== (snippet.preview_image_url || '')) {
        updates.preview_image_url = normalizedPreviewUrl || null;
      }
      if (normalizedPreviewPath !== (snippet.preview_image_path || '')) {
        updates.preview_image_path = normalizedPreviewPath || null;
      }

      if (snippet.artifact_type === 'business_rule' || snippet.artifact_type === 'client_script') {
        updates.when = editData.when;
      }

      if (supportsOrderField) {
        const orderValue = parseNumericInput(editData.order);
        if (orderValue !== undefined) {
          updates.order = orderValue;
        }
      }

      if (supportsPriorityField) {
        const priorityValue = parseNumericInput(editData.priority);
        if (priorityValue !== undefined) {
          updates.priority = priorityValue;
        }
      }

      if (snippet.artifact_type === 'business_rule') {
        updates.action_insert = editData.runsOnInsert === 'true';
        updates.action_update = editData.runsOnUpdate === 'true';
        updates.action_delete = editData.runsOnDelete === 'true';
        updates.action_query = editData.runsOnQuery === 'true';
      }

      if (snippet.artifact_type === 'client_script') {
        updates.field_name = editData.field_name.trim();
        updates.messages = editData.messages;
        updates.global = editData.global;
        updates.applies_extended = editData.applies_extended;
        updates.isolate_script = editData.isolate_script;
        const parsedUiType = parseInt(editData.ui_type_code, 10);
        updates.ui_type_code = Number.isNaN(parsedUiType) ? 0 : parsedUiType;
        updates.active = editData.active;
      }

      if (snippet.artifact_type === 'script_include') {
        updates.api_name = editData.api_name.trim();
        updates.access_level = editData.access_level;
        updates.caller_access = editData.caller_access;
        updates.client_callable = editData.client_callable;
        updates.mobile_callable = editData.mobile_callable;
        updates.sandbox_callable = editData.sandbox_callable;
        updates.sys_policy = editData.sys_policy;
        updates.active = editData.active;
      }

      // Add artifact-specific fields
      if (snippet.artifact_type === 'service_portal_widget') {
        updates.html = editData.html;
        updates.css = editData.css;
        updates.client_script = editData.client_script;
        updates.server_script = editData.server_script;
        updates.data_table = editData.data_table.trim();
        updates.link = editData.link;

        const optionSchemaInput = (editData.option_schema || '').trim();
        if (optionSchemaInput) {
          try {
            updates.option_schema = JSON.parse(optionSchemaInput);
          } catch (error) {
            console.error('Invalid option schema JSON:', error);
            setOptionSchemaError('Option schema must be valid JSON');
            return;
          }
        } else {
          updates.option_schema = null;
        }
      } else {
        updates.script = editData.script;
        if (snippet.artifact_type === 'client_script') {
          updates.script_include = editData.script_include;
        }
      }
      
      await onUpdateSnippet(snippet.id, updates);

      if (previousImagePath && previousImagePath !== normalizedPreviewPath) {
        try {
          await StorageService.deleteImage(previousImagePath);
        } catch (cleanupError) {
          console.warn('Failed to delete previous image:', cleanupError);
        }
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update snippet:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleOptionSchemaChange = (value: string) => {
    setOptionSchemaError(null);
    setEditData(prev => ({
      ...prev,
      option_schema: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !editData.tags.includes(tagInput.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUploaded = (url: string, path: string) => {
    setImageError(null);
    setEditData(prev => ({
      ...prev,
      preview_image_url: url,
      preview_image_path: path
    }));
  };

  const handleRemoveImage = async () => {
    if (removingImage) {
      return;
    }

    const originalPath = snippet.preview_image_path || '';
    const newPath = editData.preview_image_path || '';
    const pathToDelete = newPath && newPath !== originalPath ? newPath : '';

    if (!pathToDelete && !originalPath && !newPath) {
      setEditData(prev => ({
        ...prev,
        preview_image_url: '',
        preview_image_path: ''
      }));
      return;
    }

    setRemovingImage(true);
    setImageError(null);
    try {
      if (pathToDelete) {
        await StorageService.deleteImage(pathToDelete);
      }
      setEditData(prev => ({
        ...prev,
        preview_image_url: '',
        preview_image_path: ''
      }));
    } catch (error) {
      console.error('Failed to remove image:', error);
      setImageError('Failed to remove image. Please try again.');
    } finally {
      setRemovingImage(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-white/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold bg-white/10 border border-white/20 rounded px-3 py-1 text-white mb-2 w-full"
              />
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">{snippet.name}</h2>
                {snippet.artifact_type === 'service_portal_widget' && (
                  <div className="text-sm text-slate-400 mb-2">Widget Name: {snippet.name}</div>
                )}
              </>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{snippet.created_by}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(snippet.created_at).toLocaleDateString()}</span>
              </div>
              {snippet.active && (
                <div className="flex items-center gap-1 text-green-400">
                  <Zap className="h-4 w-4" />
                  <span>Active</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onUpdateSnippet && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                title="Edit snippet"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            {isAdmin && onDeleteSnippet && !isEditing && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-200 rounded text-sm transition-colors hover:bg-red-500/30 disabled:opacity-50"
                title="Delete snippet"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete</span>
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setOptionSchemaError(null);
                    setEditData(buildEditState(snippet));
                  }}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6">
            {isEditing ? (
              editData.preview_image_url ? (
                <div className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                  <img
                    src={editData.preview_image_url}
                    alt={`${snippet.name} preview`}
                    className="w-full max-h-[32rem] object-contain bg-black"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowImageModal(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-sm rounded-lg transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={removingImage}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {removingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-xl bg-white/5 p-6">
                  <ImageIcon className="h-10 w-10 text-slate-400" />
                  <p className="text-sm text-slate-300 text-center">
                    Add an optional preview image to showcase this snippet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                </div>
              )
            ) : (
              snippet.preview_image_url && (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                  <img
                    src={snippet.preview_image_url}
                    alt={`${snippet.name} preview`}
                    className="w-full max-h-[32rem] object-contain cursor-zoom-in bg-black"
                    onClick={() => setShowFullscreenImage(true)}
                  />
                </div>
              )
            )}
            {imageError && isEditing && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {imageError}
              </div>
            )}
          </div>
          <div className="mb-6">
            {isEditing ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Description"
              />
            ) : (
              <div 
                className="text-slate-300 text-lg leading-relaxed prose prose-invert prose-slate max-w-none"
              >
                <div
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(editData.description, snippet.repo_path) 
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {(snippet.collection || isEditing) && (
              <div className="flex items-center gap-2 text-slate-300">
                <Code2 className="h-4 w-4 text-blue-400" />
                <span className="font-medium">Table:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.collection}
                    onChange={(e) => setEditData(prev => ({ ...prev, collection: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-blue-300 text-sm flex-1"
                    placeholder="Table name"
                  />
                ) : (
                  <span className="text-blue-300">{snippet.collection}</span>
                )}
              </div>
            )}

            {(snippet.when || isEditing) && (
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="font-medium">
                  {snippet.artifact_type === 'business_rule' ? 'When:' : 'Script Type:'}
                </span>
                {isEditing ? (
                  snippet.artifact_type === 'business_rule' ? (
                    <div className="relative">
                      <select
                        value={editData.when}
                        onChange={(e) => setEditData(prev => ({ ...prev, when: e.target.value }))}
                        className="appearance-none bg-slate-900/80 border border-purple-500/40 rounded px-3 py-2 pr-10 text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="" className="bg-slate-900 text-purple-100">Select timing</option>
                      <option value="before" className="bg-slate-900 text-purple-100">Before</option>
                      <option value="after" className="bg-slate-900 text-purple-100">After</option>
                      <option value="async" className="bg-slate-900 text-purple-100">Async</option>
                      <option value="display" className="bg-slate-900 text-purple-100">Display</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-200" />
                  </div>
                  ) : snippet.artifact_type === 'client_script' ? (
                    <div className="relative">
                      <select
                        value={editData.when || 'onLoad'}
                        onChange={(e) => setEditData(prev => ({ ...prev, when: e.target.value }))}
                        className="appearance-none bg-slate-900/80 border border-purple-500/40 rounded px-3 py-2 pr-10 text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      >
                        {CLIENT_SCRIPT_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value} className="bg-slate-900 text-purple-100">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-200" />
                    </div>
                  ) : (
                    <span className="text-purple-300">
                      {formatWhenValue(isEditing ? editData.when : snippet.when)}
                    </span>
                  )
            ) : (
              <span className="text-purple-300">
                {formatWhenValue(isEditing ? editData.when : snippet.when)}
              </span>
            )}
          </div>
        )}

            {snippet.artifact_type === 'client_script' && (snippet.field_name || isEditing) && (
              <div className="flex items-center gap-2 text-slate-300">
                <Code2 className="h-4 w-4 text-green-400" />
                <span className="font-medium">Field:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.field_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, field_name: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-green-300 text-sm flex-1"
                    placeholder="Field name"
                  />
                ) : (
                  <span className="text-green-300">{snippet.field_name}</span>
                )}
              </div>
            )}

            {snippet.artifact_type === 'service_portal_widget' && (snippet.data_table || isEditing) && (
              <div className="flex items-center gap-2 text-slate-300">
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">Data Table:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.data_table}
                    onChange={(e) => setEditData(prev => ({ ...prev, data_table: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-emerald-300 text-sm flex-1"
                    placeholder="sp_instance"
                  />
                ) : (
                  <span className="text-emerald-300">{snippet.data_table}</span>
                )}
              </div>
            )}

            {snippet.artifact_type === 'client_script' && (snippet.ui_type_code !== undefined || isEditing) && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="font-medium">UI Type:</span>
                {isEditing ? (
                  <div className="relative">
                    <select
                      value={editData.ui_type_code || '0'}
                      onChange={(e) => setEditData(prev => ({ ...prev, ui_type_code: e.target.value }))}
                      className="appearance-none bg-slate-900/80 border border-cyan-500/40 rounded px-3 py-2 pr-10 text-cyan-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    >
                      {CLIENT_SCRIPT_UI_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value} className="bg-slate-900 text-cyan-100">
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200" />
                  </div>
                ) : (
                  <span className="text-cyan-300">
                    {snippet.ui_type_code === 10 ? 'Desktop (10)' : 
                     snippet.ui_type_code === 1 ? 'Mobile (1)' : 
                     'All (0)'}
                  </span>
                )}
              </div>
            )}

            {snippet.artifact_type === 'client_script' && (
              <div className="md:col-span-2">
                {isEditing ? (
                  <div className="flex flex-wrap gap-4 text-slate-300">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.active}
                        onChange={(e) => setEditData(prev => ({ ...prev, active: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Active</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.applies_extended}
                        onChange={(e) => setEditData(prev => ({ ...prev, applies_extended: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Inherited</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.global}
                        onChange={(e) => setEditData(prev => ({ ...prev, global: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Global</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.isolate_script}
                        onChange={(e) => setEditData(prev => ({ ...prev, isolate_script: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Isolate script</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 text-slate-400">
                    <span>Active: {formatBooleanFlag(snippet.active)}</span>
                    <span>Inherited: {formatBooleanFlag(snippet.applies_extended)}</span>
                    <span>Global: {formatBooleanFlag(snippet.global)}</span>
                    <span>Isolate: {formatBooleanFlag(snippet.isolate_script)}</span>
                  </div>
                )}
              </div>
            )}

            {snippet.artifact_type === 'script_include' && (
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Code2 className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">API Name:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.api_name}
                        onChange={(e) => setEditData(prev => ({ ...prev, api_name: e.target.value }))}
                        className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="API name"
                      />
                    ) : (
                      <span className="text-blue-300">{snippet.api_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span className="font-medium">Access Level:</span>
                    {isEditing ? (
                      <div className="relative flex-1">
                        <select
                          value={editData.access_level}
                          onChange={(e) => setEditData(prev => ({ ...prev, access_level: e.target.value }))}
                          className="appearance-none w-full bg-slate-900/80 border border-purple-500/40 rounded px-3 py-2 pr-10 text-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        >
                          {SCRIPT_INCLUDE_ACCESS_LEVEL_OPTIONS.map(option => (
                            <option key={option.value} value={option.value} className="bg-slate-900 text-purple-100">
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-200" />
                      </div>
                    ) : (
                      <span className="text-purple-300">{snippet.access_level || 'Package Private'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 text-slate-300">
                    <span className="font-medium">Caller Access:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.caller_access}
                        onChange={(e) => setEditData(prev => ({ ...prev, caller_access: e.target.value }))}
                        className="bg-white/10 border border-white/20 rounded px-3 py-2 text-yellow-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Caller access"
                      />
                    ) : (
                      <span className="text-yellow-300">{snippet.caller_access || 'Not set'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-slate-300">
                    <span className="font-medium">System Policy:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.sys_policy}
                        onChange={(e) => setEditData(prev => ({ ...prev, sys_policy: e.target.value }))}
                        className="bg-white/10 border border-white/20 rounded px-3 py-2 text-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="System policy"
                      />
                    ) : (
                      <span className="text-red-300">{snippet.sys_policy || 'Not set'}</span>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex flex-wrap gap-4 text-slate-300">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.active}
                        onChange={(e) => setEditData(prev => ({ ...prev, active: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Active</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.client_callable}
                        onChange={(e) => setEditData(prev => ({ ...prev, client_callable: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-green-500 focus:ring-green-500"
                      />
                      <span>Client Callable</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.mobile_callable}
                        onChange={(e) => setEditData(prev => ({ ...prev, mobile_callable: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Mobile Callable</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editData.sandbox_callable}
                        onChange={(e) => setEditData(prev => ({ ...prev, sandbox_callable: e.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500"
                      />
                      <span>Sandbox Callable</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 text-slate-400">
                    <span>Active: {formatBooleanFlag(snippet.active)}</span>
                    <span>Client Callable: {formatBooleanFlag(snippet.client_callable)}</span>
                    <span>Mobile Callable: {formatBooleanFlag(snippet.mobile_callable)}</span>
                    <span>Sandbox Callable: {formatBooleanFlag(snippet.sandbox_callable)}</span>
                  </div>
                )}
              </div>
            )}

            {snippet.global !== undefined && snippet.artifact_type === 'client_script' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">Global:</span>
                <span className="text-yellow-300">{snippet.global ? 'Yes' : 'No'}</span>
              </div>
            )}

            {supportsOrderField && (snippet.order !== undefined || isEditing) && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-orange-400" />
                <span className="font-medium">Order:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.order}
                    onChange={(e) => setEditData(prev => ({ ...prev, order: e.target.value }))}
                    className="w-24 bg-white/10 border border-orange-500/40 rounded px-2 py-1 text-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="Order"
                  />
                ) : (
                  <span className="text-orange-300">{snippet.order}</span>
                )}
              </div>
            )}

            {supportsPriorityField && (snippet.priority !== undefined || isEditing) && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="font-medium">Priority:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.priority}
                    onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-24 bg-white/10 border border-red-500/40 rounded px-2 py-1 text-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    placeholder="Priority"
                  />
                ) : (
                  <span className="text-red-300">{snippet.priority}</span>
                )}
              </div>
            )}

            {snippet.artifact_type === 'business_rule' && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Actions</h4>
                {isEditing ? (
                  <div className="flex flex-wrap gap-3">
                    {actionOptions.map(option => {
                      const checked = editData[option.key] === 'true';
                      return (
                        <label
                          key={option.key}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${checked ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-100' : 'border-white/20 bg-white/5 text-slate-300'}`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-emerald-500"
                            checked={checked}
                            onChange={(e) => setEditData(prev => ({ ...prev, [option.key]: e.target.checked ? 'true' : 'false' }))}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {actionOptions.map(option => {
                      const active = snippet[option.field];
                      return (
                        <span
                          key={option.field}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${active ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : 'border-white/20 bg-white/5 text-slate-400'}`}
                        >
                          {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          <span>{option.label}: {formatBooleanFlag(active)}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        {snippet.artifact_type === 'business_rule' && (snippet.filter_condition || (isEditing && editData.filter_condition)) && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-3">Filter Condition</h4>
            {isEditing ? (
              <textarea
                value={editData.filter_condition}
                onChange={(e) => setEditData(prev => ({ ...prev, filter_condition: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Filter condition expression or XML"
              />
            ) : (
              <FilterConditionDisplay value={snippet.filter_condition || ''} />
            )}
          </div>
        )}

          {(snippet.condition || isEditing) && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Condition</h4>
              {isEditing ? (
                <textarea
                  value={editData.condition}
                  onChange={(e) => setEditData(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-green-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Condition"
                />
              ) : (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <code className="text-green-300 text-sm">{snippet.condition}</code>
                </div>
              )}
            </div>
          )}

          {(snippet.messages || isEditing) && snippet.artifact_type === 'client_script' && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Messages</h4>
              {isEditing ? (
                <textarea
                  value={editData.messages}
                  onChange={(e) => setEditData(prev => ({ ...prev, messages: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg text-blue-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional UI messages to display"
                />
              ) : (
                <div className="bg-slate-800/50 rounded-lg p-4 text-blue-200 text-sm whitespace-pre-wrap">
                  {snippet.messages || 'None provided.'}
                </div>
              )}
            </div>
          )}

          {/* Service Portal Widget specific sections */}
          {snippet.artifact_type === 'service_portal_widget' && (
            <>
              {/* HTML Template */}
              {(snippet.html || isEditing) && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">HTML Template</h4>
                  {isEditing ? (
                    <textarea
                      value={editData.html}
                      onChange={(e) => setEditData(prev => ({ ...prev, html: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={8}
                      placeholder="HTML template code"
                    />
                  ) : (
                    <CodeBlock code={editData.html} language="html" />
                  )}
                </div>
              )}

              {/* CSS Styles */}
              {(snippet.css || isEditing) && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">CSS Styles</h4>
                  {isEditing ? (
                    <textarea
                      value={editData.css}
                      onChange={(e) => setEditData(prev => ({ ...prev, css: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={8}
                      placeholder="CSS styles"
                    />
                  ) : (
                    <CodeBlock code={editData.css} language="css" />
                  )}
                </div>
              )}

              {/* Server Script */}
              {(snippet.server_script || isEditing) && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Server Script</h4>
                  {isEditing ? (
                    <textarea
                      value={editData.server_script}
                      onChange={(e) => setEditData(prev => ({ ...prev, server_script: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={10}
                      placeholder="Server-side JavaScript"
                    />
                  ) : (
                    <CodeBlock code={editData.server_script} language="javascript" />
                  )}
                </div>
              )}

              {/* Client Script */}
              {(snippet.client_script || isEditing) && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Client Script</h4>
                  {isEditing ? (
                    <textarea
                      value={editData.client_script}
                      onChange={(e) => setEditData(prev => ({ ...prev, client_script: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={10}
                      placeholder="Client-side JavaScript"
                    />
                  ) : (
                    <CodeBlock code={editData.client_script} language="javascript" />
                  )}
                </div>
              )}

              {/* Link Function */}
              {(snippet.link || isEditing) && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Link Function</h4>
                  {isEditing ? (
                    <textarea
                      value={editData.link}
                      onChange={(e) => setEditData(prev => ({ ...prev, link: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={10}
                      placeholder="function link(scope, element) {\n  // ...\n}"
                    />
                  ) : snippet.link ? (
                    <CodeBlock code={snippet.link} language="javascript" />
                  ) : (
                    <p className="text-slate-500 italic">No link function provided.</p>
                  )}
                </div>
              )}

              {(hasOptionSchema || isEditing) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">Option Schema</h4>
                    {isEditing && optionSchemaError && (
                      <span className="text-xs text-red-400">{optionSchemaError}</span>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editData.option_schema}
                        onChange={(e) => handleOptionSchemaChange(e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-800 border ${optionSchemaError ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        rows={10}
                        placeholder='{"fields":[{"name":"example","label":"Example","type":"string"}]}'
                      />
                      <p className="text-xs text-slate-400">
                        Provide valid JSON describing available widget options.
                      </p>
                    </div>
                  ) : (
                    <CodeBlock code={editData.option_schema} language="json" />
                  )}
                </div>
              )}

            </>
          )}

          {(snippetTags.length > 0 || isEditing) && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Tags</h4>
              {isEditing ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 text-slate-300 text-sm rounded-full"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-400 hover:text-white ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {snippetTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 text-slate-300 text-sm rounded-full"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {snippet.artifact_type === 'client_script' ? (
            <div className="mb-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">Client Script</h4>
                  {!isEditing && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Script
                        </>
                      )}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={editData.script}
                    onChange={(e) => setEditData(prev => ({ ...prev, script: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={15}
                    placeholder="Client script code"
                  />
                ) : (
                  <CodeBlock code={snippet.script} language="javascript" />
                )}
              </div>

              {(snippet.script_include || isEditing) && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">Script Include</h4>
                    {!isEditing && snippet.script_include && (
                      <button
                        onClick={handleCopyScriptInclude}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {copiedInclude ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Include
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editData.script_include}
                      onChange={(e) => setEditData(prev => ({ ...prev, script_include: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={15}
                      placeholder="Associated script include code"
                    />
                  ) : (
                    <CodeBlock code={snippet.script_include} language="javascript" />
                  )}
                </div>
              )}
            </div>
          ) : (
            snippet.artifact_type !== 'service_portal_widget' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">Script Code</h4>
                  {!isEditing && (
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Code
                        </>
                      )}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={editData.script}
                    onChange={(e) => setEditData(prev => ({ ...prev, script: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={15}
                    placeholder="Script code"
                  />
                ) : (
                  <CodeBlock code={snippet.script} language="javascript" />
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
    {showImageModal && (
      <ImageUploadModal
        onClose={() => setShowImageModal(false)}
        onImageUploaded={(url, path) => {
          handleImageUploaded(url, path);
          setShowImageModal(false);
        }}
        userId={user?.id || snippet.user_id || 'anonymous'}
      />
    )}
    {showFullscreenImage && snippet.preview_image_url && (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={() => setShowFullscreenImage(false)}
      >
        <button
          className="absolute top-6 right-6 text-slate-200 hover:text-white transition-colors"
          onClick={() => setShowFullscreenImage(false)}
        >
          <X className="h-8 w-8" />
        </button>
        <img
          src={snippet.preview_image_url}
          alt={`${snippet.name} preview full size`}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl border border-white/10"
        />
      </div>
    )}
    </>
  );
}
