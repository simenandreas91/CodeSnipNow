import React, { useState } from 'react';
import { X, Copy, Check, Calendar, User, Globe, Shield, GitBranch } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import type { Integration } from '../types/snippet';

interface IntegrationModalProps {
  integration: Integration;
  onClose: () => void;
}

export function IntegrationModal({ integration, onClose }: IntegrationModalProps) {
  const [copiedSection, setCopiedSection] = useState<'primary' | 'secondary' | null>(null);

  const handleCopy = async (code: string, section: 'primary' | 'secondary') => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedSection(section);
      setTimeout(() => {
        setCopiedSection((current) => (current === section ? null : current));
      }, 2000);
    } catch (error) {
      console.warn('Failed to copy integration code', error);
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
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-200">
                {integration.type || 'Integration'}
              </span>
              {integration.is_public ? (
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

            <h2 className="text-2xl font-semibold text-white leading-tight">
              {integration.title}
            </h2>

            {integration.description && (
              <p className="mt-3 text-sm text-slate-300 whitespace-pre-line">
                {integration.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors"
            aria-label="Close integration details"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-8">
          <div className="grid grid-cols-1 gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{integration.author_id ? 'User' : 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {createdDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Updated {updatedDate}</span>
            </div>
            {integration.repo_path && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="truncate" title={integration.repo_path}>
                  {integration.repo_path}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Primary Code</h3>
                <button
                  type="button"
                  onClick={() => handleCopy(integration.code, 'primary')}
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
              </div>
              <CodeBlock code={integration.code} language="javascript" />
            </div>

            {integration.code2 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Additional Code</h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(integration.code2 ?? '', 'secondary')}
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
                </div>
                <CodeBlock code={integration.code2} language="javascript" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
