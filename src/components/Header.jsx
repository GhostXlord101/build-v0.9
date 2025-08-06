import React from 'react';
import { useUser } from '../contexts/UserContext';

const Header = () => {
  const { currentUser, signOut, loading } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Optionally redirect after sign-out or show feedback
    } catch (error) {
      console.error('Sign out failed:', error);
      // Optionally show user-friendly error in UI
    }
  };

  return (
    <header className="bg-brand-black border-b border-brand-violetDark p-4 flex items-center justify-between">
      <div className="text-brand-violet font-bold text-lg select-none">
        {/* You can replace this with your app logo or name */}
        My CRM
      </div>

      <nav className="flex items-center space-x-6">
        {currentUser ? (
          <>
            <div className="text-brand-accent hidden sm:block">
              <p className="font-semibold">{currentUser.name || 'User'}</p>
              <p className="text-sm text-brand-violetDark">{currentUser.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="text-sm text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-600 rounded px-3 py-1"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </>
        ) : (
          <p className="text-brand-accent">Not signed in</p>
        )}
      </nav>
    </header>
  );
};

export default Header;
