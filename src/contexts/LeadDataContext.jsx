import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from './UserContext';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LeadDataContext = createContext();

export const useLeadData = () => {
  const context = useContext(LeadDataContext);
  if (!context) {
    throw new Error('useLeadData must be used within a LeadDataProvider');
  }
  return context;
};

export const LeadDataProvider = ({ children }) => {
  const { currentUser } = useUser();

  // State
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);

  // Separate loading states to avoid race condition issues
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Combined loading indicator for convenience
  const loading = useMemo(() => loadingLeads || loadingContacts || loadingUsers, [loadingLeads, loadingContacts, loadingUsers]);

  // Separate error messages by source
  const [errorLeads, setErrorLeads] = useState(null);
  const [errorContacts, setErrorContacts] = useState(null);
  const [errorUsers, setErrorUsers] = useState(null);

  // Combined error message (could be combined more intelligently)
  const error = useMemo(() => errorLeads || errorContacts || errorUsers, [errorLeads, errorContacts, errorUsers]);

  // Caches for data with expiration timestamps
  const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  // We use refs to hold caches so that setting them doesn't cause rerenders
  // Structure: Map<cacheKey, {data, timestamp}>
  const leadsCache = useRef(new Map());
  const contactsCache = useRef(new Map());

  // Utility function to check cache validity
  const isCacheValid = (timestamp) =>
    timestamp && Date.now() - timestamp < CACHE_EXPIRY_MS;

  // Clear all errors
  const clearError = useCallback(() => {
    setErrorLeads(null);
    setErrorContacts(null);
    setErrorUsers(null);
  }, []);

  // Permission check helper
  // Usage: hasPermission(action, leadObject)
  //
  // Considers role and lead ownership for Sales Rep
  const hasPermission = useCallback(
    (action, lead = null) => {
      if (!currentUser) return false;
      const { role, id: userId } = currentUser;

      if (role === 'Admin') return true;

      if (role === 'Manager') {
        // Managers have broad rights
        return ['view', 'create', 'edit', 'delete'].includes(action);
      }

      if (role === 'Sales Rep') {
        switch (action) {
          case 'view':
            return !lead || lead.assignedTo === userId || lead.createdBy === userId;
          case 'create':
            return true; // can create leads
          case 'edit':
          case 'delete':
            return lead && (lead.assignedTo === userId || lead.createdBy === userId);
          default:
            return false;
        }
      }

      return false;
    },
    [currentUser]
  );

  // Scoping supabase instance for org -- placeholder for future extension
  const supabaseWithOrg = () => supabase;

  // Fetch users scoped by org with caching and proper loading/error state
  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;

    setLoadingUsers(true);
    setErrorUsers(null);

    try {
      // No caching for users for now since they might change frequently
      const { data, error: fetchError } = await supabaseWithOrg()
        .from('crm.users')
        .select('id, name, email, role, org_id')
        .eq('org_id', currentUser.orgId)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setUsers(data || []);
    } catch (err) {
      setErrorUsers(err.message || 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  }, [currentUser]);

  // Fetch leads with optional filters, properly cached by filters key
  const fetchLeads = useCallback(
    async (filters = {}) => {
      if (!currentUser) return [];

      setLoadingLeads(true);
      setErrorLeads(null);

      const cacheKey = JSON.stringify(filters);
      const cached = leadsCache.current.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        setLeads(cached.data);
        setLoadingLeads(false);
        return cached.data;
      }

      try {
        let query = supabaseWithOrg()
          .from('crm.leads')
          .select(`
            id, name, email, phone, status, stage_id, pipeline_id, assigned_to, org_id, custom_fields, created_at, updated_at,
            assignedUser:assigned_to (id, name),
            pipeline:pipeline_id (id, name),
            stage:stage_id (id, name)
          `)
          .eq('org_id', currentUser.orgId)
          .is('deleted_at', null)
          .limit(100) // Add pagination limit
          .order('created_at', { ascending: false });

        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.assignedTo && filters.assignedTo !== 'all') {
          query = query.eq('assigned_to', filters.assignedTo);
        }
        if (filters.pipelineId && filters.pipelineId !== 'all') {
          query = query.eq('pipeline_id', filters.pipelineId);
        }
        if (filters.search) {
          // Use ilike for partial case-insensitive match
          // Supabase limit: or() must be stringified expressions - safer to use filter on client if complex
          query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Map and normalize dates and fields
        const transformed = (data || []).map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          stageId: lead.stage_id,
          pipelineId: lead.pipeline_id,
          assignedTo: lead.assigned_to,
          orgId: lead.org_id,
          customFields: lead.custom_fields || {},
          createdAt: lead.created_at ? new Date(lead.created_at) : null,
          updatedAt: lead.updated_at ? new Date(lead.updated_at) : null,
          assignedUser: lead.assignedUser || null,
          pipeline: lead.pipeline || null,
          stage: lead.stage || null,
        }));

        leadsCache.current.set(cacheKey, {
          data: transformed,
          timestamp: Date.now(),
        });

        setLeads(transformed);
        return transformed;
      } catch (err) {
        setErrorLeads(err.message || 'Failed to fetch leads');
        return [];
      } finally {
        setLoadingLeads(false);
      }
    },
    [currentUser]
  );

  // Fetch a single lead by id with contacts, caching separately
  const fetchLeadById = useCallback(
    async (leadId) => {
      if (!currentUser || !leadId) return null;

      setLoadingLeads(true);
      setErrorLeads(null);

      const cacheKey = `lead_${leadId}`;
      const cached = leadsCache.current.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        setLoadingLeads(false);
        return cached.data;
      }

      try {
        const { data, error: fetchError } = await supabaseWithOrg()
          .from('crm.leads')
          .select(`
            *,
            assignedUser:assigned_to (id, name, email),
            pipeline:pipeline_id (id, name),
            stage:stage_id (id, name, order_position),
            contacts:contacts (id, lead_id, name, email, phone, designation, notes, created_by, org_id, created_at, updated_at)
          `)
          .eq('id', leadId)
          .eq('org_id', currentUser.orgId)
          .is('deleted_at', null)
          .single();

        if (fetchError) throw fetchError;

        const mappedContacts = (data.contacts || []).map((c) => ({
          id: c.id,
          leadId: c.lead_id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          designation: c.designation,
          notes: c.notes,
          createdBy: c.created_by,
          orgId: c.org_id,
          createdAt: c.created_at ? new Date(c.created_at) : null,
          updatedAt: c.updated_at ? new Date(c.updated_at) : null,
        }));

        const mappedLead = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          status: data.status,
          stageId: data.stage_id,
          pipelineId: data.pipeline_id,
          assignedTo: data.assigned_to,
          orgId: data.org_id,
          customFields: data.custom_fields || {},
          createdAt: data.created_at ? new Date(data.created_at) : null,
          updatedAt: data.updated_at ? new Date(data.updated_at) : null,
          assignedUser: data.assignedUser || null,
          pipeline: data.pipeline || null,
          stage: data.stage || null,
          contacts: mappedContacts,
        };

        leadsCache.current.set(cacheKey, {
          data: mappedLead,
          timestamp: Date.now(),
        });

        setLoadingLeads(false);
        return mappedLead;
      } catch (err) {
        setErrorLeads(err.message || 'Failed to fetch lead details');
        setLoadingLeads(false);
        return null;
      }
    },
    [currentUser]
  );

  // Create a new lead
  const createLead = useCallback(
    async (leadData) => {
      if (!currentUser) return null;

      if (!hasPermission('create')) {
        setErrorLeads('Permission denied for creating leads');
        return null;
      }

      setLoadingLeads(true);
      setErrorLeads(null);

      try {
        const insertData = {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone || null,
          status: leadData.status || 'New',
          stage_id: leadData.stageId || null,
          pipeline_id: leadData.pipelineId || null,
          assigned_to: leadData.assignedTo || null,
          created_by: currentUser.id,
          org_id: currentUser.orgId,
          custom_fields: leadData.customFields || {},
        };

        const { data, error: insertError } = await supabaseWithOrg()
          .from('crm.leads')
          .insert([insertData])
          .select()
          .single();

        if (insertError) throw insertError;

        // Clear cache and update state (refresh fetch is better, too)
        leadsCache.current.clear();
        setLeads((prev) => [
          {
            ...data,
            createdAt: data.created_at ? new Date(data.created_at) : null,
            updatedAt: data.updated_at ? new Date(data.updated_at) : null,
          },
          ...prev,
        ]);

        setLoadingLeads(false);
        return data;
      } catch (err) {
        setErrorLeads(err.message || 'Create lead failed');
        setLoadingLeads(false);
        return null;
      }
    },
    [currentUser, hasPermission]
  );

  // Update existing lead by ID
  const updateLead = useCallback(
    async (leadId, updates) => {
      if (!currentUser) return null;

      // Fetch the lead first to check permissions
      const existingLead = await fetchLeadById(leadId);
      if (!existingLead) {
        setErrorLeads('Lead not found');
        return null;
      }

      if (!hasPermission('edit', existingLead)) {
        setErrorLeads('Permission denied for updating lead');
        return null;
      }

      setLoadingLeads(true);
      setErrorLeads(null);

      try {
        const updatePayload = {
          ...(updates.name && { name: updates.name }),
          ...(updates.email && { email: updates.email }),
          ...(updates.phone !== undefined && { phone: updates.phone }),
          ...(updates.status && { status: updates.status }),
          ...(updates.stageId && { stage_id: updates.stageId }),
          ...(updates.pipelineId && { pipeline_id: updates.pipelineId }),
          ...(updates.assignedTo && { assigned_to: updates.assignedTo }),
          ...(updates.customFields && { custom_fields: updates.customFields }),
          updated_at: new Date().toISOString(),
        };

        const { data, error: updateError } = await supabaseWithOrg()
          .from('crm.leads')
          .update(updatePayload)
          .eq('id', leadId)
          .eq('org_id', currentUser.orgId)
          .select()
          .single();

        if (updateError) throw updateError;

        leadsCache.current.clear();
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  ...data,
                  updatedAt: data.updated_at ? new Date(data.updated_at) : null,
                }
              : l
          )
        );

        setLoadingLeads(false);
        return data;
      } catch (err) {
        setErrorLeads(err.message || 'Update lead failed');
        setLoadingLeads(false);
        return null;
      }
    },
    [currentUser, leads, hasPermission]
  );

  // Soft-delete lead by ID
  const deleteLead = useCallback(
    async (leadId) => {
      if (!currentUser) return false;
      
      // Fetch the lead first to check permissions
      const existingLead = await fetchLeadById(leadId);
      if (!existingLead) {
        setErrorLeads('Lead not found');
        return false;
      }
      
      if (!hasPermission('delete', existingLead)) {
        setErrorLeads('Permission denied for deleting lead');
        return false;
      }

      setLoadingLeads(true);
      setErrorLeads(null);

      try {
        const { error: delError } = await supabaseWithOrg()
          .from('crm.leads')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', leadId)
          .eq('org_id', currentUser.orgId);

        if (delError) throw delError;

        leadsCache.current.clear();
        setLeads((prev) => prev.filter((l) => l.id !== leadId));

        setLoadingLeads(false);
        return true;
      } catch (err) {
        setErrorLeads(err.message || 'Delete lead failed');
        setLoadingLeads(false);
        return false;
      }
    },
    [currentUser, leads, hasPermission]
  );

  // Fetch contacts by lead id with caching separate from leads
  const fetchContactsByLeadId = useCallback(
    async (leadId) => {
      if (!currentUser || !leadId) return [];

      setLoadingContacts(true);
      setErrorContacts(null);

      const cacheKey = `contacts_${leadId}`;
      const cached = contactsCache.current.get(cacheKey);
      if (cached && isCacheValid(cached.timestamp)) {
        setContacts(cached.data);
        setLoadingContacts(false);
        return cached.data;
      }

      try {
        const { data, error: fetchError } = await supabaseWithOrg()
          .from('crm.contacts')
          .select('id, lead_id, name, email, phone, designation, notes, created_by, org_id, created_at, updated_at')
          .eq('lead_id', leadId)
          .eq('org_id', currentUser.orgId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const mapped = (data || []).map((contact) => ({
          id: contact.id,
          leadId: contact.lead_id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          designation: contact.designation,
          notes: contact.notes,
          createdBy: contact.created_by,
          orgId: contact.org_id,
          createdAt: contact.created_at ? new Date(contact.created_at) : null,
          updatedAt: contact.updated_at ? new Date(contact.updated_at) : null,
        }));

        contactsCache.current.set(cacheKey, {
          data: mapped,
          timestamp: Date.now(),
        });

        setContacts(mapped);
        return mapped;
      } catch (err) {
        setErrorContacts(err.message || 'Failed to fetch contacts');
        return [];
      } finally {
        setLoadingContacts(false);
      }
    },
    [currentUser]
  );

  // Add a new contact to a lead
  const addContact = useCallback(
    async (contactData) => {
      if (!currentUser) return null;
      if (!contactData.leadId) {
        setErrorContacts('Missing leadId when adding contact');
        return null;
      }

      // Check if user has permission to edit the lead
      const lead = await fetchLeadById(contactData.leadId);
      if (!lead || !hasPermission('edit', lead)) {
        setErrorContacts('Permission denied for adding contact to this lead');
        return null;
      }
      setLoadingContacts(true);
      setErrorContacts(null);

      try {
        const insertData = {
          lead_id: contactData.leadId,
          name: contactData.name,
          email: contactData.email || null,
          phone: contactData.phone || null,
          designation: contactData.designation || null,
          notes: contactData.notes || null,
          created_by: currentUser.id,
          org_id: currentUser.orgId,
        };

        const { data, error: insertError } = await supabaseWithOrg()
          .from('crm.contacts')
          .insert([insertData])
          .select()
          .single();

        if (insertError) throw insertError;

        contactsCache.current.clear();
        setContacts((prev) => [data, ...prev]);

        setLoadingContacts(false);
        return data;
      } catch (err) {
        setErrorContacts(err.message || 'Add contact failed');
        setLoadingContacts(false);
        return null;
      }
    },
    [currentUser, fetchLeadById, hasPermission]
  );

  // Update contact by id
  const updateContact = useCallback(
    async (contactId, updates) => {
      if (!currentUser) return null;

      // First get the contact to find its lead and check permissions
      const { data: contact, error: contactError } = await supabaseWithOrg()
        .from('crm.contacts')
        .select('id, lead_id')
        .eq('id', contactId)
        .eq('org_id', currentUser.orgId)
        .single();

      if (contactError || !contact) {
        setErrorContacts('Contact not found');
        return null;
      }

      const lead = await fetchLeadById(contact.lead_id);
      if (!lead || !hasPermission('edit', lead)) {
        setErrorContacts('Permission denied for updating this contact');
        return null;
      }
      setLoadingContacts(true);
      setErrorContacts(null);

      try {
        const updatePayload = {
          ...(updates.name && { name: updates.name }),
          ...(updates.email !== undefined && { email: updates.email }),
          ...(updates.phone !== undefined && { phone: updates.phone }),
          ...(updates.designation !== undefined && { designation: updates.designation }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          updated_at: new Date().toISOString(),
        };

        const { data, error: updateError } = await supabaseWithOrg()
          .from('crm.contacts')
          .update(updatePayload)
          .eq('id', contactId)
          .eq('org_id', currentUser.orgId)
          .select()
          .single();

        if (updateError) throw updateError;

        contactsCache.current.clear();
        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? {
                  ...c,
                  ...data,
                  updatedAt: data.updated_at ? new Date(data.updated_at) : null,
                }
              : c
          )
        );

        setLoadingContacts(false);
        return data;
      } catch (err) {
        setErrorContacts(err.message || 'Update contact failed');
        setLoadingContacts(false);
        return null;
      }
    },
    [currentUser, fetchLeadById, hasPermission]
  );

  // Soft-delete contact by id
  const deleteContact = useCallback(
    async (contactId) => {
      if (!currentUser) return false;

      // First get the contact to find its lead and check permissions
      const { data: contact, error: contactError } = await supabaseWithOrg()
        .from('crm.contacts')
        .select('id, lead_id')
        .eq('id', contactId)
        .eq('org_id', currentUser.orgId)
        .single();

      if (contactError || !contact) {
        setErrorContacts('Contact not found');
        return false;
      }

      const lead = await fetchLeadById(contact.lead_id);
      if (!lead || !hasPermission('delete', lead)) {
        setErrorContacts('Permission denied for deleting this contact');
        return false;
      }
      setLoadingContacts(true);
      setErrorContacts(null);

      try {
        const { error: delError } = await supabaseWithOrg()
          .from('crm.contacts')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', contactId)
          .eq('org_id', currentUser.orgId);

        if (delError) throw delError;

        contactsCache.current.clear();
        setContacts((prev) => prev.filter((c) => c.id !== contactId));

        setLoadingContacts(false);
        return true;
      } catch (err) {
        setErrorContacts(err.message || 'Delete contact failed');
        setLoadingContacts(false);
        return false;
      }
    },
    [currentUser, fetchLeadById, hasPermission]
  );

  // Bulk update leads (partial update fields)
  const bulkUpdateLeads = useCallback(
    async (leadIds, updates) => {
      if (!currentUser) return [];

      // Check permissions for each lead before bulk update
      const leadsToUpdate = [];
      for (const leadId of leadIds) {
        const lead = await fetchLeadById(leadId);
        if (lead && hasPermission('edit', lead)) {
          leadsToUpdate.push(leadId);
        }
      }

      if (leadsToUpdate.length === 0) {
        setErrorLeads('No leads found or permission denied for all selected leads');
        return [];
      }
      setLoadingLeads(true);
      setErrorLeads(null);

      try {
        const updateData = {
          ...(updates.status && { status: updates.status }),
          ...(updates.assignedTo && { assigned_to: updates.assignedTo }),
          ...(updates.stageId && { stage_id: updates.stageId }),
          updated_at: new Date().toISOString(),
        };

        const { data, error: updateError } = await supabaseWithOrg()
          .from('crm.leads')
          .update(updateData)
          .in('id', leadsToUpdate)
          .eq('org_id', currentUser.orgId)
          .select();

        if (updateError) throw updateError;

        leadsCache.current.clear();

        // Update local leads with updated data from bulk update response
        setLeads((prev) =>
          prev.map((lead) => data.find((u) => u.id === lead.id) || lead)
        );

        setLoadingLeads(false);
        return data;
      } catch (err) {
        setErrorLeads(err.message || 'Bulk update leads failed');
        setLoadingLeads(false);
        return [];
      }
    },
    [currentUser, fetchLeadById, hasPermission]
  );

  // Clear caches and reset state helper
  const clearCache = useCallback(() => {
    leadsCache.current.clear();
    contactsCache.current.clear();
    setLeads([]);
    setContacts([]);
  }, []);

  // Initial fetch triggered when user context is available
  useEffect(() => {
    if (!currentUser) return;

    // Fetch in parallel for better performance
    Promise.all([
      fetchUsers(),
      fetchLeads()
    ]).catch(console.error);
  }, [currentUser, fetchUsers, fetchLeads]);

  return (
    <LeadDataContext.Provider
      value={{
        leads,
        contacts,
        users,
        loading,
        error,

        fetchLeads,
        fetchLeadById,
        createLead,
        updateLead,
        deleteLead,
        bulkUpdateLeads,

        fetchContactsByLeadId,
        addContact,
        updateContact,
        deleteContact,

        hasPermission,
        clearError,
        clearCache,
      }}
    >
      {children}
    </LeadDataContext.Provider>
  );
};
