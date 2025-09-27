import { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { Integration, IntegrationSubtype } from '../types/snippet';

const ITEMS_PER_PAGE = 12;

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState<IntegrationSubtype | ''>('');
  const [viewMyIntegrations, setViewMyIntegrations] = useState(false);
  const [availableSubtypes, setAvailableSubtypes] = useState<IntegrationSubtype[]>([]);
  const [subtypesLoading, setSubtypesLoading] = useState(true);

  useEffect(() => {
    fetchIntegrations(currentPage, searchQuery, selectedSubtype, viewMyIntegrations);
  }, [currentPage, searchQuery, selectedSubtype, viewMyIntegrations]);

  useEffect(() => {
    fetchSubtypes(viewMyIntegrations);
  }, [viewMyIntegrations]);

  const mapDatabaseToIntegration = (data: any[]): Integration[] => {
    return data.map((item: any) => ({
      id: String(item.id),
      title: item.title,
      description: item.description || undefined,
      code: item.code,
      code2: item.code2 || undefined,
      type: item.type,
      repo_path: item.repo_path || undefined,
      author_id: item.author_id || null,
      is_public: item.is_public,
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at
    }));
  };

  const fetchSubtypes = async (myIntegrations = false) => {
    setSubtypesLoading(true);

    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        setAvailableSubtypes([]);
        setSubtypesLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (myIntegrations && !user) {
        setAvailableSubtypes([]);
        setSubtypesLoading(false);
        return;
      }

      // Fetch from integrations table
      let integrationsQuery = supabase
        .from('integrations')
        .select('type');

      if (myIntegrations) {
        integrationsQuery = integrationsQuery.eq('author_id', user?.id);
      } else {
        integrationsQuery = integrationsQuery.eq('is_public', true);
      }

      const { data: integrationsData, error: integrationsError } = await integrationsQuery;

      // Fetch from core_servicenow_apis table - check for any records regardless of is_public status
      let apisQuery = supabase
        .from('core_servicenow_apis')
        .select('type, is_public');

      if (myIntegrations) {
        apisQuery = apisQuery.eq('author_id', user?.id);
      } else {
        // For public view, include records where is_public is true OR null (default behavior)
        apisQuery = apisQuery.or('is_public.eq.true,is_public.is.null');
      }

      const { data: apisData, error: apisError } = await apisQuery;

      if (integrationsError) {
        console.error('Error fetching integrations subtypes:', integrationsError);
      }

      if (apisError) {
        console.error('Error fetching core_servicenow_apis subtypes:', apisError);
      }

      console.log('APIs data for subtypes:', apisData);

      const allTypes = [
        ...(integrationsData || []).map((item: any) => item.type).filter(Boolean),
        ...(apisData || []).map((item: any) => item.type).filter(Boolean)
      ];

      const types = [...new Set(allTypes)].sort();
      
      // Always include 'Core ServiceNow APIs' as a special filter if there are any API records
      const hasApiRecords = (apisData || []).length > 0;
      console.log('Has API records:', hasApiRecords, 'API data length:', (apisData || []).length);
      
      if (hasApiRecords && !types.includes('Core ServiceNow APIs')) {
        types.unshift('Core ServiceNow APIs');
      }
      
      console.log('Available subtypes:', types);
      setAvailableSubtypes(types);
    } catch (error) {
      console.error('Error in fetchSubtypes:', error);
      setAvailableSubtypes([]);
    } finally {
      setSubtypesLoading(false);
    }
  };

  const fetchIntegrations = async (
    page = 1,
    query = '',
    subtype = '',
    myIntegrations = false
  ) => {
    setLoading(true);

    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        console.log('Supabase not configured');
        setIntegrations([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      console.log(`Fetching integrations - Page: ${page}, Query: ${query}, Subtype: ${subtype}, My: ${myIntegrations}`);

      const { data: { user } } = await supabase.auth.getUser();
      if (myIntegrations && !user) {
        setIntegrations([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Build base filters
      const searchFilterIntegrations = query.trim() ? {
        or: `title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%,code2.ilike.%${query}%`
      } : {};
      const searchFilterApis = query.trim() ? {
        or: `title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`
      } : {};

      try {
        let allMappedData: Integration[] = [];

        // Special handling for "Core ServiceNow APIs" - show all records from core_servicenow_apis table
        if (subtype === 'Core ServiceNow APIs') {
          console.log('Fetching Core ServiceNow APIs specifically');
          
          // Only query core_servicenow_apis table without type filter
          let apisQuery = supabase
            .from('core_servicenow_apis')
            .select('*')
            .order('created_at', { ascending: false });

          // Apply user filter if needed
          if (myIntegrations) {
            apisQuery = apisQuery.eq('author_id', user?.id);
          } else {
            // For public view, include records where is_public is true OR null
            apisQuery = apisQuery.or('is_public.eq.true,is_public.is.null');
          }

          // Apply search filter if provided
          if (query.trim()) {
            apisQuery = apisQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`);
          }

          const { data: apisData, error: apisError } = await apisQuery;

          console.log('Core ServiceNow APIs query result:', { apisData, apisError });

          if (apisError) {
            console.error('Error fetching core_servicenow_apis:', apisError);
          } else {
            const mappedApis = mapDatabaseToIntegration(apisData || []);
            allMappedData = [...mappedApis];
            console.log('Mapped Core ServiceNow APIs:', mappedApis);
          }
        } else {
          // Normal filtering - apply type filter to both tables
          const typeFilter = subtype ? { type: subtype } : {};

          // Query integrations
          let integrationsQuery = supabase
            .from('integrations')
            .select('*')
            .order('created_at', { ascending: false });

          // Apply user filter if needed
          if (myIntegrations) {
            integrationsQuery = integrationsQuery.eq('author_id', user?.id);
          } else {
            integrationsQuery = integrationsQuery.eq('is_public', true);
          }

          // Apply type filter if provided
          if (subtype) {
            integrationsQuery = integrationsQuery.eq('type', subtype);
          }

          // Apply search filter if provided
          if (query.trim()) {
            integrationsQuery = integrationsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%,code2.ilike.%${query}%`);
          }

          const { data: integrationsData, error: integrationsError } = await integrationsQuery;

          // Query core_servicenow_apis
          let apisQuery = supabase
            .from('core_servicenow_apis')
            .select('*')
            .order('created_at', { ascending: false });

          // Apply user filter if needed
          if (myIntegrations) {
            apisQuery = apisQuery.eq('author_id', user?.id);
          } else {
            apisQuery = apisQuery.or('is_public.eq.true,is_public.is.null');
          }

          // Apply type filter if provided
          if (subtype) {
            apisQuery = apisQuery.eq('type', subtype);
          }

          // Apply search filter if provided
          if (query.trim()) {
            apisQuery = apisQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%`);
          }

          const { data: apisData, error: apisError } = await apisQuery;

          if (integrationsError) {
            console.error('Error fetching integrations:', integrationsError);
          } else {
            const mappedIntegrations = mapDatabaseToIntegration(integrationsData || []);
            allMappedData = [...allMappedData, ...mappedIntegrations];
          }

          if (apisError) {
            console.error('Error fetching core_servicenow_apis:', apisError);
          } else {
            const mappedApis = mapDatabaseToIntegration(apisData || []);
            allMappedData = [...allMappedData, ...mappedApis];
          }
        }

        // Sort combined by created_at desc
        allMappedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Client-side pagination
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedData = allMappedData.slice(start, end);

        setIntegrations(paginatedData);
        setTotalCount(allMappedData.length);
        console.log('Successfully fetched integrations:', paginatedData.length, 'from total', allMappedData.length);
      } catch (fetchError) {
        console.error('Error in fetchIntegrations:', fetchError);
        setIntegrations([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error in fetchIntegrations:', error);
      setIntegrations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async (data: {
    title: string;
    description?: string;
    code: string;
    code2?: string;
    type: IntegrationSubtype;
    repo_path?: string;
    is_public?: boolean;
  }, userId?: string) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const insertData = {
        title: data.title,
        description: data.description,
        code: data.code,
        code2: data.code2,
        type: data.type,
        repo_path: data.repo_path,
        author_id: userId || null,
        is_public: data.is_public ?? true
      };

      const { data: result, error } = await supabase
        .from('integrations')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating integration:', error);
        throw new Error(`Failed to create integration: ${error.message}`);
      }

      console.log('Integration created successfully:', result);
      fetchSubtypes(viewMyIntegrations);
      return result.id;
    } catch (error: any) {
      console.error('Error in createIntegration:', error);
      throw new Error(error.message || 'Failed to create integration');
    }
  };

  const updateIntegration = async (integrationId: string, updates: Partial<{
    title: string;
    description: string;
    code: string;
    code2: string;
    type: IntegrationSubtype;
    repo_path: string;
    is_public: boolean;
  }>) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', integrationId);

      if (error) {
        console.error('Error updating integration:', error);
        throw new Error(`Failed to update integration: ${error.message}`);
      }

      console.log('Integration updated successfully');
      fetchSubtypes(viewMyIntegrations);
      return true;
    } catch (error: any) {
      console.error('Error in updateIntegration:', error);
      throw new Error(error.message || 'Failed to update integration');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSubtypeChange = (subtype: IntegrationSubtype | '') => {
    setSelectedSubtype(subtype);
    setCurrentPage(1);
  };

  const handleViewMyChange = (viewMy: boolean) => {
    setViewMyIntegrations(viewMy);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    integrations,
    loading,
    currentPage,
    totalCount,
    totalPages,
    searchQuery,
    selectedSubtype,
    viewMyIntegrations,
    availableSubtypes,
    subtypesLoading,
    handleSearch,
    handleSubtypeChange,
    handleViewMyChange,
    handlePageChange,
    createIntegration,
    updateIntegration,
    ITEMS_PER_PAGE
  };
}
