import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Edit, 
  Trash2, 
  MoreVertical,
  AlertTriangle,
  X,
  Users
} from 'lucide-react';
import { useLeadData } from '../contexts/LeadDataContext';
import ContactForm from './ContactForm';
import { ListSkeleton } from './SkeletonLoader';

/**
 * ContactList Component - Display and manage contacts for a specific lead
 */
const ContactList = ({ leadId }) => {
  const { 
    useContactsQuery,
    deleteContact, 
    hasPermission,
  } = useLeadData();

  // Use React Query for contacts
  const { data: contacts = [], isLoading, error, refetch } = useContactsQuery(leadId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleEdit = (contact) => {
    if (!hasPermission('edit')) {
      alert('You do not have permission to edit contacts for this lead.');
      return;
    }
    setEditingContact(contact);
    setShowAddForm(false);
    setActiveDropdown(null);
  };

  const handleDelete = (contact) => {
    if (!hasPermission('edit')) {
      alert('You do not have permission to delete contacts for this lead.');
      return;
    }
    setDeletingContact(contact);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  };

  const confirmDelete = async () => {
    if (!deletingContact) return;
    const confirmed = window.confirm(`Are you sure you want to delete contact "${deletingContact.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    const success = await deleteContact(deletingContact.id);
    if (success) {
      refetch();
    }
    setShowDeleteConfirm(false);
    setDeletingContact(null);
  };

  const handleFormSave = async () => {
    setShowAddForm(false);
    setEditingContact(null);
    refetch();
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingContact(null);
  };

  // Utility to get initials for avatar
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Contacts ({contacts.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">Manage all contacts associated with this lead</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingContact(null);
          }}
          disabled={!hasPermission('edit')}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          aria-label="Add contact"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <ListSkeleton items={3} />
      )}

      {/* Contacts List or Empty */}
      {!isLoading && (
        <>
          {contacts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
              <p className="text-gray-500 mb-4">Start by adding the first contact for this lead</p>
              {hasPermission('edit') && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => {
                const isActive = activeDropdown === contact.id;
                return (
                  <div
                    key={contact.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {getInitials(contact.name)}
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">{contact.name}</h4>
                            <div className="relative" ref={dropdownRef}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(isActive ? null : contact.id);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                aria-haspopup="true"
                                aria-expanded={isActive}
                                aria-label={`More options for contact ${contact.name}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {isActive && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20" role="menu">
                                  <div className="py-2">
                                    {hasPermission('edit') && (
                                      <>
                                        <button
                                          onClick={() => handleEdit(contact)}
                                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                                          role="menuitem"
                                        >
                                          <Edit className="w-4 h-4 mr-3" />
                                          Edit Contact
                                        </button>
                                        <hr className="my-2" />
                                        <button
                                          onClick={() => handleDelete(contact)}
                                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                                          role="menuitem"
                                        >
                                          <Trash2 className="w-4 h-4 mr-3" />
                                          Delete Contact
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {contact.designation && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Building className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="font-medium">{contact.designation}</span>
                              </div>
                            )}

                            {contact.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-700 transition-colors">
                                  {contact.email}
                                </a>
                              </div>
                            )}

                            {contact.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-700 transition-colors">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          {contact.notes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{contact.notes}</p>
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Added on {contact.createdAt?.toLocaleDateString() || '-'}
                              {contact.createdAt !== contact.updatedAt && contact.updatedAt && (
                                <span> • Updated {contact.updatedAt.toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Contact Form */}
      {showAddForm && hasPermission('edit') && (
        <ContactForm
          leadId={leadId}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Edit Contact Form */}
      {editingContact && hasPermission('edit') && (
        <ContactForm
          leadId={leadId}
          contact={editingContact}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Confirmation Modal (simple fallback) */}
      {showDeleteConfirm && deletingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Contact</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this contact "{deletingContact.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingContact(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;
