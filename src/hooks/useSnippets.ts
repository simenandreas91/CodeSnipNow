import { useState, useEffect, useRef } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { Snippet, CreateSnippetData } from '../types/snippet';
import { ARTIFACT_TYPES } from '../types/snippet';

const ITEMS_PER_PAGE = 12;

const CACHE_TTL_MS = 60 * 1000;

const SNIPPET_SELECT_COLUMNS = [
  'id',
  'title',
  'description',
  'code',
  'type',
  'collection',
  'table_name',
  'condition',
  'filter_condition',
  'when_to_run',
  'script_type',
  'order_value',
  'priority',
  'action_insert',
  'action_update',
  'action_delete',
  'action_query',
  'active',
  'advanced',
  'field_name',
  'global',
  'isolate_script',
  'applies_extended',
  'messages',
  'view',
  'ui_type_code',
  'api_name',
  'client_callable',
  'access_level',
  'caller_access',
  'mobile_callable',
  'sandbox_callable',
  'sys_policy',
  'html',
  'css',
  'client_script',
  'script_include',
  'server_script',
  'controller_as',
  'link',
  'demo_data',
  'option_schema',
  'repo_path',
  'tags',
  'author_id',
  'is_public',
  'created_at',
  'updated_at'
].join(', ');

const TABLE_SELECT_COLUMNS: Record<string, string> = {
  service_portal_widgets: [
    'id',
    'title',
    'description',
    'html',
    'css',
    'client_script',
    'server_script',
    'controller_as',
    'link',
    'demo_data',
    'option_schema',
    'repo_path',
    'author_id',
    'is_public',
    'created_at',
    'updated_at'
  ].join(', ')
};

const TABLE_SEARCH_COLUMNS: Record<string, string[]> = {
  service_portal_widgets: ['title', 'description', 'html', 'client_script', 'server_script']
};

const PUBLIC_FILTER_EXCEPTIONS = ['mail_scripts', 'inbound_actions', 'core_servicenow_apis'];

interface SnippetCacheEntry {
  snippets: Snippet[];
  totalCount: number;
  timestamp: number;
}

interface FetchTableParams {
  table: string;
  artifactValue: string;
  page: number;
  query: string;
  restrictToPage: boolean;
  userId?: string;
}


