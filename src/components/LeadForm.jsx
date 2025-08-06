import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLeadData } from '../contexts/LeadDataContext';
import { useUser } from '../contexts/UserContext';

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validatePhone = (phone) =>
  /^\+?[0-9\s\-().]{7,15}$/.test(phone.trim());

const LeadForm = ({ lead = null, onSave, onCancel }) => {
  const { currentUser } = useUser();
  const {
    createLead,
    updateLead,
    users,
    loading,
  } = useLeadData();

  // Get pipelines and stages from context if available
  // (If you use a DataContext for pipelines/stages, adjust accordingly)
  // For now, assume you pass them as props or have them available elsewhere

  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  // Replace above with import from context if using one

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'New',
    stageId: '',
    pipelineId: '',
    assignedTo: '',
    customFields: {},
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // Fetch pipelines and stages if not available
  useEffect(() => {
    // TODO: fetch pipelines/stages from context or API here if needed and set state
    // setPipelines(...);
    // setStages(...);
  }, []);

  // When editing, prefill the form
  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || 'New',
        stageId: lead.stageId || '',
        pipelineId: lead.pipelineId || '',
        assignedTo: lead.assignedTo || '',
        customFields: lead.customFields || {},
      });
    }
  }, [lead]);

  // Validate basic fields
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (formData.email && !validateEmail(formData.email)) errs.email = 'Invalid email address';
    if (formData.phone && !validatePhone(formData.phone)) errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
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
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      if (lead && lead.id) {
        const updated = await updateLead(lead.id, formData);
        if (!updated) throw new Error('Failed to update lead');
      } else {
        const created = await createLead(formData);
        if (!created) throw new Error('Failed to create lead');
      }
      if (onSave) onSave();
    } catch (err) {
      setSubmitError(err.message || 'Error saving lead');
    }
  };

  // Utility: render select options
  const renderOptions = (items, valueProp, labelProp) =>
    (items || []).map((item) => (
      <option key={item[valueProp]} value={item[valueProp]}>
        {item[labelProp]}
      </option>
    ));

  const availableStages =
    formData.pipelineId && stages
      ? stages
          .filter((stage) => stage.pipeline_id === formData.pipelineId)
          .sort((a, b) => a.order_position - b.order_position)
      : [];

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6 text-brand-accent font-sans" noValidate>
      {submitError && (
        <div role="alert" className="mb-4 p-3 text-red-500 bg-red-900 bg-opacity-20 rounded">
          {submitError}
        </div>
      )}

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
          onChange={handleChange}
          className={`w-full rounded px-3 py-2 bg-brand-surface border ${
            errors.name ? 'border-red-600' : 'border-brand-violetDark'
          } focus:outline-none focus:ring-2 focus:ring-brand-violet`}
          required
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          disabled={loading}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-500">
            {errors.name}
          </p>
        )}
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
          onChange={handleChange}
          className={`w-full rounded px-3 py-2 bg-brand-surface border ${
            errors.email ? 'border-red-600' : 'border-brand-violetDark'
          } focus:outline-none focus:ring-2 focus:ring-brand-violet`}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          disabled={loading}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500">
            {errors.email}
          </p>
        )}
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
          onChange={handleChange}
          className={`w-full rounded px-3 py-2 bg-brand-surface border ${
            errors.phone ? 'border-red-600' : 'border-brand-violetDark'
          } focus:outline-none focus:ring-2 focus:ring-brand-violet`}
          aria-invalid={errors.phone ? 'true' : 'false'}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          disabled={loading}
        />
        {errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-500">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block mb-1 font-semibold">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          disabled={loading}
        >
          {['New', 'Qualified', 'Contacted', 'Demo', 'Proposal', 'Won', 'Lost'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Pipeline */}
      <div>
        <label htmlFor="pipelineId" className="block mb-1 font-semibold">
          Pipeline
        </label>
        <select
          id="pipelineId"
          name="pipelineId"
          value={formData.pipelineId}
          onChange={handleChange}
          className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          required
          disabled={loading}
        >
          <option value="">Select a pipeline</option>
          {renderOptions(pipelines, 'id', 'name')}
        </select>
      </div>

      {/* Stage */}
      <div>
        <label htmlFor="stageId" className="block mb-1 font-semibold">
          Stage
        </label>
        <select
          id="stageId"
          name="stageId"
          value={formData.stageId}
          onChange={handleChange}
          className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          required
          disabled={!formData.pipelineId || loading}
        >
          <option value="">Select a stage</option>
          {renderOptions(availableStages, 'id', 'name')}
        </select>
      </div>

      {/* Assigned To */}
      <div>
        <label htmlFor="assignedTo" className="block mb-1 font-semibold">
          Assigned To
        </label>
        <select
          id="assignedTo"
          name="assignedTo"
          value={formData.assignedTo}
          onChange={handleChange}
          className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          disabled={loading}
        >
          <option value="">Unassigned</option>
          {renderOptions(users, 'id', user => `${user.name} (${user.role})`)}
        </select>
      </div>

      {/* Custom Fields (optional) */}
      <div>
        <label className="block mb-1 font-semibold">Custom Fields</label>
        {Object.keys(formData.customFields).length === 0 && (
          <p className="mb-2 italic text-brand-violetDark">No custom fields defined</p>
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
              onChange={handleChange}
              className="w-full rounded px-3 py-1 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
              disabled={loading}
            />
          </div>
        ))}
        {/* Optional: add button to add custom fields */}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 focus:outline-none"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 rounded bg-brand-violet hover:bg-brand-violetDark text-white font-semibold disabled:opacity-50 focus:outline-none"
          disabled={loading}
        >
          {loading ? (lead ? 'Saving…' : 'Creating…') : lead ? 'Save Changes' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
};

LeadForm.propTypes = {
  lead: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    status: PropTypes.string,
    stageId: PropTypes.string,
    pipelineId: PropTypes.string,
    assignedTo: PropTypes.string,
    customFields: PropTypes.object,
  }),
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

export default LeadForm;
