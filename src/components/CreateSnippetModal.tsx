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
    filter_condition: '',
    when: '',
    order: 100,
    priority: 100,
    action_insert: true,
    action_update: true,
    action_delete: false,
    action_query: false,
    active: true,
    advanced: false,
    field_name: '',
    global: false,
    isolate_script: true,
    applies_extended: false,
    messages: '',
    order_value: 100,
    view: '',
    ui_type_code: 0,
    tags: [],
    html: '',
    css: '',
    server_script: '',
    client_script: '',
    api_name: '',
    client_callable: false,
    option_schema: {},
    demo_data: {},
    access_level: 'package_private',
    caller_access: '',
    mobile_callable: false,
    sandbox_callable: false,
    sys_policy: '',
    form_button: false,
    form_action: false,
    form_context_menu: false,
    form_link: false,
    form_menu_button: false,
    list_button: false,
    list_action: false,
    list_choice: false,
    list_context_menu: false,
    list_banner_button: false,
    show_insert: false,
    show_update: false,
    show_query: false,
    show_multiple_update: false,
    onclick: '',
    hint: '',
    comments: '',
    client: false,
    newlines_to_html: false,
  });

  const [tagInput, setTagInput] = useState('');

  const handleCheckboxChange = (field: keyof CreateSnippetData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const renderScriptTextarea = (label: string, placeholder: string, required = true, rows = 10) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <textarea
        value={formData.script}
        onChange={(e) => setFormData(prev => ({ ...prev, script: e.target.value }))}
        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
    </div>
  );


  
