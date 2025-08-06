import React from 'react';
import { useUser } from '../contexts/UserContext';

const Header = () => {
  const { currentUser, signOut, loading } = useUser();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-brand-surface px-6 py-4 flex items-center justify-between shadow-md">
      {/* Left side: App title or logo */}
      <div className="text-2xl font-bold text-brand-violet select-none">
        My CRM
      </div>

      {/* Right side: User greeting and Sign Out */}
      <div className="flex items-center space-x-6">
        {currentUser && (
          <p className="text-sm font-semibold text-brand-accent whitespace-nowrap">
            Hello, <span className="text-brand-violet">{currentUser.name}</span>
          </p>
        )}

        <button
          onClick={handleSignOut}
          disabled={loading}
          aria-label="Sign Out"
          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {loading ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </header>
  );
};

export default Header;
