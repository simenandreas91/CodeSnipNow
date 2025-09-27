import { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { Integration, IntegrationSubtype } from '../types/snippet';
import { INTEGRATION_SUBTYPES } from '../types/snippet';

const ITEMS_PER_PAGE = 12;

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState<IntegrationSubtype | ''>('');
  const [viewMyIntegrations, setViewMyIntegrations] = useState(false);

  useEffect(() => {
    fetchIntegrations(currentPage, searchQuery, selectedSubtype, viewMyIntegrations);
  }, [currentPage, searchQuery, selectedSubtype, viewMyIntegrations]);

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

      // Get current user for my integrations
      const { data: { user } } = await supabase.auth.getUser();
      if (myIntegrations && !user) {
        setIntegrations([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Build base query
      let queryBuilder = supabase
        .from('integrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Filter for my integrations
      if (myIntegrations) {
        queryBuilder = queryBuilder.eq('author_id', user?.id);
      } else {
        queryBuilder = queryBuilder.eq('is_public', true);
      }

      // Apply subtype filter
      if (subtype) {
        queryBuilder = queryBuilder.eq('type', subtype);
      }

      // Apply search filter (full-text like snippets, but using ilike on multiple fields)
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,code.ilike.%${query}%,code2.ilike.%${query}%`
        );
      }

      // Apply pagination
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      queryBuilder = queryBuilder.range(start, end);

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Error fetching integrations:', error);
        setIntegrations([]);
        setTotalCount(0);
      } else {
        const mappedData = mapDatabaseToIntegration(data || []);
        setIntegrations(mappedData);
        setTotalCount(count || 0);
        console.log('Successfully fetched integrations:', mappedData.length);
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
      return true;
    } catch (error: any) {
      console.error('Error in updateIntegration:', error);
      throw new Error(error.message || 'Failed to update integration');
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Handler functions
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
    handleSearch,
    handleSubtypeChange,
    handleViewMyChange,
    handlePageChange,
    createIntegration,
    updateIntegration,
    ITEMS_PER_PAGE
  };
}
