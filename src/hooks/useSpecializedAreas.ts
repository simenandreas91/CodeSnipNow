import { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { SpecializedArea, SpecializedAreaSubtype } from '../types/snippet';

const ITEMS_PER_PAGE = 12;

type SpecializedAreaUpdates = Partial<{
  title: string;
  description: string;
  code: string;
  code2: string | null;
  type: SpecializedAreaSubtype | null;
  repo_path: string | null;
  is_public: boolean;
}>;

export function useSpecializedAreas() {
  const [specializedAreas, setSpecializedAreas] = useState<SpecializedArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState<SpecializedAreaSubtype | ''>('');
  const [viewMySpecializedAreas, setViewMySpecializedAreas] = useState(false);
  const [availableSubtypes, setAvailableSubtypes] = useState<SpecializedAreaSubtype[]>([]);
  const [subtypesLoading, setSubtypesLoading] = useState(true);

  useEffect(() => {
    fetchSpecializedAreas(currentPage, searchQuery, selectedSubtype, viewMySpecializedAreas);
  }, [currentPage, searchQuery, selectedSubtype, viewMySpecializedAreas]);

  useEffect(() => {
    fetchSubtypes(viewMySpecializedAreas);
  }, [viewMySpecializedAreas]);

  const mapDatabaseToSpecializedArea = (data: any[]): SpecializedArea[] =>
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

  const fetchSubtypes = async (mySpecializedAreas = false) => {
    setSubtypesLoading(true);

    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        setAvailableSubtypes([]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (mySpecializedAreas && !user) {
        setAvailableSubtypes([]);
        return;
      }

      let queryBuilder = supabase.from('specialized_areas').select('type');
      queryBuilder = mySpecializedAreas
        ? queryBuilder.eq('author_id', user?.id)
        : queryBuilder.eq('is_public', true);

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching specialized area subtypes:', error);
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

  const fetchSpecializedAreas = async (
    page = 1,
    query = '',
    subtype = '',
    mySpecializedAreas = false
  ) => {
    setLoading(true);

    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        console.log('Supabase not configured');
        setSpecializedAreas([]);
        setTotalCount(0);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (mySpecializedAreas && !user) {
        setSpecializedAreas([]);
        setTotalCount(0);
        return;
      }

      let queryBuilder = supabase
        .from('specialized_areas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      queryBuilder = mySpecializedAreas
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
        console.error('Error fetching specialized areas:', error);
        setSpecializedAreas([]);
        setTotalCount(0);
        return;
      }

      const mappedData = mapDatabaseToSpecializedArea(data || []);
      const resolvedCount = count || 0;

      setTotalCount(resolvedCount);

      if (mappedData.length === 0 && resolvedCount > 0 && page > 1) {
        setCurrentPage(prev => Math.max(prev - 1, 1));
        return;
      }

      setSpecializedAreas(mappedData);
    } catch (error) {
      console.error('Error in fetchSpecializedAreas:', error);
      setSpecializedAreas([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const createSpecializedArea = async (
    data: {
      title: string;
      description?: string;
      code: string;
      code2?: string;
      type: SpecializedAreaSubtype | null;
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
        .from('specialized_areas')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating specialized area:', error);
        throw new Error(`Failed to create specialized area: ${error.message}`);
      }

      fetchSubtypes(viewMySpecializedAreas);
      return result.id;
    } catch (error: any) {
      console.error('Error in createSpecializedArea:', error);
      throw new Error(error.message || 'Failed to create specialized area');
    }
  };

  const updateSpecializedArea = async (
    specializedAreaId: string,
    updates: SpecializedAreaUpdates
  ) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const sanitizedUpdates: SpecializedAreaUpdates = { ...updates };

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
        .from('specialized_areas')
        .update(sanitizedUpdates)
        .eq('id', specializedAreaId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating specialized area:', error);
        throw new Error(`Failed to update specialized area: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to update specialized area: no data returned');
      }

      const [updatedSpecializedArea] = mapDatabaseToSpecializedArea([data]);
      setSpecializedAreas(prev =>
        prev.map(area => (area.id === specializedAreaId ? updatedSpecializedArea : area))
      );

      fetchSubtypes(viewMySpecializedAreas);
      return updatedSpecializedArea;
    } catch (error: any) {
      console.error('Error in updateSpecializedArea:', error);
      throw new Error(error.message || 'Failed to update specialized area');
    }
  };

  const deleteSpecializedArea = async (specializedAreaId: string) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { error } = await supabase
        .from('specialized_areas')
        .delete()
        .eq('id', specializedAreaId);

      if (error) {
        console.error('Error deleting specialized area:', error);
        throw new Error(`Failed to delete specialized area: ${error.message}`);
      }

      setSpecializedAreas(prev => prev.filter(area => area.id !== specializedAreaId));
      setTotalCount(prev => Math.max(prev - 1, 0));

      const newTotalCount = Math.max(totalCount - 1, 0);
      const newTotalPages = newTotalCount === 0 ? 1 : Math.ceil(newTotalCount / ITEMS_PER_PAGE);
      const targetPage = Math.min(currentPage, newTotalPages);

      fetchSubtypes(viewMySpecializedAreas);

      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      } else {
        await fetchSpecializedAreas(targetPage, searchQuery, selectedSubtype, viewMySpecializedAreas);
      }

      return true;
    } catch (error: any) {
      console.error('Error in deleteSpecializedArea:', error);
      throw new Error(error.message || 'Failed to delete specialized area');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSubtypeChange = (subtype: SpecializedAreaSubtype | '') => {
    setSelectedSubtype(subtype);
    setCurrentPage(1);
  };

  const handleViewMyChange = (viewMy: boolean) => {
    setViewMySpecializedAreas(viewMy);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    specializedAreas,
    loading,
    currentPage,
    totalCount,
    totalPages,
    searchQuery,
    selectedSubtype,
    viewMySpecializedAreas,
    availableSubtypes,
    subtypesLoading,
    handleSearch,
    handleSubtypeChange,
    handleViewMyChange,
    handlePageChange,
    createSpecializedArea,
    updateSpecializedArea,
    deleteSpecializedArea,
    ITEMS_PER_PAGE
  };
}
