import { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { Integration, IntegrationSubtype } from '../types/snippet';

const ITEMS_PER_PAGE = 12;

type IntegrationUpdates = Partial<{
  title: string;
  description: string;
  code: string;
  code2: string | null;
  type: IntegrationSubtype | null;
  repo_path: string | null;
  is_public: boolean;
}>;

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

  const mapDatabaseToIntegration = (data: any[]): Integration[] =>
    data.map((item: any) => ({
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

  const fetchSubtypes = async (myIntegrations = false) => {
    setSubtypesLoading(true);

    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        setAvailableSubtypes([]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (myIntegrations && !user) {
        setAvailableSubtypes([]);
        return;
      }

      let queryBuilder = supabase.from('integrations').select('type');
      queryBuilder = myIntegrations
        ? queryBuilder.eq('author_id', user?.id)
        : queryBuilder.eq('is_public', true);

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching integration subtypes:', error);
        setAvailableSubtypes([]);
        return;
      }

      const types = [...new Set((data || []).map((item: any) => item.type).filter(Boolean))].sort();
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
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (myIntegrations && !user) {
        setIntegrations([]);
        setTotalCount(0);
        return;
      }

      let queryBuilder = supabase
        .from('integrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      queryBuilder = myIntegrations
        ? queryBuilder.eq('author_id', user?.id)
        : queryBuilder.eq('is_public', true);

      if (subtype) {
        queryBuilder = queryBuilder.eq('type', subtype);
      }

      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%,code2.ilike.%${query}%`
        );
      }

      const { data, error, count } = await queryBuilder
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching integrations:', error);
        setIntegrations([]);
        setTotalCount(0);
        return;
      }

      const mappedData = mapDatabaseToIntegration(data || []);
      const resolvedCount = count || 0;

      setTotalCount(resolvedCount);

      if (mappedData.length === 0 && resolvedCount > 0 && page > 1) {
        setCurrentPage(prev => Math.max(prev - 1, 1));
        return;
      }

      setIntegrations(mappedData);
    } catch (error) {
      console.error('Error in fetchIntegrations:', error);
      setIntegrations([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const createIntegration = async (
    data: {
      title: string;
      description?: string;
      code: string;
      code2?: string;
      type: IntegrationSubtype | null;
      repo_path?: string;
      is_public?: boolean;
    },
    userId?: string
  ) => {
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

      fetchSubtypes(viewMyIntegrations);
      return result.id;
    } catch (error: any) {
      console.error('Error in createIntegration:', error);
      throw new Error(error.message || 'Failed to create integration');
    }
  };

  const updateIntegration = async (integrationId: string, updates: IntegrationUpdates) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const sanitizedUpdates: IntegrationUpdates = { ...updates };

      if (typeof sanitizedUpdates.code2 === 'string' && sanitizedUpdates.code2.trim() === '') {
        sanitizedUpdates.code2 = null;
      }
      if (typeof sanitizedUpdates.repo_path === 'string' && sanitizedUpdates.repo_path.trim() === '') {
        sanitizedUpdates.repo_path = null;
      }
      if (typeof sanitizedUpdates.type === 'string') {
        const trimmedTypeValue = sanitizedUpdates.type.trim();
        sanitizedUpdates.type = trimmedTypeValue ? trimmedTypeValue : null;
      }

      const { data, error } = await supabase
        .from('integrations')
        .update(sanitizedUpdates)
        .eq('id', integrationId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating integration:', error);
        throw new Error(`Failed to update integration: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to update integration: no data returned');
      }

      const [updatedIntegration] = mapDatabaseToIntegration([data]);
      setIntegrations(prev =>
        prev.map(integration => (integration.id === integrationId ? updatedIntegration : integration))
      );

      fetchSubtypes(viewMyIntegrations);
      return updatedIntegration;
    } catch (error: any) {
      console.error('Error in updateIntegration:', error);
      throw new Error(error.message || 'Failed to update integration');
    }
  };

  const deleteIntegration = async (integrationId: string) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        console.error('Error deleting integration:', error);
        throw new Error(`Failed to delete integration: ${error.message}`);
      }

      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      setTotalCount(prev => Math.max(prev - 1, 0));

      const newTotalCount = Math.max(totalCount - 1, 0);
      const newTotalPages = newTotalCount === 0 ? 1 : Math.ceil(newTotalCount / ITEMS_PER_PAGE);
      const targetPage = Math.min(currentPage, newTotalPages);

      fetchSubtypes(viewMyIntegrations);

      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      } else {
        await fetchIntegrations(targetPage, searchQuery, selectedSubtype, viewMyIntegrations);
      }

      return true;
    } catch (error: any) {
      console.error('Error in deleteIntegration:', error);
      throw new Error(error.message || 'Failed to delete integration');
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
    deleteIntegration,
    ITEMS_PER_PAGE
  };
}
