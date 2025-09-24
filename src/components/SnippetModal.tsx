import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Calendar, User, Tag, Code2, Clock, Zap, Shield, Edit, Image as ImageIcon } from 'lucide-react';
import { marked } from 'marked';
import { CodeBlock } from './CodeBlock';
import { ImageUploadModal } from './ImageUploadModal';
import { StorageService } from '../lib/storage';
import type { Snippet } from '../types/snippet';

interface SnippetModalProps {
  snippet: Snippet;
  onClose: () => void;
  user?: { id: string; username?: string; email?: string } | null;
  onUpdateSnippet?: (snippetId: string, updates: Partial<Snippet>) => Promise<void>;
}

export function SnippetModal({ snippet, onClose, user, onUpdateSnippet }: SnippetModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(() => ({
    name: snippet.name,
    description: snippet.description,
    script: snippet.script,
    collection: snippet.collection || '',
    condition: snippet.condition || '',
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
      tags: [...snippet.tags],
      // Service Portal Widget specific fields
      html: snippet.html || '',
      css: snippet.css || '',
      client_script: snippet.client_script || '',
      server_script: snippet.server_script || ''
    });
  }, [snippet]);

  // Configure marked for safe HTML rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const renderMarkdown = (text: string, repoPath?: string) => {
    try {
      let processedText = text;

      // Preprocess GitHub blob URLs to raw URLs for images
      processedText = processedText.replace(
        /!\[([^\]]*)\]\(https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+?)\)/g,
        (match, alt, owner, repo, branchOrHash, path) => {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branchOrHash}/${path}`;
          return `![${alt}](${rawUrl})`;
        }
      );

      // Preprocess relative image paths to full raw GitHub URLs if repo_path is available
      if (repoPath) {
        const baseRawUrl = `https://raw.githubusercontent.com/ServiceNowDevProgram/code-snippets/main`;
        processedText = processedText.replace(
          /!\[([^\]]*)\]\((?!https:)([^)]+)\)/g,
          (match, alt, relativePath) => {
            const imageFilename = relativePath.replace(/^\.\//, ''); // Remove ./ prefix if present
            const fullPath = `${repoPath}/${imageFilename}`;
            const encodedPath = encodeURIComponent(fullPath); // Proper encoding for spaces (%20)
            const rawUrl = `${baseRawUrl}/${encodedPath}`;
            return `![${alt}](${rawUrl})`;
          }
        );
      }

      return marked(processedText);
    } catch (error) {
      console.warn('Error rendering markdown:', error);
      return text; // Fallback to plain text
    }
  };

  const isAdmin = user?.email === 'simenstaabyknudsen@gmail.com';

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
        tags: editData.tags
      };
      
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
        tags: editData.tags
      };
      
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

            {snippet.when && (
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="font-medium">
                  {snippet.artifact_type === 'business_rule' ? 'When:' : 'Script Type:'}
                </span>
                <span className="text-purple-300">
                  {snippet.artifact_type === 'client_script' && snippet.when ? 
                    snippet.when.charAt(0).toUpperCase() + snippet.when.slice(1) : 
                    snippet.when
                  }
                </span>
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

            {snippet.order !== undefined && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-orange-400" />
                <span className="font-medium">Order:</span>
                <span className="text-orange-300">{snippet.order}</span>
              </div>
            )}

            {snippet.priority !== undefined && (
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="font-medium">Priority:</span>
                <span className="text-red-300">{snippet.priority}</span>
              </div>
            )}
          </div>

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
