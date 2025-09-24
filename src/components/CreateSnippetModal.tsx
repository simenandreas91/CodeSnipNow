import React, { useState } from 'react';
import { X, Upload, Plus, Loader2 } from 'lucide-react';
import type { User, CreateSnippetData } from '../types/snippet';
import { ARTIFACT_TYPES } from '../types/snippet';

interface CreateSnippetModalProps {
  onClose: () => void;
  onCreateSnippet: (data: CreateSnippetData, userId: string) => Promise<void>;
  user: User;
}

export function CreateSnippetModal({ onClose, onCreateSnippet, user }: CreateSnippetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [optionSchemaError, setOptionSchemaError] = useState('');
  const [demoDataError, setDemoDataError] = useState('');
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
    html: '',
    css: '',
    server_script: '',
    client_script: '',
    option_schema: {},
    demo_data: {},
    access_level: '',
    caller_access: '',
    mobile_callable: false,
    sandbox_callable: false,
    sys_policy: '',
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
      let element = xmlDoc.querySelector('sys_script') || 
                    xmlDoc.querySelector('sys_script_include') || 
                    xmlDoc.querySelector('sys_ui_action') ||
                    xmlDoc.querySelector('sys_script_client') ||
                    xmlDoc.querySelector('sys_widget') ||
                    xmlDoc.querySelector('sp_widget') ||
                    xmlDoc.querySelector('sys_script_email');

      if (element) {
        const extractValue = (tagName: string) => {
          const el = element.querySelector(tagName);
          return el?.textContent?.trim() || '';
        };

        const artifactType = determineArtifactType(element.tagName);
        
        const baseData = {
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
          advanced: extractValue('advanced') === 'true',
          tags: [],
        };

        if (artifactType === 'service_portal_widget') {
          const optionSchemaStr = extractValue('option_schema').trim();
          const demoDataStr = extractValue('demo_data').trim();
          let optionSchema = {};
          let demoData = {};
          try {
            if (optionSchemaStr) {
              optionSchema = JSON.parse(optionSchemaStr);
            }
          } catch (err) {
            console.warn('Failed to parse option_schema:', err);
          }
          try {
            if (demoDataStr) {
              demoData = JSON.parse(demoDataStr);
            }
          } catch (err) {
            console.warn('Failed to parse demo_data:', err);
          }
          setFormData({
            ...baseData,
            html: extractValue('template'),
            css: extractValue('css'),
            server_script: extractValue('script'),
            client_script: extractValue('client_script'),
            option_schema: optionSchema,
            demo_data: demoData,
          });
        } else {
          setFormData({
            ...baseData,
            access_level: extractValue('access') === 'public' ? 'public' : 'package_private',
            client_callable: extractValue('client_callable') === 'true',
            caller_access: extractValue('caller_access'),
            mobile_callable: extractValue('mobile_callable') === 'true',
            sandbox_callable: extractValue('sandbox_callable') === 'true',
            sys_policy: extractValue('sys_policy'),
            // Client Script specific fields
            field_name: extractValue('field'),
            global: extractValue('global') === 'true',
            isolate_script: extractValue('isolate_script') !== 'false',
            applies_extended: extractValue('applies_extended') === 'true',
            messages: extractValue('messages'),
            order_value: parseInt(extractValue('order')) || 100,
            view: extractValue('view'),
            ui_type_code: parseInt(extractValue('ui_type')) || 10,
          });
        }
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
      'sys_widget': 'service_portal_widget',
      'sp_widget': 'service_portal_widget',
      'sys_script_email': 'mail_script',
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
    setOptionSchemaError('');
    setDemoDataError('');

    // Validation for widget
    if (formData.artifact_type === 'service_portal_widget') {
      if (!formData.html?.trim()) {
        setError('HTML Template is required for Service Portal Widgets.');
        return;
      }
      if (optionSchemaError || demoDataError) {
        setError('Please fix JSON errors in Option Schema or Demo Data.');
        return;
      }
    }

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

  const handleOptionSchemaChange = (value: string) => {
    try {
      const parsed = value ? JSON.parse(value) : {};
      setFormData(prev => ({ ...prev, option_schema: parsed }));
      setOptionSchemaError('');
    } catch (err) {
      setOptionSchemaError('Invalid JSON format');
    }
  };

  const handleDemoDataChange = (value: string) => {
    try {
      const parsed = value ? JSON.parse(value) : {};
      setFormData(prev => ({ ...prev, demo_data: parsed }));
      setDemoDataError('');
    } catch (err) {
      setDemoDataError('Invalid JSON format');
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

            {formData.artifact_type !== 'service_portal_widget' && (
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
            )}

            {formData.artifact_type !== 'service_portal_widget' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Condition
                </label>
                <input
                  type="text"
                  value={formData.condition || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., current.active=true"
                />
              </div>
            )}

            {formData.artifact_type !== 'service_portal_widget' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Script *
                </label>
                <textarea
                  value={formData.script}
                  onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your code here"
                  rows={10}
                  required
                />
              </div>
            )}

            {formData.artifact_type === 'service_portal_widget' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    HTML Template *
                  </label>
                  <textarea
                    value={formData.html || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, html: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="<div>Widget HTML template</div>"
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    CSS
                  </label>
                  <textarea
                    value={formData.css || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, css: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder=".my-widget { color: white; }"
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Client Script
                  </label>
                  <textarea
                    value={formData.client_script || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_script: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="function($scope) { /* Client-side logic */ }"
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Server Script
                  </label>
                  <textarea
                    value={formData.server_script || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, server_script: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(function() { /* Server-side logic */ })();"
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Option Schema
                    {optionSchemaError && (
                      <span className="text-red-500 ml-2 text-xs">{optionSchemaError}</span>
                    )}
                  </label>
                  <textarea
                    value={typeof formData.option_schema === 'object' ? JSON.stringify(formData.option_schema, null, 2) : ''}
                    onChange={(e) => handleOptionSchemaChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
                      optionSchemaError ? 'border-red-500' : 'border-white/20'
                    } rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder='{"fields":[{"name":"title","label":"Title","type":"string"}]}'
                    rows={6}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    JSON object defining widget options. Must be valid JSON.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Demo Data
                    {demoDataError && (
                      <span className="text-red-500 ml-2 text-xs">{demoDataError}</span>
                    )}
                  </label>
                  <textarea
                    value={typeof formData.demo_data === 'object' ? JSON.stringify(formData.demo_data, null, 2) : ''}
                    onChange={(e) => handleDemoDataChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border ${
                      demoDataError ? 'border-red-500' : 'border-white/20'
                    } rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder='{"title":"Example Title"}'
                    rows={6}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Sample data for widget preview. Must be valid JSON.
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-300 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-l-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Snippet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
