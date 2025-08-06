import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Adjust if you use a different router
import { useUser } from '../contexts/UserContext';
import {
  Home,
  Users,
  FileText,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/leads', label: 'Leads', icon: FileText },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const Sidebar = () => {
  const { currentUser, signOut, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      // Optionally show user feedback
    }
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-brand-violet text-white focus:outline-none focus:ring-2 focus:ring-brand-violetDark"
        aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <Menu size={24} /> : <X size={24} />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-brand-black border-r border-brand-violetDark shadow-lg transform transition-transform duration-300 ease-in-out
          ${collapsed ? '-translate-x-full' : 'translate-x-0'}
          md:translate-x-0 md:static md:shadow-none z-40
        `}
        aria-label="Sidebar"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-brand-violetDark px-4">
            <h1 className="text-brand-violet font-bold text-xl select-none cursor-default">
              My CRM
            </h1>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-brand-violet text-white'
                      : 'text-brand-accent hover:bg-brand-violetDark hover:text-white'
                  }`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-brand-violetDark p-4 flex items-center space-x-3">
            {currentUser ? (
              <>
                <div className="flex flex-col flex-grow min-w-0">
                  <p className="text-sm font-semibold text-brand-violet truncate select-text">
                    {currentUser.name || currentUser.email || 'User'}
                  </p>
                  <p className="text-xs text-brand-accent truncate select-text">
                    {currentUser.role}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  title="Sign Out"
                  className="text-red-500 hover:text-red-400 focus:outline-none"
                  aria-label="Sign out"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <p className="text-brand-accent text-sm italic">Not signed in</p>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {!collapsed && (
        <button
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          aria-hidden="true"
          onClick={() => setCollapsed(true)}
          tabIndex={-1}
        />
      )}
    </>
  );
};

export default Sidebar;