export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtifactType, setSelectedArtifactType] = useState('');


  const cacheRef = useRef<Map<string, SnippetCacheEntry>>(new Map());

  const buildCacheKey = (page: number, query: string, artifactType: string) =>
    `${artifactType || 'all'}::${page}::${query.trim().toLowerCase()}`;

  const readCache = (key: string): SnippetCacheEntry | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry;
  };

  const writeCache = (key: string, data: Snippet[], total: number) => {
    cacheRef.current.set(key, {
      snippets: data,
      totalCount: total,
      timestamp: Date.now()
    });
  };

  const invalidateCache = () => {
    cacheRef.current.clear();
  };


  const fetchTableData = async ({
    table,
    artifactValue,
    page,
    query,
    restrictToPage,
    userId
  }: FetchTableParams) => {
    const client = supabase;
    if (!client) {
      throw new Error('Supabase client is not configured');
    }

    const trimmedQuery = query.trim();
    const selectColumns = TABLE_SELECT_COLUMNS[table] ?? SNIPPET_SELECT_COLUMNS;
    const searchColumns = TABLE_SEARCH_COLUMNS[table] ?? ['title', 'description', 'code'];

    const runQuery = (columns: string) => {
      let builder = client.from(table).select(columns, { count: 'exact' });

      if (userId) {
        builder = builder.eq('author_id', userId);
      } else if (!PUBLIC_FILTER_EXCEPTIONS.includes(table)) {
        builder = builder.eq('is_public', true);
      }

      if (trimmedQuery && searchColumns.length > 0) {
        const filter = searchColumns
          .map((column) => `${column}.ilike.%${trimmedQuery}%`)
          .join(',');
        builder = builder.or(filter);
      }

      if (restrictToPage) {
        builder = builder
          .order('created_at', { ascending: false })
          .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
      } else {
        builder = builder.order('created_at', { ascending: false });
      }

      return builder;
    };

    let { data, error, count } = await runQuery(selectColumns);

    if (error && error.code === '42703') {
      console.warn(`Column mismatch for ${table}, falling back to select(*)`);
      ({ data, error, count } = await runQuery('*'));
    }

    if (error) {
      console.error(`Error fetching ${table}:`, error);
      return {
        data: [],
        count: 0,
        artifactType: artifactValue
      };
    }

    return {
      data: data || [],
      count: count || 0,
      artifactType: artifactValue
    };
  };

  useEffect(() => {
    fetchSnippets(currentPage, searchQuery, selectedArtifactType);
  }, [currentPage, searchQuery, selectedArtifactType]);

  const mapDatabaseToSnippet = (data: any[], artifactType: string): Snippet[] => {
    const normalizeFlag = (value: any) => value === true || value === 'true' || value === 1 || value === '1';
    return data.map((item: any) => ({
      id: String(item.id),
      name: item.title || '',
      description: item.description || '',
      script: artifactType === 'service_portal_widget' ? (item.server_script || '') : (item.code || ''),
      artifact_type: artifactType,
      subtype: ['integrations', 'core_servicenow_apis', 'specialized_areas'].includes(artifactType) ? item.type : undefined,
      collection: item.collection || item.table_name || '',
      condition: item.condition || '',
      filter_condition: item.filter_condition || '',
      when: item.when_to_run || item.script_type || '',
      order: item.order_value || 100,
      priority: item.priority || 100,
      action_insert: normalizeFlag(item.action_insert),
      action_update: normalizeFlag(item.action_update),
      action_delete: normalizeFlag(item.action_delete),
      action_query: normalizeFlag(item.action_query),
      active: item.active !== false,
      advanced: item.advanced || false,
      field_name: item.field_name || '',
      global: item.global || false,
      isolate_script: item.isolate_script !== false,
      applies_extended: item.applies_extended || false,
      messages: item.messages || '',
      order_value: item.order_value || 100,
      view: item.view || '',
      ui_type_code: item.ui_type_code || 10,
      // Script Include specific fields
      api_name: item.api_name || '',
      client_callable: item.client_callable || false,
      access_level: item.access_level || 'package_private',
      caller_access: item.caller_access || '',
      mobile_callable: item.mobile_callable || false,
      sandbox_callable: item.sandbox_callable || false,
      sys_policy: item.sys_policy || '',
      // Service Portal Widget specific fields
      html: item.html || '',
      css: item.css || '',
      client_script: item.client_script || '',
      script_include: item.script_include || '',
      server_script: item.server_script || '',
      controller_as: item.controller_as || '',
      link: item.link || '',
      demo_data: item.demo_data || null,
      option_schema: item.option_schema || null,
      repo_path: item.repo_path || '',
      tags: item.tags || [],
      created_by: 'User',
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
      sys_id: String(item.id),
      user_id: item.author_id
    }));
  };






  const fetchMySnippets = async (page = 1, query = '') => {
    if (!hasValidSupabaseCredentials || !supabase) {
      setSnippets([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const cacheKey = buildCacheKey(page, query, 'my_snippets');
    const cached = readCache(cacheKey);
    if (cached) {
      setSnippets(cached.snippets);
      setTotalCount(cached.totalCount);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSnippets([]);
        setTotalCount(0);
        return;
      }

      console.log(`Fetching my snippets for user: ${user.id}`);

      const results = await Promise.all(
        ARTIFACT_TYPES.map((artifactTypeConfig) =>
          fetchTableData({
            table: artifactTypeConfig.table,
            artifactValue: artifactTypeConfig.value,
            page,
            query,
            restrictToPage: false,
            userId: user.id
          })
        )
      );

      const allSnippets: Snippet[] = [];
      let totalItems = 0;

      for (const result of results) {
        totalItems += result.count;
        allSnippets.push(...mapDatabaseToSnippet(result.data, result.artifactType));
      }

      allSnippets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedSnippets = allSnippets.slice(startIndex, endIndex);

      setSnippets(paginatedSnippets);
      setTotalCount(totalItems);
      writeCache(cacheKey, paginatedSnippets, totalItems);
    } catch (error) {
      console.error('Error fetching my snippets:', error);
      setSnippets([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };



  const fetchSnippets = async (page = 1, query = '', artifactType = '') => {
    if (artifactType === 'my_snippets') {
      await fetchMySnippets(page, query);
      return;
    }

    if (!hasValidSupabaseCredentials || !supabase) {
      console.log('Supabase not configured');
      setSnippets([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const cacheKey = buildCacheKey(page, query, artifactType);
    const cached = readCache(cacheKey);
    if (cached) {
      setSnippets(cached.snippets);
      setTotalCount(cached.totalCount);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log(`Fetching snippets - Page: ${page}, Query: ${query}, Type: ${artifactType}`);

      const typeConfigs = artifactType
        ? ARTIFACT_TYPES.filter(config => config.value === artifactType)
        : ARTIFACT_TYPES;

      if (artifactType && typeConfigs.length === 0) {
        setSnippets([]);
        setTotalCount(0);
        return;
      }

      const results = await Promise.all(
        typeConfigs.map((typeConfig) =>
          fetchTableData({
            table: typeConfig.table,
            artifactValue: typeConfig.value,
            page,
            query,
            restrictToPage: Boolean(artifactType)
          })
        )
      );

      const allSnippets: Snippet[] = [];
      let totalItems = 0;

      for (const result of results) {
        if (artifactType) {
          totalItems = result.count;
        } else {
          totalItems += result.count;
        }

        allSnippets.push(...mapDatabaseToSnippet(result.data, result.artifactType));
      }

      allSnippets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;

      const paginatedSnippets = artifactType
        ? allSnippets
        : allSnippets.slice(startIndex, endIndex);

      const finalTotalCount = artifactType ? totalItems : allSnippets.length;

      setSnippets(paginatedSnippets);
      setTotalCount(finalTotalCount);
      writeCache(cacheKey, paginatedSnippets, finalTotalCount);

      console.log('Successfully fetched snippets:', paginatedSnippets.length, 'Total:', finalTotalCount);
    } catch (error) {
      console.error('Error fetching snippets:', error);
      setSnippets([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };


  const checkForDuplicate = async (data: CreateSnippetData): Promise<boolean> => {
    if (!hasValidSupabaseCredentials || !supabase) {
      return false;
    }

    try {
      // Find the correct table for this artifact type
      const artifactConfig = ARTIFACT_TYPES.find(type => type.value === data.artifact_type);
      if (!artifactConfig) {
        return false;
      }

      // Build query to check for duplicates
      const duplicateSelect = data.artifact_type === 'service_portal_widget'
        ? 'id, title, server_script, html'
        : 'id, title, code';

      let query = supabase
        .from(artifactConfig.table)
        .select(duplicateSelect)
        .eq('title', data.name);

      // Check for existing snippet with same title
      const { data: existingSnippets, error } = await query.limit(1);

      if (error) {
        console.warn('Error checking for duplicates:', error);
        return false;
      }

      // If we find a snippet with the same title, check if the code is also the same
      if (existingSnippets && existingSnippets.length > 0) {
        const existing = existingSnippets[0] as any;
        // Normalize whitespace for comparison
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();

        if (data.artifact_type === 'service_portal_widget') {
          const existingServerNormalized = normalize(existing.server_script);
          const newServerNormalized = normalize(data.server_script);
          const existingHtmlNormalized = normalize(existing.html);
          const newHtmlNormalized = normalize(data.html);

          return existingServerNormalized === newServerNormalized && existingHtmlNormalized === newHtmlNormalized;
        }

        const existingCodeNormalized = normalize(existing.code);
        const newCodeNormalized = normalize(data.script);

        return existingCodeNormalized === newCodeNormalized;
      }

      return false;
    } catch (error) {
      console.warn('Error checking for duplicates:', error);
      return false;
    }
  };

  const insertSnippet = async (data: CreateSnippetData, userId: string) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Find the correct table for this artifact type
      const artifactConfig = ARTIFACT_TYPES.find(type => type.value === data.artifact_type);
      if (!artifactConfig) {
        throw new Error('Invalid artifact type');
      }

      // Prepare data based on artifact type
      let insertData;

      if (data.artifact_type === 'mail_script' || data.artifact_type === 'inbound_action') {
        insertData = {
          title: data.name,
          description: data.description,
          code: data.script,
          author_id: userId,
          repo_path: ''
        };
      } else if (data.artifact_type === 'service_portal_widget') {
        insertData = {
          title: data.name,
          description: data.description,
          html: data.html || '',
          css: data.css || '',
          client_script: data.client_script || '',
          server_script: data.server_script || '',
          controller_as: data.controller_as || null,
          link: data.link || null,
          option_schema: data.option_schema ?? {},
          demo_data: data.demo_data ?? {},
          author_id: userId,
          is_public: true
        };
      } else {
        // Prepare base data for other artifact types
        const baseData = {
          title: data.name,
          description: data.description,
          code: data.script,
          tags: data.tags,
          is_public: true,
          author_id: userId
        };

        // Prepare specific data based on artifact type
        let specificData: Record<string, any> = {};

        switch (data.artifact_type) {
          case 'business_rule':
            specificData = {
              collection: data.collection,
              when_to_run: data.when,
              condition: data.condition,
              filter_condition: data.filter_condition,
              order_value: data.order,
              priority: data.priority,
              action_insert: data.action_insert,
              action_update: data.action_update,
              action_delete: data.action_delete,
              action_query: data.action_query,
              active: data.active,
              advanced: data.advanced
            };
            break;
          case 'client_script':
            specificData = {
              table_name: data.collection,
              script_type: data.when || 'onLoad',
              condition: data.condition,
              active: data.active,
              field_name: data.field_name,
              global: data.global,
              isolate_script: data.isolate_script,
              applies_extended: data.applies_extended,
              messages: data.messages,
              order_value: data.order_value,
              view: data.view,
              ui_type_code: data.ui_type_code,
              script_include: data.script_include || ''
            };
            break;
          case 'script_include':
            specificData = {
              api_name: (data.api_name?.trim() || data.name.replace(/\s+/g, '')),
              active: data.active,
              access_level: data.access_level || 'package_private',
              caller_access: data.caller_access || '',
              client_callable: data.client_callable || false
            };
            break;
          case 'ui_action':
            specificData = {
              table_name: data.collection,
              action_name: data.name,
              condition: data.condition,
              order_value: data.order,
              active: data.active,
              hint: data.hint,
              onclick: data.onclick,
              form_button: data.form_button || false,
              form_context_menu: data.form_context_menu || false,
              form_link: data.form_link || false,
              list_button: data.list_button || false,
              list_context_menu: data.list_context_menu || false,
              show_insert: data.show_insert || false,
              show_update: data.show_update || false,
              show_query: data.show_query || false,
              show_multiple_update: data.show_multiple_update || false
            };
            break;
          case 'scheduled_job':
            specificData = {
              job_name: data.name,
              active: data.active
            };
            break;
          case 'transform_map':
            specificData = {
              source_table: data.collection || 'import_table',
              target_table: 'target_table',
              active: data.active
            };
            break;
          case 'background_script':
            specificData = {
              // Background scripts are simple - no additional fields needed
            };
            break;
        }

        insertData = { ...baseData, ...specificData };
      }

      // Insert the data into the appropriate table
      const { data: result, error } = await supabase
        .from(artifactConfig.table)
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Error inserting snippet:', error);
        throw new Error(`Failed to create snippet: ${error.message}`);
      }

      console.log('Snippet created successfully:', result);
      invalidateCache();
      return result.id;
    } catch (error: any) {
      console.error('Error in insertSnippet:', error);
      throw new Error(error.message || 'Failed to create snippet');
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Handler functions for UI components
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleArtifactTypeChange = (type: string) => {
    setSelectedArtifactType(type);
    setCurrentPage(1); // Reset to first page on type change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Wrapper for insertSnippet to match expected interface
  const createSnippet = async (data: CreateSnippetData, userId: string) => {
    return await insertSnippet(data, userId);
  };

  // Function to update an existing snippet
  const updateSnippet = async (snippetId: string, updates: Partial<CreateSnippetData>) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Find the correct table for this artifact type
      if (!updates.artifact_type) {
        throw new Error('Missing artifact type in updates');
      }
      
      const artifactConfig = ARTIFACT_TYPES.find(type => type.value === updates.artifact_type);
      if (!artifactConfig) {
        throw new Error('Invalid artifact type');
      }

      // Prepare update data
      const updateData: Record<string, any> = {};
      
      // Map fields from our app's naming convention to database fields
      if (updates.name) updateData.title = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.script && updates.artifact_type !== 'service_portal_widget') {
        updateData.code = updates.script;
      }
      if (updates.tags && updates.artifact_type !== 'service_portal_widget') {
        updateData.tags = updates.tags;
      }
      
      // Add other fields based on artifact type
      if (updates.artifact_type === 'service_portal_widget') {
        if (updates.html !== undefined) updateData.html = updates.html;
        if (updates.css !== undefined) updateData.css = updates.css;
        if (updates.client_script !== undefined) updateData.client_script = updates.client_script;
        if (updates.server_script !== undefined) updateData.server_script = updates.server_script;
        if (updates.controller_as !== undefined) updateData.controller_as = updates.controller_as;
        if (updates.link !== undefined) updateData.link = updates.link;
        if (updates.option_schema !== undefined) updateData.option_schema = updates.option_schema;
        if (updates.demo_data !== undefined) updateData.demo_data = updates.demo_data;
      } else {
        // Handle other artifact-specific fields
        if (updates.collection) {
          if (['business_rule', 'transform_map'].includes(updates.artifact_type)) {
            updateData.collection = updates.collection;
          } else {
            updateData.table_name = updates.collection;
          }
        }
        
        if (updates.when) {
          if (updates.artifact_type === 'business_rule') {
            updateData.when_to_run = updates.when;
          } else if (updates.artifact_type === 'client_script') {
            updateData.script_type = updates.when;
          }
        }

        if (updates.order !== undefined && ['business_rule', 'client_script', 'ui_action'].includes(updates.artifact_type)) {
          updateData.order_value = updates.order;
        }

        if (updates.priority !== undefined && updates.artifact_type === 'business_rule') {
          updateData.priority = updates.priority;
        }

        if (updates.filter_condition !== undefined && updates.artifact_type === 'business_rule') {
          updateData.filter_condition = updates.filter_condition;
        }

        if (updates.action_insert !== undefined && updates.artifact_type === 'business_rule') {
          updateData.action_insert = updates.action_insert;
        }
        if (updates.action_update !== undefined && updates.artifact_type === 'business_rule') {
          updateData.action_update = updates.action_update;
        }
        if (updates.action_delete !== undefined && updates.artifact_type === 'business_rule') {
          updateData.action_delete = updates.action_delete;
        }
        if (updates.action_query !== undefined && updates.artifact_type === 'business_rule') {
          updateData.action_query = updates.action_query;
        }
        
        if (updates.condition) updateData.condition = updates.condition;
        if (updates.script_include !== undefined && updates.artifact_type === 'client_script') {
          updateData.script_include = updates.script_include;
        }
        if (updates.field_name !== undefined && updates.artifact_type === 'client_script') {
          updateData.field_name = updates.field_name;
        }
        if (updates.ui_type_code !== undefined && updates.artifact_type === 'client_script') {
          updateData.ui_type_code = updates.ui_type_code;
        }
        if (updates.global !== undefined && updates.artifact_type === 'client_script') {
          updateData.global = updates.global;
        }
        if (updates.applies_extended !== undefined && updates.artifact_type === 'client_script') {
          updateData.applies_extended = updates.applies_extended;
        }
        if (updates.isolate_script !== undefined && updates.artifact_type === 'client_script') {
          updateData.isolate_script = updates.isolate_script;
        }
        if (updates.messages !== undefined && updates.artifact_type === 'client_script') {
          updateData.messages = updates.messages;
        }
        if (updates.active !== undefined) updateData.active = updates.active;
      }

      // Update the snippet in the database
      const { error } = await supabase
        .from(artifactConfig.table)
        .update(updateData)
        .eq('id', snippetId);

      if (error) {
        console.error('Error updating snippet:', error);
        throw new Error(`Failed to update snippet: ${error.message}`);
      }

      console.log('Snippet updated successfully');
      invalidateCache();
      return true;
    } catch (error: any) {
      console.error('Error in updateSnippet:', error);
      throw new Error(error.message || 'Failed to update snippet');
    }
  };

  const deleteSnippet = async (snippetId: string, artifactType: string) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const artifactConfig = ARTIFACT_TYPES.find(type => type.value === artifactType);
      if (!artifactConfig) {
        throw new Error('Invalid artifact type');
      }

      const { error } = await supabase
        .from(artifactConfig.table)
        .delete()
        .eq('id', snippetId);

      if (error) {
        console.error('Error deleting snippet:', error);
        throw new Error(`Failed to delete snippet: ${error.message}`);
      }

      setSnippets(prev => prev.filter(snippet => snippet.id !== snippetId));
      invalidateCache();
      setTotalCount(prev => Math.max(prev - 1, 0));

      return true;
    } catch (error: any) {
      console.error('Error in deleteSnippet:', error);
      throw new Error(error.message || 'Failed to delete snippet');
    }
  };

  return {
    snippets,
    loading,
    currentPage,
    totalCount,
    totalPages,
    searchQuery,
    selectedArtifactType,
    handleSearch,
    handleArtifactTypeChange,
    handlePageChange,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    checkForDuplicate,
    ITEMS_PER_PAGE
  };
}
