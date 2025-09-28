import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, Calendar, User, Tag, Code2, Clock, Zap, Shield, Edit, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { renderMarkdown } from '../lib/markdown';
import { CodeBlock } from './CodeBlock';
import { ImageUploadModal } from './ImageUploadModal';
import type { Snippet } from '../types/snippet';

interface SnippetModalProps {
  snippet: Snippet;
  onClose: () => void;
  user?: { id: string; username?: string; email?: string } | null;
  onUpdateSnippet?: (snippetId: string, updates: Partial<Snippet>) => Promise<void>;
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
          logical: item.getAttribute('or') === 'true' ? 'OR' : 'AND',
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

const FilterConditionDisplay: React.FC<{ value: string }> = ({ value }) => {
  const parsed = useMemo(() => parseFilterCondition(value), [value]);

  if (!value.trim()) {
    return <p className="text-slate-500 italic">No filter condition provided.</p>;
  }

  if (parsed.kind === 'xml') {
    const items = parsed.items.filter(item => item.field || item.operator || item.value || item.isNewGroup || item.isEnd);
    const summaryLines = parsed.summary
      ? parsed.summary.split('^').map(segment => segment.trim()).filter(Boolean)
      : [];

    return (
      <div className="space-y-2">
        {parsed.table && (
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Table: <span className="text-blue-300 font-mono">{parsed.table}</span>
          </div>
        )}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, idx) => {
              const label = mapOperatorLabel(item.operator);
              const showField = Boolean(item.field);
              const showValue = Boolean(item.value);
              const showLabel = Boolean(label && (showField || showValue));
              const showLogical = idx > 0 && item.logical;
              const showTags = item.isNewGroup || item.isEnd;
              if (!showField && !showValue && !showLabel && !showTags) {
                return null;
              }

              return (
                <div
                  key={`${item.field || 'condition'}-${idx}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  {showLogical && <span className="text-xs text-slate-400">{item.logical}</span>}
                  {showField && <span className="font-semibold text-blue-200">{item.field}</span>}
                  {showLabel && <span className="text-slate-300">{label}</span>}
                  {showValue && <span className="text-emerald-200 font-mono">{item.value}</span>}
                  {item.isNewGroup && <span className="text-xs text-amber-300">New group</span>}
                  {item.isEnd && <span className="text-xs text-slate-500">End</span>}
                </div>
              );
            })}
          </div>
        ) : (
          summaryLines.length > 0 && (
            <pre className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 whitespace-pre-wrap">
              {summaryLines.join('\n')}
            </pre>
          )
        )}
      </div>
    );
  }

  const tokens = value.split('^').map(token => token.trim()).filter(Boolean);

  if (tokens.length > 0) {
    return (
      <div className="space-y-1">
        {tokens.map((token, idx) => (
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

export function SnippetModal({ snippet, onClose, user, onUpdateSnippet }: SnippetModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(() => ({
    name: snippet.name,
    description: snippet.description,
    script: snippet.script,
    collection: snippet.collection || '',
    condition: snippet.condition || '',
    when: snippet.when || '',
    order: snippet.order !== undefined ? String(snippet.order) : '',
    priority: snippet.priority !== undefined ? String(snippet.priority) : '',
    filter_condition: snippet.filter_condition || '',
    runsOnInsert: snippet.action_insert ? 'true' : 'false',
    runsOnUpdate: snippet.action_update ? 'true' : 'false',
    runsOnDelete: snippet.action_delete ? 'true' : 'false',
    runsOnQuery: snippet.action_query ? 'true' : 'false',
    tags: [...snippet.tags],
    // Service Portal Widget specific fields
    html: snippet.html || '',
    css: snippet.css || '',
    client_script: snippet.client_script || '',
    server_script: snippet.server_script || ''
  }));
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update editData when snippet prop changes
  useEffect(() => {
    setEditData({
      name: snippet.name,
      description: snippet.description,
      script: snippet.script,
      collection: snippet.collection || '',
      condition: snippet.condition || '',
      when: snippet.when || '',
      order: snippet.order !== undefined ? String(snippet.order) : '',
      priority: snippet.priority !== undefined ? String(snippet.priority) : '',
      filter_condition: snippet.filter_condition || '',
      runsOnInsert: snippet.action_insert ? 'true' : 'false',
      runsOnUpdate: snippet.action_update ? 'true' : 'false',
      runsOnDelete: snippet.action_delete ? 'true' : 'false',
      runsOnQuery: snippet.action_query ? 'true' : 'false',
      tags: [...snippet.tags],
      // Service Portal Widget specific fields
      html: snippet.html || '',
      css: snippet.css || '',
      client_script: snippet.client_script || '',
      server_script: snippet.server_script || ''
    });
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

  const formatBooleanFlag = (value?: boolean | string) => {
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
    await navigator.clipboard.writeText(snippet.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!onUpdateSnippet) return;
    
    setSaving(true);
    try {
      const updates: any = {
        name: editData.name,
        description: editData.description,
        collection: editData.collection,
        condition: editData.condition,
        filter_condition: editData.filter_condition,
        tags: editData.tags
      };

      if (snippet.artifact_type === 'business_rule' || snippet.artifact_type === 'client_script') {
        updates.when = editData.when;
      }

      const orderValue = parseNumericInput(editData.order);
      if (orderValue !== undefined) {
        updates.order = orderValue;
      }

      const priorityValue = parseNumericInput(editData.priority);
      if (priorityValue !== undefined) {
        updates.priority = priorityValue;
      }

      if (snippet.artifact_type === 'business_rule') {
        updates.action_insert = editData.runsOnInsert === 'true';
        updates.action_update = editData.runsOnUpdate === 'true';
        updates.action_delete = editData.runsOnDelete === 'true';
        updates.action_query = editData.runsOnQuery === 'true';
      }

      // Add artifact-specific fields
      if (snippet.artifact_type === 'service_portal_widget') {
        updates.html = editData.html;
        updates.css = editData.css;
        updates.client_script = editData.client_script;
        updates.server_script = editData.server_script;
      } else {
        updates.script = editData.script;
      }
      
      await onUpdateSnippet(snippet.id, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update snippet:', error);
    } finally {
      setSaving(false);
    }
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
    const markdownImage = `![Image](${url})`;
    
    // Check if there's an "alt text" placeholder to replace
    const currentDescription = editData.description;
    const altTextPattern = /!\[alt text\]\([^)]*\)/;
    
    let newDescription = currentDescription;
    
    if (altTextPattern.test(currentDescription)) {
      // Replace the first occurrence of ![alt text](...) with the new image
      newDescription = currentDescription.replace(altTextPattern, markdownImage);
    } else if (insertPosition !== null) {
      // Insert at specific position if set
      newDescription = 
        currentDescription.substring(0, insertPosition) + 
        markdownImage + 
        currentDescription.substring(insertPosition);
      
      setInsertPosition(null);
    } else {
      // Fallback: append to end
      newDescription = currentDescription + '\n\n' + markdownImage;
    }
    
    // Update the edit data immediately
    setEditData(prev => ({
      ...prev,
      description: newDescription
    }));
    
    // Also copy to clipboard for convenience
    navigator.clipboard.writeText(markdownImage);
    
    console.log('Image uploaded and added to description:', markdownImage);
    
    // Auto-save the changes immediately and show feedback
    setTimeout(async () => {
      if (onUpdateSnippet) {
        try {
          await handleSaveWithDescription(newDescription);
          setUploadMessage({ type: 'success', text: 'Image uploaded and saved successfully!' });
        } catch (error) {
          console.error('Failed to save after image upload:', error);
          setUploadMessage({ type: 'error', text: 'Image uploaded but failed to save. Please save manually.' });
        }
      } else {
        setUploadMessage({ type: 'success', text: 'Image uploaded successfully!' });
      }
      
      // Clear message after 5 seconds
      setTimeout(() => setUploadMessage(null), 5000);
    }, 50);
  };

  const handleSaveWithDescription = async (description: string) => {
    if (!onUpdateSnippet) return;
    
    setSaving(true);
    try {
      const updates: any = {
        name: editData.name,
        description: description, // Use the passed description
        collection: editData.collection,
        condition: editData.condition,
        filter_condition: editData.filter_condition,
        tags: editData.tags
      };

      if (snippet.artifact_type === 'business_rule' || snippet.artifact_type === 'client_script') {
        updates.when = editData.when;
      }

      const orderValue = parseNumericInput(editData.order);
      if (orderValue !== undefined) {
        updates.order = orderValue;
      }

      const priorityValue = parseNumericInput(editData.priority);
      if (priorityValue !== undefined) {
        updates.priority = priorityValue;
      }

      if (snippet.artifact_type === 'business_rule') {
        updates.action_insert = editData.runsOnInsert === 'true';
        updates.action_update = editData.runsOnUpdate === 'true';
        updates.action_delete = editData.runsOnDelete === 'true';
        updates.action_query = editData.runsOnQuery === 'true';
      }

      // Add artifact-specific fields
      if (snippet.artifact_type === 'service_portal_widget') {
        updates.html = editData.html;
        updates.css = editData.css;
        updates.client_script = editData.client_script;
        updates.server_script = editData.server_script;
      } else {
        updates.script = editData.script;
      }
      
      await onUpdateSnippet(snippet.id, updates);
      console.log('Auto-saved snippet after image upload');
      return true; // Indicate success
    } catch (error) {
      console.error('Failed to auto-save after image upload:', error);
      throw error; // Re-throw to be caught by caller
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      // When not editing, clicking on the description sets insertion point
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textContent = editData.description;
        
        // Try to find approximate position in the text
        // This is a simplified approach - in a real implementation you'd want more sophisticated text position mapping
        const clickedText = selection.toString();
        if (clickedText) {
          const position = textContent.indexOf(clickedText);
          if (position !== -1) {
            setInsertPosition(position);
          }
        }
      }
    }
  };
  return (
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
            {user && onUpdateSnippet && !isEditing && (
              <button
                onClick={() => setShowImageUpload(true)}
                className="p-2 text-green-400 hover:text-green-300 transition-colors"
                title="Upload image"
              >
                <ImageIcon className="h-5 w-5" />
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
                    setEditData({
                      name: snippet.name,
                      description: snippet.description,
                      script: snippet.script,
                      collection: snippet.collection || '',
                      condition: snippet.condition || '',
                      when: snippet.when || '',
                      order: snippet.order !== undefined ? String(snippet.order) : '',
                      priority: snippet.priority !== undefined ? String(snippet.priority) : '',
                      filter_condition: snippet.filter_condition || '',
                      runsOnInsert: snippet.action_insert ? 'true' : 'false',
                      runsOnUpdate: snippet.action_update ? 'true' : 'false',
                      runsOnDelete: snippet.action_delete ? 'true' : 'false',
                      runsOnQuery: snippet.action_query ? 'true' : 'false',
                      tags: [...snippet.tags],
                      html: snippet.html || '',
                      css: snippet.css || '',
                      client_script: snippet.client_script || '',
                      server_script: snippet.server_script || ''
                    });
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
                onClick={handleDescriptionClick}
                style={{ cursor: !isEditing ? 'pointer' : 'default' }}
              >
                <div
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(editData.description, snippet.repo_path) 
                  }}
                />
              </div>
            )}
          </div>

          {/* Upload feedback message */}
          {uploadMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              uploadMessage.type === 'success' 
                ? 'bg-green-500/20 border-green-500/30 text-green-200' 
                : 'bg-red-500/20 border-red-500/30 text-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {uploadMessage.type === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span>{uploadMessage.text}</span>
              </div>
            </div>
          )}

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
                {isEditing && snippet.artifact_type === 'business_rule' ? (
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
                ) : (
                  <span className="text-purple-300">
                    {formatWhenValue(isEditing ? editData.when : snippet.when)}
                  </span>
                )}
              </div>
            )}

            {snippet.field_name && snippet.artifact_type === 'client_script' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Code2 className="h-4 w-4 text-green-400" />
                <span className="font-medium">Field:</span>
                <span className="text-green-300">{snippet.field_name}</span>
              </div>
            )}

            {snippet.ui_type_code !== undefined && snippet.artifact_type === 'client_script' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="font-medium">UI Type:</span>
                <span className="text-cyan-300">
                  {snippet.ui_type_code === 10 ? 'Desktop (10)' : 
                   snippet.ui_type_code === 1 ? 'Mobile (1)' : 
                   'Both (0)'}
                </span>
              </div>
            )}

            {snippet.api_name && snippet.artifact_type === 'script_include' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Code2 className="h-4 w-4 text-blue-400" />
                <span className="font-medium">API Name:</span>
                <span className="text-blue-300">{snippet.api_name}</span>
              </div>
            )}

            {snippet.artifact_type === 'script_include' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="font-medium">Access Level:</span>
                <span className="text-purple-300">{snippet.access_level || 'Package Private'}</span>
              </div>
            )}

            {snippet.caller_access && snippet.artifact_type === 'script_include' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">Caller Access:</span>
                <span className="text-yellow-300">{snippet.caller_access}</span>
              </div>
            )}

            {snippet.sys_policy && snippet.artifact_type === 'script_include' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="font-medium">System Policy:</span>
                <span className="text-red-300">{snippet.sys_policy}</span>
              </div>
            )}

            {snippet.global !== undefined && snippet.artifact_type === 'client_script' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">Global:</span>
                <span className="text-yellow-300">{snippet.global ? 'Yes' : 'No'}</span>
              </div>
            )}

            {snippet.client_callable !== undefined && snippet.artifact_type === 'script_include' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="font-medium">Client Callable:</span>
                <span className="text-green-300">{snippet.client_callable ? 'Yes' : 'No'}</span>
              </div>
            )}

            {snippet.mobile_callable !== undefined && snippet.artifact_type === 'script_include' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="font-medium">Mobile Callable:</span>
                <span className="text-cyan-300">{snippet.mobile_callable ? 'Yes' : 'No'}</span>
              </div>
            )}

            {snippet.sandbox_callable !== undefined && snippet.artifact_type === 'script_include' && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-orange-400" />
                <span className="font-medium">Sandbox Callable:</span>
                <span className="text-orange-300">{snippet.sandbox_callable ? 'Yes' : 'No'}</span>
              </div>
            )}

            {(snippet.order !== undefined || isEditing) && (
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

            {(snippet.priority !== undefined || isEditing) && (
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
            </>
          )}

          {(snippet.tags.length > 0 || isEditing) && (
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
                  {snippet.tags.map((tag, index) => (
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
        </div>
      </div>

      {showImageUpload && user && (
        <ImageUploadModal
          onClose={() => setShowImageUpload(false)}
          onImageUploaded={handleImageUploaded}
          userId={user.id}
        />
      )}
    </div>
  );
}

