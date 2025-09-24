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

  const filterMockData = (data: Snippet[], query: string, artifactType: string) => {
    return data.filter(snippet => {
      const matchesSearch = !query || 
        snippet.name.toLowerCase().includes(query.toLowerCase()) ||
        snippet.description.toLowerCase().includes(query.toLowerCase()) ||
        snippet.script.toLowerCase().includes(query.toLowerCase());
      const matchesType = !artifactType || artifactType === 'my_snippets' || snippet.artifact_type === artifactType;
      return matchesSearch && matchesType;
    });
  };

  const paginateData = (data: Snippet[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
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
        console.log('Using mock data - Supabase not configured');
        const mockData = getMockSnippets();
        const filtered = filterMockData(mockData, query, artifactType);
        const paginated = paginateData(filtered, page);
        setSnippets(paginated);
        setTotalCount(filtered.length);
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

          if (typeConfig.table !== 'mail_scripts' && typeConfig.table !== 'inbound_actions') {
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
      console.warn('Error fetching snippets, using mock data:', error);
      const mockData = getMockSnippets();
      const filtered = filterMockData(mockData, query, artifactType);
      const paginated = paginateData(filtered, page);
      setSnippets(paginated);
      setTotalCount(filtered.length);
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

      // Check for existing snippet with same title and code
      const { data: existingSnippets, error } = await supabase
        .from(artifactConfig.table)
        .select('id, title, code')
        .eq('title', data.name)
        .limit(1);

      if (error) {
        console.warn('Error checking for duplicates:', error);
        return false;
      }

      // If we find a snippet with the same title, check if the code is also the same
      if (existingSnippets && existingSnippets.length > 0) {
        const existing = existingSnippets[0];
        // Normalize whitespace for comparison
        const normalizeCode = (code: string) => code.replace(/\s+/g, ' ').trim();
        const existingCodeNormalized = normalizeCode(existing.code);
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
      const baseData = {
        title: data.name,
        description: data.description,
        code: data.script,
        tags: data.tags,
        is_public: true,
        author_id: userId
      };

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
            active: data.active,
            form_button: data.form_button,
            form_action: data.form_action,
            form_context_menu: data.form_context_menu,
            form_link: data.form_link,
            form_menu_button: data.form_menu_button,
            list_button: data.list_button,
            list_action: data.list_action,
            list_choice: data.list_choice,
            list_context_menu: data.list_context_menu,
            list_banner_button: data.list_banner_button,
            show_insert: data.show_insert,
            show_update: data.show_update,
            show_query: data.show_query,
            show_multiple_update: data.show_multiple_update,
            client_script_v2: data.client_script_v2,
            onclick: data.onclick,
            hint: data.hint,
            comments: data.comments
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
        case 'mail_script':
        case 'inbound_action':
          specificData = {
            repo_path: ''
          };
          break;
      }

      let insertData;
      if (data.artifact_type === 'mail_script' || data.artifact_type === 'inbound_action') {
        insertData = {
          title: data.name,
          description: data.description,
          code: data.script,
          author_id: userId,
          repo_path: specificData.repo_path
        };
      } else {
        insertData = { ...baseData, ...specificData };
      }

      const { data: insertedData, error } = await supabase
        .from(artifactConfig.table)
        .insert([insertData])
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      return insertedData;
    } catch (error) {
      console.error('Database insert error:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createSnippet = async (data: CreateSnippetData, userId: string) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      return { status: 'error' as const, message: 'Database not configured' };
    }

    try {
      // Check for duplicates first
      const isDuplicate = await checkForDuplicate(data);
      if (isDuplicate) {
        return { status: 'duplicate' as const, message: `Snippet "${data.name}" already exists` };
      }

      const insertedData = await insertSnippet(data, userId);
      
      console.log('Snippet created successfully');
      // Reset to first page and refresh
      setCurrentPage(1);
      await fetchSnippets(1, searchQuery, selectedArtifactType);
      
      return { status: 'created' as const, snippet: insertedData };
    } catch (error) {
      console.error('Error in createSnippet:', error);
      return { status: 'error' as const, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateSnippet = async (snippetId: string, updates: Partial<Snippet>) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      // Get artifact type from the updates or find the snippet first
      let artifactType = updates.artifact_type;
      
      if (!artifactType) {
        // If artifact_type not provided, we need to find it by checking tables
        // But we'll be more careful about UUID validation
        let foundConfig = null;
        
        for (const config of ARTIFACT_TYPES) {
          try {
            // Skip if the ID doesn't look like a UUID for UUID-based tables
            const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(snippetId);
            
            // For service_portal_widgets, check if it uses bigint (numeric) IDs
            if (config.table === 'service_portal_widgets' && !isUuidFormat && /^\d+$/.test(snippetId)) {
              // This table might use numeric IDs
              const { data: existingSnippet, error: fetchError } = await supabase
                .from(config.table)
                .select('*')
                .eq('id', parseInt(snippetId))
                .maybeSingle();

              if (!fetchError && existingSnippet) {
                foundConfig = config;
                artifactType = config.value;
                break;
              }
            } else if (isUuidFormat) {
              // For UUID-based tables
              const { data: existingSnippet, error: fetchError } = await supabase
                .from(config.table)
                .select('*')
                .eq('id', snippetId)
                .maybeSingle();

              if (!fetchError && existingSnippet) {
                foundConfig = config;
                artifactType = config.value;
                break;
              }
            }
          } catch (err) {
            // Continue checking other tables
            console.warn(`Error checking ${config.table}:`, err);
          }
        }
        
        if (!foundConfig) {
          throw new Error('Snippet not found in any table');
        }
      }
      
      // Find the artifact configuration
      const artifactConfig = ARTIFACT_TYPES.find(type => type.value === artifactType);
      if (!artifactConfig) {
        throw new Error('Invalid artifact type');
      }

      // Prepare update data based on the snippet structure
      const updateData: any = {};
      
      if (updates.name) updateData.title = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      
      // Handle artifact-specific fields
      switch (artifactType) {
        case 'service_portal_widget':
          // Service Portal Widgets have specific columns
          if (updates.html !== undefined) updateData.html = updates.html;
          if (updates.css !== undefined) updateData.css = updates.css;
          if (updates.client_script !== undefined) updateData.client_script = updates.client_script;
          if (updates.server_script !== undefined) updateData.server_script = updates.server_script;
          // Note: service_portal_widgets don't have collection, condition, or tags columns
          break;
          
        case 'client_script':
        case 'ui_action':
          if (updates.script !== undefined) updateData.code = updates.script;
          if (updates.collection !== undefined) updateData.table_name = updates.collection;
          if (updates.condition !== undefined) updateData.condition = updates.condition;
          if (updates.tags !== undefined) updateData.tags = updates.tags;
          break;
          
        default:
          // All other artifact types use the 'code' column
          if (updates.script !== undefined) updateData.code = updates.script;
          if (updates.collection !== undefined) updateData.collection = updates.collection;
          if (updates.condition !== undefined) updateData.condition = updates.condition;
          if (updates.tags !== undefined) updateData.tags = updates.tags;
          break;
      }
      
      // Always update the updated_at timestamp
      if (artifactType !== 'service_portal_widget') {
        updateData.updated_at = new Date().toISOString();
      }

      // Handle different ID types for different tables
      let query;
      if (artifactConfig.table === 'service_portal_widgets' && /^\d+$/.test(snippetId)) {
        // Use numeric ID for service_portal_widgets
        query = supabase
          .from(artifactConfig.table)
          .update(updateData)
          .eq('id', parseInt(snippetId))
          .select();
      } else {
        // Use string ID for other tables
        query = supabase
          .from(artifactConfig.table)
          .update(updateData)
          .eq('id', snippetId)
          .select();
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Snippet updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating snippet:', error);
      throw error;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleArtifactTypeChange = (artifactType: string) => {
    setSelectedArtifactType(artifactType);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    snippets,
    loading,
    currentPage,
    totalPages,
    totalCount,
    searchQuery,
    selectedArtifactType,
    handleSearch,
    handleArtifactTypeChange,
    handlePageChange,
    createSnippet,
    updateSnippet,
    createMultipleSnippets: async (snippetsData: CreateSnippetData[], userId: string) => {
      const results = [];
      
      for (const data of snippetsData) {
        const result = await createSnippet(data, userId);
        
        if (result.status === 'created') {
          results.push({ success: true, data, type: 'created' });
        } else if (result.status === 'duplicate') {
          results.push({ success: false, data, type: 'duplicate', error: { message: result.message } });
        } else {
          results.push({ success: false, data, type: 'error', error: { message: result.message } });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const duplicateCount = results.filter(r => !r.success && r.type === 'duplicate').length;
      const errorCount = results.filter(r => !r.success && r.type === 'error').length;
      
      console.log(`Import completed: ${successCount} created, ${duplicateCount} duplicates skipped, ${errorCount} errors`);
      return results;
    }
  };
}

// Mock data for demo purposes
function getMockSnippets(): Snippet[] {
  return [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Set Manager from Department Head',
      description: 'Finds the department of the user and sets the head to become the manager of the user. Works on insert and update.',
      script: `(function executeRule(current, previous /*null when async*/) {
  var departmentSysId = current.department;
  if (gs.nil(departmentSysId)) {
      gs.log("BR 'Set User Manager from Department': Department is empty for user " + current.user_name + ". Skipping.", "User Manager Automation");
      return;
  }

  var deptGR = new GlideRecord('cmn_department');
  if (deptGR.get(departmentSysId)) {
      // Get the department's manager (dept_head)
      var departmentManagerSysId = deptGR.dept_head;
      if (!gs.nil(departmentManagerSysId)) {
          if (current.manager != departmentManagerSysId) {
              current.manager = departmentManagerSysId;
              gs.info("BR 'Set User Manager from Department': Set manager for user '" + current.user_name + "' to '" + deptGR.dept_head.getDisplayValue() + "' from department '" + deptGR.name + "'.", "User Manager Automation");
          }
      } else {
          gs.info("BR 'Set User Manager from Department': Department '" + deptGR.name + "' has no manager (dept_head). User '" + current.user_name + "' manager not set by this rule.", "User Manager Automation");
      }
  } else {
      gs.warn("BR 'Set User Manager from Department': Department with sys_id '" + departmentSysId + "' not found for user '" + current.user_name + "'.", "User Manager Automation");
  }
})(current, previous);`,
      artifact_type: 'business_rule',
      collection: 'sys_user',
      condition: 'departmentVALCHANGES^departmentISNOTEMPTY^EQ',
      when: 'before',
      order: 100,
      priority: 100,
      active: true,
      advanced: true,
      tags: ['user management', 'department', 'manager', 'automation'],
      created_by: 'admin',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      sys_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    },
    {
      id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
      name: 'Auto-assign Incident to Group',
      description: 'Automatically assigns incidents to the appropriate group based on category and subcategory.',
      script: `(function executeRule(current, previous /*null when async*/) {
  // Auto-assignment logic based on category
  if (current.category == 'hardware') {
      if (current.subcategory == 'computer') {
          current.assignment_group = getGroupSysId('Desktop Support');
      } else if (current.subcategory == 'monitor') {
          current.assignment_group = getGroupSysId('Hardware Team');
      }
  } else if (current.category == 'software') {
      current.assignment_group = getGroupSysId('Application Support');
  }

  function getGroupSysId(groupName) {
      var gr = new GlideRecord('sys_user_group');
      if (gr.get('name', groupName)) {
          return gr.sys_id;
      }
      return '';
  }
})(current, previous);`,
      artifact_type: 'business_rule',
      collection: 'incident',
      condition: 'category.changes()^ORsubcategory.changes()',
      when: 'before',
      order: 200,
      priority: 100,
      active: true,
      advanced: false,
      tags: ['incident', 'assignment', 'automation', 'category'],
      created_by: 'system.admin',
      created_at: '2024-01-10T14:20:00Z',
      updated_at: '2024-01-10T14:20:00Z',
      sys_id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012'
    },
    {
      id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
      name: 'Validate Email Format',
      description: 'Client-side validation to ensure email addresses follow the correct format before submission.',
      script: `function onSubmit() {
  var email = g_form.getValue('email');
  if (email) {
      var emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(email)) {
          g_form.addErrorMessage('Please enter a valid email address');
          return false;
      }
  }
  return true;
}`,
      artifact_type: 'client_script',
      collection: 'sys_user',
      condition: '',
      when: 'onSubmit',
      order: 100,
      priority: 100,
      active: true,
      advanced: false,
      tags: ['validation', 'email', 'client-side', 'form'],
      created_by: 'developer',
      created_at: '2024-01-08T09:15:00Z',
      updated_at: '2024-01-08T09:15:00Z',
      sys_id: 'c3d4e5f6-g7h8-9012-cdef-345678901234'
    },
    {
      id: 'd4e5f6g7-h8i9-0123-defg-456789012345',
      name: 'Email Notification Script',
      description: 'Custom script for sending email notifications with dynamic content.',
      script: `var email = new GlideRecord('sys_email');
email.initialize();
email.subject = 'Custom Notification';
email.message = 'Hello, this is a custom email from the mail script.';
email.recipients = current.email;
email.insert();`,
      artifact_type: 'mail_script',
      repo_path: '/scripts/mail/email_notification.js',
      active: true,
      tags: ['email', 'notification', 'custom'],
      created_by: 'developer',
      created_at: '2024-01-05T12:00:00Z',
      updated_at: '2024-01-05T12:00:00Z',
      sys_id: 'd4e5f6g7-h8i9-0123-defg-456789012345'
    },
    {
      id: 'e5f6g7h8-i9j0-1234-efgh-567890123456',
      name: 'Inbound Email Action',
      description: 'Processes inbound emails and creates incidents based on content.',
      script: `if (email.subject.indexOf('Urgent') > -1) {
  var inc = new GlideRecord('incident');
  inc.initialize();
  inc.short_description = email.subject;
  inc.description = email.body_text;
  inc.insert();
  email.reply('Incident created: ' + inc.number);
}`,
      artifact_type: 'inbound_action',
      repo_path: '/scripts/inbound/inbound_incident.js',
      active: true,
      tags: ['inbound', 'email', 'incident'],
      created_by: 'admin',
      created_at: '2024-01-03T15:30:00Z',
      updated_at: '2024-01-03T15:30:00Z',
      sys_id: 'e5f6g7h8-i9j0-1234-efgh-567890123456'
    }
  ];
}