const renderArtifactFields = (): React.ReactNode => {
  switch (formData.artifact_type) {
    case 'client_script':
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Application
              </label>
              <input
                type="text"
                value="Global"
                readOnly
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Scoped to the Global application by default.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:justify-end">
              <label className="inline-flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.active !== false}
                  onChange={handleCheckboxChange('active')}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                Active
              </label>
              <label className="inline-flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={!!formData.applies_extended}
                  onChange={handleCheckboxChange('applies_extended')}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                Inherited
              </label>
              <label className="inline-flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={!!formData.global}
                  onChange={handleCheckboxChange('global')}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                Global
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Table *
              </label>
              <input
                type="text"
                value={formData.collection || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="User [sys_user]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                UI Type
              </label>
              <select
                value={formData.ui_type_code ?? 0}
                onChange={(e) => setFormData(prev => ({ ...prev, ui_type_code: parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0} className="bg-slate-800">All</option>
                <option value={10} className="bg-slate-800">Desktop</option>
                <option value={1} className="bg-slate-800">Mobile</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type *
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
                Field Name
              </label>
              <input
                type="text"
                value={formData.field_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="leave blank unless Type is onChange"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                View
              </label>
              <input
                type="text"
                value={formData.view || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, view: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Default view"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Order
              </label>
              <input
                type="number"
                value={formData.order_value ?? 100}
                onChange={(e) => setFormData(prev => ({ ...prev, order_value: Number.isNaN(parseInt(e.target.value, 10)) ? 100 : parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
              />
            </div>
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
              placeholder="Optional script condition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Messages
            </label>
            <textarea
              value={formData.messages || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, messages: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional UI messages to display"
              rows={3}
            />
          </div>

          {renderScriptTextarea('Script *', 'function onLoad() {\n  // Client script\n}')}

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.isolate_script !== false}
                onChange={handleCheckboxChange('isolate_script')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Isolate script
            </label>
          </div>
        </>
      );
    case 'business_rule':
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Table *
              </label>
              <input
                type="text"
                value={formData.collection || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Incident [incident]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                When *
              </label>
              <select
                value={formData.when || 'before'}
                onChange={(e) => setFormData(prev => ({ ...prev, when: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="before" className="bg-slate-800">Before</option>
                <option value="after" className="bg-slate-800">After</option>
                <option value="async" className="bg-slate-800">Async</option>
                <option value="display" className="bg-slate-800">Display</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Order
              </label>
              <input
                type="number"
                value={formData.order ?? 100}
                onChange={(e) => setFormData(prev => ({ ...prev, order: Number.isNaN(parseInt(e.target.value, 10)) ? 100 : parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Filter Condition (encoded query)
              </label>
              <input
                type="text"
                value={formData.filter_condition || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, filter_condition: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., active=true^category=software"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.active !== false}
                onChange={handleCheckboxChange('active')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={!!formData.advanced}
                onChange={handleCheckboxChange('advanced')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Advanced
            </label>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={!!formData.action_insert}
                onChange={handleCheckboxChange('action_insert')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Insert
            </label>
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={!!formData.action_update}
                onChange={handleCheckboxChange('action_update')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Update
            </label>
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={!!formData.action_delete}
                onChange={handleCheckboxChange('action_delete')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Delete
            </label>
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={!!formData.action_query}
                onChange={handleCheckboxChange('action_query')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Query
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Condition Script
            </label>
            <textarea
              value={formData.condition || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="return current.active;"
              rows={4}
            />
          </div>

          {renderScriptTextarea('Script *', '(function executeRule(current, previous /*null when async*/ ) {\n  // Business rule logic\n})()')}
        </>
      );
    case 'script_include':
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Application
              </label>
              <input
                type="text"
                value="Global"
                readOnly
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Name *
              </label>
              <input
                type="text"
                value={formData.api_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, api_name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MyScriptInclude"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Used when calling this script include.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Accessible from
              </label>
              <select
                value={formData.access_level || 'package_private'}
                onChange={(e) => setFormData(prev => ({ ...prev, access_level: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="package_private" className="bg-slate-800">This application scope only</option>
                <option value="public" className="bg-slate-800">All application scopes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Caller Access
              </label>
              <input
                type="text"
                value={formData.caller_access || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, caller_access: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comma separated roles (optional)"
              />
              <p className="text-xs text-slate-400 mt-1">
                Restrict who can call this script include.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.active !== false}
                onChange={handleCheckboxChange('active')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={!!formData.client_callable}
                onChange={handleCheckboxChange('client_callable')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Client callable
            </label>
          </div>

          {renderScriptTextarea('Script *', 'var MyScriptInclude = Class.create({\n  initialize: function() {},\n});', true, 12)}
        </>
      );
    case 'ui_action': {
      const placementOptions: Array<{ field: keyof CreateSnippetData; label: string }> = [
        { field: 'form_button', label: 'Form button' },
        { field: 'form_context_menu', label: 'Form context menu' },
        { field: 'form_link', label: 'Form link' },
        { field: 'list_button', label: 'List button' },
        { field: 'list_context_menu', label: 'List context menu' },
      ];
      const visibilityOptions: Array<{ field: keyof CreateSnippetData; label: string }> = [
        { field: 'show_insert', label: 'Show Insert' },
        { field: 'show_update', label: 'Show Update' },
        { field: 'show_query', label: 'Show List (Query)' },
        { field: 'show_multiple_update', label: 'Show Multi Update' },
      ];
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Table *
              </label>
              <input
                type="text"
                value={formData.collection || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Incident [incident]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Order
              </label>
              <input
                type="number"
                value={formData.order ?? 100}
                onChange={(e) => setFormData(prev => ({ ...prev, order: Number.isNaN(parseInt(e.target.value, 10)) ? 100 : parseInt(e.target.value, 10) }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={formData.active !== false}
                onChange={handleCheckboxChange('active')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={!!formData.client}
                onChange={handleCheckboxChange('client')}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />
              Client
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Condition
              </label>
              <input
                type="text"
                value={formData.condition || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional script condition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Button hint
              </label>
              <input
                type="text"
                value={formData.hint || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hint: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tooltip displayed on the button"
              />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-300 mb-2">Display on</span>
            <div className="flex flex-wrap gap-4">
              {placementOptions.map((option) => (
                <label key={option.field as string} className="inline-flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[option.field])}
                    onChange={handleCheckboxChange(option.field)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-300 mb-2">Visibility</span>
            <div className="flex flex-wrap gap-4">
              {visibilityOptions.map((option) => (
                <label key={option.field as string} className="inline-flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[option.field])}
                    onChange={handleCheckboxChange(option.field)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Onclick
            </label>
            <textarea
              value={formData.onclick || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, onclick: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="onClick();"
              rows={4}
            />
          </div>

          {renderScriptTextarea('Script *', '(function onClick() {\n  // logic\n})()')}
        </>
      );
    }
    case 'mail_script':
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Application
              </label>
              <input
                type="text"
                value="Global"
                readOnly
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Scoped to the Global application by default.
              </p>
            </div>
            <div className="flex items-center md:justify-end">
              <label className="inline-flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={!!formData.newlines_to_html}
                  onChange={handleCheckboxChange('newlines_to_html')}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                Newlines to HTML
              </label>
            </div>
          </div>

          {renderScriptTextarea('Script *', '// Mail script code\n')}
        </>
      );
    case 'background_script':
      return (
        <>
          {renderScriptTextarea('Script *', '// Background script code\n')}
        </>
      );
    case 'service_portal_widget':
      return null;
    default:
      return (
        <>
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
                placeholder="e.g., sys_email"
              />
            </div>
            <div className="flex items-center md:justify-end">
              <label className="inline-flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.active !== false}
                  onChange={handleCheckboxChange('active')}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                Active
              </label>
            </div>
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
              placeholder="Optional condition or encoded query"
            />
          </div>

          {renderScriptTextarea('Script *', 'Enter your code here')}
        </>
      );
  }
};
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
          filter_condition: extractValue('filter_condition'),
          when: extractValue('when') || extractValue('type'),
          order: parseInt(extractValue('order')) || 100,
          priority: parseInt(extractValue('priority')) || 100,
          action_insert: extractValue('action_insert') === 'true',
          action_update: extractValue('action_update') === 'true',
          action_delete: extractValue('action_delete') === 'true',
          action_query: extractValue('action_query') === 'true',
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
            client: extractValue('client') === 'true',  // UI Action specific field
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

  if (formData.artifact_type === 'client_script') {
    if (!formData.collection?.trim()) {
      setError('Table is required for Client Scripts.');
      return;
    }
    if (!(formData.when?.trim())) {
      setError('Type is required for Client Scripts.');
      return;
    }
  }

  if (formData.artifact_type === 'business_rule') {
    if (!formData.collection?.trim()) {
      setError('Table is required for Business Rules.');
      return;
    }
    if (!(formData.when?.trim())) {
      setError('When is required for Business Rules.');
      return;
    }
  }

  if (formData.artifact_type === 'script_include') {
    const apiCandidate = formData.api_name?.trim() || formData.name.replace(/\s+/g, '');
    if (!apiCandidate) {
      setError('API Name is required for Script Includes.');
      return;
    }
  }

  if (formData.artifact_type === 'ui_action') {
    if (!formData.collection?.trim()) {
      setError('Table is required for UI Actions.');
      return;
    }
  }

  let submissionData: CreateSnippetData = { ...formData };

  if (submissionData.artifact_type === 'client_script') {
    submissionData = {
      ...submissionData,
      collection: submissionData.collection?.trim() || '',
      when: submissionData.when?.trim() || 'onLoad',
      order_value: submissionData.order_value ?? 100,
      ui_type_code: submissionData.ui_type_code ?? 0,
    };
  }

  if (submissionData.artifact_type === 'business_rule') {
    const normalizedOrder = Number.isNaN(Number(submissionData.order)) ? 100 : Number(submissionData.order);
    submissionData = {
      ...submissionData,
      collection: submissionData.collection?.trim() || '',
      when: submissionData.when?.trim() || 'before',
      order: normalizedOrder,
      filter_condition: submissionData.filter_condition?.trim() || '',
      condition: submissionData.condition?.trim() || '',
      action_insert: !!submissionData.action_insert,
      action_update: !!submissionData.action_update,
      action_delete: !!submissionData.action_delete,
      action_query: !!submissionData.action_query,
      advanced: !!submissionData.advanced,
      active: submissionData.active !== false,
    };
  }

  if (submissionData.artifact_type === 'script_include') {
    const apiName = (submissionData.api_name?.trim() || submissionData.name?.replace(/\s+/g, '') || '');
    submissionData = {
      ...submissionData,
      api_name: apiName,
      access_level: submissionData.access_level || 'package_private',
      caller_access: submissionData.caller_access?.trim() || '',
      client: !!submissionData.client,
      active: submissionData.active !== false,
    };
  }

  if (submissionData.artifact_type === 'ui_action') {
    const normalizedOrder = Number.isNaN(Number(submissionData.order)) ? 100 : Number(submissionData.order);
    submissionData = {
      ...submissionData,
      collection: submissionData.collection?.trim() || '',
      order: normalizedOrder,
      condition: submissionData.condition?.trim() || '',
      hint: submissionData.hint?.trim() || '',
      onclick: submissionData.onclick?.trim() || '',
      active: submissionData.active !== false,
      form_button: !!submissionData.form_button,
      form_context_menu: !!submissionData.form_context_menu,
      form_link: !!submissionData.form_link,
      list_button: !!submissionData.list_button,
      list_context_menu: !!submissionData.list_context_menu,
      show_insert: !!submissionData.show_insert,
      show_update: !!submissionData.show_update,
      show_query: !!submissionData.show_query,
      show_multiple_update: !!submissionData.show_multiple_update,
      client: !!submissionData.client,
    };
  }

  setLoading(true);
  console.log('Form submitted, creating snippet...');

  try {
    await onCreateSnippet(submissionData, user.id);
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

            {renderArtifactFields()}

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
