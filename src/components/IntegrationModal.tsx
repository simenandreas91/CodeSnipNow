import React, { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Calendar,
  User,
  Globe,
  Shield,
  GitBranch,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { renderMarkdown } from '../lib/markdown';
import { CodeBlock } from './CodeBlock';
import type { IntegrationLike } from '../types/snippet';

interface IntegrationModalProps {
  integration: IntegrationLike;
  onClose: () => void;
  entityLabel?: string;
  user?: { id: string; email?: string; username?: string } | null;
  onUpdate?: (
    integrationId: string,
    updates: Partial<IntegrationLike>
  ) => Promise<IntegrationLike | void | null>;
  onDelete?: (integrationId: string) => Promise<void>;
}

type CodeSection = 'primary' | 'secondary';

type FormState = {
  title: string;
  type: string;
  description: string;
  repo_path: string;
  is_public: boolean;
  code: string;
  code2: string;
};

const buildFormState = (integration: IntegrationLike): FormState => ({
  title: integration.title,
  type: integration.type || '',
  description: integration.description || '',
  repo_path: integration.repo_path || '',
  is_public: integration.is_public ?? true,
  code: integration.code || '',
  code2: integration.code2 || ''
});

export function IntegrationModal({
  integration,
  onClose,
  entityLabel = 'Integration',
  user,
  onUpdate,
  onDelete
}: IntegrationModalProps) {
  const [copiedSection, setCopiedSection] = useState<CodeSection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<FormState>(() => buildFormState(integration));

  useEffect(() => {
    setFormData(buildFormState(integration));
    setIsEditing(false);
    setCopiedSection(null);
  }, [integration]);

  const isAdmin = user?.email === 'simenstaabyknudsen@gmail.com';
  const isOwner = Boolean(integration.author_id && user?.id && integration.author_id === user.id);
  const canManage = Boolean(onUpdate && (isAdmin || isOwner));

  const handleCopy = async (code: string, section: CodeSection) => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedSection(section);
      setTimeout(() => {
        setCopiedSection(current => (current === section ? null : current));
      }, 2000);
    } catch (error) {
      console.warn('Failed to copy integration code', error);
    }
  };

  const handleCancel = () => {
    setFormData(buildFormState(integration));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaving(true);

    try {
      const trimmedType = formData.type.trim();
      const updates: Partial<IntegrationLike> = {
        title: formData.title,
        description: formData.description,
        code: formData.code,
        code2: formData.code2 || null,
        type: trimmedType || null,
        repo_path: formData.repo_path || null,
        is_public: formData.is_public
      };

      const normalizedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      ) as Partial<IntegrationLike>;

      const result = await onUpdate(integration.id, normalizedUpdates);

      if (result) {
        setFormData(buildFormState(result));
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update integration', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(`Delete ${entityLabel.toLowerCase()} "${integration.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(integration.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete integration', error);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const createdDate = new Date(integration.created_at).toLocaleDateString();
  const updatedDate = new Date(integration.updated_at).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-xl shadow-blue-500/20">
        <div className="flex items-start justify-between gap-6 border-b border-slate-700 px-8 py-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {isEditing ? (
                <input
                  value={formData.type}
                  onChange={event => setFormData(prev => ({ ...prev, type: event.target.value }))}
                  placeholder={`${entityLabel} Type`}
                  className="px-3 py-1 rounded-full text-xs font-medium text-white bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-200">
                  {formData.type || entityLabel}
                </span>
              )}

              {isEditing ? (
                <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={event => setFormData(prev => ({ ...prev, is_public: event.target.checked }))}
                    className="rounded border-slate-600 bg-slate-900"
                  />
                  Public
                </label>
              ) : formData.is_public ? (
                <span className="inline-flex items-center gap-2 text-xs text-emerald-300">
                  <Globe className="h-3 w-3" />
                  Public
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs text-amber-300">
                  <Shield className="h-3 w-3" />
                  Private
                </span>
              )}
            </div>

            {isEditing ? (
              <input
                value={formData.title}
                onChange={event => setFormData(prev => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${entityLabel} title`}
              />
            ) : (
              <h2 className="text-2xl font-semibold text-white leading-tight">
                {formData.title}
              </h2>
            )}

            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={event => setFormData(prev => ({ ...prev, description: event.target.value }))}
                className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Markdown description"
              />
            ) : (
              formData.description && (
                <div
                  className="mt-3 text-sm text-slate-300 leading-relaxed prose prose-invert prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(formData.description, formData.repo_path)
                  }}
                />
              )
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              {canManage && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-blue-500 hover:text-white"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              )}

              {canManage && !isEditing && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-600/60 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-600/10"
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </button>
              )}

              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-400"
                  >
                    Cancel
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-transparent p-2 text-slate-300 transition-colors hover:text-white"
                aria-label={`Close ${entityLabel.toLowerCase()} details`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="text-right text-xs text-slate-400">
              <div>Created {createdDate}</div>
              <div>Updated {updatedDate}</div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          <div className="grid grid-cols-1 gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{integration.author_id ? 'User' : 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{createdDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{updatedDate}</span>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <input
                  value={formData.repo_path}
                  onChange={event => setFormData(prev => ({ ...prev, repo_path: event.target.value }))}
                  className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repository path"
                />
              </div>
            ) : (
              formData.repo_path && (
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="truncate" title={formData.repo_path}>
                    {formData.repo_path}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Primary Code</h3>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.code, 'primary')}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                  >
                    {copiedSection === 'primary' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={formData.code}
                  onChange={event => setFormData(prev => ({ ...prev, code: event.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={14}
                  placeholder="Primary code"
                />
              ) : (
                <CodeBlock code={formData.code} language="javascript" />
              )}
            </div>

            {(isEditing || formData.code2) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Additional Code</h3>
                  {!isEditing && formData.code2 && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.code2, 'secondary')}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm text-white transition-colors hover:bg-purple-700"
                    >
                      {copiedSection === 'secondary' ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={formData.code2}
                    onChange={event => setFormData(prev => ({ ...prev, code2: event.target.value }))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={10}
                    placeholder="Additional code (optional)"
                  />
                ) : (
                  formData.code2 && <CodeBlock code={formData.code2} language="javascript" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
