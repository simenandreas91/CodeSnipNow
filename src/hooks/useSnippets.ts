import { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { Snippet, CreateSnippetData, ArtifactType } from '../types/snippet';
import { ARTIFACT_TYPES } from '../types/snippet';

const ITEMS_PER_PAGE = 12;

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtifactType, setSelectedArtifactType] = useState('');

  useEffect(() => {
    fetchSnippets(currentPage, searchQuery, selectedArtifactType);
  }, [currentPage, searchQuery, selectedArtifactType]);

  const mapDatabaseToSnippet = (data: any[], artifactType: string): Snippet[] => {
    return data.map((item: any) => ({
      id: String(item.id),
      name: item.title || '',
      description: item.description || '',
      script: item.code || '',
      artifact_type: artifactType,
      subtype: ['integrations', 'core_servicenow_apis'].includes(artifactType) ? item.type : undefined,
      collection: item.collection || item.table_name || '',
      condition: item.condition || '',
      when: item.when_to_run || item.script_type || '',
      order: item.order_value || 100,
      priority: item.priority || 100,
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
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSnippets([]);
        setTotalCount(0);
        return;
      }

      console.log(`Fetching my snippets for user: ${user.id}`);
      
      const allSnippets: Snippet[] = [];
      let totalItems = 0;
      
      for (const artifactType of ARTIFACT_TYPES) {
        try {
          // Build query for user's snippets
          let queryBuilder = supabase
            .from(artifactType.table)
            .select('*', { count: 'exact' })
            .eq('author_id', user.id);

          // Apply search filter if provided
          if (query.trim()) {
            queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`);
          }

          const { data, error, count } = await queryBuilder
            .order('created_at', { ascending: false });

          if (error) {
            console.error(`Error fetching my ${artifactType.table}:`, error);
            continue;
          }

          totalItems += count || 0;
          const mappedData = mapDatabaseToSnippet(data || [], artifactType.value);
          allSnippets.push(...mappedData);
        } catch (err) {
          console.warn(`Error fetching my ${artifactType.table}:`, err);
        }
      }
      
      // Sort by created_at descending
      allSnippets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply pagination
      setTotalCount(allSnippets.length);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setSnippets(allSnippets.slice(startIndex, endIndex));
      
      console.log('Successfully fetched my snippets:', allSnippets.length);
      
    } catch (error) {
      console.error('Error fetching my snippets:', error);
      setSnippets([]);
      setTotalCount(0);
    }
  };

  const fetchSnippets = async (page = 1, query = '', artifactType = '') => {
    setLoading(true);
    
    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        console.log('Supabase not configured');
        setSnippets([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      console.log(`Fetching snippets - Page: ${page}, Query: ${query}, Type: ${artifactType}`);
      
      // Handle "My Snippets" filter
      if (artifactType === 'my_snippets') {
        await fetchMySnippets(page, query);
        return;
      }
      
      // Fetch from all artifact tables
      const allSnippets: Snippet[] = [];
      let totalItems = 0;
      
      for (const typeConfig of ARTIFACT_TYPES) {
        try {
          // Build query
          let queryBuilder = supabase
            .from(typeConfig.table)
            .select('*', { count: 'exact' });

          const publicFilterExceptions = ['mail_scripts', 'inbound_actions', 'core_servicenow_apis'];

          if (!publicFilterExceptions.includes(typeConfig.table)) {
            queryBuilder = queryBuilder.eq('is_public', true);
          }

          // Apply search filter if provided
          if (query.trim()) {
            queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`);
          }

          // Apply artifact type filter if provided
          if (artifactType === typeConfig.value) {
            // Only fetch from this specific table
            const { data, error, count } = await queryBuilder
              .order('created_at', { ascending: false })
              .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

            if (error) {
              console.error(`Error fetching ${typeConfig.table}:`, error);
              continue;
            }

            totalItems = count || 0;
            const mappedData = mapDatabaseToSnippet(data || [], typeConfig.value);
            allSnippets.push(...mappedData);
            break; // Only fetch from one table when filtering by type
          } else if (!artifactType) {
            // Fetch from all tables when no type filter
            const { data, error, count } = await queryBuilder
              .order('created_at', { ascending: false });

            if (error) {
              console.error(`Error fetching ${typeConfig.table}:`, error);
              continue;
            }

            totalItems += count || 0;
            const mappedData = mapDatabaseToSnippet(data || [], typeConfig.value);
            allSnippets.push(...mappedData);
          }
        } catch (err) {
          console.warn(`Error fetching ${typeConfig.table}:`, err);
        }
      }
      
      // Sort by created_at descending
      allSnippets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply pagination if fetching from all tables
      if (!artifactType) {
        setTotalCount(allSnippets.length);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setSnippets(allSnippets.slice(startIndex, endIndex));
      } else {
        setTotalCount(totalItems);
        setSnippets(allSnippets);
      }
      
      console.log('Successfully fetched snippets:', allSnippets.length, 'Total:', totalItems);
      
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
      let query = supabase
        .from(artifactConfig.table)
        .select('id, title, code')
        .eq('title', data.name);

      // Check for existing snippet with same title
      const { data: existingSnippets, error } = await query.limit(1);

      if (error) {
        console.warn('Error checking for duplicates:', error);
        return false;
      }

      // If we find a snippet with the same title, check if the code is also the same
      if (existingSnippets && existingSnippets.length > 0) {
        const existing = existingSnippets[0];
        // Normalize whitespace for comparison
        const normalizeCode = (code: string) => code.replace(/\s+/g, ' ').trim();
        const existingCodeNormalized = normalizeCode(existing.code || '');
        const newCodeNormalized = normalizeCode(data.script);
        
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
          code: data.script || '',
          html: data.html,
          css: data.css,
          client_script: data.client_script,
          server_script: data.server_script,
          option_schema: data.option_schema,
          demo_data: data.demo_data,
          author_id: userId,
          is_public: true,
          tags: data.tags
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
              order_value: data.order,
              priority: data.priority,
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
              ui_type_code: data.ui_type_code
            };
            break;
          case 'script_include':
            specificData = {
              api_name: data.name.replace(/\s+/g, ''),
              active: data.active
            };
            break;
          case 'ui_action':
            specificData = {
              table_name: data.collection,
              action_name: data.name,
              condition: data.condition,
              order_value: data.order,
              active: data.active
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
      if (updates.script) updateData.code = updates.script;
      if (updates.tags) updateData.tags = updates.tags;
      
      // Add other fields based on artifact type
      if (updates.artifact_type === 'service_portal_widget') {
        if (updates.html) updateData.html = updates.html;
        if (updates.css) updateData.css = updates.css;
        if (updates.client_script) updateData.client_script = updates.client_script;
        if (updates.server_script) updateData.server_script = updates.server_script;
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
        
        if (updates.condition) updateData.condition = updates.condition;
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
      return true;
    } catch (error: any) {
      console.error('Error in updateSnippet:', error);
      throw new Error(error.message || 'Failed to update snippet');
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
    checkForDuplicate,
    ITEMS_PER_PAGE
  };
}

