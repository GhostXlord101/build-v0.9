import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLeadData } from '../contexts/LeadDataContext';

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validatePhone = (phone) =>
  /^\+?[0-9\s\-().]{7,15}$/.test(phone.trim());

const ContactForm = ({ leadId, contact = null, onSave, onCancel }) => {
  const { addContact, updateContact, loading } = useLeadData();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        designation: contact.designation || '',
        notes: contact.notes || '',
      });
    } else {
      // Reset form when adding new contact
      setFormData({
        name: '',
        email: '',
        phone: '',
        designation: '',
        notes: '',
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [contact]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (formData.email && !validateEmail(formData.email))
      errs.email = 'Invalid email address';
    if (formData.phone && !validatePhone(formData.phone))
      errs.phone = 'Invalid phone number';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      if (contact) {
        const updated = await updateContact(contact.id, formData);
        if (!updated) throw new Error('Failed to update contact');
      } else {
        if (!leadId) {
          throw new Error('Missing leadId for adding contact.');
        }
        const added = await addContact({ ...formData, leadId });
        if (!added) throw new Error('Failed to add contact');
      }
      onSave && onSave();
    } catch (err) {
      setSubmitError(err.message || 'Error saving contact');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 text-brand-accent max-w-md mx-auto"
      noValidate
    >
      {submitError && (
        <div
          role="alert"
          className="text-red-500 bg-red-900 bg-opacity-20 p-2 rounded"
        >
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

      {/* Designation */}
      <div>
        <label htmlFor="designation" className="block mb-1 font-semibold">
          Designation
        </label>
        <input
          id="designation"
          name="designation"
          type="text"
          value={formData.designation}
          onChange={handleChange}
          className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          disabled={loading}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block mb-1 font-semibold">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="4"
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
          disabled={loading}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-brand-violet hover:bg-brand-violetDark text-white font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (contact ? 'Saving…' : 'Saving…') : (contact ? 'Save' : 'Add')}
        </button>
      </div>
    </form>
  );
};

ContactForm.propTypes = {
  leadId: PropTypes.string, // Required for adding new contact
  contact: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    designation: PropTypes.string,
    notes: PropTypes.string,
  }),
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ContactForm;
