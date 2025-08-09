import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
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

  // State
  const [users, setUsers] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);

  // Split loading and error state for each resource
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [errorUsers, setErrorUsers] = useState(null);
  const [errorPipelines, setErrorPipelines] = useState(null);
  const [errorStages, setErrorStages] = useState(null);

  const loading = useMemo(() => loadingUsers || loadingPipelines || loadingStages, [loadingUsers, loadingPipelines, loadingStages]);
  const error = useMemo(() => errorUsers || errorPipelines || errorStages, [errorUsers, errorPipelines, errorStages]);

  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // Increased to 10 minutes
  const usersCache = useRef({ data: null, timestamp: 0 });
  const pipelinesCache = useRef({ data: null, timestamp: 0 });
  const stagesCache = useRef({ data: null, timestamp: 0 });

  const isCacheValid = (timestamp) => Date.now() - timestamp < CACHE_EXPIRY_MS;

  const clearError = () => {
    setErrorUsers(null);
    setErrorPipelines(null);
    setErrorStages(null);
  };

  // -------- USERS --------
  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    setLoadingUsers(true);
    setErrorUsers(null);

    try {
      if (usersCache.current.data && isCacheValid(usersCache.current.timestamp)) {
        setUsers(usersCache.current.data);
        setLoadingUsers(false);
        return usersCache.current.data;
      }

      const { data, error: fetchError } = await supabase
        .from('crm.users')
        .select('id, name, email, role, org_id')
        .eq('org_id', currentUser.orgId)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setUsers(data);
      usersCache.current = { data, timestamp: Date.now() };
    } catch (err) {
      setErrorUsers(err.message || 'Fetch users failed');
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser]);

  // -------- PIPELINES --------
  const fetchPipelines = useCallback(async () => {
    if (!currentUser) return;
    setLoadingPipelines(true);
    setErrorPipelines(null);

    try {
      if (pipelinesCache.current.data && isCacheValid(pipelinesCache.current.timestamp)) {
        setPipelines(pipelinesCache.current.data);
        setLoadingPipelines(false);
        return pipelinesCache.current.data;
      }

      const { data, error: fetchError } = await supabase
        .from('crm.pipelines')
        .select('id, name, org_id')
        .eq('org_id', currentUser.orgId)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setPipelines(data);
      pipelinesCache.current = { data, timestamp: Date.now() };
    } catch (err) {
      setErrorPipelines(err.message || 'Fetch pipelines failed');
    } finally {
      setLoadingPipelines(false);
    }
  }, [currentUser]);

  // -------- STAGES --------
  const fetchStages = useCallback(async () => {
    if (!currentUser) return;
    setLoadingStages(true);
    setErrorStages(null);

    try {
      if (stagesCache.current.data && isCacheValid(stagesCache.current.timestamp)) {
        setStages(stagesCache.current.data);
        setLoadingStages(false);
        return stagesCache.current.data;
      }

      const { data, error: fetchError } = await supabase
        .from('crm.stages')
        .select('id, name, order_position, pipeline_id, org_id')
        .eq('org_id', currentUser.orgId)
        .is('deleted_at', null)
        .order('order_position', { ascending: true });

      if (fetchError) throw fetchError;
      setStages(data);
      stagesCache.current = { data, timestamp: Date.now() };
    } catch (err) {
      setErrorStages(err.message || 'Fetch stages failed');
    } finally {
      setLoadingStages(false);
    }
  }, [currentUser]);

  // --------- Initial fetch for all data resources --------
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch all data in parallel for better performance
    Promise.all([
      fetchUsers(),
      fetchPipelines(),
      fetchStages()
    ]).catch(console.error);
  }, [currentUser, fetchUsers, fetchPipelines, fetchStages]);

  // --------- Clear all caches & data -------
  const clearCache = () => {
    usersCache.current = { data: null, timestamp: 0 };
    pipelinesCache.current = { data: null, timestamp: 0 };
    stagesCache.current = { data: null, timestamp: 0 };
    setUsers([]);
    setPipelines([]);
    setStages([]);
  };

  return (
    <DataContext.Provider
      value={{
        users, pipelines, stages,
        loading, error,
        fetchUsers, fetchPipelines, fetchStages,
        clearCache, clearError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
