import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for auth operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Settings = () => {
  const { currentUser, loading: userLoading, error: userError, clearError } = useUser();

  // Profile form state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Password change form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Notification preferences (illustrative example)
  const [notifications, setNotifications] = useState({
    emailNotifications: true,   // Example preference boolean
    pushNotifications: false,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [notifSuccess, setNotifSuccess] = useState(null);

  // Load initial profile info
  useEffect(() => {
    if (!currentUser) return;
    setProfile({
      name: currentUser.name || '',
      email: currentUser.email || '',
    });

    // Here, you might also load user preferences from your database (omitted for brevity)
  }, [currentUser]);

  // Utility: Clear all success and error messages before a new action
  const clearMessages = () => {
    setProfileError(null);
    setProfileSuccess(null);
    setPasswordError(null);
    setPasswordSuccess(null);
    setNotifError(null);
    setNotifSuccess(null);
    clearError && clearError();
  };

  // Handle profile input change
  const handleProfileChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileError(null);
    setProfileSuccess(null);
  };

  // Submit profile update (name and email)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!profile.name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    if (!validateEmail(profile.email)) {
      setProfileError('Invalid email format.');
      return;
    }

    setProfileLoading(true);

    try {
      // Update profile in your users table (crm.users)
      const { error: updateError } = await supabase
        .from('crm.users')
        .update({ name: profile.name, email: profile.email })
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }

      setProfileSuccess('Profile updated successfully.');

      // Optionally, update auth email too if changed via Supabase Auth
      if (profile.email !== currentUser.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: profile.email });
        if (authError) {
          setProfileError(`Failed to update auth email: ${authError.message}`);
          return;
        }
      }
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      // Re-authenticate user with current password (Supabase does not provide direct re-auth)
      // Workaround: signIn again to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password incorrect.');
      }

      // Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw updateError;
      }

      setPasswordSuccess('Password updated successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Validate email format utility
  function validateEmail(email) {
    // simple regex for basic validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  // Handle notification preferences change (toggle switches)
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications((prev) => ({ ...prev, [name]: checked }));
    setNotifError(null);
    setNotifSuccess(null);
  };

  // Submit notification preferences (simulate save; add your backend logic)
  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    setNotifLoading(true);

    try {
      // Simulating backend update
      // Replace this with actual API call if you store preferences server-side
      await new Promise((res) => setTimeout(res, 800)); // simulate delay

      setNotifSuccess('Notification preferences updated.');
    } catch (error) {
      setNotifError(error.message || 'Failed to update preferences.');
    } finally {
      setNotifLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black text-brand-accent font-sans">
        Loading user settings…
      </div>
    );
  }

  if (userError) {
    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-red-900 bg-opacity-40 text-red-500 font-sans p-4"
      >
        Failed to load user data: {userError}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black text-brand-accent font-sans">
        You must be logged in to access settings.
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-brand-black font-sans text-brand-accent max-w-3xl mx-auto select-text">
      <h1 className="text-3xl font-bold mb-8 text-brand-violet">Settings</h1>

      {/* Profile Section */}
      <section aria-labelledby="profile-section" className="mb-12">
        <h2 id="profile-section" className="text-2xl font-semibold mb-4">
          Profile
        </h2>
        {profileError && (
          <div role="alert" className="mb-4 p-2 bg-red-900 bg-opacity-30 text-red-400 rounded">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div role="status" className="mb-4 p-2 bg-green-900 bg-opacity-30 text-green-400 rounded">
            {profileSuccess}
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 font-semibold">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={profile.name}
              onChange={handleProfileChange}
              className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 font-semibold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleProfileChange}
              className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 rounded bg-brand-violet hover:bg-brand-violetDark text-white font-semibold disabled:opacity-50"
            disabled={profileLoading}
          >
            {profileLoading ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </section>

      {/* Password Change Section */}
      <section aria-labelledby="password-section" className="mb-12">
        <h2 id="password-section" className="text-2xl font-semibold mb-4">
          Change Password
        </h2>
        {passwordError && (
          <div role="alert" className="mb-4 p-2 bg-red-900 bg-opacity-30 text-red-400 rounded">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div role="status" className="mb-4 p-2 bg-green-900 bg-opacity-30 text-green-400 rounded">
            {passwordSuccess}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          <div>
            <label htmlFor="currentPassword" className="block mb-1 font-semibold">
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block mb-1 font-semibold">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block mb-1 font-semibold">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full rounded px-3 py-2 bg-brand-surface border border-brand-violetDark focus:outline-none focus:ring-2 focus:ring-brand-violet"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 rounded bg-brand-violet hover:bg-brand-violetDark text-white font-semibold disabled:opacity-50"
            disabled={passwordLoading}
          >
            {passwordLoading ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </section>

      {/* Notifications Preferences Section */}
      <section aria-labelledby="notifications-section" className="mb-12 max-w-sm">
        <h2 id="notifications-section" className="text-2xl font-semibold mb-4">
          Notification Preferences
        </h2>
        {notifError && (
          <div role="alert" className="mb-4 p-2 bg-red-900 bg-opacity-30 text-red-400 rounded">
            {notifError}
          </div>
        )}
        {notifSuccess && (
          <div role="status" className="mb-4 p-2 bg-green-900 bg-opacity-30 text-green-400 rounded">
            {notifSuccess}
          </div>
        )}
        <form onSubmit={handleNotificationsSubmit} className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              id="emailNotifications"
              name="emailNotifications"
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={handleNotificationChange}
              className="form-checkbox h-5 w-5 text-brand-violet"
            />
            <label htmlFor="emailNotifications" className="font-medium select-none">
              Email Notifications
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              id="pushNotifications"
              name="pushNotifications"
              type="checkbox"
              checked={notifications.pushNotifications}
              onChange={handleNotificationChange}
              className="form-checkbox h-5 w-5 text-brand-violet"
            />
            <label htmlFor="pushNotifications" className="font-medium select-none">
              Push Notifications
            </label>
          </div>
          <button
            type="submit"
            className="px-6 py-2 rounded bg-brand-violet hover:bg-brand-violetDark text-white font-semibold disabled:opacity-50"
            disabled={notifLoading}
          >
            {notifLoading ? 'Saving…' : 'Save Preferences'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Settings;
