import React, { useEffect, useState, useCallback } from 'react';
import { useLeadData } from '../contexts/LeadDataContext';
import { useUser } from '../contexts/UserContext';
import ContactList from './ContactList';
import ContactForm from './ContactForm';
import { useParams, useNavigate } from 'react-router-dom';

const LeadDetail = ({ onClose, onUpdate }) => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const {
    fetchLeadById,
    updateLead,
    deleteLead,
    hasPermission,
    loading,
    error,
  } = useLeadData();

  const [lead, setLead] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: '',
    stageId: '',
    pipelineId: '',
    assignedTo: '',
    customFields: {},
  });

  const [deleteError, setDeleteError] = useState(null);
  const [updateError, setUpdateError] = useState(null);

  // Fetch lead details on mount or when leadId changes
  const loadLead = useCallback(async () => {
    if (!leadId) return;
    const fetchedLead = await fetchLeadById(leadId);
    if (fetchedLead) {
      setLead(fetchedLead);
      setFormData({
        name: fetchedLead.name || '',
        email: fetchedLead.email || '',
        phone: fetchedLead.phone || '',
        status: fetchedLead.status || '',
        stageId: fetchedLead.stageId || '',
        pipelineId: fetchedLead.pipelineId || '',
        assignedTo: fetchedLead.assignedTo || '',
        customFields: fetchedLead.customFields || {},
      });
      setEditMode(false);
      setDeleteError(null);
      setUpdateError(null);
    }
  }, [leadId, fetchLeadById]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  // Handler for form field changes
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('customFields.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Save updates to lead
  const handleSave = async () => {
    setUpdateError(null);
    try {
      if (!hasPermission('edit', lead)) {
        setUpdateError('You do not have permission to edit this lead.');
        return;
      }

      const updates = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        stageId: formData.stageId,
        pipelineId: formData.pipelineId,
        assignedTo: formData.assignedTo,
        customFields: formData.customFields,
      };

      const updatedLead = await updateLead(lead.id, updates);
      if (updatedLead) {
        setLead((prev) => ({ ...prev, ...updatedLead }));
        setEditMode(false);
        onUpdate && onUpdate();
        loadLead();
      }
    } catch (err) {
      setUpdateError(err.message || 'Failed to update lead.');
    }
  };

  // Delete the lead with permission check and confirmation
  const handleDelete = async () => {
    setDeleteError(null);
    if (!hasPermission('delete', lead)) {
      setDeleteError('You do not have permission to delete this lead.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete lead "${lead.name}"?`)) return;

    const success = await deleteLead(lead.id);
    if (success) {
      if (onClose) {
        onClose();
      } else {
        navigate('/leads');
      }
    } else {
      setDeleteError('Failed to delete lead.');
    }
  };

  // Handlers for Contact form modal show/hide
  const openContactForm = () => setShowContactForm(true);
  const closeContactForm = () => setShowContactForm(false);

  // Called after a new contact is added
  const handleContactFormSave = () => {
    closeContactForm();
    loadLead(); // Refresh to reload updated contacts
  };

  if (loading && !lead) {
    return (
      <div className="p-6 text-brand-accent text-center select-none">
        Loading lead details…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="p-6 text-red-500 bg-red-900 bg-opacity-20 rounded">
        Error loading lead details: {error}
      </div>
    );
  }

  if (!lead) {
    return <div className="p-6 text-brand-accent select-none">No lead selected.</div>;
  }

  return (
    <section className="p-6 bg-brand-surface rounded shadow-md max-w-4xl mx-auto font-sans text-brand-accent select-text">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-violet">{lead.name}</h2>
        <button
          onClick={onClose ? onClose : () => navigate('/leads')}
          aria-label="Close lead detail"
          className="text-brand-violet hover:text-brand-accent focus:outline-none"
        >
          ✕
        </button>
      </header>

      {deleteError && (
        <p className="mb-4 text-red-500" role="alert">
          {deleteError}
        </p>
      )}

      {editMode ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block mb-1 font-semibold">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleFieldChange}
                className="w-full rounded px-3 py-2 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-1 font-semibold">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFieldChange}
                className="w-full rounded px-3 py-2 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block mb-1 font-semibold">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleFieldChange}
                className="w-full rounded px-3 py-2 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block mb-1 font-semibold">
                Status
              </label>
              <input
                id="status"
                name="status"
                type="text"
                value={formData.status}
                onChange={handleFieldChange}
                className="w-full rounded px-3 py-2 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
              />
            </div>

            {/* Pipeline */}
            <div>
              <label htmlFor="pipelineId" className="block mb-1 font-semibold">
                Pipeline
              </label>
              <input
                id="pipelineId"
                name="pipelineId"
                type="text"
                value={formData.pipelineId}
                onChange={handleFieldChange}
                className="w-full rounded px-3 py-2 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
                placeholder={lead.pipeline?.name || 'Pipeline ID'}
                disabled
              />
            </div>

            {/* Stage */}
            <div>
              <label htmlFor="stageId" className="block mb-1 font-semibold">
                Stage
              </label>
              <input
                id="stageId"
                name="stageId"
                type="text"
                value={formData.stageId}
                onChange={handleFieldChange}
                className="w-full rounded px-3 py-2 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
                placeholder={lead.stage?.name || 'Stage ID'}
                disabled
              />
            </div>

            {/* Assigned To */}
            <div>
              <label htmlFor="assignedTo" className="block mb-1 font-semibold">
                Assigned To
              </label>
              <input
                id="assignedTo"
                name="assignedTo"
                type="text"
                value={formData.assignedTo}
                onChange={handleFieldChange}
                className="w-full rounded px-3 py-2 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
                placeholder={lead.assignedUser?.name || 'User ID'}
                disabled
              />
            </div>

            {/* Custom Fields */}
            <div className="md:col-span-2">
              <label className="block mb-1 font-semibold">Custom Fields</label>
              {Object.entries(formData.customFields).length === 0 && (
                <p className="mb-2 italic text-brand-violetDark">No custom fields defined.</p>
              )}
              {Object.entries(formData.customFields).map(([key, value]) => (
                <div key={key} className="mb-2">
                  <label htmlFor={`customFields.${key}`} className="block text-sm font-medium text-brand-accent">
                    {key}
                  </label>
                  <input
                    id={`customFields.${key}`}
                    name={`customFields.${key}`}
                    type="text"
                    value={value}
                    onChange={handleFieldChange}
                    className="w-full rounded px-3 py-1 bg-brand-black border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {updateError && <p className="mb-4 text-red-500">{updateError}</p>}

          <div className="flex space-x-4 justify-end">
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-brand-violet rounded hover:bg-brand-violetDark text-white font-semibold focus:outline-none"
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <DetailItem label="Name" value={lead.name} />
            <DetailItem label="Email" value={lead.email} />
            <DetailItem label="Phone" value={lead.phone} />
            <DetailItem label="Status" value={lead.status} />
            <DetailItem label="Pipeline" value={lead.pipeline?.name || '-'} />
            <DetailItem label="Stage" value={lead.stage?.name || '-'} />
            <DetailItem label="Assigned To" value={lead.assignedUser?.name || '-'} />
            <div className="md:col-span-2">
              <label className="text-lg font-semibold text-brand-violet mb-1 block">Custom Fields</label>
              {Object.keys(lead.customFields).length === 0 && (
                <p className="italic text-brand-violetDark">No custom fields set.</p>
              )}
              <ul>
                {Object.entries(lead.customFields).map(([key, val]) => (
                  <li key={key} className="mb-1">
                    <strong>{key}:</strong> {val}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex space-x-4 mb-6 justify-end">
            {hasPermission('edit', lead) && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-brand-violet rounded hover:bg-brand-violetDark text-white font-semibold focus:outline-none"
              >
                Edit
              </button>
            )}
            {hasPermission('delete', lead) && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 text-white font-semibold focus:outline-none"
              >
                Delete
              </button>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-brand-violet">Contacts</h3>
            <ContactList leadId={lead.id} />
            {hasPermission('edit', lead) && (
              <>
                {showContactForm ? (
                  <ContactForm
                    leadId={lead.id}
                    onSave={handleContactFormSave}
                    onCancel={closeContactForm}
                  />
                ) : (
                  <button
                    onClick={openContactForm}
                    className="mt-4 px-4 py-2 bg-brand-violet rounded hover:bg-brand-violetDark text-white font-semibold focus:outline-none"
                  >
                    Add New Contact
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="font-semibold text-brand-violet">{label}</p>
    <p>{value || '-'}</p>
  </div>
);

export default LeadDetail;