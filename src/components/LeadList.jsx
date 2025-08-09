import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLeadData } from '../contexts/LeadDataContext';

const LeadList = () => {
  const {
    leads,
    fetchLeads,
    loading,
    error,
    deleteLead,
    hasPermission,
    bulkUpdateLeads,
  } = useLeadData();

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');

  // Pagination state (simple client side example)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25; // Increased page size

  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  // For showing inline delete confirmation and/or error
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [inlineError, setInlineError] = useState(null);

  // Filters – convert 'all' to undefined for context
  const filters = useMemo(() => ({
    search: search.trim(),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(pipelineFilter !== 'all' ? { pipelineId: pipelineFilter } : {}),
    ...(assignedToFilter !== 'all' ? { assignedTo: assignedToFilter } : {}),
  }), [search, statusFilter, pipelineFilter, assignedToFilter]);

  // Debounced fetch function
  const debouncedFetchLeads = useCallback(
    debounce((filters) => {
      fetchLeads(filters);
    }, 300),
    [fetchLeads]
  );

  // Fetch leads when filters change (debounced for search)
  useEffect(() => {
    if (filters.search) {
      debouncedFetchLeads(filters);
    } else {
      fetchLeads(filters);
    }
    setCurrentPage(1); // Reset to first page upon refilter!
    setSelectedLeadIds([]);
  }, [filters, fetchLeads, debouncedFetchLeads]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalLeads = leads.length;
    const totalPages = Math.max(1, Math.ceil(totalLeads / PAGE_SIZE));
    const paginatedLeads = leads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    
    return { totalLeads, totalPages, paginatedLeads };
  }, [leads, currentPage]);

  const { totalLeads, totalPages, paginatedLeads } = paginationData;

  // Handle checkbox toggles for bulk select
  const toggleSelectLead = (leadId) => {
    setSelectedLeadIds((ids) =>
      ids.includes(leadId) ? ids.filter((id) => id !== leadId) : [...ids, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (areAllSelected()) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(paginatedLeads.map((lead) => lead.id));
    }
  };

  const areAllSelected = () => {
    return paginatedLeads.length > 0 && paginatedLeads.every((lead) => selectedLeadIds.includes(lead.id));
  };

  // Bulk status update
  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedLeadIds.length === 0) return;
    setInlineError(null);
    await bulkUpdateLeads(selectedLeadIds, { status: newStatus });
    setSelectedLeadIds([]);
    fetchLeads(filters);
  };

  // Handle single lead delete with inline confirmation
  const handleDeleteLead = (leadId) => {
    setDeleteConfirmId(leadId);
    setInlineError(null);
  };

  const confirmDeleteLead = async (leadId) => {
    setInlineError(null);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || !hasPermission('delete', lead)) {
      setInlineError('You do not have permission to delete this lead.');
      setDeleteConfirmId(null);
      return;
    }
    const success = await deleteLead(leadId);
    if (success) {
      fetchLeads(filters);
    } else {
      setInlineError('Failed to delete the lead.');
    }
    setDeleteConfirmId(null);
  };

  // Handlers for filters & search
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  const handlePipelineFilterChange = (e) => {
    setPipelineFilter(e.target.value);
  };
  const handleAssignedToFilterChange = (e) => {
    setAssignedToFilter(e.target.value);
  };

  // Pagination controls
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <section className="p-6 bg-brand-black text-brand-accent font-sans min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-brand-violet">Leads</h1>

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search leads by name or email..."
          className="flex-grow max-w-md px-3 py-2 rounded bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          aria-label="Search leads"
        />

        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="px-3 py-2 rounded bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="New">New</option>
          <option value="Qualified">Qualified</option>
          <option value="Contacted">Contacted</option>
          <option value="Demo">Demo</option>
          <option value="Proposal">Proposal</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
        </select>

        <select
          value={pipelineFilter}
          onChange={handlePipelineFilterChange}
          className="px-3 py-2 rounded bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          aria-label="Filter by pipeline"
        >
          <option value="all">All Pipelines</option>
          {leads
            .map((lead) => lead.pipeline)
            .filter(Boolean)
            .reduce((unique, p) => {
              if (!unique.some((up) => up.id === p.id)) unique.push(p);
              return unique;
            }, [])
            .map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
        </select>

        <select
          value={assignedToFilter}
          onChange={handleAssignedToFilterChange}
          className="px-3 py-2 rounded bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          aria-label="Filter by assigned user"
        >
          <option value="all">All Assigned</option>
          {leads
            .map((lead) => lead.assignedUser)
            .filter(Boolean)
            .reduce((unique, u) => {
              if (!unique.some((un) => un.id === u.id)) unique.push(u);
              return unique;
            }, [])
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </select>
      </div>

      {/* Inline error message */}
      {inlineError && (
        <p className="mb-4 text-red-500" role="alert">{inlineError}</p>
      )}

      {/* Bulk Actions */}
      {selectedLeadIds.length > 0 && (
        <div className="mb-4">
          <p>
            Selected <strong>{selectedLeadIds.length}</strong> lead(s).
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {['New', 'Qualified', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost'].map((status) => (
              <button
                key={status}
                type="button"
                className="px-3 py-1 bg-brand-violet hover:bg-brand-violetDark rounded text-white text-sm"
                onClick={() => handleBulkUpdateStatus(status)}
                disabled={loading}
              >
                Mark as {status}
              </button>
            ))}
            <button
              type="button"
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
              onClick={() => setSelectedLeadIds([])}
              disabled={loading}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      {loading ? (
        <p className="text-brand-accent">Loading leads...</p>
      ) : error ? (
        <p role="alert" className="text-red-500">
          Error loading leads: {error}
        </p>
      ) : leads.length === 0 ? (
        <p className="italic text-brand-accent">No leads found.</p>
      ) : (
        <table className="w-full table-fixed border-collapse border border-brand-violetDark rounded-lg overflow-hidden bg-brand-surface text-left text-sm">
          <thead className="bg-brand-violetDark uppercase text-xs font-semibold text-brand-accent">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={areAllSelected()}
                  onChange={toggleSelectAll}
                  aria-label="Select all leads on page"
                />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3 hidden sm:table-cell">Email</th>
              <th className="p-3 hidden md:table-cell">Status</th>
              <th className="p-3 hidden lg:table-cell">Pipeline</th>
              <th className="p-3 hidden lg:table-cell">Assigned To</th>
              <th className="p-3 w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead) => {
              const canDelete = hasPermission('delete', lead);
              const isSelected = selectedLeadIds.includes(lead.id);
              return (
                <tr
                  key={lead.id}
                  className={`border-t border-brand-violetDark ${
                    isSelected ? 'bg-brand-violetDark/30' : 'hover:bg-brand-violetDark/10'
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectLead(lead.id)}
                      aria-label={`Select lead ${lead.name}`}
                    />
                  </td>
                  <td className="p-3 font-semibold">{lead.name}</td>
                  <td className="p-3 hidden sm:table-cell truncate">{lead.email}</td>
                  <td className="p-3 hidden md:table-cell">{lead.status}</td>
                  <td className="p-3 hidden lg:table-cell">{lead.pipeline?.name || '-'}</td>
                  <td className="p-3 hidden lg:table-cell">{lead.assignedUser?.name || '-'}</td>
                  <td className="p-3 flex justify-center space-x-2">
                    <button
                      aria-label={`View lead ${lead.name}`}
                      className="px-2 py-1 bg-brand-violet rounded text-white hover:bg-brand-violetDark text-xs"
                      onClick={() => window.location.assign(`/leads/${lead.id}`)}
                    >
                      View
                    </button>
                    {canDelete && (
                      <>
                        {deleteConfirmId === lead.id ? (
                          <button
                            aria-label={`Confirm delete lead ${lead.name}`}
                            className="px-2 py-1 bg-red-600 rounded text-white hover:bg-red-700 text-xs"
                            onClick={() => confirmDeleteLead(lead.id)}
                            disabled={loading}
                          >
                            Confirm Delete?
                          </button>
                        ) : (
                          <button
                            aria-label={`Delete lead ${lead.name}`}
                            className="px-2 py-1 bg-red-600 rounded text-white hover:bg-red-700 text-xs"
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="mt-6 flex justify-center space-x-2"
          aria-label="Pagination Navigation"
        >
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-brand-violet disabled:opacity-50 text-white"
            aria-label="Previous page"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => goToPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? 'bg-brand-violetDark text-white font-bold'
                  : 'bg-brand-violet text-white hover:bg-brand-violetDark'
              }`}
              aria-current={currentPage === i + 1 ? 'page' : undefined}
              aria-label={`Go to page ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-brand-violet disabled:opacity-50 text-white"
            aria-label="Next page"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
};

// Simple debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default LeadList;
