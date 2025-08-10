import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './UserContext';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider = ({ children }) => {
  const { currentUser } = useUser();

  // Optimized data fetching with React Query
  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Parallel data fetching for better performance
      const [usersResult, pipelinesResult, stagesResult] = await Promise.all([
        supabase
          .from('crm.users')
          .select('id, name, email, role')
          .eq('org_id', currentUser.orgId)
          .is('deleted_at', null)
          .limit(50)
          .order('name', { ascending: true }),
        
        supabase
          .from('crm.pipelines')
          .select('id, name')
          .eq('org_id', currentUser.orgId)
          .is('deleted_at', null)
          .limit(20)
          .order('name', { ascending: true }),
        
        supabase
          .from('crm.stages')
          .select('id, name, order_position, pipeline_id')
          .eq('org_id', currentUser.orgId)
          .is('deleted_at', null)
          .limit(100)
          .order('order_position', { ascending: true })
      ]);

      if (usersResult.error) throw usersResult.error;
      if (pipelinesResult.error) throw pipelinesResult.error;
      if (stagesResult.error) throw stagesResult.error;

      return {
        users: usersResult.data || [],
        pipelines: pipelinesResult.data || [],
        stages: stagesResult.data || []
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch data');
    }
  }, [currentUser]);

  // Use React Query for optimized data fetching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orgData', currentUser?.orgId],
    queryFn: fetchAllData,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const users = data?.users || [];
  const pipelines = data?.pipelines || [];
  const stages = data?.stages || [];

  return (
    <DataContext.Provider
      value={{
        users, pipelines, stages,
        loading: isLoading,
        error: error?.message,
        refetch,
        clearError: () => {}, // React Query handles errors
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
