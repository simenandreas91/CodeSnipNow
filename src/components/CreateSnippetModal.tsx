import React, { useState } from 'react';
import { X, Upload, Plus, Loader2 } from 'lucide-react';
import type { User, CreateSnippetData } from '../types/snippet';

interface CreateSnippetModalProps {
  onClose: () => void;
  onCreateSnippet: (data: CreateSnippetData, userId: string) => Promise<void>;
  user: User;
}

const ARTIFACT_TYPES = [
  { value: 'business_rule', label: 'Business Rule' },
  { value: 'client_script', label: 'Client Script' },
  { value: 'script_include', label: 'Script Include' },
  { value: 'ui_action', label: 'UI Action' },
  { value: 'scheduled_job', label: 'Scheduled Job' },
  { value: 'transform_map', label: 'Transform Map' },
  { value: 'background_script', label: 'Background Script' },
];

export function CreateSnippetModal({ onClose, onCreateSnippet, user }: CreateSnippetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<'manual' | 'xml'>('manual');
  
  const [formData, setFormData] = useState<CreateSnippetData>({
    name: '',
    description: '',
    script: '',
    artifact_type: 'business_rule',
    collection: '',
    condition: '',
    when: '',
    order: 100,
    priority: 100,
    active: true,
    advanced: false,
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xmlContent = event.target?.result as string;
      parseXMLContent(xmlContent);
    };
    reader.readAsText(file);
  };

  const parseXMLContent = (xmlContent: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Extract data from ServiceNow XML export
      const scriptElement = xmlDoc.querySelector('sys_script') || 
                           xmlDoc.querySelector('sys_script_include') || 
                           xmlDoc.querySelector('sys_ui_action') ||
                           xmlDoc.querySelector('sys_script_client');
      
      if (scriptElement) {
        const extractValue = (tagName: string) => {
          const element = scriptElement.querySelector(tagName);
          return element?.textContent?.trim() || '';
        };

        const artifactType = determineArtifactType(scriptElement.tagName);
        
        setFormData({
          name: extractValue('name') || extractValue('sys_name'),
          description: extractValue('description'),
          script: extractValue('script'),
          artifact_type: artifactType,
          collection: extractValue('collection') || extractValue('table') || extractValue('table_name'),
          condition: extractValue('condition'),
          when: extractValue('when') || extractValue('type'),
          order: parseInt(extractValue('order')) || 100,
          priority: parseInt(extractValue('priority')) || 100,
          active: extractValue('active') === 'true',
          access_level: extractValue('access') === 'public' ? 'public' : 'package_private',
          client_callable: extractValue('client_callable') === 'true',
          caller_access: extractValue('caller_access'),
          mobile_callable: extractValue('mobile_callable') === 'true',
          sandbox_callable: extractValue('sandbox_callable') === 'true',
          sys_policy: extractValue('sys_policy'),
          advanced: extractValue('advanced') === 'true',
          // Client Script specific fields
          field_name: extractValue('field'),
          global: extractValue('global') === 'true',
          isolate_script: extractValue('isolate_script') !== 'false', // Default true
          applies_extended: extractValue('applies_extended') === 'true',
          messages: extractValue('messages'),
          order_value: parseInt(extractValue('order')) || 100,
          view: extractValue('view'),
          ui_type_code: parseInt(extractValue('ui_type')) || 10,
          tags: [],
        });
      }
    } catch (err) {
      setError('Failed to parse XML file. Please check the format.');
    }
  };

  const determineArtifactType = (tagName: string): string => {
    const tagMap: { [key: string]: string } = {
      'sys_script': 'business_rule',
      'sys_script_client': 'client_script',
      'sys_script_include': 'script_include',
      'sys_ui_action': 'ui_action',
    };
    return tagMap[tagName] || 'other';
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Form submitted, creating snippet...');

    try {
      await onCreateSnippet(formData, user.id);
      console.log('Snippet created successfully, closing modal...');
      onClose();
    } catch (err: any) {
      console.error('Error creating snippet:', err);
      const errorMessage = err.message || 'Failed to create snippet';
      setError(errorMessage);
      console.error('Setting error message:', errorMessage);
    } finally {
      setLoading(false);
      console.log('Create snippet process completed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create New Snippet</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMethod('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                method === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Plus className="h-4 w-4" />
              Manual Entry
            </button>
            <button
              onClick={() => setMethod('xml')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                method === 'xml'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload XML
            </button>
          </div>

          {method === 'xml' && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Upload ServiceNow XML Export
              </label>
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
              <p className="text-xs text-slate-400 mt-2">
                Upload a ServiceNow XML export file to automatically populate the form fields.
              </p>
            </div>
          )}

          <form id="snippet-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter snippet name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Artifact Type *
                </label>
                <select
                  value={formData.artifact_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, artifact_type: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {ARTIFACT_TYPES.map(type => (
                    <option key={type.value} value={type.value} className="bg-slate-800">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this snippet does"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Table/Collection
                </label>
                <input
                  type="text"
                  value={formData.collection || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., sys_user, incident"
                />
              </div>

              {formData.artifact_type === 'business_rule' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    When
                  </label>
                  <select
                    value={formData.when || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, when: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" className="bg-slate-800">Select timing</option>
                    <option value="before" className="bg-slate-800">Before</option>
                    <option value="after" className="bg-slate-800">After</option>
                    <option value="async" className="bg-slate-800">Async</option>
                    <option value="display" className="bg-slate-800">Display</option>
                  </select>
                </div>
              )}

              {formData.artifact_type === 'ui_action' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order || 100}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Condition
              </label>
              <input
                type="text"
                value={formData.condition || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., current.state.changesTo(6)"
              />
            </div>

            {/* Business Rule specific fields */}
            {formData.artifact_type === 'business_rule' && (
              <>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Action Settings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.action_insert !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, action_insert: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Insert</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.action_update !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, action_update: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Update</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.action_delete || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, action_delete: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Delete</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.action_query || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, action_query: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Query</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Behavior Options</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.abort_action || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, abort_action: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Abort Action</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.add_message || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, add_message: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Add Message</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.change_fields || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, change_fields: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Set Field Values</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.execute_function || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, execute_function: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Execute Function</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Access Level
                    </label>
                    <select
                      value={formData.access || 'package_private'}
                      onChange={(e) => setFormData(prev => ({ ...prev, access: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="package_private" className="bg-slate-800">Package Private</option>
                      <option value="public" className="bg-slate-800">Public</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={formData.priority || 100}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Filter Condition
                  </label>
                  <textarea
                    value={formData.filter_condition || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, filter_condition: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Advanced filter conditions"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message (for users)
                  </label>
                  <textarea
                    value={formData.message || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Message to display to users"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.client_callable || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_callable: e.target.checked }))}
                      className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">Client Callable</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_rest || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_rest: e.target.checked }))}
                      className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-slate-300">REST Endpoint</span>
                  </label>
                </div>
              </>
            )}

            {/* Client Script specific fields */}
            {formData.artifact_type === 'client_script' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Script Type *
                    </label>
                    <select
                      value={formData.when || 'onLoad'}
                      onChange={(e) => setFormData(prev => ({ ...prev, when: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="onLoad" className="bg-slate-800">onLoad</option>
                      <option value="onChange" className="bg-slate-800">onChange</option>
                      <option value="onSubmit" className="bg-slate-800">onSubmit</option>
                      <option value="onCellEdit" className="bg-slate-800">onCellEdit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      UI Type
                    </label>
                    <select
                      value={formData.ui_type_code === 1 ? 'mobile' : formData.ui_type_code === 0 ? 'both' : 'desktop'}
                      onChange={(e) => {
                        const uiType = e.target.value;
                        const uiTypeCode = uiType === 'mobile' ? 1 : uiType === 'both' ? 0 : 10;
                        setFormData(prev => ({ 
                          ...prev, 
                          ui_type_code: uiTypeCode 
                        }));
                      }}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="desktop" className="bg-slate-800">Desktop (10)</option>
                      <option value="mobile" className="bg-slate-800">Mobile (1)</option>
                      <option value="both" className="bg-slate-800">Both (0)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={formData.field_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., state, priority (for onChange scripts)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      View
                    </label>
                    <input
                      type="text"
                      value={formData.view || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, view: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Specific view name (optional)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.order_value || 100}
                      onChange={(e) => setFormData(prev => ({ ...prev, order_value: parseInt(e.target.value) || 100 }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Messages
                    </label>
                    <input
                      type="text"
                      value={formData.messages || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, messages: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Custom messages"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Script Options</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.global || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, global: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Global</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isolate_script !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isolate_script: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Isolate Script</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.applies_extended || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, applies_extended: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Applies Extended</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* UI Action specific fields */}
            {formData.artifact_type === 'ui_action' && (
              <>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Form Display Options</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.form_button || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, form_button: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Form Button</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.form_action || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, form_action: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Form Action</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.form_context_menu || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, form_context_menu: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Form Context Menu</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.form_link || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, form_link: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Form Link</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.form_menu_button || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, form_menu_button: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Form Menu Button</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">List Display Options</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.list_button || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, list_button: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">List Button</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.list_action || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, list_action: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">List Action</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.list_choice || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, list_choice: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">List Choice</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.list_context_menu || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, list_context_menu: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">List Context Menu</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.list_banner_button || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, list_banner_button: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">List Banner Button</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Visibility Options</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.show_insert !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, show_insert: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Show Insert</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.show_update !== false}
                        onChange={(e) => setFormData(prev => ({ ...prev, show_update: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Show Update</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.show_query || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, show_query: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Show Query</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.show_multiple_update || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, show_multiple_update: e.target.checked }))}
                        className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-slate-300 text-sm">Show Multiple Update</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Client Script
                    </label>
                    <textarea
                      value={formData.client_script_v2 || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_script_v2: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="function onClick(g_form) { }"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      OnClick Script
                    </label>
                    <textarea
                      value={formData.onclick || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, onclick: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="onClick script"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hint
                    </label>
                    <input
                      type="text"
                      value={formData.hint || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tooltip hint text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Comments
                    </label>
                    <input
                      type="text"
                      value={formData.comments || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Internal comments"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 text-slate-300 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Script Code *
              </label>
              <textarea
                value={formData.script}
                onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Paste your ServiceNow script here"
                rows={10}
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-300">Active</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.advanced}
                  onChange={(e) => setFormData(prev => ({ ...prev, advanced: e.target.checked }))}
                  className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-300">Advanced</span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

          </form>
        </div>
        
        <div className="p-6 border-t border-white/10 bg-slate-900/95">
          <button
            type="submit"
            form="snippet-form"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Snippet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}