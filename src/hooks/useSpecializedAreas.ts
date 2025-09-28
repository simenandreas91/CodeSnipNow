import { useState, useEffect } from 'react';
import { supabase, hasValidSupabaseCredentials } from '../lib/supabase';
import type { SpecializedArea, SpecializedAreaSubtype } from '../types/snippet';

const ITEMS_PER_PAGE = 12;

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

  const mapDatabaseToSpecializedArea = (data: any[]): SpecializedArea[] => {
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

  const fetchSubtypes = async (mySpecializedAreas = false) => {
    setSubtypesLoading(true);

    try {
      if (!hasValidSupabaseCredentials || !supabase) {
        setAvailableSubtypes([]);
        setSubtypesLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (mySpecializedAreas && !user) {
        setAvailableSubtypes([]);
        setSubtypesLoading(false);
        return;
      }

      let queryBuilder = supabase
        .from('specialized_areas')
        .select('type');

      if (mySpecializedAreas) {
        queryBuilder = queryBuilder.eq('author_id', user?.id);
      } else {
        queryBuilder = queryBuilder.eq('is_public', true);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching specialized area subtypes:', error);
        setAvailableSubtypes([]);
      } else {
        const types = [...new Set((data || []).map((item: any) => item.type).filter(Boolean))].sort();
        setAvailableSubtypes(types);
      }
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
        setLoading(false);
        return;
      }

      console.log(`Fetching specialized areas - Page: ${page}, Query: ${query}, Subtype: ${subtype}, My: ${mySpecializedAreas}`);

      const { data: { user } } = await supabase.auth.getUser();
      if (mySpecializedAreas && !user) {
        setSpecializedAreas([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let queryBuilder = supabase
        .from('specialized_areas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (mySpecializedAreas) {
        queryBuilder = queryBuilder.eq('author_id', user?.id);
      } else {
        queryBuilder = queryBuilder.eq('is_public', true);
      }

      if (subtype) {
        queryBuilder = queryBuilder.eq('type', subtype);
      }

      if (query.trim()) {
        const formattedQuery = `%${query.trim()}%`;
        queryBuilder = queryBuilder.or(
          `title.ilike.${formattedQuery},description.ilike.${formattedQuery},code.ilike.${formattedQuery},code2.ilike.${formattedQuery}`
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

      setSpecializedAreas(mapDatabaseToSpecializedArea(data || []));
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error in fetchSpecializedAreas:', error);
      setSpecializedAreas([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const createSpecializedArea = async (data: {
    title: string;
    description?: string;
    code: string;
    code2?: string;
    type: SpecializedAreaSubtype;
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
        .from('specialized_areas')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating specialized area:', error);
        throw new Error(`Failed to create specialized area: ${error.message}`);
      }

      console.log('Specialized area created successfully:', result);
      fetchSubtypes(viewMySpecializedAreas);
      return result.id;
    } catch (error: any) {
      console.error('Error in createSpecializedArea:', error);
      throw new Error(error.message || 'Failed to create specialized area');
    }
  };

  const updateSpecializedArea = async (specializedAreaId: string, updates: Partial<{
    title: string;
    description: string;
    code: string;
    code2: string;
    type: SpecializedAreaSubtype;
    repo_path: string;
    is_public: boolean;
  }>) => {
    if (!hasValidSupabaseCredentials || !supabase) {
      throw new Error('Database not configured');
    }

    try {
      const { error } = await supabase
        .from('specialized_areas')
        .update(updates)
        .eq('id', specializedAreaId);

      if (error) {
        console.error('Error updating specialized area:', error);
        throw new Error(`Failed to update specialized area: ${error.message}`);
      }

      console.log('Specialized area updated successfully');
      fetchSubtypes(viewMySpecializedAreas);
      return true;
    } catch (error: any) {
      console.error('Error in updateSpecializedArea:', error);
      throw new Error(error.message || 'Failed to update specialized area');
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
    ITEMS_PER_PAGE
  };
}
